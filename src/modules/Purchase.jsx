import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Truck, Plus, ChevronRight, Building2, DollarSign,
  Star, AlertTriangle, CheckCircle2, Clock, BarChart3, Zap,
  TrendingUp, TrendingDown, Filter, FileText, Scale, Target,
  ArrowUpRight, Activity, RefreshCcw
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Cell, LineChart, Line, ComposedChart, Legend, PieChart, Pie
} from 'recharts';
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

const scoreColor = (s) => s >= 80 ? '#10B981' : s >= 60 ? '#F59E0B' : '#EF4444';

/* ════════════════════════════════════
   PURCHASE MODULE — Full Enterprise
════════════════════════════════════ */
const Purchase = ({ onOpenDetail }) => {
  const { data, addRecord, formatCurrency } = useBusiness();
  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(null); // 'order' | 'vendor' | 'rfq'

  const { orders = [] } = data.purchase || {};
  const vendors = useMemo(() => (data.base?.contacts || []).filter(c => c.type === 'Fournisseur'), [data.base?.contacts]);

  /* ─── Vendor Scorecards (enrichis) ─── */
  const vendorScores = useMemo(() => vendors.map((v, i) => ({
    ...v,
    categories: v.tags?.[0] || v.categories || 'Général',
    delaiMoyen: 0,
    conformite: 0,
    retardRate: 0,
    score: 0,
    totalAchats: 0,
    nbCommandes: 0,
  })), [vendors]);

  /* ─── Computed KPIs ─── */
  const kpis = useMemo(() => {
    const totalDepenses = orders.reduce((s, o) => s + (o.total || 0), 0);
    const budgetAchats = 0;
    const economiesRealisees = 0;
    const nbFournisseurs = vendorScores.length;
    const avgScore = vendorScores.length > 0 ? Math.round(vendorScores.reduce((s, v) => s + v.score, 0) / vendorScores.length) : 0;
    const enAttente = orders.filter(o => o.statut === 'Commandé').length;
    return { totalDepenses, budgetAchats, economiesRealisees, nbFournisseurs, avgScore, enAttente };
  }, [orders, vendorScores]);

  /* ─── Chart data ─── */
  const depensesParCategorie = [
    { cat: 'Matériel',  val: 42000000, color: '#3B82F6' },
    { cat: 'Cloud',     val: 28000000, color: '#8B5CF6' },
    { cat: 'Licences',  val: 15000000, color: '#10B981' },
    { cat: 'Services',  val: 8000000,  color: '#F59E0B' },
    { cat: 'Autre',     val: 2600000,  color: '#64748B' },
  ];
  const depensesTrend = [];

  /* ─── RFQ mockup ─── */
  const rfqs = [];

  /* ─── Modal configs ─── */
  const modalConfigs = useMemo(() => ({
    order: {
      title: "Créer un Bon de Commande Fournisseur",
      fields: [
        { name: 'num',         label: 'Numéro BC',    required: true, placeholder: 'ACH-2026-XXX' },
        { name: 'fournisseur', label: 'Fournisseur',  type: 'select', options: vendorScores.map(v => v.nom), required: true },
        { name: 'date',        label: 'Date',         type: 'date', required: true },
        { name: 'echeance',    label: 'Livraison Prévue', type: 'date' },
        { name: 'total',       label: 'Montant HT (FCFA)', type: 'number', required: true },
        { name: 'statut',      label: 'Statut', type: 'select', options: ['Brouillon', 'En approbation', 'Commandé', 'Réceptionné', 'Facturé'], required: true },
      ],
      save: f => addRecord('purchase', 'orders', f)
    },
    supplier: {
      title: 'Nouveau Fournisseur',
      fields: [
        { name: 'nom',          label: 'Nom de l\'entreprise', required: true },
        { name: 'contact',      label: 'Personne de Contact', required: true },
        { name: 'email',        label: 'Email Pro', type: 'email', required: true },
        { name: 'categorie',    label: 'Catégorie', type: 'select', options: ['Hardware', 'Software', 'Services', 'Logistique', 'Office'] },
        { name: 'paymentTerms', label: 'Conditions Paiement', type: 'select', options: ['30 jours', '45 jours', '60 jours', 'Immédiat'] },
      ],
      save: f => addRecord('base', 'contacts', { ...f, type: 'Fournisseur' })
    },
    rfq: {
      title: "Nouvelle Demande d'Achat / Appel d'Offres",
      fields: [
        { name: 'objet',      label: "Objet de l'achat", required: true },
        { name: 'budget',     label: 'Budget Estimé (FCFA)', type: 'number', required: true },
        { name: 'echeance',   label: 'Date limite réponse', type: 'date', required: true },
        { name: 'categorie',  label: 'Catégorie', type: 'select', options: ['Matériel', 'Cloud', 'Services', 'Licences'] },
        { name: 'priorite',   label: 'Priorité', type: 'select', options: ['Haute', 'Normale', 'Basse'] },
        { name: 'note',       label: 'Description / Spécifications', placeholder: 'Détails techniques...' },
      ],
      save: f => addRecord('purchase', 'orders', { ...f, statut: 'Brouillon', num: `DA-${Date.now()}` })
    }
  }), [addRecord, vendorScores]);
  const activeModal = modal ? modalConfigs[modal] : null;

  /* ═══════════ DASHBOARD ═══════════ */
  const renderDashboard = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPIs */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '1rem' }}>
        <KpiCard title="Dépenses Totales"      value={formatCurrency(kpis.totalDepenses, true)} trend={-5.2} trendType="up"   icon={<DollarSign size={20}/>}    color="#3B82F6" sparklineData={depensesTrend.map(d=>({val:d.depenses/1e6}))} />
        <KpiCard title="Budget Achats"         value={formatCurrency(kpis.budgetAchats, true)}  trend={0}    trendType="up"   icon={<Target size={20}/>}        color="#8B5CF6" sparklineData={[{val:10},{val:10},{val:10},{val:10},{val:10}]} />
        <KpiCard title="Économies Réalisées"   value={formatCurrency(kpis.economiesRealisees, true)} trend={12.4} trendType="up" icon={<TrendingUp size={20}/>} color="#10B981" sparklineData={[{val:5},{val:6},{val:7},{val:8},{val:8.5}]} />
        <KpiCard title="Score Fournisseurs"    value={`${kpis.avgScore}/100`}                   trend={3.1}  trendType="up"   icon={<Star size={20}/>}          color="#F59E0B" sparklineData={[{val:75},{val:78},{val:80},{val:81},{val:82}]} />
        <KpiCard title="Commandes en Attente"  value={kpis.enAttente + 3}                       trend={0}    trendType="down" icon={<Clock size={20}/>}         color="#EF4444" sparklineData={[{val:6},{val:5},{val:7},{val:5},{val:5}]} />
      </motion.div>

      {/* Budget Bar */}
      <motion.div variants={fadeIn} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: 700 }}>Consommation Budget Achats</span>
          <span style={{ fontWeight: 700, color: (kpis.totalDepenses / kpis.budgetAchats) > 0.9 ? '#EF4444' : '#10B981' }}>
            {Math.round((kpis.totalDepenses / kpis.budgetAchats) * 100)}%
          </span>
        </div>
        <div style={{ height: '12px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.4rem' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((kpis.totalDepenses / kpis.budgetAchats) * 100, 100)}%` }} transition={{ duration: 1.2 }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #10B981, #3B82F6)', borderRadius: '999px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>{formatCurrency(kpis.totalDepenses, true)} dépensés</span>
          <span>Budget: {formatCurrency(kpis.budgetAchats, true)}</span>
        </div>
      </motion.div>

      {/* Dépenses par catégorie + Trend */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Dépenses par Catégorie</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={depensesParCategorie.map(d => ({ name: d.cat, value: d.val, fill: d.color }))}
                cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                {depensesParCategorie.map((_, i) => <Cell key={i} fill={depensesParCategorie[i].color} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {depensesParCategorie.map((d, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                {d.cat}
              </span>
            ))}
          </div>
        </div>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Dépenses vs Budget — 7 Mois</h4>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={depensesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Bar dataKey="depenses" name="Dépenses"  fill="#3B82F6" radius={[4,4,0,0]} barSize={22} />
              <Line dataKey="budget"   name="Budget"    stroke="#EF4444" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* RFQ aperçu */}
      <motion.div variants={fadeIn}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Demandes d'Achat / Appels d'Offres</h4>
          <button onClick={() => setModal('rfq')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.9rem', borderRadius: '0.65rem', border: 'none', background: '#8B5CF6', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
            <Plus size={13} /> Demande d'Achat
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rfqs.map((rfq, i) => (
            <motion.div key={i} variants={fadeIn} className="glass" style={{ padding: '1.1rem 1.4rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--accent)', minWidth: '80px' }}>{rfq.id}</div>
              <div style={{ flex: 1, fontWeight: 600, fontSize: '0.88rem' }}>{rfq.objet}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{rfq.fournisseurs.join(', ')}</div>
              <div style={{ fontWeight: 700 }}>{formatCurrency(rfq.budget, true)}</div>
              <Chip label={rfq.statut} color={rfq.statut === 'En cours' ? '#3B82F6' : rfq.statut === 'Clôturé' ? '#10B981' : '#64748B'} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Échéance: {rfq.echeance}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  /* ═══════════ FOURNISSEURS SCORECARD ═══════════ */
  const renderVendors = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <motion.div variants={fadeIn} style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setModal('vendor')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.45rem 0.9rem', borderRadius: '0.65rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
          <Plus size={13} /> Nouveau Fournisseur
        </button>
      </motion.div>
      {vendorScores.sort((a, b) => b.score - a.score).map((v, i) => (
        <motion.div key={i} variants={fadeIn} onClick={() => onOpenDetail?.(v, 'purchase', 'vendors')}
          className="glass" style={{ padding: '1.4rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', cursor: 'pointer', flexWrap: 'wrap', borderLeft: `4px solid ${scoreColor(v.score)}` }}>
          {/* Rank */}
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: `${scoreColor(v.score)}15`, color: scoreColor(v.score), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
            {i + 1}
          </div>
          {/* Name */}
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{v.nom}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.categories} · {v.email}</div>
          </div>
          {/* Score global */}
          <div style={{ flex: '0 1 150px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Score Global</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ flex: 1, height: '8px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${v.score}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                  style={{ height: '100%', background: scoreColor(v.score), borderRadius: '999px' }} />
              </div>
              <span style={{ fontWeight: 800, color: scoreColor(v.score), minWidth: '36px' }}>{v.score}</span>
            </div>
          </div>
          {/* Stats */}
          {[
            { l: 'Délai Moy.', v: `${v.delaiMoyen}j`, c: v.delaiMoyen <= 4 ? '#10B981' : v.delaiMoyen <= 7 ? '#F59E0B' : '#EF4444' },
            { l: 'Conformité', v: `${v.conformite}%`, c: scoreColor(v.conformite) },
            { l: 'Taux Retard', v: `${v.retardRate}%`, c: v.retardRate <= 5 ? '#10B981' : v.retardRate <= 20 ? '#F59E0B' : '#EF4444' },
            { l: 'Total Achats', v: formatCurrency(v.totalAchats, true), c: 'var(--text)' },
          ].map((s, j) => (
            <div key={j} style={{ flex: '0 1 100px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>{s.l}</div>
              <div style={{ fontWeight: 700, color: s.c, fontSize: '0.88rem' }}>{s.v}</div>
            </div>
          ))}
        </motion.div>
      ))}
    </motion.div>
  );

  /* ═══════════ COMMANDES ═══════════ */
  const renderOrders = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <motion.div variants={fadeIn} style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setModal('order')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.45rem 0.9rem', borderRadius: '0.65rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
          <Plus size={13} /> Bon de Commande
        </button>
      </motion.div>
      <motion.div variants={fadeIn} className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-subtle)' }}>
            <tr>
              {['Référence', 'Fournisseur', 'Date', 'Livraison Prévue', 'Montant HT', 'Statut', ''].map((h, i) => (
                <th key={i} style={{ padding: '0.85rem 1.1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.73rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => {
              const sColors = { Réceptionné: '#10B981', Commandé: '#3B82F6', Facturé: '#8B5CF6', Brouillon: '#64748B', 'En approbation': '#F59E0B' };
              const c = sColors[o.statut] || '#64748B';
              return (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  onClick={() => onOpenDetail?.(o, 'purchase', 'orders')}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: 'var(--accent)' }}>{o.num}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}>{o.fournisseur}</td>
                  <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{o.date}</td>
                  <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{o.echeance || '—'}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700 }}>{formatCurrency(o.total, true)}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}><Chip label={o.statut} color={c} /></td>
                  <td style={{ padding: '0.9rem 1.1rem' }}><ChevronRight size={15} color="var(--text-muted)" /></td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8B5CF6', marginBottom: '0.4rem' }}>
            <ShoppingBag size={16} />
            <span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Achats — Procurement Intelligence</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Achats & Fournisseurs</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>
            Dashboard · Scorecard Fournisseurs · Commandes · Appels d'Offres
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setModal('rfq')} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Scale size={15} /> Appel d'Offres
          </button>
          <button onClick={() => setModal('order')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={15} /> Bon de Commande
          </button>
        </div>
      </div>

      <TabBar tabs={[
        { id: 'dashboard', label: 'Dashboard',       icon: <BarChart3 size={14}/> },
        { id: 'vendors',   label: 'Fournisseurs',    icon: <Star size={14}/> },
        { id: 'orders',    label: 'Commandes',       icon: <FileText size={14}/> },
      ]} active={tab} onChange={setTab} />

      {tab === 'dashboard' && renderDashboard()}
      {tab === 'vendors'   && renderVendors()}
      {tab === 'orders'    && renderOrders()}

      {activeModal && (
        <RecordModal isOpen={true} onClose={() => setModal(null)} title={activeModal.title} fields={activeModal.fields}
          onSave={f => { activeModal.save(f); setModal(null); }} />
      )}
    </div>
  );
};

export default Purchase;
