import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Users, Truck, LifeBuoy, 
  Settings, Download, Share2, History,
  ShieldCheck, Briefcase, Activity
} from 'lucide-react';
import { useStore } from '../../store';

// Components
import TabBar from '../marketing/components/TabBar';
import RecordModal from '../../components/RecordModal';

// Tabs
import PeopleTab from './tabs/PeopleTab';
import FleetTab from './tabs/FleetTab';
import SupportTab from './tabs/SupportTab';

const EnterpriseHub = ({ onOpenDetail, appId }) => {
  const { data, addRecord, updateRecord, formatCurrency } = useStore();
  const [mainTab, setMainTab] = useState(
    appId === 'fleet' ? 'fleet' : 
    appId === 'helpdesk' ? 'support' : 
    'people'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = [
    { id: 'people', label: 'Collaborateurs', icon: <Users size={16} /> },
    { id: 'fleet', label: 'Parc Automobile', icon: <Truck size={16} /> },
    { id: 'support', label: 'Support Interne', icon: <LifeBuoy size={16} /> },
  ];

  const isFleetContext = appId === 'fleet';
  const isHelpdeskContext = appId === 'helpdesk';

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '1000px', background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(13, 148, 136, 0.02) 100%)' }}>
      {/* Header Operational Excellence */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#0D9488', marginBottom: '0.75rem' }}>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} style={{ background: '#0D948820', padding: '6px', borderRadius: '8px' }}>
              {isFleetContext ? <Truck size={18} /> : <ShieldCheck size={18} />}
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>
              {isFleetContext ? 'IPC Fleet Management' : isHelpdeskContext ? 'IPC Internal Support' : 'IPC People & Operation Hub'}
            </span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', color: '#0F172A' }}>
            {isFleetContext ? 'Gestion de Flotte' : isHelpdeskContext ? 'Centre de Support' : 'People & Support'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.6rem 0 0 0', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            {isFleetContext 
              ? 'Maximisez la disponibilité et la rentabilité de votre parc automobile. Suivi complet des véhicules et contrats.'
              : isHelpdeskContext
              ? 'Accélérez la résolution des incidents internes et améliorez la satisfaction de vos collaborateurs.'
              : 'Tour de contrôle des ressources et des opérations : Gérez votre capital humain, votre mobilité et votre support avec une fluidité absolue.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1.25rem', borderRadius: '3rem', border: '1px solid #0D948830' }}>
              <Activity size={16} color="#0D9488" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0D9488' }}>Statut Opérationnel : Optimal</span>
           </div>

           <button disabled title="Historique — bientôt disponible" className="glass" style={{ padding: '0.8rem', borderRadius: '1rem', color: 'var(--text-muted)', cursor: 'not-allowed', opacity: 0.5 }}>
             <History size={20} />
           </button>
          <button onClick={() => onOpenDetail && onOpenDetail(null, 'hr', 'employees')} className="btn-primary" style={{ padding: '0.8rem 1.8rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0F172A', borderColor: '#0F172A', cursor: 'pointer' }}>
            <Briefcase size={20} /> <span style={{ fontWeight: 800 }}>Recrutement Flash</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
        <TabBar tabs={tabs} active={mainTab} onChange={setMainTab} />
      </div>

      {/* Dynamic Content Frame */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mainTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'relative' }}
        >
          {mainTab === 'people' && <PeopleTab data={data} onOpenDetail={onOpenDetail} />}
          {mainTab === 'fleet' && <FleetTab data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
          {mainTab === 'support' && <SupportTab data={data} onOpenDetail={onOpenDetail} updateRecord={updateRecord} />}
        </motion.div>
      </AnimatePresence>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle Opération Enterprise"
        fields={[]} 
        onSave={(f) => {
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default EnterpriseHub;
