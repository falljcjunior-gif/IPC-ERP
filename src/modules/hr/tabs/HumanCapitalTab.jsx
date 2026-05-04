import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Activity, Heart, TrendingUp, 
  Zap, ShieldCheck, Wallet, Sparkles,
  Search, Filter
} from 'lucide-react';
import EmployeeProfileCard from '../components/EmployeeProfileCard';
import { useStore } from '../../../store';
import KpiCard from '../../../components/KpiCard';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const HumanCapitalTab = ({ data, onOpenDetail, searchQuery = '' }) => {
  const employees = data?.hr?.employees || [];
  
  const filteredEmployees = useMemo(() => {
    if (!searchQuery) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(e => 
      e.nom?.toLowerCase().includes(q) || 
      e.poste?.toLowerCase().includes(q) || 
      e.dept?.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  const globalMetrics = useMemo(() => {
    if (employees.length === 0) return { performance: 0, retention: 0, wellness: 0 };
    const perf = employees.reduce((acc, e) => acc + (e.performance_score || 85), 0) / employees.length;
    const ret = employees.reduce((acc, e) => acc + (e.retention_score || 95), 0) / employees.length;
    const risk = employees.reduce((acc, e) => acc + (e.burnout_risk || 10), 0) / employees.length;
    return {
      performance: Math.round(perf),
      retention: Math.round(ret),
      wellness: Math.round(100 - risk)
    };
  }, [employees]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}
    >
      {/* ── LUXURY STRATEGIC KPIs ── */}
      <motion.div 
        variants={item}
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem' 
        }}
      >
        <KpiCard 
          title="Indice de Performance Global" 
          value={`${globalMetrics.performance}%`} 
          icon={<TrendingUp size={24} />} 
          color="#0D9488"
          trend="+2.4% vs Q1"
          description="Basé sur les objectifs CRM & Opérations"
        />
        <KpiCard 
          title="Predictive Retention" 
          value={`${globalMetrics.retention}%`} 
          icon={<ShieldCheck size={24} />} 
          color="#6366F1"
          trend="Stable"
          description="Algorithme de risque de départ Nexus"
        />
        <KpiCard 
          title="Human Wellness Score" 
          value={`${globalMetrics.wellness}%`} 
          icon={<Heart size={24} />} 
          color="#EC4899"
          trend="-1.2% (Charge de travail)"
          description="Monitoring de la charge et congés"
        />
      </motion.div>

      {/* ── TALENT GRID ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div 
          variants={item}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
              Human <strong>Assets</strong>
            </h3>
            <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
              Pilotage haute fidélité du capital humain IPC.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="glass" style={{ 
              padding: '0.75rem 1.5rem', borderRadius: '1.5rem', 
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              fontSize: '0.85rem', fontWeight: 700, color: '#374151',
              border: '1px solid rgba(0,0,0,0.1)'
            }}>
              <Filter size={16} /> Filtres Avancés
            </button>
            <button className="glass" style={{ 
              padding: '0.75rem 1.5rem', borderRadius: '1.5rem', 
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              fontSize: '0.85rem', fontWeight: 800, color: '#0D9488',
              border: '1px solid rgba(13, 148, 136, 0.2)',
              background: 'rgba(13, 148, 136, 0.05)'
            }}>
              <Sparkles size={16} /> Intelligence RH
            </button>
          </div>
        </motion.div>

        <motion.div 
          variants={item}
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '2rem' 
          }}
        >
          {filteredEmployees.map(emp => (
            <EmployeeProfileCard 
              key={emp.id} 
              employee={emp} 
              onOpenDetail={onOpenDetail} 
            />
          ))}
          
          {/* ── ADD NEW TALENT (EMPTY STATE STYLE) ── */}
          <motion.div
            whileHover={{ scale: 0.98 }}
            onClick={() => onOpenDetail && onOpenDetail(null, 'hr', 'employees')}
            style={{
              border: '2px dashed rgba(0,0,0,0.05)',
              borderRadius: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              padding: '2rem',
              cursor: 'pointer',
              color: '#9ca3af',
              minHeight: '220px'
            }}
          >
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              background: 'rgba(0,0,0,0.02)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center' 
            }}>
              <Zap size={20} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#4b5563' }}>Recruter un Talent</div>
              <div style={{ fontSize: '0.75rem' }}>Déclenche le Smart Onboarding</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── NEXUS INTELLIGENCE FOOTER ── */}
      <motion.div 
        variants={item}
        style={{ 
          background: 'linear-gradient(90deg, rgba(13, 148, 136, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)',
          padding: '2rem',
          borderRadius: '2.5rem',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '1rem', 
            background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 10px 20px -5px rgba(0,0,0,0.05)'
          }}>
            <Wallet size={24} color="#0D9488" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>Automated Payroll & Compliance</div>
            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Dernière vérification : Il y a 14 minutes. Prêt pour le virement du 30.</div>
          </div>
        </div>
        <button className="btn-primary" style={{ padding: '0.8rem 2rem', borderRadius: '1.5rem', fontWeight: 900, background: '#111827', borderColor: '#111827' }}>
          Lancer la Simulation
        </button>
      </motion.div>
    </motion.div>
  );
};

export default HumanCapitalTab;
