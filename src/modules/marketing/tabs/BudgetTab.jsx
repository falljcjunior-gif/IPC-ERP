import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, PieChart as PieIcon,
  BarChart2, Target, AlertTriangle, CheckCircle2, Award,
  Wallet, Scale, ArrowUpRight, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import SafeResponsiveChart from '../../../components/charts/SafeResponsiveChart';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const BudgetTab = ({ campaigns, emailings, events, formatCurrency }) => {
  const stats = useMemo(() => {
    const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0)
      + events.reduce((s, e) => s + (e.budget || 0), 0);
    const totalDepense = campaigns.reduce((s, c) => s + (c.depense || 0), 0);
    const totalReach = campaigns.reduce((s, c) => s + (c.reach || 0), 0);
    const totalClics = campaigns.reduce((s, c) => s + (c.clics || 0), 0);
    const totalConversions = campaigns.reduce((s, c) => s + (c.conversions || 0), 0);
    const cpm = totalReach > 0 ? (totalDepense / totalReach * 1000).toFixed(0) : 0;
    const cpc = totalClics > 0 ? Math.round(totalDepense / totalClics) : 0;
    const cpl = totalConversions > 0 ? Math.round(totalDepense / totalConversions) : 0;
    const remainingBudget = totalBudget - totalDepense;
    const burnRate = totalBudget > 0 ? ((totalDepense / totalBudget) * 100).toFixed(1) : 0;
    const roi = totalDepense > 0 ? ((totalConversions * 250000) / totalDepense * 100).toFixed(0) : 0;
    return { totalBudget, totalDepense, totalReach, totalClics, totalConversions, cpm, cpc, cpl, remainingBudget, burnRate, roi };
  }, [campaigns, events]);

  const fmt = (v) => formatCurrency ? formatCurrency(v, true) : `${v.toLocaleString()} F`;

  // Canal performance data
  const canalData = useMemo(() => {
    const map = {};
    campaigns.forEach(c => {
      const canal = c.canal || 'Autre';
      if (!map[canal]) map[canal] = { canal, budget: 0, depense: 0, leads: 0 };
      map[canal].budget += c.budget || 0;
      map[canal].depense += c.depense || 0;
      map[canal].leads += c.conversions || 0;
    });
    return Object.values(map).sort((a, b) => b.leads - a.leads);
  }, [campaigns]);

  // Objectif radar
  const radarData = [
    { subject: 'ROI', value: Math.min(parseInt(stats.roi), 100) },
    { subject: 'Taux occup.', value: Math.round(campaigns.filter(c => c.statut === 'Active').length / Math.max(campaigns.length, 1) * 100) },
    { subject: 'Conv. rate', value: stats.totalClics > 0 ? Math.min(Math.round(stats.totalConversions / stats.totalClics * 100), 100) : 0 },
    { subject: 'Reach', value: Math.min(Math.round(stats.totalReach / 10000), 100) },
    { subject: 'Efficacité', value: Math.min(100 - parseInt(stats.cpm), 100) },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Budget Global */}
      <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)', background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)', color: 'white' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '2rem' }}>
          {[
            { label: 'Budget Total Alloué', value: fmt(stats.totalBudget), icon: <Wallet size={24} /> },
            { label: 'Total Dépensé', value: fmt(stats.totalDepense), icon: <DollarSign size={24} /> },
            { label: 'Restant Disponible', value: fmt(stats.remainingBudget), icon: <Scale size={24} /> },
            { label: 'Taux de Consommation', value: `${stats.burnRate}%`, icon: <Activity size={24} /> },
          ].map((k, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ opacity: 0.7, marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{k.icon}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{k.value}</div>
            </div>
          ))}
        </div>
        {/* Global budget bar */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px', opacity: 0.8 }}>
            <span>Progression budgétaire</span>
            <span>{stats.burnRate}% consommé</span>
          </div>
          <div style={{ height: '10px', background: 'rgba(255,255,255,0.2)', borderRadius: '5px', overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${stats.burnRate}%` }} transition={{ duration: 1 }}
              style={{ height: '100%', background: 'white', borderRadius: '5px' }} />
          </div>
        </div>
      </motion.div>

      {/* Métriques de Performance */}
      <motion.div variants={item}>
        <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900 }}>Indicateurs de Performance (KPIs)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '1.25rem' }}>
          {[
            { label: 'ROI Global', value: `${stats.roi}%`, note: 'Objectif: 300%', color: parseInt(stats.roi) > 300 ? '#10B981' : '#EF4444', icon: <TrendingUp size={22} />, good: parseInt(stats.roi) > 300 },
            { label: 'Coût par Mille (CPM)', value: `${parseInt(stats.cpm).toLocaleString()} F`, note: `Sur ${(stats.totalReach/1000).toFixed(0)}k personnes atteintes`, color: '#3B82F6', icon: <Target size={22} /> },
            { label: 'Coût par Clic (CPC)', value: `${stats.cpc.toLocaleString()} F`, note: `${stats.totalClics.toLocaleString()} clics`, color: '#8B5CF6', icon: <ArrowUpRight size={22} /> },
            { label: 'Coût par Lead (CPL)', value: `${stats.cpl.toLocaleString()} F`, note: `${stats.totalConversions} conversions`, color: '#EC4899', icon: <Award size={22} /> },
          ].map((k, i) => (
            <div key={i} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: `1px solid ${k.color}30` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ background: `${k.color}15`, color: k.color, padding: '10px', borderRadius: '0.75rem' }}>{k.icon}</div>
                {k.good !== undefined && (
                  <div style={{ color: k.good ? '#10B981' : '#EF4444' }}>
                    {k.good ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>{k.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>{k.note}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Canal Performance + Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '1.5rem' }}>
        {/* Canal Bar */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1rem' }}>Performance par Canal</h4>
          {canalData.length > 0 ? (
            <SafeResponsiveChart minHeight={240} fallbackHeight={240}>
              <BarChart data={canalData} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="canal" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                <Bar dataKey="leads" name="Leads" fill="#EC4899" radius={[4,4,0,0]} />
                <Bar dataKey="depense" name="Dépense" fill="#8B5CF620" radius={[4,4,0,0]} />
              </BarChart>
            </SafeResponsiveChart>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Aucune donnée de canal</div>
          )}
        </motion.div>

        {/* Detail Canal Table */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1rem' }}>Détail par Canal</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {canalData.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem' }}>Aucune campagne active</div>
            ) : canalData.map((c, i) => {
              const cpl = c.leads > 0 ? Math.round(c.depense / c.leads) : '—';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: '1rem', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{c.canal}</div>
                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.78rem', fontWeight: 700 }}>
                    <span style={{ color: '#EC4899' }}>{c.leads} leads</span>
                    <span style={{ color: '#8B5CF6' }}>CPL: {typeof cpl === 'number' ? `${cpl.toLocaleString()} F` : cpl}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Campagnes Table with Budget */}
      <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
        <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1rem' }}>Suivi Budgétaire par Campagne</h4>
        {campaigns.filter(c => c.budget > 0).length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem', fontSize: '0.85rem' }}>Aucune campagne avec budget défini.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {campaigns.filter(c => c.budget > 0).sort((a,b) => (b.budget || 0) - (a.budget || 0)).map((c, i) => {
              const pct = Math.min(((c.depense || 0) / c.budget) * 100, 100);
              const roi = c.depense > 0 ? ((c.conversions || 0) * 250000 / c.depense * 100).toFixed(0) : '—';
              return (
                <div key={i} style={{ padding: '1rem 1.5rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{c.nom}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.type} · {c.objectif}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 700 }}>
                      <div style={{ color: '#EC4899' }}>{(c.depense || 0).toLocaleString()} / {(c.budget || 0).toLocaleString()} FCFA</div>
                      <div style={{ color: '#10B981' }}>ROI: {roi !== '—' ? `${roi}%` : roi}</div>
                    </div>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7 }}
                      style={{ height: '100%', background: pct > 90 ? '#EF4444' : '#EC4899', borderRadius: '3px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>{pct.toFixed(0)}% consommé</span>
                    <span>{c.conversions || 0} leads · {c.reach?.toLocaleString() || 0} reach</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default BudgetTab;
