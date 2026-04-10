import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Filter, 
  Download, 
  Calendar,
  Layers,
  Zap,
  DollarSign,
  Package,
  Users
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import KpiCard from '../components/KpiCard';
import { BarChartComp, AreaChartComp, DonutChartComp } from '../components/BusinessCharts';

const BI = () => {
  const { data, formatCurrency } = useBusiness();
  const [period, setPeriod] = useState('30d');

  // Aggregated Data Mock/Calculation
  const stats = {
    totalRevenue: data.sales.orders.reduce((sum, o) => sum + o.totalTTC, 0),
    pipelineValue: data.crm.opportunities.reduce((sum, o) => sum + o.montant, 0),
    stockValue: data.inventory.products.reduce((sum, p) => sum + (p.stock * 50), 0), // Assuming 50 EUR avg cost
    employeeCost: data.hr.employees.length * 3500 // Assuming 3500 EUR avg cost
  };

  const revenueByApp = [
    { name: 'Ventes Directes', value: stats.totalRevenue * 0.7, color: '#3B82F6' },
    { name: 'Services (Projets)', value: stats.totalRevenue * 0.2, color: '#10B981' },
    { name: 'Abonnements', value: stats.totalRevenue * 0.1, color: '#8B5CF6' }
  ];

  const monthlyPerformance = [
    { name: 'Jan', revenue: 450000000, costs: 380000000 },
    { name: 'Fév', revenue: 1200000000, costs: 410000000 },
    { name: 'Mar', revenue: 850000000, costs: 420000000 },
    { name: 'Avr', revenue: 1610000000, costs: 450000000 },
    { name: 'Mai', revenue: 550000000, costs: 460000000 },
    { name: 'Juin', revenue: 1970000000, costs: 480000000 },
  ];

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Business Intelligence</h1>
          <p style={{ color: 'var(--text-muted)' }}>Analyse croisée des performances de l'organisation.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
             <button onClick={() => setPeriod('7d')} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: period === '7d' ? 'var(--bg)' : 'transparent', fontWeight: 600, cursor: 'pointer' }}>7j</button>
             <button onClick={() => setPeriod('30d')} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: period === '30d' ? 'var(--bg)' : 'transparent', fontWeight: 600, cursor: 'pointer' }}>30j</button>
             <button onClick={() => setPeriod('90d')} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: 'none', background: period === '90d' ? 'var(--bg)' : 'transparent', fontWeight: 600, cursor: 'pointer' }}>90j</button>
          </div>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             <Download size={18} /> Exporter PDF
          </button>
        </div>
      </div>

      <div className="grid grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <KpiCard 
          title="CA Global Est." 
          value={formatCurrency(stats.totalRevenue * 100, true)}
          trend={14.2}
          trendType="up"
          icon={<DollarSign size={20} />}
          color="#3B82F6"
        />
        <KpiCard 
          title="Opportunités Pipeline" 
          value={formatCurrency(stats.pipelineValue, true)}
          trend={8.5}
          trendType="up"
          icon={<Zap size={20} />}
          color="#F59E0B"
        />
        <KpiCard 
          title="Valeur de Stock" 
          value={formatCurrency(stats.stockValue, true)}
          trend={-2.1}
          trendType="down"
          icon={<Package size={20} />}
          color="#10B981"
        />
        <KpiCard 
          title="Masse Salariale / CA" 
          value={`${Math.round((stats.employeeCost / (stats.totalRevenue || 1)) * 100)}%`}
          trend={0.5}
          trendType="up"
          icon={<Users size={20} />}
          color="#8B5CF6"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 700 }}>Performance CA vs Coûts (k FCFA)</h3>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--accent)' }} /> Revenu
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#EF4444' }} /> Coûts
               </div>
            </div>
          </div>
          <BarChartComp 
             data={monthlyPerformance.map(d => ({ name: d.name, revenue: d.revenue, costs: d.costs }))} 
             bars={[{ key: 'revenue', color: 'var(--accent)' }, { key: 'costs', color: '#EF4444' }]}
          />
        </div>

        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '2rem' }}>Répartition du CA</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <DonutChartComp data={revenueByApp} />
          </div>
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             {revenueByApp.map((item, idx) => (
               <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color }} />
                    <span style={{ color: 'var(--text-muted)' }}>{item.name}</span>
                 </div>
                 <span style={{ fontWeight: 700 }}>{((item.value / stats.totalRevenue) * 100).toFixed(0)}%</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
         <h3 style={{ fontWeight: 700, marginBottom: '2rem' }}>Indicateurs de Productivité par Équipe</h3>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {[
              { label: 'Ventes', score: 88, color: '#3B82F6', icon: <DollarSign size={16}/> },
              { label: 'Production', score: 94, color: '#10B981', icon: <Zap size={16}/> },
              { label: 'Support', score: 72, color: '#F59E0B', icon: <Users size={16}/> },
            ].map((team, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                      {team.icon} {team.label}
                   </div>
                   <span style={{ fontWeight: 800 }}>{team.score}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${team.score}%` }}
                     style={{ height: '100%', background: team.color }} 
                   />
                </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default BI;
