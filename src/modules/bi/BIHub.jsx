import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Activity, Zap, Star, 
  Target, Globe, ShieldCheck, Download, 
  Calendar, Settings, Share2, Sparkles, TrendingUp
} from 'lucide-react';
import { useBusiness } from '../../BusinessContext';

// Components
import TabBar from '../marketing/components/TabBar';
import ExecutiveTab from './tabs/ExecutiveTab';
import IndustrialTab from './tabs/IndustrialTab';
import FinancialTab from './tabs/FinancialTab';
import GrowthTab from './tabs/GrowthTab';

const BIHub = () => {
  const { data, formatCurrency } = useBusiness();
  const [activeTab, setActiveTab] = useState('executive');

  const tabs = [
    { id: 'executive', label: 'Vue Exécutive', icon: <Star size={16} /> },
    { id: 'industrial', label: 'Indus & Ops', icon: <Activity size={16} /> },
    { id: 'financial', label: 'Finance & Audit', icon: <TrendingUp size={16} /> },
    { id: 'growth', label: 'Growth Velocity', icon: <Zap size={16} /> },
  ];

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '1000px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%)' }}>
      
      {/* Executive Header : The Boardroom Cockpit */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6366F1', marginBottom: '1rem' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} style={{ background: '#6366F120', padding: '8px', borderRadius: '10px' }}>
              <Globe size={20} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>IPC STRATEGIC OS</span>
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px', color: '#0F172A', lineHeight: 1 }}>Decision Core</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            Intelligence centralisée : Visualisez la santé de vos opérations, vos flux financiers et votre vitesse de croissance en un cockpit unifié.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1.5rem', borderRadius: '3rem', border: '1px solid #6366F130' }}>
              <ShieldCheck size={16} color="#6366F1" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366F1' }}>Données Consolidées : 100% OK</span>
           </div>
           
           <button className="glass" style={{ padding: '0.9rem', borderRadius: '1.25rem', color: 'var(--text-muted)' }}>
              <Calendar size={22} />
           </button>
           <button className="btn-primary" style={{ padding: '0.9rem 2rem', borderRadius: '1.5rem', background: '#0F172A', borderColor: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Download size={20} /> <span style={{ fontWeight: 800 }}>Rapport Exécutif</span>
           </button>
        </div>
      </div>

      {/* Intelligence Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Analytics Experience Frame */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -15, filter: 'blur(10px)' }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'relative' }}
        >
          {activeTab === 'executive' && <ExecutiveTab data={data} formatCurrency={formatCurrency} />}
          {activeTab === 'industrial' && <IndustrialTab data={data} />}
          {activeTab === 'financial' && <FinancialTab data={data} formatCurrency={formatCurrency} />}
          {activeTab === 'growth' && <GrowthTab data={data} formatCurrency={formatCurrency} />}
        </motion.div>
      </AnimatePresence>

      {/* IA Strategic Insight Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} style={{ marginTop: '2rem', padding: '2rem', borderRadius: '2.5rem', background: '#0F172A', color: 'white', display: 'flex', alignItems: 'center', gap: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
         <div style={{ padding: '15px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.2)', color: '#6366F1' }}>
            <Sparkles size={32} />
         </div>
         <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: '#6366F1', marginBottom: '8px' }}>IPC Intelligence Insight</h4>
            <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500, lineHeight: 1.4, opacity: 0.9 }}>
               "Analyse en cours : La vitesse de croissance du pôle **Growth** (+12%) compense largement la légère baisse de l'OTIF industriel ce mois-ci. La trésorerie reste saine avec un runway projeté de 18 mois."
            </p>
         </div>
      </motion.div>
    </div>
  );
};

export default BIHub;
