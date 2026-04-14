import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, DollarSign, CheckCircle2, TrendingUp, Target, 
  BarChart3, ArrowUpRight, Lightbulb, AlertTriangle 
} from 'lucide-react';
import {
  ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis,
  RadialBarChart, RadialBar, Legend, Tooltip
} from 'recharts';
import KpiCard from '../../../components/KpiCard';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const StrategyTab = ({ predictionData, formatCurrency }) => {
  const roiData = [
    { name: 'FB Ads', value: 1.8, fill: '#1877F2' },
    { name: 'Google Ads', value: 1.4, fill: '#34A853' },
    { name: 'Instagram', value: 2.1, fill: '#E4405F' },
    { name: 'LinkedIn', value: 1.2, fill: '#0A66C2' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Strategic Vision Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <motion.div variants={item} className="glass" 
          style={{ 
            padding: '2.5rem', borderRadius: '2rem', 
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', 
            color: 'white', border: 'none', position: 'relative', overflow: 'hidden'
          }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
            <Target size={180} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', color: '#10B981', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>
             <Activity size={14} /> Prédiction IPC Intelligence
          </div>
          <h4 style={{ margin: '0 0 0.5rem 0', opacity: 0.7, fontSize: '0.9rem', fontWeight: 600 }}>Chiffre d'Affaires Projeté (J+30)</h4>
          <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-1px' }}>{formatCurrency(predictionData.predictedRevenue, true)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '12px', width: 'fit-content' }}>
            <CheckCircle2 size={16} color="#10B981" /> Indice de confiance IA : <strong>{predictionData.confidence}%</strong>
          </div>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <KpiCard title="Valeur de Deal Estimée" value={formatCurrency(predictionData.avgOrderValue, true)} trend={5.2} trendType="up" icon={<DollarSign size={22} />} color="#10B981" sparklineData={[1.2, 1.4, 1.3, 1.5, 1.6]} />
          <KpiCard title="Coût d'Acquisition (CAC)" value="12,500 FCFA" trend={-12} trendType="down" icon={<Zap size={22} />} color="#8B5CF6" sparklineData={[15, 14, 13, 12.5]} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.5rem' }}>
        {/* ROI Radial Chart */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem' }}>
          <h4 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '1.5rem' }}>Performance ROI par Canal</h4>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={20} data={roiData}>
                <RadialBar
                  minAngle={15}
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 800 }}
                  background
                  clockWise
                  dataKey="value"
                />
                <Tooltip />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '0.75rem', fontWeight: 700 }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Indice de retour sur investissement (Ventes / Budget Ads)
          </div>
        </motion.div>

        {/* AI Recommendations - Enhanced Design */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h4 style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>Analyse Recommandée</h4>
            <div style={{ background: 'var(--accent-alpha)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 900 }}>IA ACTIVE</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { 
                title: 'Optimisation Budgétaire Facebook', 
                text: 'Votre CPA sur Facebook a baissé de 15%. Nous recommandons d\'augmenter le budget hebdomadaire de 45,000 FCFA pour capturer la demande croissante de blocs de construction.',
                icon: <TrendingUp size={18} />, 
                color: '#3B82F6',
                priority: 'High'
              },
              { 
                title: 'Urgence Lead : Moussa Diakité', 
                text: 'Ce prospect a interagi avec 3 de vos publicités aujourd\'hui. Il a une probabilité de clôture de 92%. Contactez-le immédiatement pour finaliser son devis.', 
                icon: <ArrowUpRight size={18} />, 
                color: '#F59E0B',
                priority: 'Critical'
              },
              { 
                title: 'Suggestion de Contenu', 
                text: 'Les vidéos "Behind the scenes" de la production ont un taux d\'engagement 3x supérieur. Planifiez un live en usine ce mercredi.', 
                icon: <Lightbulb size={18} />, 
                color: '#10B981',
                priority: 'Strategic'
              }
            ].map((rec, i) => (
              <motion.div key={i} whileHover={{ x: 10 }}
                style={{ 
                  padding: '1.5rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)', 
                  border: '1px solid var(--border)', position: 'relative' 
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ background: `${rec.color}15`, padding: '8px', borderRadius: '10px', color: rec.color }}>
                    {rec.icon}
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '0.88rem' }}>{rec.title}</div>
                  <div style={{ marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 900, opacity: 0.6, textTransform: 'uppercase' }}>{rec.priority}</div>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{rec.text}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StrategyTab;
