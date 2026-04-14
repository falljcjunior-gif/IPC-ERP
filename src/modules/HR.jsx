import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, Wallet, Plus, Mail, Phone, Briefcase, Clock,
  CheckCircle2, AlertCircle, ChevronRight, BarChart3, TrendingUp, TrendingDown,
  Award, BookOpen, Search, Filter, Activity, BarChart2, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, AreaChart, Area, PieChart, Pie
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import KpiCard from '../components/KpiCard';
import { hrSchema } from '../schemas/hr.schema.js';

/* ─── Helpers ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const DEPT_COLORS = { IT: '#3B82F6', Ventes: '#10B981', RH: '#F97316', Finance: '#8B5CF6', Marketing: '#EC4899', Production: '#F59E0B', Direction: '#14B8A6' };

/* ════════════════════════════════════
   HR MODULE — Full Enterprise
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const HR = ({ onOpenDetail }) => {
  const { data, formatCurrency } = useBusiness();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'employees', 'candidates'
  
  const { employees = [], formations = [] } = data.hr || {};

  /* ─── KPIs ─── */
  const kpis = useMemo(() => {
    const activeEmps = employees.filter(e => e.active !== false);
    const masseSalariale = activeEmps.reduce((s, e) => s + (e.salaire || 0), 0) * 12;
    const turnover = 3.2; 
    const absenteisme = 2.5; 
    const deptDist = Object.entries(
      activeEmps.reduce((acc, e) => ({ ...acc, [e.dept]: (acc[e.dept] || 0) + 1 }), {})
    ).map(([name, value]) => ({ name, value, fill: DEPT_COLORS[name] || '#64748B' }));
    return { masseSalariale, turnover, absenteisme, activeCount: activeEmps.length, deptDist };
  }, [employees]);

  /* ─── Dashboard Renderer ─── */
  const renderDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Masse Salariale Annuelle" value={formatCurrency(kpis.masseSalariale, true)} icon={<Wallet size={20} />} color="#3B82F6" />
        <KpiCard title="Effectif Actif" value={kpis.activeCount} icon={<Users size={20} />} color="#10B981" />
        <KpiCard title="Taux de Turnover" value={`${kpis.turnover}%`} icon={<TrendingDown size={20} />} color="#F59E0B" />
        <KpiCard title="Taux d'Absentéisme" value={`${kpis.absenteisme}%`} icon={<Activity size={20} />} color="#EF4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Répartition par Département</h4>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={kpis.deptDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                {kpis.deptDist.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Formations en cours</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {formations.slice(0, 4).map(f => (
              <div key={f.id} style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--bg-subtle)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{f.titre}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.employe} • {f.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Module Header Toolbar */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
             {[
               { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={16} /> },
               { id: 'employees', label: 'Collaborateurs', icon: <Users size={16} /> },
               { id: 'candidates', label: 'Recrutement', icon: <Briefcase size={16} /> }
             ].map(t => (
               <button
                 key={t.id}
                 onClick={() => setView(t.id)}
                 style={{
                   padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                   background: view === t.id ? 'var(--bg)' : 'transparent',
                   color: view === t.id ? 'var(--accent)' : 'var(--text-muted)',
                   fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px',
                   boxShadow: view === t.id ? 'var(--shadow-sm)' : 'none'
                 }}
               >
                 {t.icon} {t.label}
               </button>
             ))}
          </div>
       </div>

       <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
             <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderDashboard()}
             </motion.div>
          ) : (
             <motion.div key="records" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EnterpriseView 
                  moduleId="hr"
                  modelId={view}
                  schema={hrSchema}
                  onOpenDetail={onOpenDetail}
                />
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default HR;
