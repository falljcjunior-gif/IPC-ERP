import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, Plus, Search, CheckCircle2, XCircle, ChevronRight,
  CreditCard, FileText, Clock, User, Truck, Plane, Coffee,
  Home, BarChart3, TrendingUp, Target, AlertCircle, Download,
  Filter, Activity, DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Cell, ComposedChart, Line, Legend, PieChart, Pie
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';

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

const EXPENSE_TYPES = {
  Transport:     { icon: <Truck size={16}/>,    color: '#3B82F6' },
  Repas:         { icon: <Coffee size={16}/>,   color: '#F59E0B' },
  Hébergement:   { icon: <Home size={16}/>,     color: '#8B5CF6' },
  'Déplacement': { icon: <Plane size={16}/>,    color: '#10B981' },
  Fournitures:   { icon: <FileText size={16}/>, color: '#64748B' },
  Autre:         { icon: <CreditCard size={16}/>,color: '#EC4899' },
};

const ALL_EXPENSES_FALLBACK = [];

/* ════════════════════════════════════
   EXPENSES MODULE — Full Enterprise
════════════════════════════════════ */
const Expenses = ({ onOpenDetail }) => {
  const { data, addRecord, updateRecord, userRole, formatCurrency } = useBusiness();
  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState('all');

  const isManager = userRole === 'ADMIN' || userRole === 'HR' || userRole === 'FINANCE' || userRole === 'SUPER_ADMIN';

  /* ─── KPIs ─── */
  const allExpenses = useMemo(() => data?.hr?.expenses || [], [data?.hr?.expenses]);

  /* ─── KPIs ─── */
  const kpis = useMemo(() => {
    const total       = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const enAttente   = allExpenses.filter(e => e.status === 'En attente');
    const approuves   = allExpenses.filter(e => e.status === 'Approuvé' || e.status === 'Remboursé');
    const totalAppr   = approuves.reduce((s, e) => s + (e.amount || 0), 0);
    const txValidation= allExpenses.length > 0 ? Math.round((approuves.length / allExpenses.length) * 100) : 0;
    const sansRecu    = allExpenses.filter(e => !e.receipt && e.status === 'En attente').length;
    return { total, enAttente, totalAppr, txValidation, sansRecu };
  }, [allExpenses]);

  /* ─── Par catégorie ─── */
  const parCategorie = useMemo(() => {
    const map = allExpenses.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + (e.amount || 0);
      return acc;
    }, {});
    return Object.entries(map).map(([name, value]) => ({ name, value, fill: EXPENSE_TYPES[name]?.color || '#64748B' }))
      .sort((a, b) => b.value - a.value);
  }, [allExpenses]);

  /* ─── Par employé ─── */
  const parEmploye = useMemo(() => {
    const map = allExpenses.reduce((acc, e) => {
      acc[e.employee] = (acc[e.employee] || 0) + (e.amount || 0);
      return acc;
    }, {});
    return Object.entries(map).map(([nom, montant]) => ({ nom: (nom || 'N/A').split(' ')[0], montant })).sort((a, b) => b.montant - a.montant);
  }, [allExpenses]);

  const mensuel = [];

  const handleAction = (id, newStatus) => updateRecord('hr', 'expenses', id, { status: newStatus });

  const filteredExpenses = filter === 'pending'
    ? allExpenses.filter(e => e.status === 'En attente')
    : filter === 'mine'
    ? allExpenses.filter(e => e.employee === currentUser.nom)
    : allExpenses;

  /* ═══════════ DASHBOARD ═══════════ */
  const renderDashboard = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Total Frais (M)"       value={formatCurrency(kpis.total, true)}      trend={12.4} trendType="up"   icon={<Wallet size={20}/>}      color="#3B82F6" sparklineData={mensuel.map(d=>({val:d.total/1000}))} />
        <KpiCard title="Total Approuvés"       value={formatCurrency(kpis.totalAppr, true)}  trend={8.2}  trendType="up"   icon={<CheckCircle2 size={20}/>} color="#10B981" sparklineData={mensuel.map(d=>({val:d.approuve/1000}))} />
        <KpiCard title="En Attente"            value={`${kpis.enAttente.length} dossiers`}   trend={0}    trendType="down" icon={<Clock size={20}/>}        color="#F59E0B" sparklineData={[{val:4},{val:3},{val:5},{val:kpis.enAttente.length}]} />
        <KpiCard title="Taux de Validation"    value={`${kpis.txValidation}%`}               trend={3.0}  trendType="up"   icon={<Target size={20}/>}       color="#8B5CF6" sparklineData={[{val:72},{val:74},{val:76},{val:kpis.txValidation}]} />
        <KpiCard title="Sans Justificatif"     value={`${kpis.sansRecu} frais`}              trend={0}    trendType="down" icon={<AlertCircle size={20}/>}  color="#EF4444" sparklineData={[{val:2},{val:1},{val:2},{val:kpis.sansRecu}]} />
      </motion.div>

      {kpis.enAttente.length > 0 && isManager && (
        <motion.div variants={fadeIn} className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: '1.25rem', border: '1px solid #F59E0B30' }}>
          <h4 style={{ fontWeight: 700, color: '#F59E0B', marginBottom: '0.75rem', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} /> {kpis.enAttente.length} Note(s) de Frais en attente d'approbation
          </h4>
          {kpis.enAttente.map((e, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, flex: 1 }}>{e.employee}</span>
              <span style={{ fontSize: '0.8rem' }}>{e.title}</span>
              <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(e.amount)}</span>
              {!e.receipt && <Chip label="Sans reçu" color="#EF4444" />}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => handleAction(e.id, 'Approuvé')} style={{ padding: '3px 10px', borderRadius: '0.4rem', border: 'none', background: '#10B98120', color: '#10B981', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}>✓ Approuver</button>
                <button onClick={() => handleAction(e.id, 'Rejeté')} style={{ padding: '3px 10px', borderRadius: '0.4rem', border: 'none', background: '#EF444420', color: '#EF4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}>✕ Rejeter</button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Frais Mensuels vs Approuvés</h4>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={mensuel}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Bar dataKey="total"    name="Total"     fill="#3B82F630" radius={[4,4,0,0]} barSize={24} />
              <Bar dataKey="approuve" name="Approuvé"  fill="#10B981"   radius={[4,4,0,0]} barSize={24} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Répartition par Catégorie</h4>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={parCategorie} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={4} dataKey="value">
                {parCategorie.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
            {parCategorie.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.fill, display: 'inline-block' }} /> {c.name}
                </div>
                <span style={{ fontWeight: 700 }}>{formatCurrency(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Par employé */}
      <motion.div variants={fadeIn} className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
        <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Top Dépenses — Par Collaborateur</h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={parEmploye} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="nom" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={70} />
            <Tooltip content={<TT />} />
            <Bar dataKey="montant" name="Montant (FCFA)" fill="var(--accent)" radius={[0,6,6,0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );

  /* ═══════════ NOTES DE FRAIS ═══════════ */
  const renderExpenses = () => {
    const statusColor = { Remboursé: '#10B981', Approuvé: '#3B82F6', 'En attente': '#F59E0B', Rejeté: '#EF4444' };
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <motion.div variants={fadeIn} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
            {[{ k: 'all', l: 'Tous' }, { k: 'mine', l: 'Mes Frais' }, { k: 'pending', l: `À Valider (${kpis.enAttente.length})` }].map(f => (
              <button key={f.k} onClick={() => setFilter(f.k)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.55rem', border: 'none', background: filter === f.k ? 'var(--bg)' : 'transparent', color: filter === f.k ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                {f.l}
              </button>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={14} /> Déclarer un Frais
          </button>
        </motion.div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredExpenses.map((exp, i) => {
            const typeConf = EXPENSE_TYPES[exp.type] || EXPENSE_TYPES['Autre'];
            return (
              <motion.div key={i} variants={fadeIn} className="glass"
                style={{ padding: '1.1rem 1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', cursor: 'pointer' }}
                onClick={() => onOpenDetail?.(exp, 'hr', 'expenses')}>
                <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: `${typeConf.color}15`, color: typeConf.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {typeConf.icon}
                </div>
                <div style={{ flex: '1 1 160px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{exp.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{exp.employee} · {exp.date} · {exp.mission}</div>
                </div>
                <Chip label={exp.type} color={typeConf.color} />
                <div style={{ fontWeight: 800, fontSize: '1rem', minWidth: '90px', textAlign: 'right' }}>{formatCurrency(exp.amount)}</div>
                {!exp.receipt && <Chip label="⚠ Sans reçu" color="#EF4444" />}
                <Chip label={exp.status} color={statusColor[exp.status] || '#64748B'} />
                {filter === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={e => { e.stopPropagation(); handleAction(exp.id, 'Approuvé'); }} style={{ padding: '4px 10px', borderRadius: '0.4rem', border: 'none', background: '#10B98120', color: '#10B981', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>✓</button>
                    <button onClick={e => { e.stopPropagation(); handleAction(exp.id, 'Rejeté'); }} style={{ padding: '4px 10px', borderRadius: '0.4rem', border: 'none', background: '#EF444420', color: '#EF4444', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>✕</button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8B5CF6', marginBottom: '0.4rem' }}>
            <Wallet size={16} /><span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Finance RH — Notes de Frais</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Gestion des Notes de Frais</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>Déclaration · Approbation · Rapports · Top Dépenses</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="glass" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Download size={15} /> Export
          </button>
          <button onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={15} /> Déclarer un Frais
          </button>
        </div>
      </div>

      <TabBar tabs={[
        { id: 'dashboard', label: 'Analytics',       icon: <BarChart3 size={14}/> },
        { id: 'expenses',  label: 'Notes de Frais',  icon: <Wallet size={14}/> },
      ]} active={tab} onChange={setTab} />

      {tab === 'dashboard' && renderDashboard()}
      {tab === 'expenses'  && renderExpenses()}

      <RecordModal isOpen={modal} onClose={() => setModal(false)} title="Nouvelle Note de Frais"
        fields={[
          { name: 'title',    label: 'Libellé',        required: true },
          { name: 'amount',   label: 'Montant TTC (FCFA)', type: 'number', required: true },
          { name: 'date',     label: 'Date',           type: 'date', required: true },
          { name: 'type',     label: 'Catégorie',      type: 'select', options: Object.keys(EXPENSE_TYPES), required: true },
          { name: 'employee', label: 'Collaborateur',  type: 'select', options: data.hr.employees.map(e => e.nom), required: true },
          { name: 'mission',  label: 'Mission / Objet', required: true },
        ]}
        onSave={f => { addRecord('hr', 'expenses', { ...f, status: 'En attente', receipt: true }); setModal(false); }}
      />
    </div>
  );
};

export default Expenses;
