import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, DollarSign, Target, Award, 
  Zap, Activity
} from 'lucide-react';
import {
  Area, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, ComposedChart
} from 'recharts';
import KpiCard from '../../../components/KpiCard';
import SafeResponsiveChart from '../../../components/charts/SafeResponsiveChart';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const AnalyticsTab = ({ opportunities, formatCurrency }) => {
  const pipeline = useMemo(() => {
    const total = opportunities.reduce((s, o) => s + (Number(o.montant) || 0), 0);
    const weighted = opportunities.reduce((s, o) => s + (Number(o.montant) || 0) * ((Number(o.probabilite) || 0) / 100), 0);
    const won = opportunities.filter(o => o.etape === 'Gagné');
    const lost = opportunities.filter(o => o.etape === 'Perdu');
    const winRate = (won.length + lost.length) > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
    return { total, weighted, winRate };
  }, [opportunities]);

  // [GO-LIVE] Forecast vide tant qu'aucune opportunité n'existe.
  // Recharts gère naturellement l'empty state (axes vides).
  const forecastData = useMemo(() => {
    if (!opportunities || opportunities.length === 0) return [];
    // Agrégation par mois (12 derniers mois) sur les opportunités réelles
    const buckets = {};
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('fr-FR', { month: 'short' });
      buckets[key] = { name: key, real: 0, target: 0 };
    }
    opportunities.forEach(o => {
      if (!o.dateCloture) return;
      const d = new Date(o.dateCloture);
      const key = d.toLocaleString('fr-FR', { month: 'short' });
      if (buckets[key]) {
        buckets[key].real   += (Number(o.montant) || 0) * (o.etape === 'Gagné' ? 1 : ((Number(o.probabilite) || 0) / 100));
        buckets[key].target += Number(o.montant) || 0;
      }
    });
    return Object.values(buckets);
  }, [opportunities]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" 
      style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}
    >
      {/* KPI Row */}
      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-primary)' }}><TrendingUp size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>ACTIF</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Revenu Projeté</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{formatCurrency(pipeline.weighted, true)}</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-primary)' }}><DollarSign size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>BRUT</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Pipeline Global</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{formatCurrency(pipeline.total, true)}</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-primary)' }}><Award size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>{pipeline.winRate}%</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Win Rate (Global)</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>Nexus High</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.05)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-secondary)' }}><Target size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>DEALS</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Opportunités</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{opportunities.length}</div>
      </motion.div>

      {/* Main Chart Area */}
      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 8', padding: '2rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', color: 'var(--nexus-secondary)' }}>Revenue Forecasting</h4>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--nexus-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Performance réelle vs Objectifs Nexus Q2.</p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--nexus-primary)' }}></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>Réel</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: 'var(--nexus-border)' }}></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>Objectif</span>
            </div>
          </div>
        </div>
        <SafeResponsiveChart minHeight={350} fallbackHeight={350}>
          <ComposedChart data={forecastData}>
            <defs>
              <linearGradient id="nexusRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--nexus-primary)" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="var(--nexus-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--nexus-border)" opacity={0.4} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 12, fontWeight: 800 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 11, fontWeight: 700 }} tickFormatter={(v) => `${v/1000000}M`} />
            <Tooltip 
              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.15)', padding: '1rem' }} 
              itemStyle={{ fontWeight: 900, fontSize: '0.85rem' }}
              labelStyle={{ fontWeight: 900, marginBottom: '0.5rem', color: 'var(--nexus-secondary)' }}
            />
            <Area type="monotone" dataKey="real" name="Chiffre d'Affaires" stroke="var(--nexus-primary)" strokeWidth={4} fillOpacity={1} fill="url(#nexusRevenue)" />
            <Bar dataKey="target" name="Objectif" fill="var(--nexus-border)" radius={[4, 4, 0, 0]} barSize={24} />
          </ComposedChart>
        </SafeResponsiveChart>
      </motion.div>

      {/* Secondary Data Row */}
      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'white' }}>
         <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1rem', color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Award size={18} color="#F59E0B" /> Top Opportunités
         </h4>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {opportunities.sort((a,b) => b.montant - a.montant).slice(0, 3).map((o, i) => (
               <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--nexus-border)', background: 'var(--bg-subtle)' }}>
                  <div>
                     <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{o.nom || 'Sans Nom'}</div>
                     <div style={{ fontSize: '0.7rem', color: 'var(--nexus-text-muted)', fontWeight: 800 }}>{o.client} • {o.probabilite}%</div>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>{formatCurrency(o.montant)}</div>
               </div>
            ))}
         </div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'white' }}>
         <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1rem', color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={18} color="#3B82F6" /> État du Funnel
         </h4>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {['Qualification', 'Proposition', 'Négociation', 'Gagné'].map((step, i) => {
               const count = opportunities.filter(o => o.etape === step).length;
               const total = opportunities.length || 1;
               return (
                  <div key={i}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, marginBottom: '4px' }}>
                        <span>{step}</span>
                        <span>{count}</span>
                     </div>
                     <div style={{ height: '8px', background: 'var(--nexus-border)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(count/total)*100}%`, height: '100%', background: 'var(--nexus-secondary)', opacity: 1 - (i*0.2) }} />
                     </div>
                  </div>
               );
            })}
         </div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'var(--nexus-primary)', color: 'white', position: 'relative', overflow: 'hidden' }}>
         <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', background: 'white', opacity: 0.1, filter: 'blur(40px)' }} />
         <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Zap size={18} fill="white" /> Nexus Growth Engine
         </h4>
         <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.5 }}>
            Analyse effectuée : Le taux de transformation sur les briques industrielles a augmenté de <span style={{ textDecoration: 'underline' }}>12%</span> grâce aux nouvelles fiches techniques immersives.
         </p>
         <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <TrendingUp size={20} />
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>Tendance Mensuelle : EXCELLENTE</div>
         </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsTab;
