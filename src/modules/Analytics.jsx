import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieIcon, 
  Download, 
  Filter, 
  RefreshCcw, 
  ArrowUpRight, 
  ArrowDownRight,
  Target,
  Users,
  Zap
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { AreaChartComp, DonutChartComp, BarChartComp } from '../components/BusinessCharts';

const Analytics = () => {
  const { formatCurrency } = useBusiness();
  const [timeRange, setTimeRange] = useState('month');

  const performanceData = [];
  const distributionData = [];

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Business Intelligence</h1>
          <p style={{ color: 'var(--text-muted)' }}>Analyse croisée des performances et aide à la décision stratégique.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="glass"
            style={{ padding: '0.75rem 1rem', borderRadius: '0.8rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontWeight: 600 }}
          >
            <option value="week">7 derniers jours</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Année</option>
          </select>
          <button className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <Users size={18} color="var(--accent)" />
               <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>+5.2%</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>CLIENTS ACTIFS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>0</div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <Target size={18} color="#F59E0B" />
               <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>98%</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>OBJECTIF VENTES</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatCurrency(0, true)}</div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <Zap size={18} color="#3B82F6" />
               <span style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 700 }}>-2.1%</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>CHARGES OPÉR.</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatCurrency(0, true)}</div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
               <TrendingUp size={18} color="#10B981" />
               <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>+15.4%</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>MARGE BRUTE</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>0%</div>
         </div>
      </div>

      <div className="grid grid-2" style={{ gap: '1.5rem', marginBottom: '2.5rem' }}>
         <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Performance des Revenus (TTC)</h3>
            <AreaChartComp data={performanceData} color="var(--accent)" />
         </div>
         <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Répartition du Chiffre d'Affaires</h3>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
               <DonutChartComp data={distributionData} />
            </div>
         </div>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 700 }}>Rentabilité par Division</h3>
            <button className="btn" style={{ fontSize: '0.8rem' }}><RefreshCcw size={14} /> Rafraîchir</button>
         </div>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[].map((div, i) => (
               <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '1rem' }}>
                  <div style={{ fontWeight: 700 }}>{div.name}</div>
                  <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
                     <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>REVENU</div>
                        <div style={{ fontWeight: 800 }}>{formatCurrency(div.revenue, true)}</div>
                     </div>
                     <div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>MARGE</div>
                        <div style={{ fontWeight: 800, color: div.margin === '12%' ? '#EF4444' : 'var(--primary)' }}>{div.margin}</div>
                     </div>
                     {div.trend === 'up' ? <ArrowUpRight color="#10B981" /> : <ArrowDownRight color="#EF4444" />}
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default Analytics;
