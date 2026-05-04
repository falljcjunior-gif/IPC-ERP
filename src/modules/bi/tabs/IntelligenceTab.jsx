import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, HardDrive, DollarSign, 
  Target, AlertCircle, PieChart, BarChart3,
  ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';
import { useStore } from '../../../store';

/**
 * 🧠 NEXUS OS: INTELLIGENCE & PREDICTIVE ANALYTICS
 * Cross-module data correlation: IT (Assets) + RH (Salaries) + CRM (Churn).
 */
const IntelligenceTab = () => {
  const { data } = useStore();

  // Simulated Correlation: Operational Cost Per Seat
  const stats = useMemo(() => [
    { label: 'Total OpEx / Month', value: '€42,500', trend: '+2.4%', color: 'var(--primary)' },
    { label: 'Avg Cost Per Seat', value: '€1,850', trend: '-1.1%', color: 'var(--accent)' },
    { label: 'Asset ROI Score', value: '84/100', trend: '+5.2%', color: '#8B5CF6' },
    { label: 'Predicted Churn Risk', value: '12%', trend: '-3.0%', color: '#EF4444' }
  ], []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* ── TOP KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{ 
              padding: '2rem', borderRadius: '2rem', background: 'white', 
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
              display: 'flex', flexDirection: 'column', gap: '1rem'
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {stat.label}
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-1px' }}>
                {stat.value}
              </span>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '4px 8px', 
                borderRadius: '8px', background: stat.trend.startsWith('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: stat.trend.startsWith('+') ? '#10B981' : '#EF4444',
                fontSize: '0.75rem', fontWeight: 800
              }}>
                {stat.trend.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.trend}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* ── DATA CORRELATION: COST PER SEAT ── */}
        <div style={{ padding: '2.5rem', borderRadius: '2.5rem', background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={24} color="var(--primary)" /> Resource Efficiency Index
            </h3>
            <div style={{ padding: '0.5rem 1rem', borderRadius: '1rem', background: 'var(--bg-subtle)', fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>
              IT Assets + HR Payroll
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { dept: 'Tech & Engineering', assets: '€12k', salaries: '€28k', efficiency: 94 },
              { dept: 'Sales & Marketing', assets: '€4k', salaries: '€15k', efficiency: 82 },
              { dept: 'Logistics', assets: '€18k', salaries: '€10k', efficiency: 68 },
              { dept: 'Management', assets: '€2k', salaries: '€12k', efficiency: 91 }
            ].map(row => (
              <div key={row.dept} style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border-light)', background: 'var(--bg-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                   <span style={{ fontWeight: 800, color: 'var(--text)' }}>{row.dept}</span>
                   <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>Efficiency: {row.efficiency}%</span>
                </div>
                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><HardDrive size={14} /> Assets: {row.assets}</div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><DollarSign size={14} /> Payroll: {row.salaries}</div>
                </div>
                <div style={{ height: '6px', background: 'var(--border)', borderRadius: '999px', marginTop: '1rem', overflow: 'hidden' }}>
                   <div style={{ width: `${row.efficiency}%`, height: '100%', background: 'var(--accent)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CRM CHURN PREDICTION (AIOps) ── */}
        <div style={{ padding: '2.5rem', borderRadius: '2.5rem', background: 'var(--primary)', color: 'white', boxShadow: 'var(--shadow-premium)' }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white' }}>
            <Zap size={24} fill="white" /> Churn Sentinel
          </h3>
          <p style={{ margin: '0.75rem 0 2rem 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
            Predictive AI identifying accounts with declining activity levels.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { client: 'Acme Corp', risk: 'High', score: 85, reason: 'No orders in 30d' },
              { client: 'Global Tech', risk: 'Medium', score: 45, reason: 'Reduced usage' },
              { client: 'Green Solutions', risk: 'Low', score: 12, reason: 'Consistent' }
            ].map(client => (
              <div key={client.client} style={{ padding: '1.25rem', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800 }}>{client.client}</span>
                  <span style={{ 
                    padding: '0.25rem 0.75rem', borderRadius: '8px', 
                    background: client.risk === 'High' ? '#EF4444' : client.risk === 'Medium' ? '#F59E0B' : '#10B981',
                    fontSize: '0.7rem', fontWeight: 900
                  }}>{client.risk} RISK</span>
                </div>
                <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{client.reason}</div>
              </div>
            ))}
          </div>

          <button style={{ width: '100%', marginTop: '2.5rem', padding: '1rem', borderRadius: '1rem', background: 'white', color: 'var(--primary)', border: 'none', fontWeight: 900, cursor: 'pointer' }}>
            Launch Marketing Campaign
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceTab;
