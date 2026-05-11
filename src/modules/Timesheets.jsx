import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle2, XCircle, Plus,
  BarChart3, Target, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import SafeResponsiveChart from '../components/charts/SafeResponsiveChart';
import { useStore } from '../store';
import RecordModal from '../components/RecordModal';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';
import '../components/GlobalDashboard.css';

const Timesheets = () => {
  const { data, addRecord, updateRecord, userRole } = useStore();
  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(false);

  const timesheets = useMemo(() => data.hr?.timesheets || [], [data.hr?.timesheets]);
  const isManager = userRole === 'ADMIN' || userRole === 'HR' || userRole === 'SUPER_ADMIN';

  /* ─── KPIs ─── */
  const kpis = useMemo(() => {
    const totalH      = timesheets.reduce((s, t) => s + (parseFloat(t.heures) || 0), 0);
    const validees    = timesheets.filter(t => t.statut === 'Validé').reduce((s, t) => s + (parseFloat(t.heures) || 0), 0);
    const enAttente   = timesheets.filter(t => t.statut === 'En attente').length;
    const facturables = timesheets.filter(t => t.facturable).reduce((s, t) => s + (parseFloat(t.heures) || 0), 0);
    const txFacturable = totalH > 0 ? Math.round((facturables / totalH) * 100) : 0;
    return { totalH, validees, enAttente, txFacturable };
  }, [timesheets]);

  const heuresParProjet = useMemo(() => {
    const map = timesheets.reduce((acc, t) => {
      acc[t.projet] = (acc[t.projet] || 0) + (parseFloat(t.heures) || 0);
      return acc;
    }, {});
    return Object.entries(map).map(([name, heures], i) => ({ name: name.substring(0, 20), heures, fill: ['#3B82F6','#10B981','#8B5CF6','#F59E0B'][i%4] }));
  }, [timesheets]);

  const heuresParCollab = useMemo(() => {
    const map = timesheets.reduce((acc, t) => {
      acc[t.collaborateur] = (acc[t.collaborateur] || 0) + (parseFloat(t.heures) || 0);
      return acc;
    }, {});
    return Object.entries(map).map(([nom, heures]) => ({ nom: nom.split(' ')[0], heures })).sort((a, b) => b.heures - a.heures);
  }, [timesheets]);

  const handleValidation = (id, newStatut) => updateRecord('hr', 'timesheets', id, { statut: newStatut });

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
        {[
          { label: 'Heures Totales',   value: kpis.totalH,       suffix: 'h',   color: '#3B82F6', icon: <Clock size={24} /> },
          { label: 'Heures Validées',  value: kpis.validees,     suffix: 'h',   color: '#10B981', icon: <CheckCircle2 size={24} /> },
          { label: 'En Attente',       value: kpis.enAttente,    suffix: ' saisies', color: '#F59E0B', icon: <AlertCircle size={24} /> },
          { label: 'Taux Facturable',  value: kpis.txFacturable, suffix: '%',   color: '#8B5CF6', icon: <Target size={24} /> },
        ].map((k, i) => (
          <div key={i} className="luxury-widget" style={{ gridColumn: 'span 3', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ background: `${k.color}15`, padding: '12px', borderRadius: '1rem', color: k.color }}>{k.icon}</div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: k.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>●</span>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{k.label}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b' }}>
                <AnimatedCounter from={0} to={parseFloat(k.value)} duration={1.5} formatter={v => `${Math.round(v)}${k.suffix}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div className="luxury-widget" style={{ padding: '2.5rem' }}>
          <h4 style={{ fontWeight: 800, marginBottom: '2rem', fontSize: '1.1rem', color: '#1e293b' }}>Heures par Collaborateur</h4>
          <SafeResponsiveChart minHeight={240} fallbackHeight={240}>
            <BarChart data={heuresParCollab} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
              <YAxis type="category" dataKey="nom" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} width={80} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="heures" name="Heures" fill="#3B82F6" radius={[0, 8, 8, 0]} barSize={20} />
            </BarChart>
          </SafeResponsiveChart>
        </div>

        <div className="luxury-widget" style={{ padding: '2.5rem' }}>
          <h4 style={{ fontWeight: 800, marginBottom: '2rem', fontSize: '1.1rem', color: '#1e293b' }}>Répartition par Projet</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {heuresParProjet.map((p, i) => {
              const pct = kpis.totalH > 0 ? Math.round((p.heures / kpis.totalH) * 100) : 0;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#475569' }}>{p.name}</span>
                    <span style={{ color: p.fill, fontWeight: 700 }}>{p.heures}h · {pct}%</span>
                  </div>
                  <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                      style={{ height: '100%', background: p.fill, borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSaisies = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {isManager && timesheets.filter(t => t.statut === 'En attente').length > 0 && (
        <div className="luxury-widget" style={{ padding: '1.25rem 2rem', borderLeft: '4px solid #F59E0B', borderRadius: '1rem' }}>
          <span style={{ fontWeight: 700, color: '#F59E0B', fontSize: '0.9rem' }}>
            ⚠️ {timesheets.filter(t => t.statut === 'En attente').length} saisie(s) en attente de validation
          </span>
        </div>
      )}
      {timesheets.map((ts) => (
        <motion.div key={ts.id} whileHover={{ x: 4 }}
          className="luxury-widget"
          style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', borderLeft: `4px solid ${ts.statut === 'Validé' ? '#10B981' : ts.statut === 'Refusé' ? '#EF4444' : '#F59E0B'}` }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f8fafc', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#3B82F6', fontSize: '0.9rem', flexShrink: 0 }}>
            {ts.collaborateur.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>{ts.collaborateur}</div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{ts.date} · {ts.projet}</div>
          </div>
          <div style={{ flex: '0 1 180px' }}>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Tâche</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#475569' }}>{ts.tache || ts.commentaire}</div>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#3B82F6', minWidth: '65px', textAlign: 'center' }}>
            {ts.heures}<span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#94a3b8' }}>h</span>
          </div>
          {ts.facturable && (
            <span style={{ padding: '4px 14px', borderRadius: '999px', background: 'rgba(16,185,129,0.1)', color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>Facturable</span>
          )}
          <span style={{ padding: '4px 14px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
            background: ts.statut === 'Validé' ? 'rgba(16,185,129,0.1)' : ts.statut === 'Refusé' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
            color: ts.statut === 'Validé' ? '#10B981' : ts.statut === 'Refusé' ? '#EF4444' : '#F59E0B'
          }}>
            {ts.statut}
          </span>
          {isManager && ts.statut === 'En attente' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => handleValidation(ts.id, 'Refusé')} style={{ padding: '8px', borderRadius: '0.75rem', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#EF4444', cursor: 'pointer' }}><XCircle size={18} /></button>
              <button onClick={() => handleValidation(ts.id, 'Validé')} style={{ padding: '8px', borderRadius: '0.75rem', border: 'none', background: 'rgba(16,185,129,0.1)', color: '#10B981', cursor: 'pointer' }}><CheckCircle2 size={18} /></button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="luxury-subtitle">RH — Gestion du Temps</div>
          <h1 className="luxury-title">Feuilles de <strong>Temps</strong></h1>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Heures totales</div>
            <div className="luxury-value-massive" style={{ fontSize: '3rem', color: '#3B82F6' }}>
              <AnimatedCounter from={0} to={kpis.totalH} duration={1.5} formatter={v => `${Math.round(v)}h`} />
            </div>
          </div>
          <button onClick={() => setModal(true)} className="luxury-widget" style={{ padding: '1rem 2rem', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', borderRadius: '1.5rem' }}>
            <Plus size={20} /> <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>Saisir mes Heures</span>
          </button>
        </div>
      </div>

      {/* ── FROSTED-GLASS TABS ── */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '1.5rem', backdropFilter: 'blur(10px)', marginBottom: '2rem', width: 'fit-content' }}>
        {[
          { id: 'dashboard', label: 'Analytics', icon: <BarChart3 size={16} /> },
          { id: 'saisies',   label: 'Saisies',   icon: <Clock size={16} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
            background: tab === t.id ? 'white' : 'transparent', color: tab === t.id ? '#111827' : '#64748B',
            boxShadow: tab === t.id ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {tab === 'dashboard' && renderDashboard()}
            {tab === 'saisies'   && renderSaisies()}
          </motion.div>
        </AnimatePresence>
      </div>

      <RecordModal isOpen={modal} onClose={() => setModal(false)} title="Saisie de Temps"
        fields={[
          { name: 'date',          label: 'Date',              type: 'date',   required: true },
          { name: 'collaborateur', label: 'Collaborateur',     type: 'select', options: data.hr?.employees?.map(e => e.nom) || [], required: true },
          { name: 'projet',        label: 'Projet',            type: 'select', options: data.projects?.projects?.map(p => p.nom) || [], required: true },
          { name: 'tache',         label: 'Tâche effectuée',                   required: true },
          { name: 'heures',        label: 'Durée (heures)',    type: 'number', required: true },
          { name: 'facturable',    label: 'Facturable ?',      type: 'select', options: ['Oui', 'Non'] },
          { name: 'commentaire',   label: 'Détail / Commentaire' },
        ]}
        onSave={f => { addRecord('hr', 'timesheets', { ...f, statut: 'En attente', facturable: f.facturable === 'Oui' }); setModal(false); }}
      />
    </div>
  );
};

export default React.memo(Timesheets);
