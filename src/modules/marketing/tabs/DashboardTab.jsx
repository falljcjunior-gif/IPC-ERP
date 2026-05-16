import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Megaphone, Mail, CalendarDays, Users2, TrendingUp,
  TrendingDown, Target, DollarSign, Eye, MousePointerClick,
  ArrowUpRight, Activity, Zap, BarChart3, Award
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import SafeResponsiveChart from '../../../components/charts/SafeResponsiveChart';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const COLORS = ['#EC4899', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#06B6D4'];

const KpiCard = ({ title, value, sub, icon, color, trend, trendType }) => (
  <motion.div variants={item} className="glass" style={{
    padding: '1.75rem', borderRadius: '1.75rem', border: '1px solid var(--border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  }}>
    <div>
      <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{title}</div>
      <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: trend > 0 ? '#10B981' : '#EF4444', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {trendType === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {sub}
      </div>}
    </div>
    <div style={{ background: `${color}18`, padding: '16px', borderRadius: '1.25rem', color }}>{icon}</div>
  </motion.div>
);

const MarketingDashboard = ({ data, formatCurrency, onNavigate }) => {
  const campaigns = data?.marketing?.campaigns || [];
  const emailings = data?.marketing?.emailings || [];
  const events = data?.marketing?.events || [];
  const leads = data?.crm?.leads || [];

  const stats = useMemo(() => {
    const activeCampaigns = campaigns.filter(c => c.statut === 'Active').length;
    const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);
    const totalDepense = campaigns.reduce((s, c) => s + (c.depense || 0), 0);
    const totalReach = campaigns.reduce((s, c) => s + (c.reach || 0), 0);
    const totalConversions = campaigns.reduce((s, c) => s + (c.conversions || 0), 0);
    const roi = totalDepense > 0 ? ((totalConversions * 150000) / totalDepense * 100).toFixed(0) : 0;
    const emailsSent = emailings.reduce((s, e) => s + (e.nbEnvoyes || 0), 0);
    const emailOpens = emailings.reduce((s, e) => s + (e.nbOuvertures || 0), 0);
    const openRate = emailsSent > 0 ? ((emailOpens / emailsSent) * 100).toFixed(1) : 0;
    const newLeads = leads.filter(l => l.statut === 'Nouveau' || !l.statut).length;
    const upcomingEvents = events.filter(e => e.statut === 'Planifié' || e.statut === 'Confirmé').length;
    return { activeCampaigns, totalBudget, totalDepense, totalReach, totalConversions, roi, emailsSent, openRate, newLeads, upcomingEvents };
  }, [campaigns, emailings, events, leads]);

  const budgetData = campaigns.slice(0, 6).map(c => ({
    name: (c.nom || '').substring(0, 12),
    budget: c.budget || 0,
    depense: c.depense || 0
  }));

  const sourceData = Object.entries(
    leads.reduce((acc, l) => { const s = l.source || 'Autre'; acc[s] = (acc[s] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  const canalData = Object.entries(
    campaigns.reduce((acc, c) => { const canal = c.canal || 'Autre'; acc[canal] = (acc[canal] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.25rem' }}>
        <KpiCard title="Campagnes Actives" value={stats.activeCampaigns} trend={2} trendType="up" icon={<Megaphone size={26} />} color="#EC4899" />
        <KpiCard title="ROI Global" value={`${stats.roi}%`} trend={stats.roi > 150 ? 1 : -1} trendType={stats.roi > 150 ? 'up' : 'down'} icon={<TrendingUp size={26} />} color="#10B981" />
        <KpiCard title="Leads Générés" value={stats.totalConversions + stats.newLeads} trend={18} trendType="up" icon={<Users2 size={26} />} color="#8B5CF6" />
        <KpiCard title="Taux Ouverture Email" value={`${stats.openRate}%`} trend={1} trendType="up" icon={<Mail size={26} />} color="#3B82F6" />
        <KpiCard title="Budget Engagé" value={formatCurrency ? formatCurrency(stats.totalDepense, true) : `${stats.totalDepense.toLocaleString()} F`} sub={`sur ${formatCurrency ? formatCurrency(stats.totalBudget, true) : stats.totalBudget.toLocaleString()} F`} trend={-1} trendType="down" icon={<DollarSign size={26} />} color="#F59E0B" />
        <KpiCard title="Événements à Venir" value={stats.upcomingEvents} sub="Prochainement" trend={1} trendType="up" icon={<CalendarDays size={26} />} color="#06B6D4" />
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
        {/* Budget vs Dépenses */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1rem' }}>Budget vs Dépenses par Campagne</h3>
            <BarChart3 size={20} color="var(--text-muted)" />
          </div>
          {budgetData.length > 0 ? (
            <SafeResponsiveChart minHeight={240} fallbackHeight={240}>
              <BarChart data={budgetData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`${v.toLocaleString()} FCFA`]} contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                <Bar dataKey="budget" name="Budget" fill="#EC489920" radius={[6,6,0,0]} />
                <Bar dataKey="depense" name="Dépensé" fill="#EC4899" radius={[6,6,0,0]} />
              </BarChart>
            </SafeResponsiveChart>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Aucune campagne avec budget défini
            </div>
          )}
        </motion.div>

        {/* Sources Leads */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1rem' }}>Sources des Leads</h3>
            <Target size={20} color="var(--text-muted)" />
          </div>
          {sourceData.length > 0 ? (
            <SafeResponsiveChart minHeight={240} fallbackHeight={240}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </SafeResponsiveChart>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Aucun lead enregistré
            </div>
          )}
        </motion.div>
      </div>

      {/* Top Campagnes */}
      <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1rem' }}> Top Campagnes par Conversions</h3>
          <button onClick={() => onNavigate('campaigns')} style={{ background: 'none', border: 'none', color: '#EC4899', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Voir tout <ArrowUpRight size={14} />
          </button>
        </div>
        {campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Aucune campagne. Créez votre première campagne marketing.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...campaigns].sort((a, b) => (b.conversions || 0) - (a.conversions || 0)).slice(0, 5).map((c, i) => {
              const ratio = c.budget > 0 ? Math.min((c.depense / c.budget) * 100, 100) : 0;
              const roi = c.depense > 0 ? ((c.conversions || 0) * 150000 / c.depense) : 0;
              return (
                <div key={c.id || i} style={{ display: 'grid', gridTemplateColumns: '32px 2fr 1.5fr 1fr 1fr 80px', alignItems: 'center', gap: '1.5rem', padding: '1rem 1.5rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontWeight: 900, color: i < 3 ? '#F59E0B' : 'var(--text-muted)', fontSize: '1.1rem' }}>
                    {i < 3 ? ['','',''][i] : `#${i+1}`}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{c.nom}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.type} · {c.canal}</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      <span>Budget</span><span>{ratio.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${ratio}%`, height: '100%', background: ratio > 90 ? '#EF4444' : '#EC4899', borderRadius: '3px' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, color: '#8B5CF6' }}>{c.conversions || 0}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Leads</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 900, color: '#10B981' }}>×{roi.toFixed(1)}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ROI</div>
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900, textAlign: 'center',
                    background: c.statut === 'Active' ? '#10B98115' : c.statut === 'Clôturée' ? '#6B728015' : '#F59E0B15',
                    color: c.statut === 'Active' ? '#10B981' : c.statut === 'Clôturée' ? '#6B7280' : '#F59E0B'
                  }}>{c.statut}</div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MarketingDashboard;
