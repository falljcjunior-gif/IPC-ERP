import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Briefcase, Activity, 
  TrendingUp, Shield, Zap,
  User, ChevronRight
} from 'lucide-react';

const EmployeeProfileCard = ({ employee, onOpenDetail }) => {
  const isHighRisk = (employee.burnout_risk || 0) > 40;
  
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)' }}
      onClick={() => onOpenDetail && onOpenDetail(employee.id, 'hr', 'employees')}
      style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: '2rem',
        padding: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        transition: 'all 0.3s ease'
      }}
    >
      {/* ── JEWELRY STATUS BADGE ── */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <motion.div 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: employee.active !== false ? '#10B981' : '#F59E0B',
            boxShadow: `0 0 10px ${employee.active !== false ? '#10B981' : '#F59E0B'}`
          }} 
        />
        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af' }}>
          {employee.active !== false ? 'Actif' : 'En pause'}
        </span>
      </div>

      {/* ── PROFILE HEADER ── */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ 
          width: '50px', height: '50px', borderRadius: '1.5rem', 
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', fontWeight: 800, color: '#4b5563'
        }}>
          {employee.avatar || employee.nom?.[0] || <User size={24} />}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#111827', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{employee.nom}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6b7280', fontSize: '0.75rem' }}>
            <Briefcase size={12} /> {employee.poste}
          </div>
        </div>
      </div>

      {/* ── STRATEGIC SCORING (MINI BENTO) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Performance</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrendingUp size={14} color="#0D9488" />
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>{employee.performance_score || 85}%</span>
          </div>
        </div>
        <div style={{ 
          background: isHighRisk ? 'rgba(239, 68, 68, 0.05)' : 'rgba(0,0,0,0.02)', 
          padding: '0.75rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' 
        }}>
          <div style={{ fontSize: '0.6rem', color: isHighRisk ? '#EF4444' : '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Risque Burn-out</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={14} color={isHighRisk ? '#EF4444' : '#10B981'} />
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isHighRisk ? '#EF4444' : '#111827' }}>{employee.burnout_risk || 10}%</span>
          </div>
        </div>
      </div>

      {/* ── TALENT QUOTE / ENGAGEMENT ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={14} color="#6366F1" />
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4b5563' }}>Engagement: <strong>{employee.engagement_level || 'High'}</strong></span>
        </div>
        <motion.div whileHover={{ x: 3 }}>
          <ChevronRight size={16} color="#9ca3af" />
        </motion.div>
      </div>

      {/* ── GLASSMORPHISM GLOW ── */}
      <div style={{ 
        position: 'absolute', bottom: '-20px', right: '-20px', 
        width: '60px', height: '60px', borderRadius: '50%', 
        background: 'linear-gradient(135deg, #0D948810 0%, #6366F110 100%)',
        filter: 'blur(20px)'
      }} />
    </motion.div>
  );
};

export default EmployeeProfileCard;
