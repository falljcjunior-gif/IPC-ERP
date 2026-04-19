import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, TrendingUp, TrendingDown, DollarSign, Eye, MousePointer2, 
  Plus, Play, Pause, MoreVertical, ExternalLink, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Cell
} from 'recharts';
import SafeResponsiveChart from '../../../components/charts/SafeResponsiveChart';
import KpiCard from '../../../components/KpiCard';
import Chip from '../components/Chip';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const AdsTab = ({ campaigns, formatCurrency }) => {
  const chartData = campaigns.map(c => ({
    name: c.nom || 'Campagne',
    budget: Number(c.budget) || 0,
    spent: (Number(c.budget) || 0) * 0.65 // Mock spent data
  }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Ads Performance Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Budget Total Actif" value={formatCurrency(campaigns.reduce((s, c) => s + (Number(c.budget) || 0), 0), true)} trend={2.4} trendType="up" icon={<DollarSign size={22} />} color="#3B82F6" sparklineData={[30, 45, 32, 60, 55]} />
        <KpiCard title="Coût par Clic (CPC)" value="245 FCFA" trend={-8.5} trendType="down" icon={<MousePointer2 size={22} />} color="#8B5CF6" sparklineData={[280, 260, 255, 245]} />
        <KpiCard title="Impressions Ads" value="1.2M" trend={15.2} trendType="up" icon={<Eye size={22} />} color="#EC4899" sparklineData={[800, 950, 1100, 1200]} />
        <KpiCard title="ROAS Moyen" value="4.2x" trend={0.5} trendType="up" icon={<TrendingUp size={22} />} color="#10B981" sparklineData={[3.8, 4.0, 4.2]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
        {/* Active Campaigns Table */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h4 style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>Campagnes Actives</h4>
            <button className="glass" style={{ padding: '0.6rem 1.2rem', borderRadius: '0.9rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)' }}>Voir toutes</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {campaigns.length > 0 ? campaigns.map((camp, i) => (
              <div key={i} className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 100px', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'var(--accent-alpha)', padding: '10px', borderRadius: '12px', color: 'var(--accent)' }}><Target size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{camp.nom}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {camp.id.substring(0, 8)}...</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Budget</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{formatCurrency(camp.budget, true)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Statut</div>
                  <Chip label={camp.statut || 'Actif'} color={camp.statut === 'Terminé' ? '#64748B' : '#10B981'} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button className="glass" style={{ padding: '0.5rem', borderRadius: '0.75rem' }}><Pause size={14} /></button>
                  <button className="glass" style={{ padding: '0.5rem', borderRadius: '0.75rem' }}><MoreVertical size={14} /></button>
                </div>
              </div>
            )) : (
               <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>Aucune campagne active.</div>
            )}
          </div>
        </motion.div>

        {/* Budget Allocation Chart */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <h4 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '1.5rem' }}>Répartition du Budget</h4>
          <div style={{ height: '300px' }}>
            <SafeResponsiveChart minHeight="100%" fallbackHeight={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }} width={100} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="budget" name="Budget" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="spent" name="Dépensé" fill="#EC4899" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </SafeResponsiveChart>
          </div>
          
          <div style={{ marginTop: '2rem', background: 'linear-gradient(135deg, var(--bg-subtle) 0%, var(--bg) 100%)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#F59E0B20', padding: '8px', borderRadius: '10px', color: '#F59E0B' }}><Zap size={18} /></div>
                <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>Analyse Smart-Budget</div>
             </div>
             <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Le canal **Instagram** affiche un ROAS exceptionnel de **5.4x**. Nous suggérons de réallouer 15% du budget LinkedIn vers Instagram pour maximiser le volume de conversions.
             </p>
             <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                Appliquer l'Optimisation <ExternalLink size={14} />
             </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdsTab;
