import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, Package, Plus, ChevronRight, MapPin, Clock, CheckCircle2,
  AlertTriangle, BarChart3, Zap, Target, Activity, XCircle, Globe,
  Navigation, RefreshCcw, ArrowUpRight, FileText, Filter, Search
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Cell, LineChart, Line, ComposedChart, Legend, PieChart, Pie, AreaChart, Area
} from 'recharts';
import SafeResponsiveChart from '../components/charts/SafeResponsiveChart';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';

/* ─── Helpers ─── */
const fadeIn = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const Chip = ({ label, color = '#64748B' }) => (
  <span style={{ padding: '2px 9px', borderRadius: '999px', background: `${color}18`, color, fontSize: '0.71rem', fontWeight: 700 }}>{label}</span>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.9rem', border: '1px solid var(--border)', gap: '0.2rem', width: 'fit-content', flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: '0.48rem 1.05rem', borderRadius: '0.7rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem', background: active === t.id ? 'var(--bg)' : 'transparent', color: active === t.id ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.8rem' }}>
      <p style={{ fontWeight: 700, marginBottom: '4px' }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name}: {p.value?.toLocaleString?.('fr-FR') ?? p.value}</p>)}
    </div>
  );
};

/* ─── Status config ─── */
const SHIP_STATUS = {
  'Préparation':  { color: '#64748B', icon: <Package size={13} /> },
  'Expédié':      { color: '#3B82F6', icon: <Truck size={13} /> },
  'En Transit':   { color: '#F59E0B', icon: <Navigation size={13} /> },
  'Livré':        { color: '#10B981', icon: <CheckCircle2 size={13} /> },
  'Retardé':      { color: '#EF4444', icon: <AlertTriangle size={13} /> },
  'Retourné':     { color: '#8B5CF6', icon: <RefreshCcw size={13} /> },
};

/* ─── Variables injectées depuis data-factory ─── */

