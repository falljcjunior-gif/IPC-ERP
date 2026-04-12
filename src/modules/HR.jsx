import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Calendar, Wallet, Plus, Mail, Phone, Briefcase, Clock,
  CheckCircle2, AlertCircle, ChevronRight, BarChart3, TrendingUp,
  TrendingDown, UserCheck, Check, X, Star, Target, Activity,
  Award, BookOpen, AlertTriangle, MapPin, Search, Filter,
  ArrowUpRight, Zap, Heart, Shield, GitBranch, Terminal, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, ComposedChart, Line, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, PieChart, Pie
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

const DEPT_COLORS = { IT: '#3B82F6', Ventes: '#10B981', RH: '#F97316', Finance: '#8B5CF6', Marketing: '#EC4899', Production: '#F59E0B', Direction: '#14B8A6' };

/* ════════════════════════════════════
   HR MODULE — Full Enterprise
════════════════════════════════════ */
const HR = ({ onOpenDetail }) => {
  const { data, addRecord, approveRequest, rejectRequest, formatCurrency } = useBusiness();
  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const { employees, leaves } = data.hr;

  /* ─── Enriched employee data ─── */
  const enrichedEmployees = useMemo(() => {
    return (employees || []).map(e => ({
      ...e,
      salaire: e.salaire || 0,
      performance: e.performance || 0,
      congesRestants: e.congesRestants || 0,
      contrat: e.contrat || 'N/A',
      email: e.email || '',
      tel: e.tel || '',
      skills: e.skills || { technique: 50, soft: 50, leader: 50, product: 50, agile: 50 }
    }));
  }, [employees]);

  /* ─── KPIs ─── */
  const kpis = useMemo(() => {
    const masseSalariale = enrichedEmployees.reduce((s, e) => s + (e.salaire || 0), 0) * 12;
    const turnover = 8.4;
    const absenteisme = 3.2;
    const engagementScore = 76;
    const enFormation = 3;
    const deptDist = Object.entries(
      enrichedEmployees.reduce((acc, e) => ({ ...acc, [e.dept]: (acc[e.dept] || 0) + 1 }), {})
    ).map(([name, value]) => ({ name, value, fill: DEPT_COLORS[name] || '#64748B' }));
    return { masseSalariale, turnover, absenteisme, engagementScore, enFormation, deptDist };
  }, [enrichedEmployees]);

  const headcountTrend = [
    { mois: 'Oct', effectif: 6, entrees: 0, sorties: 0 },
    { mois: 'Nov', effectif: 6, entrees: 0, sorties: 0 },
    { mois: 'Déc', effectif: 7, entrees: 1, sorties: 0 },
    { mois: 'Jan', effectif: 7, entrees: 0, sorties: 0 },
    { mois: 'Fév', effectif: 7, entrees: 0, sorties: 0 },
    { mois: 'Mar', effectif: 8, entrees: 1, sorties: 0 },
    { mois: 'Avr', effectif: enrichedEmployees.length, entrees: 0, sorties: 0 },
  ];

  const performanceData = enrichedEmployees.map(e => ({
    nom: e.nom.split(' ')[0],
    score: e.performance || 80,
    fill: e.performance >= 85 ? '#10B981' : e.performance >= 70 ? '#F59E0B' : '#EF4444',
  }));

  const allLeaves = leaves || [];

  /* ─── Recruitment Data ─── */
  const candidates = data.hr?.candidates || [];
  const jobs = data.hr?.jobs || [];
  const formations = data.hr?.formations || [];

  /* ─── Modal configs ─── */
  const modalConfigs = {
    employee: {
      title: 'Nouveau Collaborateur',
      fields: [
        { name: 'nom',         label: 'Nom Complet',    required: true },
        { name: 'poste',       label: 'Poste / Fonction', required: true },
        { name: 'dept',        label: 'Département', type: 'select', options: Object.keys(DEPT_COLORS), required: true },
        { name: 'manager',     label: 'Manager Direct', required: true },
        { name: 'dateEntree',  label: 'Date d\'embauche', type: 'date', required: true },
        { name: 'contrat',     label: 'Type de Contrat', type: 'select', options: ['CDI', 'CDD', 'Alternance', 'Stage', 'Freelance'] },
        { name: 'salaire',     label: 'Salaire Brut Mensuel (FCFA)', type: 'number' },
        { name: 'email',       label: 'Email Pro', type: 'email', required: true },
        { name: 'avatar',      label: 'Initiales', required: true, placeholder: 'Ex: JD' },
      ],
      save: f => addRecord('hr', 'employees', f),
    },
    leave: {
      title: 'Demande de Congé',
      fields: [
        { name: 'employe', label: 'Collaborateur', type: 'select', options: enrichedEmployees.map(e => e.nom), required: true },
        { name: 'type',    label: 'Type', type: 'select', options: ['Congés Payés', 'Maladie', 'RTT', 'Formation', 'Maternité/Paternité', 'Autre'], required: true },
        { name: 'du',      label: 'Du',   type: 'date', required: true },
        { name: 'au',      label: 'Au',   type: 'date', required: true },
        { name: 'note',    label: 'Commentaire' },
      ],
      save: f => addRecord('hr', 'leaves', { ...f, statut: 'En attente' }),
    },
    formation: {
      title: 'Planifier une Formation',
      fields: [
        { name: 'titre',    label: 'Titre de la formation', required: true },
        { name: 'employe',  label: 'Collaborateur', type: 'select', options: enrichedEmployees.map(e => e.nom), required: true },
        { name: 'date',     label: 'Date de début', type: 'date', required: true },
        { name: 'duree',    label: 'Durée', type: 'select', options: ['0.5j', '1j', '2j', '3j', '5j', '10j'] },
        { name: 'organisme',label: 'Organisme / Formateur' },
        { name: 'budget',   label: 'Budget (FCFA)', type: 'number' },
      ],
      save: () => {},
    },
  };
  const activeMod = modal ? modalConfigs[modal] : null;

  /* ═══════════ DASHBOARD ═══════════ */
  const renderDashboard = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPIs */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '1rem' }}>
        <KpiCard title="Effectif Total"       value={enrichedEmployees.length}              trend={0} trendType="up"   icon={<Users size={20}/>}       color="#3B82F6" sparklineData={[]} />
        <KpiCard title="Masse Salariale/an"   value={formatCurrency(kpis.masseSalariale, true)} trend={0} trendType="up" icon={<Wallet size={20}/>}      color="#8B5CF6" sparklineData={[]} />
        <KpiCard title="Taux de Turnover"     value={`${kpis.turnover}%`}                  trend={0} trendType="up"   icon={<TrendingDown size={20}/>} color="#10B981" sparklineData={[]} />
        <KpiCard title="Absentéisme"          value={`${kpis.absenteisme}%`}               trend={0}  trendType="down" icon={<Clock size={20}/>}        color="#EF4444" sparklineData={[]} />
        <KpiCard title="Score Engagement"     value={`${kpis.engagementScore}/100`}        trend={0}  trendType="up"   icon={<Heart size={20}/>}        color="#EC4899" sparklineData={[]} />
        <KpiCard title="En Formation"         value={`${kpis.enFormation} collab.`}        trend={0}    trendType="up"   icon={<BookOpen size={20}/>}     color="#F59E0B" sparklineData={[]} />
      </motion.div>

      {/* Effectif Trend + Distribution dept */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Évolution Effectifs — Entrées / Sorties</h4>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={headcountTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Bar dataKey="entrees" name="Entrées"  fill="#10B981" radius={[4,4,0,0]} barSize={18} />
              <Bar dataKey="sorties" name="Sorties"  fill="#EF4444" radius={[4,4,0,0]} barSize={18} />
              <Line dataKey="effectif" name="Effectif Total" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: '#3B82F6' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Effectif par Département</h4>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={kpis.deptDist} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={4} dataKey="value">
                {kpis.deptDist.map((e, i) => <Cell key={i} fill={e.fill || '#64748B'} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
            {kpis.deptDist.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.fill, display: 'inline-block' }} />
                  {d.name}
                </div>
                <span style={{ fontWeight: 700 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Performance Bar Chart */}
      <motion.div variants={fadeIn} className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
        <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Performance Individuelle (Score 0-100)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={performanceData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis type="category" dataKey="nom" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={80} />
            <Tooltip content={<TT />} />
            <Bar dataKey="score" name="Score Perf." radius={[0, 6, 6, 0]} barSize={18}>
              {performanceData.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );

  /* ═══════════ EMPLOYÉS ═══════════ */
  const renderEmployees = () => {
    const filtered = enrichedEmployees.filter(e =>
      e.nom.toLowerCase().includes(search.toLowerCase()) ||
      e.poste.toLowerCase().includes(search.toLowerCase()) ||
      e.dept.toLowerCase().includes(search.toLowerCase())
    );
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <motion.div variants={fadeIn} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="glass" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem', borderRadius: '0.75rem', minWidth: '200px' }}>
            <Search size={15} color="var(--text-muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Chercher un collaborateur..." style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '0.88rem', color: 'var(--text)' }} />
          </div>
          <button onClick={() => setModal('employee')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={14} /> Nouveau Collaborateur
          </button>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((emp, i) => (
            <motion.div key={i} variants={fadeIn} whileHover={{ y: -4 }} onClick={() => onOpenDetail?.(emp, 'hr', 'employees')}
              className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.1rem' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: `${DEPT_COLORS[emp.dept] || '#64748B'}20`, color: DEPT_COLORS[emp.dept] || '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem', fontWeight: 800, flexShrink: 0, border: `2px solid ${DEPT_COLORS[emp.dept] || '#64748B'}40` }}>
                  {emp.avatar}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{emp.nom}</div>
                  <div style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600 }}>{emp.poste}</div>
                  <Chip label={emp.dept} color={DEPT_COLORS[emp.dept] || '#64748B'} />
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Perf.</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: emp.performance >= 85 ? '#10B981' : emp.performance >= 70 ? '#F59E0B' : '#EF4444' }}>{emp.performance}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={11} /> {emp.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={11} /> {emp.tel}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={11} /> {emp.contrat}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={11} /> {emp.dateEntree}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Congés restants: <span style={{ fontWeight: 700, color: 'var(--text)' }}>{emp.congesRestants}j</span></span>
                <span style={{ fontWeight: 700, color: '#8B5CF6' }}>{formatCurrency(emp.salaire)}/mois</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  /* ═══════════ CONGÉS ═══════════ */
  const renderLeaves = () => {
    const statusColor = { Validé: '#10B981', 'En attente': '#F59E0B', Refusé: '#EF4444', Brouillon: '#64748B' };
    const pending = allLeaves.filter(l => l.statut === 'En attente');
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {pending.length > 0 && (
          <motion.div variants={fadeIn} className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: '1.25rem', border: '1px solid #F59E0B30' }}>
            <h4 style={{ fontWeight: 700, color: '#F59E0B', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
              <AlertCircle size={14} /> {pending.length} Demande(s) en attente — Validation requise
            </h4>
            {pending.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, flex: 1 }}>{l.employe}</span>
                <Chip label={l.type} color="#8B5CF6" />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l.du} → {l.au} ({l.jours || '?'}j)</span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button onClick={() => approveRequest('hr', 'leaves', l.id)} style={{ padding: '4px 12px', borderRadius: '0.5rem', border: 'none', background: '#10B98120', color: '#10B981', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '3px' }}><Check size={12} /> Valider</button>
                  <button onClick={() => rejectRequest('hr', 'leaves', l.id)} style={{ padding: '4px 12px', borderRadius: '0.5rem', border: 'none', background: '#EF444420', color: '#EF4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '3px' }}><X size={12} /> Refuser</button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
        <motion.div variants={fadeIn} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setModal('leave')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={14} /> Demande de Congé
          </button>
        </motion.div>
        <motion.div variants={fadeIn} className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-subtle)' }}>
              <tr>{['Collaborateur', 'Type', 'Période', 'Durée', 'Statut', 'Actions'].map((h, i) => (
                <th key={i} style={{ padding: '0.85rem 1.1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.73rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {allLeaves.map((l, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700 }}>{l.employe}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}><Chip label={l.type} color="#8B5CF6" /></td>
                  <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{l.du} → {l.au}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700 }}>{l.jours || '—'}j</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}><Chip label={l.statut} color={statusColor[l.statut] || '#64748B'} /></td>
                  <td style={{ padding: '0.9rem 1.1rem' }}>
                    {l.statut === 'En attente' ? (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => approveRequest('hr', 'leaves', l.id)} style={{ padding: '3px 8px', borderRadius: '0.4rem', border: 'none', background: '#10B98120', color: '#10B981', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}><Check size={11} /></button>
                        <button onClick={() => rejectRequest('hr', 'leaves', l.id)} style={{ padding: '3px 8px', borderRadius: '0.4rem', border: 'none', background: '#EF444420', color: '#EF4444', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}><X size={11} /></button>
                      </div>
                    ) : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Traité</span>}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </motion.div>
    );
  };

  /* ═══════════ FORMATIONS ═══════════ */
  const renderFormations = () => {
    const statusColors = { Terminé: '#10B981', 'En cours': '#3B82F6', Planifié: '#F59E0B' };
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <motion.div variants={fadeIn} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setModal('formation')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={14} /> Planifier Formation
          </button>
        </motion.div>
        {formations.map((f, i) => (
          <motion.div key={i} variants={fadeIn} className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', borderLeft: `4px solid ${statusColors[f.statut] || '#64748B'}` }}>
            <div style={{ flex: '0 0 36px', height: '36px', background: `${statusColors[f.statut] || '#64748B'}15`, borderRadius: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusColors[f.statut] || '#64748B' }}>
              <BookOpen size={18} />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{f.titre}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{f.employe} · {f.date} · {f.duree}</div>
            </div>
            <Chip label={f.statut} color={statusColors[f.statut] || '#64748B'} />
            {f.score !== null && (
              <div style={{ textAlign: 'center', minWidth: '60px' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Score</div>
                <div style={{ fontWeight: 800, color: f.score >= 80 ? '#10B981' : '#F59E0B' }}>{f.score}/100</div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    );
  };

  /* ═══════════ RECRUTEMENT ═══════════ */
  const renderRecruitment = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Open Jobs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SectionTitle icon={<Briefcase size={16} />} label="Postes Ouverts" color="var(--accent)" />
          {jobs.map((j, i) => (
            <div key={i} className="glass" style={{ padding: '1rem', borderRadius: '1rem', borderLeft: `4px solid ${j.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{j.titre}</span>
                <Chip label={j.status} color={j.color} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>{j.dept}</span>
                <span style={{ fontWeight: 600 }}>{j.candidates} candidats</span>
              </div>
            </div>
          ))}
          <button className="glass" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px dashed var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}>
            + Publier une offre
          </button>
        </div>

        {/* Candidate Pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SectionTitle icon={<Users size={16} />} label="Pipeline des Talents" color="#8B5CF6" />
          <div style={{ overflowX: 'auto', display: 'flex', gap: '1rem', paddingBottom: '1rem' }}>
            {['Top of Funnel', 'Entretien Tech', 'Entretien Manager', 'Offre envoyée'].map(stage => (
              <div key={stage} style={{ minWidth: '220px', flex: 1, background: 'var(--bg-subtle)', borderRadius: '1rem', padding: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                  {stage}
                  <span style={{ opacity: 0.5 }}>{candidates.filter(c => c.status === stage).length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {candidates.filter(c => c.status === stage).map(can => (
                    <motion.div key={can.id} whileHover={{ scale: 1.02 }} className="glass" style={{ padding: '0.85rem', borderRadius: '0.85rem', cursor: 'grab' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '2px' }}>{can.nom}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>{can.poste}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{can.source}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: can.score > 85 ? '#10B981' : '#3B82F6' }}>{can.score}%</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  /* ═══════════ ORGANIGRAMME ═══════════ */
  const renderOrgChart = () => {
    // Basic implementation: Root -> Managers -> Reports
    const managers = enrichedEmployees.filter(e => enrichedEmployees.some(r => r.manager === e.nom));
    const root = enrichedEmployees.find(e => e.dept === 'Direction');

    return (
      <motion.div variants={fadeIn} className="glass" style={{ padding: '3rem', borderRadius: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem' }}>
        {/* Direction */}
        {root && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
             <OrgNode emp={root} isRoot />
             <div style={{ width: '2px', height: '40px', background: 'var(--accent)', opacity: 0.4 }} />
             
             {/* Managers Level */}
             <div style={{ display: 'flex', gap: '2rem' }}>
                {managers.filter(m => m.id !== root.id).map(m => (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', height: '2px', background: 'var(--accent)', opacity: 0.2, marginBottom: '-1px' }} />
                    <OrgNode emp={m} />
                  </div>
                ))}
             </div>
          </div>
        )}
      </motion.div>
    );
  };

  const SectionTitle = ({ icon, label, color }) => (
    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px', color }}>
      {icon} {label}
    </h3>
  );

  const OrgNode = ({ emp, isRoot }) => (
    <div className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', border: isRoot ? `2px solid var(--accent)` : '1px solid var(--border)', textAlign: 'center', minWidth: '150px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${DEPT_COLORS[emp.dept] || '#64748B'}20`, color: DEPT_COLORS[emp.dept] || '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, margin: '0 auto 0.5rem' }}>
        {emp.avatar}
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{emp.nom}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.poste}</div>
    </div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F97316', marginBottom: '0.4rem' }}>
            <Users size={16} /><span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Capital Humain — HRIS Enterprise</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Ressources Humaines</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>
            Effectifs · Performance · Congés · Formations · Masse Salariale
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setModal('leave')} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Calendar size={15} /> Congé
          </button>
          <button onClick={() => setModal('employee')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={15} /> Nouveau Collab.
          </button>
        </div>
      </div>

      <TabBar tabs={[
        { id: 'dashboard',   label: 'Dashboard RH',   icon: <BarChart3 size={14}/> },
        { id: 'employees',   label: 'Collaborateurs',  icon: <Users size={14}/> },
        { id: 'recruitment', label: 'Recrutement',    icon: <Briefcase size={14}/> },
        { id: 'leaves',      label: 'Congés',          icon: <Calendar size={14}/> },
        { id: 'formations',  label: 'Formations',      icon: <BookOpen size={14}/> },
        { id: 'orgchart',    label: 'Organigramme',    icon: <GitBranch size={14}/> },
      ]} active={tab} onChange={setTab} />

      {tab === 'dashboard'   && renderDashboard()}
      {tab === 'employees'   && renderEmployees()}
      {tab === 'recruitment' && renderRecruitment()}
      {tab === 'leaves'      && renderLeaves()}
      {tab === 'formations'  && renderFormations()}
      {tab === 'orgchart'    && renderOrgChart()}

      {activeMod && (
        <RecordModal isOpen={true} onClose={() => setModal(null)} title={activeMod.title} fields={activeMod.fields}
          onSave={f => { activeMod.save(f); setModal(null); }} />
      )}
    </div>
  );
};

export default HR;
