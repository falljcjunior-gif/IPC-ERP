import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, Activity, TrendingUp, Award, BarChart3, 
  Target, Users, ArrowUpRight, ArrowDownRight, Zap 
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell, PieChart, Pie
} from 'recharts';
import KpiCard from '../../../components/KpiCard';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const AnalyticsTab = ({ leads, opportunities, formatCurrency }) => {
  const kpis = useMemo(() => {
    const totalPipeline = opportunities.reduce((s, o) => s + (Number(o.montant) || 0), 0);
    const weightedPipeline = opportunities.reduce((s, o) => s + (Number(o.montant) || 0) * ((Number(o.probabilite) || 0) / 100), 0);
    const won = opportunities.filter(o => o.etape === 'Gagné');
    const lost = opportunities.filter(o => o.etape === 'Perdu');
    const convRate = leads.length > 0 ? Math.round((opportunities.length / leads.length) * 100) : 0;
    const winRate = (won.length + lost.length) > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
    return { totalPipeline, weightedPipeline, convRate, winRate };
  }, [leads, opportunities]);

  const STAGE_ORDER = ['Nouveau', 'Qualification', 'Proposition', 'Négociation', 'Gagné'];
  const STAGE_COLORS = { 'Nouveau': '#64748B', 'Qualification': '#3B82F6', 'Proposition': '#8B5CF6', 'Négociation': '#F59E0B', 'Gagné': '#10B981' };

  const pipelineByStage = STAGE_ORDER.map(stage => ({
    name: stage,
    montant: opportunities.filter(o => o.etape === stage).reduce((s, o) => s + (Number(o.montant) || 0), 0),
    count: opportunities.filter(o => o.etape === stage).length,
    color: STAGE_COLORS[stage]
  }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Sales Velocity KPIs */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Valeur Pipeline" value={formatCurrency(kpis.totalPipeline, true)} trend={15} trendType="up" icon={<DollarSign size={22} />} color="#3B82F6" sparklineData={[30, 45, 32, 60, 55]} />
        <KpiCard title="Prévu (Pondéré)" value={formatCurrency(kpis.weightedPipeline, true)} trend={8.2} trendType="up" icon={<Target size={22} />} color="#8B5CF6" sparklineData={[20, 30, 25, 40, 38]} />
        <KpiCard title="Conversion Leads" value={`${kpis.convRate}%`} trend={2.5} trendType="up" icon={<Zap size={22} />} color="#F59E0B" sparklineData={[15, 18, 14, 20]} />
        <KpiCard title="Win Rate Global" value={`${kpis.winRate}%`} trend={-1.2} trendType="down" icon={<Award size={22} />} color="#10B981" sparklineData={[65, 68, 62, 60]} />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: '1.5rem' }}>
        {/* Pipeline Distribution */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <h4 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '2rem' }}>Pipeline par Étape Commerciale</h4>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={pipelineByStage} layout="vertical" margin={{ left: 20, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.3} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} width={100} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="glass" style={{ padding: '1rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>{label}</p>
                      <p style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 900 }}>{formatCurrency(payload[0].value, true)}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payload[0].payload.count} Opportunités</p>
                    </div>
                  );
                }
                return null;
              }} />
              <Bar dataKey="montant" radius={[0, 8, 8, 0]} barSize={25}>
                {pipelineByStage.map((entry, index) => <Cell key={index} fill={entry.color} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Lead Sources Analysis */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <h4 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '2rem' }}>Origine des Prospects</h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Facebook Ads', value: 45 },
                  { name: 'Google Search', value: 25 },
                  { name: 'Direct / Site', value: 20 },
                  { name: 'Referral', value: 10 }
                ]}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {/* Custom Colors match Marketing logic */}
                <Cell fill="#1877F2" />
                <Cell fill="#34A853" />
                <Cell fill="#3B82F6" />
                <Cell fill="#8B5CF6" />
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'FB Ads', value: '45%', color: '#1877F2' },
              { label: 'Google', value: '25%', color: '#34A853' },
              { label: 'Direct', value: '20%', color: '#3B82F6' },
              { label: 'Autres', value: '10%', color: '#8B5CF6' }
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                <span>{s.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnalyticsTab;