/* ════════════════════════════════════
   SHIPPING MODULE
════════════════════════════════════ */
const Shipping = ({ onOpenDetail, appId = 'shipping' }) => {
  const { data, addRecord, getModuleAccess, currentUser } = useBusiness();
  const accessLevel = getModuleAccess(currentUser?.id, appId);
  const isReadOnly = accessLevel === 'read';

  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');

  const contacts = data?.base?.contacts || [];
  const SHIPMENTS = data?.shipping?.shipments || [];
  const TRANSPORTEURS = data?.shipping?.carriers || [];

  /* ─── KPIs ─── */
  const kpis = useMemo(() => {
    const livres   = SHIPMENTS.filter(s => s.statut === 'Livré').length;
    const retardes = SHIPMENTS.filter(s => s.statut === 'Retardé').length;
    const transit  = SHIPMENTS.filter(s => s.statut === 'En Transit' || s.statut === 'Expédié').length;
    const otif     = (livres + retardes) > 0 ? Math.round((livres / (livres + retardes)) * 100 * 10) / 10 : 0;
    const totalColis = SHIPMENTS.reduce((s, x) => s + (x.colis || 0), 0);
    const caMoyen    = SHIPMENTS.length > 0 ? SHIPMENTS.reduce((s, x) => s + (x.montant || 0), 0) / SHIPMENTS.length : 0;
    return { livres, retardes, transit, otif, totalColis, caMoyen };
  }, [SHIPMENTS]);

  const otifTrend = [
    { mois: 'Oct', otif: 85, retards: 15 },
    { mois: 'Nov', otif: 88, retards: 12 },
    { mois: 'Déc', otif: 82, retards: 18 },
    { mois: 'Jan', otif: 90, retards: 10 },
    { mois: 'Fév', otif: 93, retards: 7 },
    { mois: 'Mar', otif: 96, retards: 4 },
    { mois: 'Avr', otif: kpis.otif || 98, retards: kpis.retardes || 2 }
  ];

  const volumeTrend = [
    { sem: 'S1', colisExp: 120, colisLiv: 110, retours: 5 },
    { sem: 'S2', colisExp: 140, colisLiv: 135, retours: 2 },
    { sem: 'S3', colisExp: 110, colisLiv: 105, retours: 4 },
    { sem: 'S4', colisExp: 160, colisLiv: 150, retours: 8 }
  ];

  const causeRetards = [
    { cause: 'Météo / Aléas Route', pct: 45, color: '#F59E0B' },
    { cause: 'Problème Transporteur', pct: 30, color: '#EF4444' },
    { cause: 'Erreur Préparation', pct: 15, color: '#8B5CF6' },
    { cause: 'Client Absent', pct: 10, color: '#64748B' }
  ];

  /* ─── Timeline tracker visual ─── */
  const TrackingTimeline = ({ statut }) => {
    const steps = ['Préparation', 'Expédié', 'En Transit', 'Livré'];
    const idx = steps.indexOf(statut === 'Retardé' ? 'En Transit' : statut);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i <= idx ? (statut === 'Retardé' && i === idx ? '#EF4444' : '#10B981') : 'var(--bg-subtle)',
                border: `2px solid ${i <= idx ? (statut === 'Retardé' && i === idx ? '#EF4444' : '#10B981') : 'var(--border)'}` }}>
                {i <= idx && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.substring(0,5)}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: '2px', background: i < idx ? '#10B981' : 'var(--border)', minWidth: '20px', marginBottom: '14px' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const modalFields = [
    { name: 'id',           label: 'N° Bon de Livraison', required: true, placeholder: 'BL-2026-XXX' },
    { name: 'client',       label: 'Client',              type: 'select', options: contacts.filter(c=>c.type==='Client').map(c=>c.nom), required: true },
    { name: 'dest',         label: 'Adresse de Livraison', required: true, placeholder: 'Ville, Pays' },
    { name: 'transporteur', label: 'Transporteur',        type: 'select', options: TRANSPORTEURS.map(t=>t.nom), required: true },
    { name: 'date',         label: 'Date Expédition',     type: 'date', required: true },
    { name: 'dateExpec',    label: 'Date Livraison Prévue', type: 'date', required: true },
    { name: 'colis',        label: 'Nombre de Colis',     type: 'number', required: true },
    { name: 'poids',        label: 'Poids Total (ex: 45 kg)', required: true },
    { name: 'montant',      label: 'Valeur Marchandise (FCFA)', type: 'number' },
    { name: 'statut',       label: 'Statut', type: 'select', options: Object.keys(SHIP_STATUS), required: true },
  ];

  const filtered = SHIPMENTS.filter(s =>
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.client.toLowerCase().includes(search.toLowerCase()) ||
    s.dest.toLowerCase().includes(search.toLowerCase())
  );

  /* ═══════════ DASHBOARD ═══════════ */
  const renderDashboard = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPIs */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="OTIF Livraisons"      value={`${kpis.otif}%`}                           trend={-2.1} trendType="down"  icon={<Target size={20}/>}       color="#F59E0B" sparklineData={otifTrend.map(d=>({val:d.otif}))} />
        <KpiCard title="Livraisons Réalisées" value={kpis.livres}                               trend={8.2}  trendType="up"    icon={<CheckCircle2 size={20}/>} color="#10B981" sparklineData={[{val:110},{val:120},{val:118},{val:125},{val:kpis.livres+120}]} />
        <KpiCard title="En Transit / Expédié" value={kpis.transit}                              trend={0}    trendType="up"    icon={<Navigation size={20}/>}   color="#3B82F6" sparklineData={[{val:5},{val:6},{val:4},{val:5},{val:kpis.transit}]} />
        <KpiCard title="Livraisons Retardées" value={kpis.retardes}                             trend={18.0} trendType="down"  icon={<AlertTriangle size={20}/>} color="#EF4444" sparklineData={[{val:3},{val:4},{val:5},{val:4},{val:kpis.retardes}]} />
        <KpiCard title="Colis Total Expédiés" value={kpis.totalColis}                           trend={5.4}  trendType="up"    icon={<Package size={20}/>}      color="#8B5CF6" sparklineData={[{val:50},{val:55},{val:58},{val:60},{val:kpis.totalColis/10}]} />
      </motion.div>

      {/* Alertes retards */}
      {SHIPMENTS.filter(s => s.statut === 'Retardé').length > 0 && (
        <motion.div variants={fadeIn} className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: '1.25rem', border: '1px solid #EF444430' }}>
          <h4 style={{ fontWeight: 700, color: '#EF4444', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} /> Expéditions Retardées — Action Requise
          </h4>
          {SHIPMENTS.filter(s => s.statut === 'Retardé').map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.5rem 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.82rem' }}>{s.id}</span>
              <span style={{ flex: 1, fontSize: '0.83rem' }}>{s.client} — {s.dest}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.transporteur}</span>
              <Chip label="Retardé" color="#EF4444" />
            </div>
          ))}
        </motion.div>
      )}

      {/* OTIF Trend + Causes retards */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>OTIF & Retards — 7 Mois</h4>
          <SafeResponsiveChart minHeight={220} fallbackHeight={220}>
            <ComposedChart data={otifTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis yAxisId="l" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={[80, 100]} />
              <YAxis yAxisId="r" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Bar  yAxisId="r" dataKey="retards" name="Retards"     fill="#EF444430" radius={[4,4,0,0]} barSize={20} />
              <Line yAxisId="l" dataKey="otif"    name="OTIF (%)"    stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
            </ComposedChart>
          </SafeResponsiveChart>
        </div>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Causes des Retards</h4>
          {causeRetards.map((c, i) => (
            <div key={i} style={{ marginBottom: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                <span style={{ fontWeight: 600 }}>{c.cause}</span>
                <span style={{ color: c.color, fontWeight: 700 }}>{c.pct}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${c.pct}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                  style={{ height: '100%', background: c.color, borderRadius: '999px' }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Scorecard Transporteurs */}
      <motion.div variants={fadeIn}>
        <h4 style={{ fontWeight: 700, marginBottom: '1.1rem', fontSize: '0.95rem' }}>Performance Transporteurs</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {TRANSPORTEURS.sort((a, b) => b.otif - a.otif).map((t, i) => (
            <div key={i} className="glass" style={{ padding: '1rem 1.4rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', borderLeft: `4px solid ${t.color}` }}>
              <div style={{ flex: '1 1 120px', fontWeight: 700, fontSize: '0.88rem' }}>{t.nom}</div>
              <div style={{ flex: '0 1 140px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '3px' }}>OTIF</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '80px', height: '7px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${t.otif}%`, height: '100%', background: t.otif >= 95 ? '#10B981' : t.otif >= 90 ? '#F59E0B' : '#EF4444', borderRadius: '999px' }} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: t.otif >= 95 ? '#10B981' : t.otif >= 90 ? '#F59E0B' : '#EF4444' }}>{t.otif}%</span>
                </div>
              </div>
              {[
                { l: 'Livraisons', v: t.livraisons },
                { l: 'Retards',    v: `${t.retards}%` },
                { l: 'Coût Moy.',  v: `${(t.coutMoy/1000).toFixed(0)}K FCFA` },
              ].map((s, j) => (
                <div key={j} style={{ flex: '0 1 100px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.l}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{s.v}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  /* ═══════════ BONS DE LIVRAISON ═══════════ */
  const renderShipments = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <motion.div variants={fadeIn} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="glass" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem', borderRadius: '0.75rem', minWidth: '220px' }}>
          <Search size={15} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Chercher BL, client, destination..." style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '0.88rem', color: 'var(--text)' }} />
        </div>
        {!isReadOnly && (
          <button onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={14} /> Nouveau BL
          </button>
        )}
      </motion.div>

      {/* Cards BL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.1rem' }}>
        {filtered.map((s, i) => {
          const sc = SHIP_STATUS[s.statut] || SHIP_STATUS['Expédié'];
          return (
            <motion.div key={i} variants={fadeIn} whileHover={{ y: -3 }} onClick={() => onOpenDetail?.(s, 'shipping', 'shipments')}
              className="glass" style={{ padding: '1.4rem', borderRadius: '1.25rem', cursor: 'pointer', borderTop: `3px solid ${sc.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent)' }}>{s.id}</div>
                <Chip label={s.statut} color={sc.color} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>{s.client}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1rem' }}>
                <MapPin size={11} /> {s.dest} · <Truck size={11} /> {s.transporteur}
              </div>

              {/* Tracking timeline */}
              <div style={{ marginBottom: '1rem' }}>
                <TrackingTimeline statut={s.statut} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                {[
                  { l: 'Colis',   v: s.colis },
                  { l: 'Poids',   v: s.poids },
                  { l: 'Expédié', v: s.date.substring(5) },
                  { l: 'Prévu',   v: s.dateExpec.substring(5) },
                ].map((d, j) => (
                  <div key={j} style={{ background: 'var(--bg-subtle)', borderRadius: '0.5rem', padding: '0.4rem 0.5rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.66rem' }}>{d.l}</div>
                    <div style={{ fontWeight: 700 }}>{d.v}</div>
                  </div>
                ))}
              </div>
              {s.tracking !== 'En attente' && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                  Tracking: <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{s.tracking}</span>
                </div>
              )}
            </motion.div>
          );
        })}
        {!isReadOnly && (
          <motion.div whileHover={{ scale: 1.02 }} onClick={() => setModal(true)} variants={fadeIn} className="glass"
            style={{ padding: '1.4rem', borderRadius: '1.25rem', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)', minHeight: '160px' }}>
            <Plus size={26} />
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Nouveau Bon de Livraison</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  /* ─── Volume stats mini-view ─── */
  const renderVolume = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <motion.div variants={fadeIn} className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
        <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Volume Hebdomadaire — Colis Expédiés / Livrés</h4>
        <SafeResponsiveChart minHeight={250} fallbackHeight={250}>
          <BarChart data={volumeTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="sem" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <Tooltip content={<TT />} />
            <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
            <Bar dataKey="colisExp" name="Expédiés" fill="#3B82F6" radius={[4,4,0,0]} barSize={24} />
            <Bar dataKey="colisLiv" name="Livrés"   fill="#10B981" radius={[4,4,0,0]} barSize={24} />
            <Bar dataKey="retours"  name="Retours"  fill="#EF4444" radius={[4,4,0,0]} barSize={24} />
          </BarChart>
        </SafeResponsiveChart>
      </motion.div>

      {/* Par destination */}
      <motion.div variants={fadeIn} className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
        <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Flux par Région de Destination</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {[
             { region: 'Abidjan & Sud', livraisons: 310, pct: 55, color: '#3B82F6' },
             { region: 'Bouaké & Centre', livraisons: 110, pct: 20, color: '#10B981' },
             { region: 'San Pedro & Ouest', livraisons: 80, pct: 15, color: '#F59E0B' },
             { region: 'International (Export)', livraisons: 56, pct: 10, color: '#8B5CF6' }
          ].map((r, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={13} color={r.color} /> <span style={{ fontWeight: 600 }}>{r.region}</span>
                </div>
                <span style={{ color: r.color, fontWeight: 700 }}>{r.livraisons} livraisons · {r.pct}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${r.pct}%` }} transition={{ duration: 1, delay: i * 0.15 }}
                  style={{ height: '100%', background: r.color, borderRadius: '999px' }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3B82F6', marginBottom: '0.4rem' }}>
            <Truck size={16} />
            <span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Logistique — Shipping & Delivery</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Expéditions & Livraisons</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>
            OTIF · Tracking Temps Réel · Transporteurs · Volumes
          </p>
        </div>
        {!isReadOnly && (
          <button onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1.25rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            <Plus size={15} /> Nouveau Bon de Livraison
          </button>
        )}
      </div>

      <TabBar tabs={[
        { id: 'dashboard',  label: 'Dashboard OTIF',      icon: <BarChart3 size={14}/> },
        { id: 'shipments',  label: 'Bons de Livraison',   icon: <FileText size={14}/> },
        { id: 'volume',     label: 'Volume & Flux',        icon: <Activity size={14}/> },
      ]} active={tab} onChange={setTab} />

      {tab === 'dashboard' && renderDashboard()}
      {tab === 'shipments' && renderShipments()}
      {tab === 'volume'    && renderVolume()}

      <RecordModal isOpen={modal} onClose={() => setModal(false)} title="Nouveau Bon de Livraison" appId={appId}
        fields={modalFields} onSave={f => { addRecord('shipping', 'shipments', { ...f, tracking: 'En attente' }); setModal(false); }} />
    </div>
  );
};

export default Shipping;
