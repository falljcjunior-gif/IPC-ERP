import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, FileSignature, ShieldCheck, Gavel, 
  Building, BookOpen, AlertCircle, History,
  Search, Plus, Filter, Download, Lock
} from 'lucide-react';
import { useStore } from '../../store';
import TabBar from '../marketing/components/TabBar';

// Tabs
import CLMTab from './tabs/CLMTab';
import IPTab from './tabs/IPTab';
import LitigationTab from './tabs/LitigationTab';
import CorporateTab from './tabs/CorporateTab';

const LegalHub = ({ onOpenDetail }) => {
  const { data, formatCurrency, userRole, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState('clm');

  const complianceIndex = useMemo(() => {
    const contracts = data?.legal?.contracts || [];
    if (contracts.length === 0) return null;
    const signed = contracts.filter(c => c.statut === 'Signé' || c.statut === 'Actif').length;
    return Math.round((signed / contracts.length) * 100);
  }, [data?.legal?.contracts]);

  const tabs = [
    { id: 'clm', label: 'Engagements Contractuels (CLM)', icon: <FileSignature size={16} /> },
    { id: 'ip', label: 'Propriété Intellectuelle & Marques', icon: <ShieldCheck size={16} /> },
    { id: 'litiges', label: 'Contentieux & Affaires Juridiques', icon: <Gavel size={16} /> },
    { id: 'corporate', label: 'Gouvernance & Corporate', icon: <Building size={16} /> },
  ];

  // Restricted Access for Corporate Tab
  const canAccessCorporate = userRole === 'SUPER_ADMIN' || currentUser?.role === 'LEGAL_DIRECTOR';

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '1000px', background: 'linear-gradient(135deg, rgba(31, 54, 61, 0.02) 0%, rgba(82, 153, 144, 0.03) 100%)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)', marginBottom: '0.75rem' }}>
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 5 }} style={{ background: 'rgba(82, 153, 144, 0.15)', padding: '6px', borderRadius: '8px' }}>
              <Scale size={18} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>IPC Legal OS — Compliance & Strategy</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', color: 'var(--text)' }}>Direction Juridique</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.6rem 0 0 0', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            Gestion souveraine du cycle de vie des contrats, de la propriété intellectuelle et des dossiers contentieux du groupe.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1.25rem', borderRadius: '3rem', border: '1px solid rgba(82, 153, 144, 0.3)' }}>
              <ShieldCheck size={16} color="var(--accent)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)' }}>Compliance Index : {complianceIndex !== null ? `${complianceIndex}%` : '—'}</span>
           </div>

           <button disabled title="Historique des actions — bientôt disponible" className="glass" style={{ padding: '0.8rem', borderRadius: '1rem', color: 'var(--text-muted)', cursor: 'not-allowed', opacity: 0.5 }}>
             <History size={20} />
           </button>
          <button className="btn-primary" 
            onClick={() => setActiveTab('clm')}
            style={{ padding: '0.8rem 1.8rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--text)', borderColor: 'var(--text)' }}>
            <BookOpen size={20} /> <span style={{ fontWeight: 800 }}>Vue d'Ensemble</span>
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.5rem' }}>
        {[
          { label: 'Contrats Actifs', value: (data.legal?.contracts || []).length, icon: <FileSignature size={20} />, color: 'var(--accent)' },
          { label: 'Alertes Échéance', value: 0, sub: 'Prochains 30 jours', icon: <AlertCircle size={20} />, color: '#EF4444' },
          { label: 'Marques & IP', value: (data.legal?.ip || []).length, icon: <ShieldCheck size={20} />, color: '#6366F1' },
          { label: 'Provisions Risques', value: formatCurrency(0), icon: <Gavel size={20} />, color: '#F59E0B' },
        ].map((kpi, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass" 
            style={{ padding: '1.5rem', borderRadius: '1.5rem', borderLeft: `4px solid ${kpi.color}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
               <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{kpi.label}</span>
               <div style={{ color: kpi.color }}>{kpi.icon}</div>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{kpi.value}</div>
            {kpi.sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{kpi.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Dynamic Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
          transition={{ duration: 0.4 }}
          style={{ position: 'relative' }}
        >
          {activeTab === 'clm' && <CLMTab onOpenDetail={onOpenDetail} />}
          {activeTab === 'ip' && <IPTab onOpenDetail={onOpenDetail} />}
          {activeTab === 'litiges' && <LitigationTab onOpenDetail={onOpenDetail} />}
          {activeTab === 'corporate' && (
            canAccessCorporate ? <CorporateTab onOpenDetail={onOpenDetail} /> : (
              <div style={{ textAlign: 'center', padding: '5rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '2rem', border: '1px dashed #EF444450' }}>
                 <Lock size={48} color="#EF4444" style={{ marginBottom: '1rem' }} />
                 <h2 style={{ color: '#EF4444', fontWeight: 800 }}>Accès Restriction Corporate</h2>
                 <p style={{ color: 'var(--text-muted)' }}>Le sous-module Secrétariat Juridique est réservé à la Direction Générale.</p>
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LegalHub;
