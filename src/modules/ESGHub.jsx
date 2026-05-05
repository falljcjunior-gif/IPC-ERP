import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Droplets, Zap, Fuel, TrendingDown, BarChart3, Target, Award } from 'lucide-react';
import { useStore } from '../store';
import KpiCard from '../components/KpiCard';
import SmartButton from '../components/SmartButton';
import { useToastStore } from '../store/useToastStore';

const ESGHub = () => {
  const { data } = useStore();
  const [activeTab, setActiveTab] = useState('carbon');

  const carbonData = [
    { month: 'Jan', production: 12.4, transport: 5.2, energy: 8.1 },
    { month: 'Fév', production: 11.8, transport: 4.9, energy: 7.6 },
    { month: 'Mar', production: 10.5, transport: 5.5, energy: 7.2 },
    { month: 'Avr', production: 9.8, transport: 4.1, energy: 6.9 },
  ];

  const resources = [
    { name: 'Eau', icon: <Droplets size={24} />, value: '2,340 m³', trend: '-8%', color: '#3B82F6', target: '2,500 m³' },
    { name: 'Électricité', icon: <Zap size={24} />, value: '18,500 kWh', trend: '-12%', color: '#F59E0B', target: '20,000 kWh' },
    { name: 'Carburant', icon: <Fuel size={24} />, value: '1,200 L', trend: '-5%', color: '#EF4444', target: '1,400 L' },
  ];

  return (
    <div style={{ padding: '3rem', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: '#059669', boxShadow: '0 4px 15px rgba(5,150,105,0.3)' }}>
              <Leaf size={20} color="white" />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#059669', textTransform: 'uppercase' }}>Green Intelligence</span>
          </div>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 900, margin: 0 }}>ESG & Environnement</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Empreinte carbone, consommation de ressources et objectifs durables.</p>
        </div>
        <SmartButton variant="primary" icon={BarChart3} onClick={async () => useToastStore.getState().addToast('Rapport ESG généré', 'info')}>Rapport ESG</SmartButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <KpiCard title="Émissions CO₂ (mois)" value="20.8t" icon={<Leaf size={20} />} color="#059669" trend={15} trendType="up" sparklineData={[{val:25.7},{val:24.3},{val:23.2},{val:20.8}]} />
        <KpiCard title="Eau Consommée" value="2,340 m³" icon={<Droplets size={20} />} color="#3B82F6" trend={8} trendType="up" sparklineData={[{val:2800},{val:2600},{val:2500},{val:2340}]} />
        <KpiCard title="Score ESG" value="B+" icon={<Award size={20} />} color="#8B5CF6" trend="12" trendType="up" sparklineData={[{val:60},{val:70},{val:78},{val:82}]} />
        <KpiCard title="Objectif 2025" value="72%" icon={<Target size={20} />} color="#F59E0B" trend="5.4" trendType="up" sparklineData={[{val:45},{val:55},{val:65},{val:72}]} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15,23,42,0.03)', padding: '6px', borderRadius: '1.5rem', border: '1px solid var(--border-light)', width: 'fit-content', marginBottom: '2.5rem' }}>
        {[{id:'carbon',label:'Empreinte Carbone',icon:<Leaf size={16}/>},{id:'resources',label:'Ressources',icon:<Droplets size={16}/>}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.8rem 1.5rem', borderRadius:'1.25rem', border:'none', cursor:'pointer', fontWeight:700, background: activeTab===t.id?'white':'transparent', color: activeTab===t.id?'#059669':'var(--text-muted)', boxShadow: activeTab===t.id?'var(--shadow-md)':'none' }}>{t.icon} {t.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
          {activeTab === 'carbon' && (
            <div className="glass" style={{ padding: '2.5rem', borderRadius: '2rem', background: 'white', border: '1px solid var(--border)' }}>
              <h3 style={{ fontWeight: 900, marginBottom: '2rem' }}>Évolution des Émissions (tonnes CO₂)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                {carbonData.map((m, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem' }}>{m.month}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      {[{v: m.production, c: '#EF4444', l: 'Prod'}, {v: m.transport, c: '#F59E0B', l: 'Trans'}, {v: m.energy, c: '#3B82F6', l: 'Énergie'}].map((s, j) => (
                        <motion.div key={j} initial={{scaleY:0}} animate={{scaleY:1}} style={{ width: '100%', height: `${s.v * 3}px`, background: s.c, borderRadius: '6px', opacity: 0.8 }} title={`${s.l}: ${s.v}t`} />
                      ))}
                    </div>
                    <div style={{ fontWeight: 900, marginTop: '0.75rem' }}>{(m.production + m.transport + m.energy).toFixed(1)}t</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '2rem' }}>
                {[{c:'#EF4444',l:'Production'},{c:'#F59E0B',l:'Transport'},{c:'#3B82F6',l:'Énergie'}].map((l,i)=>(
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: l.c }} />{l.l}
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'resources' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {resources.map((r, i) => (
                <motion.div key={i} whileHover={{y:-6}} className="glass" style={{ padding: '2.5rem', borderRadius: '2rem', background: 'white', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '1rem', background: `${r.color}15`, color: r.color }}>{r.icon}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', fontSize: '0.8rem', fontWeight: 900 }}>
                      <TrendingDown size={14} />{r.trend}
                    </div>
                  </div>
                  <h3 style={{ fontWeight: 900, marginBottom: '0.25rem' }}>{r.name}</h3>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: r.color, marginBottom: '1rem' }}>{r.value}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Objectif: <strong>{r.target}</strong></div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ESGHub;
