import React from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, MousePointer2, Users, Activity, Clock, Grid, Square, Camera, Briefcase, Globe, Smartphone,
  TrendingUp, TrendingDown, ArrowUpRight, Zap
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, Line, ComposedChart, Bar, BarChart, Cell
} from 'recharts';
import KpiCard from '../../../components/KpiCard';

const container = { 
  hidden: { opacity: 0 }, 
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } 
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const AnalyticsTab = ({ subNetwork, setSubNetwork }) => {
  /* ─── Metricool Mock Data ─── */
  const evolutionData = [
    { date: '01/04', followers: 12400, engagement: 4.2 },
    { date: '05/04', followers: 12850, engagement: 4.5 },
    { date: '10/04', followers: 13100, engagement: 4.1 },
    { date: '15/04', followers: 13600, engagement: 4.8 },
    { date: '20/04', followers: 14200, engagement: 5.2 },
    { date: '25/04', followers: 15100, engagement: 5.5 },
  ];

  const heatmapData = [
    { hour: '0h', mon: 10, tue: 15, wed: 8, thu: 12, fri: 20, sat: 40, sun: 35 },
    { hour: '8h', mon: 50, tue: 60, wed: 55, thu: 70, fri: 65, sat: 30, sun: 25 },
    { hour: '12h', mon: 80, tue: 85, wed: 90, thu: 88, fri: 92, sat: 60, sun: 55 },
    { hour: '16h', mon: 85, tue: 90, wed: 88, thu: 92, fri: 98, sat: 70, sun: 65 },
    { hour: '20h', mon: 95, tue: 98, wed: 96, thu: 99, fri: 100, sat: 85, sun: 90 },
    { hour: '23h', mon: 40, tue: 35, wed: 45, thu: 42, fri: 55, sat: 95, sun: 98 },
  ];

  const networks = [
    { id: 'all', label: 'Global', icon: <Grid size={16} /> },
    { id: 'facebook', label: 'Facebook', icon: <Square size={16} color="#1877F2" /> },
    { id: 'instagram', label: 'Instagram', icon: <Camera size={16} color="#E4405F" /> },
    { id: 'linkedin', label: 'LinkedIn', icon: <Briefcase size={16} color="#0A66C2" /> },
    { id: 'tiktok', label: 'TikTok', icon: <Smartphone size={16} color="#000000" /> },
    { id: 'web', label: 'Website', icon: <Globe size={16} color="#3B82F6" /> },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass" style={{ padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '0.8rem' }}>{label}</p>
          {payload.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{p.name}: <span style={{ color: 'var(--text)' }}>{p.value.toLocaleString()}</span></span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Network Filter - Premium Glass Style */}
      <motion.div variants={item} style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
        {networks.map(net => (
          <button key={net.id} onClick={() => setSubNetwork(net.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem',
              borderRadius: '2rem', border: '1px solid var(--border)', cursor: 'pointer',
              background: subNetwork === net.id ? 'var(--bg-subtle)' : 'transparent',
              fontWeight: 800, fontSize: '0.8rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
              whiteSpace: 'nowrap', color: subNetwork === net.id ? 'var(--accent)' : 'var(--text-muted)',
              boxShadow: subNetwork === net.id ? '0 10px 20px -10px var(--accent-alpha)' : 'none'
            }}>
            {net.icon} {net.label}
          </button>
        ))}
      </motion.div>

      {/* Main KPIs Section */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Reach Global" value="452,840" trend={12.5} trendType="up" icon={<Eye size={22} />} color="#3B82F6" sparklineData={[30, 45, 32, 60, 55, 80, 75]} />
        <KpiCard title="Engagement Rate" value="4.82%" trend={0.5} trendType="up" icon={<Zap size={22} />} color="#8B5CF6" sparklineData={[4, 5, 4.2, 4.8, 4.5, 5.2]} />
        <KpiCard title="Net Followers" value="+2,450" trend={8.2} trendType="up" icon={<Users size={22} />} color="#10B981" sparklineData={[100, 150, 120, 300, 250, 400]} />
        <KpiCard title="Link Clicks" value="12,840" trend={-2.4} trendType="down" icon={<MousePointer2 size={22} />} color="#EC4899" sparklineData={[2000, 1800, 2500, 2200, 2100]} />
      </motion.div>

      {/* Main Evolution Chart - High Vis Style */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>Évolution Analytics</h4>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Suivi détaillé de vos performances sociales.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
               <button className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 800 }}>Export CSV</button>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="followers" 
                name="Abonnés" 
                stroke="#3B82F6" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorFollowers)" 
              />
              <Area 
                yAxisId="right" 
                type="monotone" 
                dataKey="engagement" 
                name="Engagement %" 
                stroke="#10B981" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorEngagement)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Heatmap Section - Re-engineered for Aesthetics */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <h4 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} color="#F59E0B" /> Heatmap d'Activité
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {heatmapData.map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: '30px', fontWeight: 800 }}>{row.hour}</span>
                <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
                  {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                    <motion.div 
                      key={day} 
                      whileHover={{ scale: 1.2 }}
                      style={{
                        flex: 1, height: '22px', borderRadius: '4px',
                        background: row[day] > 90 ? '#8B5CF6' : row[day] > 70 ? '#8B5CF680' : row[day] > 40 ? '#8B5CF640' : '#8B5CF612',
                        transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'help'
                      }} 
                      title={`${day} ${row.hour}: ${row[day]}% de probabilité`} 
                    />
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingLeft: '38px' }}>
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                <span key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 900, width: '22px', textAlign: 'center' }}>{d}</span>
              ))}
            </div>
            <div style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, var(--bg-subtle) 0%, var(--bg) 100%)', padding: '1rem', borderRadius: '1.25rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 800, fontSize: '0.85rem' }}>
                <Zap size={14} /> Recommandation IA
              </div>
              <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                Préparez votre prochain post pour le <strong style={{color: 'var(--text)'}}>Vendredi à 20:00</strong>. C'est votre pic d'engagement historique.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnalyticsTab;
