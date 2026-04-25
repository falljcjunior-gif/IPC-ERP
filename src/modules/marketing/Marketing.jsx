import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Megaphone, Mail, CalendarDays, Users2,
  DollarSign, Download, Plus, Activity, Zap, Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useBusiness } from '../../BusinessContext';
import TabBar from './components/TabBar';
import RecordModal from '../../components/RecordModal';
import { marketingSchema } from '../../schemas/marketing.schema';

// Tabs
import DashboardTab from './tabs/DashboardTab';
import CampaignsTab from './tabs/CampaignsTab';
import EmailingTab from './tabs/EmailingTab';
import EventsTab from './tabs/EventsTab';
import LeadsEntrantsTab from './tabs/LeadsEntrantsTab';
import BudgetTab from './tabs/BudgetTab';

const Marketing = ({ onOpenDetail, navigateTo }) => {
  const { data, addRecord, formatCurrency, shellView } = useBusiness();
  const [tab, setTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('campaigns');

  const campaigns  = useMemo(() => data?.marketing?.campaigns || [], [data?.marketing?.campaigns]);
  const emailings  = useMemo(() => data?.marketing?.emailings || [], [data?.marketing?.emailings]);
  const events     = useMemo(() => data?.marketing?.events || [], [data?.marketing?.events]);
  const leads      = useMemo(() => data?.crm?.leads || [], [data?.crm?.leads]);

  const newLeadsCount = useMemo(() => leads.filter(l => !l.statut || l.statut === 'Nouveau').length, [leads]);
  const activeCampaigns = useMemo(() => campaigns.filter(c => c.statut === 'Active').length, [campaigns]);

  const openModal = (mode) => { setModalMode(mode); setIsModalOpen(true); };

  const handleSave = (fields) => {
    if (modalMode === 'campaigns')    addRecord('marketing', 'campaigns', fields);
    else if (modalMode === 'emailings') addRecord('marketing', 'emailings', fields);
    else if (modalMode === 'events')  addRecord('marketing', 'events', fields);
    else if (modalMode === 'leads')   addRecord('crm', 'leads', { ...fields, source: fields.source || 'Formulaire Web', statut: 'Nouveau' });
    setIsModalOpen(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(236, 72, 153);
    doc.rect(0, 0, W, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('RAPPORT MARKETING — I.P.C.', 15, 22);
    // ... rest of PDF logic (simplified for visibility)
    doc.save(`Rapport_Marketing_IPC_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const modalSchemas = {
    campaigns:  { title: 'Nouvelle Campagne Marketing', fields: Object.entries(marketingSchema.models.campaigns.fields).map(([n, f]) => ({ ...f, name: n })) },
    emailings:  { title: 'Nouvelle Campagne E-mailing', fields: Object.entries(marketingSchema.models.emailings.fields).map(([n, f]) => ({ ...f, name: n })) },
    events:     { title: 'Nouvel Événement Marketing', fields: Object.entries(marketingSchema.models.events.fields).map(([n, f]) => ({ ...f, name: n })) },
    leads:      { title: 'Nouveau Lead Entrant', fields: Object.entries(marketingSchema.models.leads_entrants.fields).map(([n, f]) => ({ ...f, name: n })) },
  };

  const tabs = [
    { id: 'dashboard',  label: 'Stratégie', icon: <BarChart3 size={15} /> },
    { id: 'campaigns',  label: `Campagnes${activeCampaigns > 0 ? ` (${activeCampaigns})` : ''}`, icon: <Megaphone size={15} /> },
    { id: 'emailing',   label: 'E-mailing', icon: <Mail size={15} /> },
    { id: 'events',     label: 'Événements', icon: <CalendarDays size={15} /> },
    { id: 'leads',      label: `Leads${newLeadsCount > 0 ? ` (${newLeadsCount})` : ''}`, icon: <Users2 size={15} /> },
    { id: 'budget',     label: 'Budget & ROI', icon: <DollarSign size={15} /> },
  ];

  const primaryAction = {
    dashboard: { label: 'Nouvelle Campagne', onClick: () => openModal('campaigns'), color: '#EC4899' },
    campaigns: { label: 'Nouvelle Campagne', onClick: () => openModal('campaigns'), color: '#EC4899' },
    emailing:  { label: 'Nouvel E-mailing', onClick: () => openModal('emailings'), color: '#3B82F6' },
    events:    { label: 'Nouvel Événement', onClick: () => openModal('events'), color: '#8B5CF6' },
    leads:     { label: 'Saisir un Lead', onClick: () => openModal('leads'), color: '#EF4444' },
    budget:    { label: 'Rapport PDF', onClick: handleExportPDF, color: '#10B981' },
  };
  const action = primaryAction[tab];

  return (
    <div style={{ 
      padding: shellView?.mobile ? '1rem' : '2.5rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: shellView?.mobile ? '1.5rem' : '3rem', 
      minHeight: '100%',
      backgroundImage: 'radial-gradient(circle at 0% 100%, rgba(236, 72, 153, 0.05) 0%, transparent 50%)'
    }}>
      
      {/* --- NEXT GEN MARKETING HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EC4899', marginBottom: '0.75rem' }}>
            <motion.div 
              animate={{ 
                rotate: [0, 5, -5, 0],
                boxShadow: ['0 0 0px rgba(236, 72, 153, 0)', '0 0 20px rgba(236, 72, 153, 0.3)', '0 0 0px rgba(236, 72, 153, 0)']
              }} 
              transition={{ repeat: Infinity, duration: 4 }} 
              style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '8px', borderRadius: '12px', border: '1px solid rgba(236, 72, 153, 0.2)' }}
            >
              <Megaphone size={20} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '3px' }}>
              IPC Growth Engine
            </span>
          </div>
          <h1 style={{ fontSize: shellView?.mobile ? '2.5rem' : '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>
            Marketing Suite
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, maxWidth: '750px', lineHeight: 1.6 }}>
            Accélérez votre croissance et optimisez votre visibilité avec des outils de gestion de campagnes et d'acquisition de pointe.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {activeCampaigns > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.85rem 1.5rem', borderRadius: '1.25rem', border: '1px solid #EC489940', background: 'rgba(236, 72, 153, 0.05)' }}>
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ width: 10, height: 10, borderRadius: '50%', background: '#EC4899', boxShadow: '0 0 10px #EC4899' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#EC4899' }}>
                {activeCampaigns} Campagne{activeCampaigns > 1 ? 's' : ''} en Cours
              </span>
            </motion.div>
          )}
          
          <button onClick={handleExportPDF} className="btn-glass" style={{ width: '48px', height: '48px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Download size={20} />
          </button>
          
          <button onClick={action.onClick} className="btn-primary"
            style={{ padding: '0.85rem 2rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: action.color }}>
            <Plus size={20} /> <span style={{ fontWeight: 800 }}>{action.label}</span>
          </button>
        </div>
      </div>

      {/* --- PREMIUM TAB NAVIGATION --- */}
      <div style={{ display: 'flex', justifyContent: shellView?.mobile ? 'flex-start' : 'center', alignItems: 'center', overflowX: 'auto' }}>
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {/* --- CONTENT FRAME --- */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'relative' }}
        >
          {tab === 'dashboard' && <DashboardTab data={data} formatCurrency={formatCurrency} onNavigate={setTab} />}
          {tab === 'campaigns' && <CampaignsTab campaigns={campaigns} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} onNew={() => openModal('campaigns')} />}
          {tab === 'emailing' && <EmailingTab emailings={emailings} formatCurrency={formatCurrency} onNew={() => openModal('emailings')} onOpenDetail={onOpenDetail} />}
          {tab === 'events' && <EventsTab events={events} onNew={() => openModal('events')} onOpenDetail={onOpenDetail} />}
          {tab === 'leads' && <LeadsEntrantsTab leads={leads} onNew={() => openModal('leads')} onOpenDetail={onOpenDetail} navigateToCrm={() => navigateTo && navigateTo('crm')} />}
          {tab === 'budget' && <BudgetTab campaigns={campaigns} emailings={emailings} events={events} formatCurrency={formatCurrency} />}
        </motion.div>
      </AnimatePresence>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalSchemas[modalMode]?.title}
        fields={modalSchemas[modalMode]?.fields || []}
        onSave={handleSave}
      />
    </div>
  );
};

export default Marketing;
