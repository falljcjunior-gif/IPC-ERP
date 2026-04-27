import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Activity, Zap, Star, 
  Target, Globe, ShieldCheck, Download, 
  Calendar, Settings, Share2, Sparkles, TrendingUp
} from 'lucide-react';
import { useStore } from '../../store';

// Components
import TabBar from '../marketing/components/TabBar';
import ExecutiveTab from './tabs/ExecutiveTab';
import IndustrialTab from './tabs/IndustrialTab';
import FinancialTab from './tabs/FinancialTab';
import GrowthTab from './tabs/GrowthTab';

const BIHub = () => {
  const { data, formatCurrency, shellView } = useStore();
  const [activeTab, setActiveTab] = useState('executive');

  const tabs = [
    { id: 'executive', label: 'Vue Exécutive', icon: <Star size={16} /> },
    { id: 'industrial', label: 'Indus & Ops', icon: <Activity size={16} /> },
    { id: 'financial', label: 'Finance & Audit', icon: <TrendingUp size={16} /> },
    { id: 'growth', label: 'Growth Velocity', icon: <Zap size={16} /> },
  ];

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '100%' }}>
      
      {/* Nexus Header */}
      {!shellView?.mobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '6px', borderRadius: '10px' }}>
                <Globe size={16} color="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Nexus Strategic Intelligence Hub
              </span>
            </div>
            <h1 className="nexus-gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>
              Decision Core
            </h1>
            <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.1rem', fontWeight: 500, maxWidth: '650px', lineHeight: 1.6 }}>
              Centralisez vos données stratégiques et visualisez la trajectoire de votre entreprise avec une précision militaire.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="nexus-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white' }}>
              <ShieldCheck size={24} color="var(--nexus-primary)" />
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Consolidation Nexus</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>100% OK</div>
              </div>
            </div>

            <button className="nexus-card" style={{ background: 'white', padding: '1rem', border: '1px solid var(--nexus-border)', cursor: 'pointer' }}>
               <Calendar size={20} color="var(--nexus-secondary)" />
            </button>
            <button className="nexus-card" style={{ background: 'var(--nexus-secondary)', padding: '1rem 2rem', color: 'white', fontWeight: 900, cursor: 'pointer', border: 'none' }}>
               Rapport Exécutif
            </button>
          </div>
        </div>
      )}

      {/* Intelligence Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Experience Frame */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -15, filter: 'blur(10px)' }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {activeTab === 'executive' && <ExecutiveTab data={data} formatCurrency={formatCurrency} />}
          {activeTab === 'industrial' && <IndustrialTab data={data} />}
          {activeTab === 'financial' && <FinancialTab data={data} formatCurrency={formatCurrency} />}
          {activeTab === 'growth' && <GrowthTab data={data} formatCurrency={formatCurrency} />}
        </motion.div>
      </AnimatePresence>

      {/* Nexus AI Insights */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="nexus-card" 
        style={{ padding: '2.5rem', background: 'white', border: '2px solid var(--nexus-primary)', display: 'flex', alignItems: 'center', gap: '2.5rem' }}
      >
         <div className="nexus-glow" style={{ padding: '20px', borderRadius: '24px', background: 'var(--nexus-primary)', color: 'white' }}>
            <Sparkles size={32} />
         </div>
         <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--nexus-primary)', marginBottom: '8px' }}>
              Nexus Intelligence Insight Engine
            </div>
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--nexus-secondary)', lineHeight: 1.4 }}>
              "Analyse prédictive : La synergie entre le pôle Industriel et la vélocité Growth projette une augmentation de 15% de la marge opérationnelle d'ici le prochain trimestre."
            </p>
         </div>
      </motion.div>
    </div>
  );
};
  );
};

export default BIHub;
