import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '../../../BusinessContext';
import { Plus, TrendingUp, Eye, MousePointer2, Target, CheckCircle2, Clock, PauseCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const CANAL_COLORS = {
  Facebook: '#1877F2',
  Instagram: '#E4405F',
  LinkedIn: '#0A66C2',
  TikTok: '#010101',
  Google: '#4285F4'
};

const CampaignsTab = ({ formatCurrency, setModalMode, setIsModalOpen }) => {
  const { data } = useBusiness();
  const campaigns = data?.marketing?.campaigns || [];
  const [selected, setSelected] = useState(campaigns[0]?.id || null);

  const activeCampaign = campaigns.find(c => c.id === selected);

  const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);
  const totalDepense = campaigns.reduce((s, c) => s + (c.depense || 0), 0);
  const totalReach = campaigns.reduce((s, c) => s + (c.reach || 0), 0);
  const totalConversions = campaigns.reduce((s, c) => s + (c.conversions || 0), 0);

  const chartData = campaigns.map(c => ({
    name: c.nom.substring(0, 16) + '…',
    budget: c.budget,
    depense: c.depense,
    conversions: c.conversions
  }));

  const getStatusIcon = (s) => {
    if (s === 'Active') return <CheckCircle2 size={14} color="#10B981" />;
    if (s === 'Terminée') return <PauseCircle size={14} color="#6366F1" />;
    return <Clock size={14} color="#F59E0B" />;
  };

  const cpm = activeCampaign && activeCampaign.reach > 0 ? ((activeCampaign.depense / activeCampaign.reach) * 1000).toFixed(0) : 0;
  const cpc = activeCampaign && activeCampaign.clics > 0 ? (activeCampaign.depense / activeCampaign.clics).toFixed(0) : 0;
  const cpa = activeCampaign && activeCampaign.conversions > 0 ? (activeCampaign.depense / activeCampaign.conversions).toFixed(0) : 0;
  const roiBudget = activeCampaign && activeCampaign.depense > 0 ? ((activeCampaign.conversions * 150000) / activeCampaign.depense).toFixed(1) : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header KPIs */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Budget Total', value: formatCurrency?.(totalBudget), icon: <Target size={20} />, color: '#6366F1', sub: `Dépensé: ${formatCurrency?.(totalDepense)}` },
          { label: 'Reach Cumulé', value: totalReach.toLocaleString(), icon: <Eye size={20} />, color: '#3B82F6', sub: `Sur ${campaigns.length} campagnes` },
          { label: 'Conversions', value: totalConversions, icon: <TrendingUp size={20} />, color: '#10B981', sub: 'Leads générés' },
          { label: 'CPA Moyen', value: `${formatCurrency?.(totalDepense / Math.max(totalConversions, 1))}`, icon: <MousePointer2 size={20} />, color: '#F59E0B', sub: 'Coût par acquisition' },
        ].map((kpi, i) => (
          <div key={i} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: `1px solid ${kpi.color}20` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ background: `${kpi.color}15`, padding: '10px', borderRadius: '12px', color: kpi.color }}>
                {kpi.icon}
              </div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)' }}>{kpi.value}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.25rem' }}>{kpi.label}</div>
            <div style={{ fontSize: '0.7rem', color: kpi.color, marginTop: '0.25rem' }}>{kpi.sub}</div>
          </div>
        ))}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        {/* Campaign List */}
        <motion.div variants={item} className="glass" style={{ padding: '1.5rem', borderRadius: '1.75rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontWeight: 900 }}>Campagnes Publicitaires</h3>
            <button onClick={() => { setModalMode('campaigns'); setIsModalOpen(true); }} className="btn btn-primary" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={14} /> Nouvelle
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {campaigns.map(c => {
              const burnRate = c.budget > 0 ? (c.depense / c.budget) * 100 : 0;
              const isSelected = selected === c.id;
              return (
                <motion.div
                  key={c.id}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelected(c.id)}
                  style={{
                    padding: '1.25rem',
                    borderRadius: '1.25rem',
                    border: `1px solid ${isSelected ? CANAL_COLORS[c.canal] + '60' : 'var(--border)'}`,
                    background: isSelected ? `${CANAL_COLORS[c.canal]}08` : 'var(--bg-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{c.nom}</div>
                      <div style={{ fontSize: '0.75rem', color: CANAL_COLORS[c.canal], fontWeight: 700 }}>{c.canal} • {c.objectif}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {getStatusIcon(c.statut)} {c.statut}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    <span>Budget consommé</span>
                    <span style={{ fontWeight: 700, color: burnRate > 90 ? '#EF4444' : 'var(--text)' }}>{burnRate.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${burnRate}%`, height: '100%', background: burnRate > 90 ? '#EF4444' : CANAL_COLORS[c.canal], borderRadius: '3px' }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Campaign Detail */}
        <motion.div variants={item} className="glass" style={{ padding: '1.5rem', borderRadius: '1.75rem', border: '1px solid var(--border)' }}>
          {activeCampaign ? (
            <>
              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: CANAL_COLORS[activeCampaign.canal], fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>{activeCampaign.canal}</div>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>{activeCampaign.nom}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{activeCampaign.dateDebut} → {activeCampaign.dateFin}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'CPM', value: `${Number(cpm).toLocaleString()} FCFA`, hint: 'Pour 1 000 impressions' },
                  { label: 'CPC', value: `${Number(cpc).toLocaleString()} FCFA`, hint: 'Par clic' },
                  { label: 'CPA', value: `${Number(cpa).toLocaleString()} FCFA`, hint: 'Par conversion' },
                  { label: 'ROI estimé', value: `×${roiBudget}`, hint: 'Retour sur investissement', highlight: true },
                ].map((m, i) => (
                  <div key={i} style={{ padding: '1rem', borderRadius: '1rem', background: m.highlight ? '#10B98115' : 'var(--bg-subtle)', border: m.highlight ? '1px solid #10B98130' : '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{m.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: m.highlight ? '#10B981' : 'var(--text)' }}>{m.value}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{m.hint}</div>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={[{ reach: activeCampaign.reach, clics: activeCampaign.clics, conversions: activeCampaign.conversions * 100 }]} barCategoryGap="20%">
                  <XAxis hide />
                  <YAxis hide />
                  <Tooltip formatter={(v, n) => [n === 'conversions' ? v / 100 : v.toLocaleString(), n]} />
                  <Bar dataKey="reach" fill="#3B82F6" radius={[6,6,0,0]} name="Reach" />
                  <Bar dataKey="clics" fill="#6366F1" radius={[6,6,0,0]} name="Clics" />
                  <Bar dataKey="conversions" fill="#10B981" radius={[6,6,0,0]} name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)' }}>
              Sélectionnez une campagne pour voir les détails
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CampaignsTab;
