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
import { useStore } from '../store';
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
  const { data, addRecord, getModuleAccess, currentUser, formatCurrency, shellView } = useStore();
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
    return { livres, retardes, transit, otif, totalColis };
  }, [SHIPMENTS]);

  const otifTrend = useMemo(() => {
    if (SHIPMENTS.length === 0) return [];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul'];
    return months.map(m => ({ mois: m, otif: 90 + Math.random() * 8, retards: Math.floor(Math.random() * 5) }));
  }, [SHIPMENTS]);

  const volumeTrend = useMemo(() => {
    if (SHIPMENTS.length === 0) return [];
    const weeks = ['S1', 'S2', 'S3', 'S4'];
    return weeks.map(w => ({ sem: w, colisExp: 20 + Math.floor(Math.random() * 30), colisLiv: 18 + Math.floor(Math.random() * 25), retours: Math.floor(Math.random() * 3) }));
  }, [SHIPMENTS]);

  const causeRetards = useMemo(() => {
    if (SHIPMENTS.length === 0) return [];
    return [
      { cause: 'Douane / Contrôle', pct: 45, color: '#F59E0B' },
      { cause: 'Panne Transporteur', pct: 25, color: '#EF4444' },
      { cause: 'Intempéries', pct: 15, color: 'var(--nexus-primary)' },
      { cause: 'Erreur Destination', pct: 15, color: 'var(--nexus-text-muted)' },
    ];
  }, [SHIPMENTS]);

  /* ─── Timeline tracker visual ─── */
  const TrackingTimeline = ({ statut }) => {
    const steps = ['Préparation', 'Expédié', 'En Transit', 'Livré'];
    const idx = steps.indexOf(statut === 'Retardé' ? 'En Transit' : statut);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ 
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i <= idx ? (statut === 'Retardé' && i === idx ? '#EF4444' : 'var(--nexus-primary)') : 'var(--nexus-bg)',
                border: `2px solid ${i <= idx ? (statut === 'Retardé' && i === idx ? '#EF4444' : 'var(--nexus-primary)') : 'var(--nexus-border)'}` 
              }}>
                {i <= idx && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: i <= idx ? 'var(--nexus-secondary)' : 'var(--nexus-text-muted)', whiteSpace: 'nowrap' }}>{s}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: '3px', background: i < idx ? 'var(--nexus-primary)' : 'var(--nexus-border)', minWidth: '20px', marginBottom: '14px' }} />
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        <div className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-primary)' }}><Target size={20} /></div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>QUALITY</div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>OTIF Livraisons</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{kpis.otif}%</div>
        </div>

        <div className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '10px', color: '#3B82F6' }}><CheckCircle2 size={20} /></div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#3B82F6' }}>SUCCESS</div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Livraisons Réalisées</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{kpis.livres}</div>
        </div>

        <div className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '10px', color: '#F59E0B' }}><Navigation size={20} /></div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#F59E0B' }}>TRANSIT</div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>En Transit</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{kpis.transit}</div>
        </div>

        <div className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '10px', color: '#EF4444' }}><AlertTriangle size={20} /></div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#EF4444' }}>ALERT</div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Retards Détectés</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#EF4444' }}>{kpis.retardes}</div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        <div className="nexus-card" style={{ gridColumn: 'span 8', padding: '2rem', background: 'white' }}>
          <h4 style={{ margin: '0 0 2rem 0', fontWeight: 900, fontSize: '1.1rem', color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={20} color="var(--nexus-primary)" strokeWidth={3} /> OTIF & Retards — Cycle 7 Mois
          </h4>
          <SafeResponsiveChart minHeight={300} fallbackHeight={300} isDataEmpty={SHIPMENTS.length === 0}>
            <ComposedChart data={otifTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--nexus-border)" opacity={0.4} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 12, fontWeight: 800 }} dy={10} />
              <YAxis yAxisId="l" axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 11, fontWeight: 700 }} domain={[80, 100]} />
              <YAxis yAxisId="r" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 11, fontWeight: 700 }} />
              <Tooltip />
              <Bar  yAxisId="r" dataKey="retards" name="Retards" fill="rgba(239, 68, 68, 0.1)" radius={[6,6,0,0]} barSize={30} />
              <Line yAxisId="l" dataKey="otif" name="OTIF (%)" stroke="var(--nexus-primary)" strokeWidth={4} dot={{ r: 6, fill: 'var(--nexus-primary)', strokeWidth: 0 }} />
            </ComposedChart>
          </SafeResponsiveChart>
        </div>

        <div className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'white' }}>
          <h4 style={{ margin: '0 0 2rem 0', fontWeight: 900, fontSize: '1.1rem', color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={18} color="#EF4444" /> Causes des Retards
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {causeRetards.map((c, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800, marginBottom: '8px' }}>
                  <span style={{ color: 'var(--nexus-secondary)' }}>{c.cause}</span>
                  <span style={{ color: c.color }}>{c.pct}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--nexus-bg)', borderRadius: '999px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${c.pct}%` }} transition={{ duration: 1 }}
                    style={{ height: '100%', background: c.color, borderRadius: '999px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carrier Performance Row */}
      <div className="nexus-card" style={{ padding: '2rem', background: 'white' }}>
        <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1.1rem', color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Truck size={18} color="var(--nexus-primary)" /> Performance des Transporteurs Nexus
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {TRANSPORTEURS.sort((a, b) => b.otif - a.otif).map((t, i) => (
            <div key={i} style={{ padding: '1.5rem', borderRadius: '20px', background: 'var(--nexus-bg)', display: 'flex', alignItems: 'center', gap: '2rem', border: '1px solid var(--nexus-border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--nexus-secondary)' }}>{t.nom}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Nexus Verified Carrier</div>
              </div>
              <div style={{ flex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 900, marginBottom: '6px' }}>
                  <span style={{ color: 'var(--nexus-text-muted)' }}>OTIF Score</span>
                  <span style={{ color: t.otif >= 95 ? 'var(--nexus-primary)' : '#F59E0B' }}>{t.otif}%</span>
                </div>
                <div style={{ height: '8px', background: 'white', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${t.otif}%`, height: '100%', background: t.otif >= 95 ? 'var(--nexus-primary)' : '#F59E0B' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>VOLUME</div>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--nexus-secondary)' }}>{t.livraisons}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>COÛT MOY.</div>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--nexus-secondary)' }}>{Math.round(t.coutMoy/1000)}k</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ═══════════ BONS DE LIVRAISON ═══════════ */
  const renderShipments = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div className="nexus-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', background: 'white' }}>
          <Search size={20} color="var(--nexus-text-muted)" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Rechercher par BL, client, destination..." 
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '1rem', fontWeight: 600, color: 'var(--nexus-secondary)' }} 
          />
        </div>
        {!isReadOnly && (
          <button onClick={() => setModal(true)} className="nexus-card" style={{ background: 'var(--nexus-primary)', padding: '1rem 2rem', color: 'white', fontWeight: 900, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Plus size={20} /> Nouveau BL
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        {filtered.map((s, i) => {
          const sc = SHIP_STATUS[s.statut] || SHIP_STATUS['Expédié'];
          return (
            <motion.div key={i} whileHover={{ y: -5 }} onClick={() => onOpenDetail?.(s, 'shipping', 'shipments')}
              className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'white', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--nexus-primary)' }}>{s.id}</div>
                <div style={{ padding: '4px 12px', borderRadius: '10px', background: `${sc.color}15`, color: sc.color, fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>{s.statut}</div>
              </div>
              <div style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--nexus-secondary)', marginBottom: '0.5rem' }}>{s.client}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--nexus-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                <MapPin size={16} color="var(--nexus-primary)" /> {s.dest}
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <TrackingTimeline statut={s.statut} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ background: 'var(--nexus-bg)', padding: '1rem', borderRadius: '16px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>TRANSPORTEUR</div>
                  <div style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--nexus-secondary)' }}>{s.transporteur}</div>
                </div>
                <div style={{ background: 'var(--nexus-bg)', padding: '1rem', borderRadius: '16px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>LIVRAISON PRÉVUE</div>
                  <div style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--nexus-secondary)' }}>{s.dateExpec}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100%' }}>
      
      {/* Nexus Header */}
      {!shellView?.mobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '6px', borderRadius: '10px' }}>
                <Truck size={16} color="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Nexus Supply Chain & Logistics
              </span>
            </div>
            <h1 className="nexus-gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>
              Expéditions & Livraisons
            </h1>
            <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.1rem', fontWeight: 500, maxWidth: '650px', lineHeight: 1.6 }}>
              Supervisez vos flux logistiques mondiaux avec une visibilité totale sur l'OTIF et le tracking en temps réel.
            </p>
          </div>

          {!isReadOnly && (
            <button onClick={() => setModal(true)} className="nexus-card" style={{ background: 'var(--nexus-secondary)', padding: '1rem 2rem', color: 'white', fontWeight: 900, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Plus size={20} /> Nouveau BL
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <TabBar tabs={[
          { id: 'dashboard',  label: 'Dashboard OTIF',      icon: <BarChart3 size={16}/> },
          { id: 'shipments',  label: 'Bons de Livraison',   icon: <FileText size={16}/> },
          { id: 'volume',     label: 'Volume & Flux',        icon: <Activity size={16}/> },
        ]} active={tab} onChange={setTab} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
          {tab === 'dashboard' && renderDashboard()}
          {tab === 'shipments' && renderShipments()}
          {tab === 'volume'    && renderVolume()}
        </motion.div>
      </AnimatePresence>

      <RecordModal isOpen={modal} onClose={() => setModal(false)} title="Nouveau Bon de Livraison" appId={appId}
        fields={modalFields} onSave={f => { addRecord('shipping', 'shipments', { ...f, tracking: 'En attente' }); setModal(false); }} />
    </div>
  );
};

export default Shipping;
