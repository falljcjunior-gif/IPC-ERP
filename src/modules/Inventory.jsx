import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package, ArrowUpRight, ArrowDownLeft, Plus, Search, AlertTriangle,
  History, ChevronRight, Database, BarChart3, Truck, Zap, Activity,
  TrendingUp, TrendingDown, RefreshCcw, Target, MapPin, Clock,
  Star, CheckCircle2, XCircle, Filter, Download
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Cell, PieChart, Pie, LineChart, Line, ComposedChart, Area, AreaChart, Legend
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';

/* ─── Helpers ─── */
const fadeIn = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const Chip = ({ label, color = '#64748B' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: '999px', background: `${color}18`, color, fontSize: '0.71rem', fontWeight: 700 }}>{label}</span>
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

/* ABC Class colors */
const ABC_COLOR = { A: '#10B981', B: '#F59E0B', C: '#EF4444' };

/* ════════════════════════════════════
   INVENTORY MODULE — Full Enterprise
════════════════════════════════════ */
const Inventory = ({ onOpenDetail }) => {
  const { data, addRecord, formatCurrency } = useBusiness();
  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(null); // 'product' | 'movement' | 'reception' | 'inventory'
  const [search, setSearch] = useState('');

  /* ─── Base Data ─── */
  const { movements = [] } = data.inventory;
  const products = (data.base.catalog || []).map((p, i) => ({
    ...p,
    stock: p.stock ?? 0,
    alerte: p.alerte ?? 0,
    emplacement: p.emplacement ?? 'N/A',
    coutUnit: (p.prixMoyen || 0) * 0.6,
    sorties30j: p.sorties30j ?? 0,
    entrees30j: p.entrees30j ?? 0,
  }));

  /* ─── Computed KPIs ─── */
  const kpis = useMemo(() => {
    const enAlerte = products.filter(p => p.stock <= p.alerte);
    const valeurTotale = products.reduce((s, p) => s + p.stock * p.coutUnit, 0);
    const rotations = products.map(p => ({
      ...p,
      rotation: p.stock > 0 ? (p.sorties30j * 12) / p.stock : 0,
      couvertureDays: p.sorties30j > 0 ? Math.round((p.stock / p.sorties30j) * 30) : 999,
      abcClass: p.coutUnit * p.sorties30j > 50000 ? 'A' : p.coutUnit * p.sorties30j > 10000 ? 'B' : 'C',
    }));
    const avgRotation = rotations.reduce((s, p) => s + p.rotation, 0) / rotations.length;
    const otif = 94.2;
    const serviceRate = 97.1;
    return { enAlerte, valeurTotale, rotations, avgRotation, otif, serviceRate };
  }, [products]);

  const warehouses = data.inventory?.warehouses || [];

  const rotationTrend = [];

  const abcDistrib = [
    { name: 'Classe A', value: kpis.rotations.filter(p => p.abcClass === 'A').length, fill: '#10B981' },
    { name: 'Classe B', value: kpis.rotations.filter(p => p.abcClass === 'B').length, fill: '#F59E0B' },
    { name: 'Classe C', value: kpis.rotations.filter(p => p.abcClass === 'C').length, fill: '#EF4444' },
  ];

  /* ─── Modal configs ─── */
  const modalConfigs = {
    product: {
      title: 'Nouveau Référencement Produit',
      fields: [
        { name: 'code', label: 'Référence', required: true, placeholder: 'PROD-XXX' },
        { name: 'nom', label: 'Désignation', required: true },
        { name: 'stock', label: 'Stock Initial', type: 'number', required: true },
        { name: 'alerte', label: 'Seuil d\'alerte', type: 'number', required: true },
        { name: 'coutUnit', label: 'Coût Unitaire (FCFA)', type: 'number' },
        { name: 'emplacement', label: 'Emplacement', placeholder: 'Ex: WH-CENT A4' },
      ],
      save: f => addRecord('base', 'catalog', f),
    },
    movement: {
      title: 'Enregistrer un Mouvement de Stock',
      fields: [
        { name: 'produit', label: 'Produit', type: 'select', options: products.map(p => p.nom), required: true },
        { name: 'type', label: 'Type', type: 'select', options: ['Réception', 'Expédition', 'Transfert', 'Ajustement'], required: true },
        { name: 'qte', label: 'Quantité', type: 'number', required: true },
        { name: 'source', label: 'Entrepôt Source', type: 'select', options: warehouses.map(w => w.nom) },
        { name: 'dest', label: 'Entrepôt Destination', type: 'select', options: warehouses.map(w => w.nom) },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'ref', label: 'Référence Document', required: true, placeholder: 'BL-2026-XXX' },
      ],
      save: f => addRecord('inventory', 'movements', f),
    },
    inventory: {
      title: 'Inventaire Physique — Écart de Stock',
      fields: [
        { name: 'produit', label: 'Produit', type: 'select', options: products.map(p => p.nom), required: true },
        { name: 'qteTheorique', label: 'Qté Théorique (Système)', type: 'number', required: true },
        { name: 'qteReelle', label: 'Qté Réelle (Comptée)', type: 'number', required: true },
        { name: 'date', label: 'Date Comptage', type: 'date', required: true },
        { name: 'responsable', label: 'Responsable Inventaire', required: true },
        { name: 'note', label: 'Motif Écart', placeholder: 'Casse, Vol, Erreur saisie...' },
      ],
      save: f => addRecord('inventory', 'movements', { ...f, type: 'Inventaire', qte: (f.qteReelle - f.qteTheorique) }),
    },
  };

  /* ═══════════ DASHBOARD ═══════════ */
  const renderDashboard = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* KPIs */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '1rem' }}>
        <KpiCard title="Valeur Stock Totale"    value={formatCurrency(kpis.valeurTotale, true)} trend={3.2} trendType="up"   icon={<Package size={20}/>}      color="#3B82F6" sparklineData={rotationTrend.map(d => ({ val: d.valeur }))} />
        <KpiCard title="Rotation des Stocks"    value={`${kpis.avgRotation.toFixed(1)}x / an`} trend={4.5} trendType="up"   icon={<RefreshCcw size={20}/>}   color="#10B981" sparklineData={rotationTrend.map(d => ({ val: d.rotation }))} />
        <KpiCard title="OTIF"                   value={`${kpis.otif}%`}                         trend={-2.1}trendType="down"  icon={<Target size={20}/>}       color="#F59E0B" sparklineData={[{val:96},{val:95.5},{val:95},{val:94.8},{val:94.2}]} />
        <KpiCard title="Taux de Service"         value={`${kpis.serviceRate}%`}                 trend={0.4} trendType="up"   icon={<CheckCircle2 size={20}/>}  color="#8B5CF6" sparklineData={[{val:96},{val:96.5},{val:97},{val:97},{val:97.1}]} />
        <KpiCard title="Articles en Alerte"     value={kpis.enAlerte.length}                   trend={0}   trendType="down"  icon={<AlertTriangle size={20}/>} color="#EF4444" sparklineData={[{val:8},{val:6},{val:7},{val:5},{val:kpis.enAlerte.length}]} />
      </motion.div>

      {/* Alertes Réapprovisionnement */}
      {kpis.enAlerte.length > 0 && (
        <motion.div variants={fadeIn} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #EF444430' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1rem', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> Alertes Réapprovisionnement — {kpis.enAlerte.length} Article(s)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {kpis.enAlerte.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.65rem 1rem', background: 'var(--bg-subtle)', borderRadius: '0.75rem' }}>
                <div style={{ flex: 1, fontWeight: 600, fontSize: '0.85rem' }}>{p.nom}</div>
                <Chip label={`Stock: ${p.stock}`} color="#EF4444" />
                <Chip label={`Seuil: ${p.alerte}`} color="#F59E0B" />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.emplacement}</div>
                <button onClick={() => setModal('movement')} style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3B82F6', background: '#3B82F615', border: 'none', borderRadius: '0.5rem', padding: '4px 10px', cursor: 'pointer' }}>
                  ↺ Réappro
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Rotation + ABC */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Évolution Rotation des Stocks</h4>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={rotationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis yAxisId="l" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis yAxisId="r" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Bar yAxisId="r" dataKey="valeur" name="Valeur Stock (M)" fill="#3B82F620" radius={[4,4,0,0]} barSize={20} />
              <Line yAxisId="l" dataKey="rotation" name="Rotation (x/an)" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Analyse ABC des Articles</h4>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={abcDistrib} cx="50%" cy="50%" innerRadius={45} outerRadius={68} dataKey="value" paddingAngle={4}>
                {abcDistrib.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
            {abcDistrib.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.fill, display: 'inline-block' }} />
                  {c.name}
                </div>
                <span style={{ fontWeight: 700 }}>{c.value} articles</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Taux d'occupation entrepôts */}
      <motion.div variants={fadeIn}>
        <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>🏭 Taux d'Occupation — Entrepôts</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {warehouses.map((wh, i) => (
            <div key={i} className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{wh.nom}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                    <MapPin size={11} /> {wh.lieu}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.3rem', color: wh.taux > 80 ? '#EF4444' : wh.taux > 60 ? '#F59E0B' : '#10B981' }}>
                  {wh.taux}%
                </div>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${wh.taux}%` }} transition={{ duration: 1, delay: i * 0.15 }}
                  style={{ height: '100%', background: wh.taux > 80 ? '#EF4444' : wh.taux > 60 ? '#F59E0B' : '#10B981', borderRadius: '999px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>{wh.items} articles</span>
                <span>{wh.occupe.toLocaleString('fr-FR')}/{wh.capacite.toLocaleString('fr-FR')} unités</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  /* ═══════════ ARTICLES / ABC ═══════════ */
  const renderArticles = () => {
    const filtered = kpis.rotations.filter(p =>
      p.nom.toLowerCase().includes(search.toLowerCase()) || (p.code || '').toLowerCase().includes(search.toLowerCase())
    );
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <motion.div variants={fadeIn} className="glass" style={{ padding: '0.6rem 1rem', borderRadius: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Search size={15} color="var(--text-muted)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Chercher un article..." style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '0.88rem', color: 'var(--text)' }} />
        </motion.div>
        <motion.div variants={fadeIn} className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-subtle)' }}>
              <tr>
                {['Référence', 'Désignation', 'Classe ABC', 'Stock', 'Couverture', 'Rotation/an', 'Emplacement', 'Statut'].map((h, i) => (
                  <th key={i} style={{ padding: '0.85rem 1.1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.73rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  onClick={() => onOpenDetail?.(p, 'inventory', 'products')}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: 'var(--accent)' }}>{p.code}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 600 }}>{p.nom}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}>
                    <Chip label={`Classe ${p.abcClass}`} color={ABC_COLOR[p.abcClass]} />
                  </td>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 800, color: p.stock <= p.alerte ? '#EF4444' : 'var(--text)' }}>
                    {p.stock} <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ alerte {p.alerte}</span>
                  </td>
                  <td style={{ padding: '0.9rem 1.1rem' }}>
                    <span style={{ color: p.couvertureDays < 14 ? '#EF4444' : p.couvertureDays < 30 ? '#F59E0B' : '#10B981', fontWeight: 700 }}>
                      {p.couvertureDays < 999 ? `${p.couvertureDays}j` : '∞'}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1.1rem' }}>{p.rotation.toFixed(1)}x</td>
                  <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{p.emplacement}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}>
                    {p.stock <= p.alerte
                      ? <Chip label="Alerte Réappro" color="#EF4444" />
                      : <Chip label="Nominal" color="#10B981" />}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </motion.div>
    );
  };

  /* ═══════════ MOUVEMENTS ═══════════ */
  const renderMovements = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <motion.div variants={fadeIn} style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button onClick={() => setModal('movement')} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.45rem 0.9rem', borderRadius: '0.65rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
          <Plus size={14} /> Mouvement
        </button>
        <button onClick={() => setModal('inventory')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.45rem 0.9rem', borderRadius: '0.65rem', border: 'none', background: '#8B5CF6', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
          <Database size={14} /> Inventaire Physique
        </button>
      </motion.div>
      <motion.div variants={fadeIn} className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-subtle)' }}>
            <tr>
              {['Date', 'Produit', 'Type', 'Quantité', 'Source → Dest.', 'Référence', ''].map((h, i) => (
                <th key={i} style={{ padding: '0.85rem 1.1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.73rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...movements,
              { id: 'S1', num: 'MVT-003', produit: 'Licence CRM Annuelle',  date: '2026-04-10', type: 'Transfert',  qte: 20,  ref: 'TRF-001', source: 'WH-CENT', dest: 'DEPOT-NORD' },
              { id: 'S2', num: 'MVT-004', produit: 'Support Premium 24/7',  date: '2026-04-11', type: 'Inventaire', qte: -2,  ref: 'INV-2026-01', source: 'WH-CENT', dest: '' },
              { id: 'S3', num: 'MVT-005', produit: 'Serveur Pro GenX',       date: '2026-04-12', type: 'Réception', qte: 15,  ref: 'ACH-2026-003', source: 'Intel Europe', dest: 'WH-CENT' },
            ].map((mov, i) => {
              const typeColors = { Réception: '#10B981', Expédition: '#EF4444', Transfert: '#3B82F6', Inventaire: '#8B5CF6', Ajustement: '#F59E0B' };
              const color = typeColors[mov.type] || '#64748B';
              return (
                <motion.tr key={mov.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{mov.date}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 600 }}>{mov.produit}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {mov.type === 'Réception' ? <ArrowDownLeft size={14} color={color} /> : <ArrowUpRight size={14} color={color} />}
                      <Chip label={mov.type} color={color} />
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 800, color: mov.qte >= 0 ? '#10B981' : '#EF4444' }}>
                    {mov.qte >= 0 ? '+' : ''}{mov.qte}
                  </td>
                  <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {mov.source} {mov.dest ? `→ ${mov.dest}` : ''}
                  </td>
                  <td style={{ padding: '0.9rem 1.1rem', color: 'var(--accent)', fontWeight: 600 }}>{mov.ref}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}><ChevronRight size={15} color="var(--text-muted)" /></td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );

  /* ─── Active Modal ─── */
  const activeModal = modal ? modalConfigs[modal] : null;

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F59E0B', marginBottom: '0.4rem' }}>
            <Package size={16} />
            <span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Supply Chain — Gestion des Stocks</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Inventaire & Logistique</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>
            KPIs Supply · ABC Analysis · Mouvements · Entrepôts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setModal('movement')} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <ArrowUpRight size={15} /> Mouvement
          </button>
          <button onClick={() => setModal('product')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={15} /> Nouveau Article
          </button>
        </div>
      </div>

      <TabBar tabs={[
        { id: 'dashboard',  label: 'Dashboard KPIs',    icon: <BarChart3 size={14} /> },
        { id: 'articles',   label: 'Articles & ABC',     icon: <Package size={14} /> },
        { id: 'movements',  label: 'Mouvements',         icon: <History size={14} /> },
        { id: 'warehouses', label: 'Entrepôts',          icon: <MapPin size={14} /> },
      ]} active={tab} onChange={setTab} />

      {tab === 'dashboard'  && renderDashboard()}
      {tab === 'articles'   && renderArticles()}
      {tab === 'movements'  && renderMovements()}
      {tab === 'warehouses' && (
        <motion.div variants={stagger} initial="hidden" animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {warehouses.map((wh, i) => (
            <motion.div key={i} variants={fadeIn} whileHover={{ y: -4 }} className="glass"
              style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '4px' }}>{wh.nom}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1rem' }}>
                <MapPin size={12} /> {wh.lieu} · Code: {wh.id}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                {[{ l: 'Articles', v: wh.items }, { l: 'Unités', v: wh.occupe.toLocaleString('fr-FR') }, { l: 'Capacité', v: wh.capacite.toLocaleString('fr-FR') }, { l: 'Taux Occ.', v: `${wh.taux}%` }].map((s, j) => (
                  <div key={j} style={{ background: 'var(--bg-subtle)', padding: '0.6rem', borderRadius: '0.6rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.l}</div>
                    <div style={{ fontWeight: 700 }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${wh.taux}%` }} transition={{ duration: 1, delay: i * 0.15 }}
                  style={{ height: '100%', background: wh.taux > 80 ? '#EF4444' : wh.taux > 60 ? '#F59E0B' : '#10B981', borderRadius: '999px' }} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {activeModal && (
        <RecordModal isOpen={true} onClose={() => setModal(null)} title={activeModal.title} fields={activeModal.fields}
          onSave={f => { activeModal.save(f); setModal(null); }} />
      )}
    </div>
  );
};

export default Inventory;
