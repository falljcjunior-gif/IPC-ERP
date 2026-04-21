import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, CheckCircle2, XCircle, Plus,
  BarChart3, Target, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ComposedChart, Legend
} from 'recharts';
import SafeResponsiveChart from '../components/charts/SafeResponsiveChart';
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

/* ════════════════════════════════════
   TIMESHEETS MODULE — Full Enterprise
════════════════════════════════════ */
const Timesheets = () => {
  const { data, addRecord, updateRecord, userRole } = useBusiness();
  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(false);

  // Initialize timesheets with fallback to avoid direct data mutation
  const timesheets = useMemo(() => {
    if (data.hr.timesheets) return data.hr.timesheets;
    return data.hr.timesheets || [];
  }, [data.hr.timesheets]);
  const isManager = userRole === 'ADMIN' || userRole === 'HR' || userRole === 'SUPER_ADMIN';

  /* ─── KPIs ─── */
  const kpis = useMemo(() => {
    const totalH   = timesheets.reduce((s, t) => s + (parseFloat(t.heures) || 0), 0);
    const validees = timesheets.filter(t => t.statut === 'Validé').reduce((s, t) => s + (parseFloat(t.heures) || 0), 0);
    const enAttente= timesheets.filter(t => t.statut === 'En attente').length;
    const facturables = timesheets.filter(t => t.facturable).reduce((s, t) => s + (parseFloat(t.heures) || 0), 0);
    const txFacturable = totalH > 0 ? Math.round((facturables / totalH) * 100) : 0;
    return { totalH, validees, enAttente, txFacturable };
  }, [timesheets]);

  /* ─── Heures par projet ─── */
  const heuresParProjet = useMemo(() => {
    const map = timesheets.reduce((acc, t) => {
      acc[t.projet] = (acc[t.projet] || 0) + (parseFloat(t.heures) || 0);
      return acc;
    }, {});
    return Object.entries(map).map(([name, heures], _i) => ({ name: name.substring(0, 20), heures, fill: ['#3B82F6','#10B981','#8B5CF6','#F59E0B'][_i%4] }));
  }, [timesheets]);

  /* ─── Heures par collaborateur ─── */
  const heuresParCollab = useMemo(() => {
    const map = timesheets.reduce((acc, t) => {
      acc[t.collaborateur] = (acc[t.collaborateur] || 0) + (parseFloat(t.heures) || 0);
      return acc;
    }, {});
    return Object.entries(map).map(([nom, heures]) => ({ nom: nom.split(' ')[0], heures })).sort((a, b) => b.heures - a.heures);
  }, [timesheets]);

  const weeklyTrend = [];

  const handleValidation = (id, newStatut) => updateRecord('hr', 'timesheets', id, { statut: newStatut });

  /* ═══════════ DASHBOARD ═══════════ */
  const renderDashboard = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Heures Totales"      value={`${kpis.totalH}h`}          trend={0}  trendType="up"   icon={<Clock size={20}/>}       color="#3B82F6" sparklineData={[]} />
        <KpiCard title="Heures Validées"     value={`${kpis.validees}h`}         trend={0}  trendType="up"   icon={<CheckCircle2 size={20}/>} color="#10B981" sparklineData={[]} />
        <KpiCard title="À Valider"           value={`${kpis.enAttente} saisies`} trend={0}    trendType="down" icon={<AlertCircle size={20}/>}  color="#F59E0B" sparklineData={[]} />
        <KpiCard title="Taux Facturable"     value={`${kpis.txFacturable}%`}     trend={0}  trendType="up"   icon={<Target size={20}/>}       color="#8B5CF6" sparklineData={[]} />
      </motion.div>

      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Heures Hebdomadaires — Totales vs Facturables</h4>
          <SafeResponsiveChart minHeight={220} fallbackHeight={220}>
            <ComposedChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="sem" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Bar dataKey="heures"       name="Total (h)"       fill="#3B82F630" radius={[4,4,0,0]} barSize={22} />
              <Bar dataKey="facturables"  name="Facturables (h)" fill="#10B981"   radius={[4,4,0,0]} barSize={22} />
            </ComposedChart>
          </SafeResponsiveChart>
        </div>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Heures par Collaborateur</h4>
          <SafeResponsiveChart minHeight={220} fallbackHeight={220}>
            <BarChart data={heuresParCollab} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis type="category" dataKey="nom" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={75} />
              <Tooltip content={<TT />} />
              <Bar dataKey="heures" name="Heures" fill="var(--accent)" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </SafeResponsiveChart>
        </div>
      </motion.div>

      <motion.div variants={fadeIn} className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
        <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Répartition Heures par Projet</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {heuresParProjet.map((p, index) => {
            const pct = Math.round((p.heures / kpis.totalH) * 100);
            return (
              <div key={index}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ color: p.fill, fontWeight: 700 }}>{p.heures}h · {pct}%</span>
                </div>
                <div style={{ height: '7px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: index * 0.1 }}
                    style={{ height: '100%', background: p.fill, borderRadius: '999px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );

  /* ═══════════ SAISIES ═══════════ */
  const renderSaisies = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {isManager && timesheets.filter(t => t.statut === 'En attente').length > 0 && (
        <motion.div variants={fadeIn} className="glass" style={{ padding: '1rem 1.5rem', borderRadius: '1rem', border: '1px solid #F59E0B30' }}>
          <div style={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.85rem', marginBottom: '4px' }}>
            ⚠️ {timesheets.filter(t => t.statut === 'En attente').length} saisie(s) en attente de validation
          </div>
        </motion.div>
      )}
      {timesheets.map((ts) => (
        <motion.div key={ts.id} variants={fadeIn} className="glass"
          style={{ padding: '1.25rem 1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', borderLeft: `4px solid ${ts.statut === 'Validé' ? '#10B981' : ts.statut === 'Refusé' ? '#EF4444' : '#F59E0B'}` }}>
          {/* Avatar */}
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--accent)', fontSize: '0.85rem', flexShrink: 0 }}>
            {ts.collaborateur.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{ts.collaborateur}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ts.date} · {ts.projet}</div>
          </div>
          <div style={{ flex: '0 1 140px' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Tâche</div>
            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{ts.tache || ts.commentaire}</div>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent)', minWidth: '55px', textAlign: 'center' }}>
            {ts.heures}<span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)' }}>h</span>
          </div>
          {ts.facturable && <Chip label="Facturable" color="#10B981" />}
          <Chip label={ts.statut} color={ts.statut === 'Validé' ? '#10B981' : ts.statut === 'Refusé' ? '#EF4444' : '#F59E0B'} />
          {isManager && ts.statut === 'En attente' && (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button onClick={() => handleValidation(ts.id, 'Refusé')} style={{ padding: '5px', borderRadius: '0.5rem', border: 'none', background: '#EF444420', color: '#EF4444', cursor: 'pointer' }}><XCircle size={16} /></button>
              <button onClick={() => handleValidation(ts.id, 'Validé')} style={{ padding: '5px', borderRadius: '0.5rem', border: 'none', background: '#10B98120', color: '#10B981', cursor: 'pointer' }}><CheckCircle2 size={16} /></button>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3B82F6', marginBottom: '0.4rem' }}>
            <Clock size={16} /><span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>RH — Gestion du Temps</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Feuilles de Temps</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>Suivi · Taux Facturable · Projets · Validation Manager</p>
        </div>
        <button onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1.25rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          <Plus size={15} /> Saisir mes Heures
        </button>
      </div>

      <TabBar tabs={[
        { id: 'dashboard', label: 'Analytics', icon: <BarChart3 size={14}/> },
        { id: 'saisies',   label: 'Saisies',   icon: <Clock size={14}/> },
      ]} active={tab} onChange={setTab} />

      {tab === 'dashboard' && renderDashboard()}
      {tab === 'saisies'   && renderSaisies()}

      <RecordModal isOpen={modal} onClose={() => setModal(false)} title="Saisie de Temps"
        fields={[
          { name: 'date',          label: 'Date',          type: 'date', required: true },
          { name: 'collaborateur', label: 'Collaborateur', type: 'select', options: data.hr.employees.map(e => e.nom), required: true },
          { name: 'projet',        label: 'Projet',        type: 'select', options: data.projects.projects.map(p => p.nom), required: true },
          { name: 'tache',         label: 'Tâche effectuée', required: true },
          { name: 'heures',        label: 'Durée (heures)', type: 'number', required: true },
          { name: 'facturable',    label: 'Facturable ?',   type: 'select', options: ['Oui', 'Non'] },
          { name: 'commentaire',   label: 'Détail / Commentaire' },
        ]}
        onSave={f => { addRecord('hr', 'timesheets', { ...f, statut: 'En attente', facturable: f.facturable === 'Oui' }); setModal(false); }}
      />
    </div>
  );
};

export default Timesheets;
