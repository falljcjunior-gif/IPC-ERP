import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, Megaphone, Mail, CalendarDays, Users2,
  DollarSign, Download, Plus, Activity, Zap
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useBusiness } from '../../BusinessContext';
import TabBar from './components/TabBar';
import RecordModal from '../../components/RecordModal';
import { marketingSchema } from '../../schemas/marketing.schema';

// Tabs — Axelor-inspired Marketing Suite
import DashboardTab from './tabs/DashboardTab';
import CampaignsTab from './tabs/CampaignsTab';
import EmailingTab from './tabs/EmailingTab';
import EventsTab from './tabs/EventsTab';
import LeadsEntrantsTab from './tabs/LeadsEntrantsTab';
import BudgetTab from './tabs/BudgetTab';

const Marketing = ({ onOpenDetail, navigateTo }) => {
  const { data, addRecord, formatCurrency } = useBusiness();
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
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString('fr-FR'), 15, 32);
    const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);
    const totalDepense = campaigns.reduce((s, c) => s + (c.depense || 0), 0);
    const totalLeads = campaigns.reduce((s, c) => s + (c.conversions || 0), 0) + leads.length;
    const roi = totalDepense > 0 ? ((totalLeads * 250000 / totalDepense) * 100).toFixed(0) : 0;
    autoTable(doc, {
      startY: 48,
      head: [['KPI', 'Valeur']],
      body: [
        ['Campagnes Actives', activeCampaigns],
        ['Budget Total Alloué', `${totalBudget.toLocaleString()} FCFA`],
        ['Total Dépensé', `${totalDepense.toLocaleString()} FCFA`],
        ['ROI Global', `${roi}%`],
        ['Leads Générés', totalLeads],
        ['Événements planifiés', events.filter(e => ['Planifié','Confirmé'].includes(e.statut)).length],
        ['Campagnes E-mail envoyées', emailings.filter(e => e.statut === 'Envoyé').length],
      ],
      theme: 'grid',
      headStyles: { fillColor: [236, 72, 153] }
    });
    if (campaigns.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Campagne', 'Type', 'Canal', 'Budget', 'Dépense', 'Leads', 'Statut']],
        body: campaigns.map(c => [c.nom, c.type, c.canal, `${(c.budget||0).toLocaleString()} F`, `${(c.depense||0).toLocaleString()} F`, c.conversions || 0, c.statut]),
        theme: 'striped',
        headStyles: { fillColor: [139, 92, 246] }
      });
    }
    doc.save(`Rapport_Marketing_IPC_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const modalSchemas = {
    campaigns:  { title: 'Nouvelle Campagne Marketing', fields: Object.entries(marketingSchema.models.campaigns.fields).map(([n, f]) => ({ ...f, name: n })) },
    emailings:  { title: 'Nouvelle Campagne E-mailing', fields: Object.entries(marketingSchema.models.emailings.fields).map(([n, f]) => ({ ...f, name: n })) },
    events:     { title: 'Nouvel Événement Marketing', fields: Object.entries(marketingSchema.models.events.fields).map(([n, f]) => ({ ...f, name: n })) },
    leads:      { title: 'Nouveau Lead Entrant', fields: Object.entries(marketingSchema.models.leads_entrants.fields).map(([n, f]) => ({ ...f, name: n })) },
  };

  const tabs = [
    { id: 'dashboard',  label: 'Tableau de Bord', icon: <BarChart3 size={15} /> },
    { id: 'campaigns',  label: `Campagnes${activeCampaigns > 0 ? ` (${activeCampaigns})` : ''}`, icon: <Megaphone size={15} /> },
    { id: 'emailing',   label: 'E-mailing', icon: <Mail size={15} /> },
    { id: 'events',     label: 'Événements', icon: <CalendarDays size={15} /> },
    { id: 'leads',      label: `Leads${newLeadsCount > 0 ? ` (${newLeadsCount})` : ''}`, icon: <Users2 size={15} /> },
    { id: 'budget',     label: 'Budget & ROI', icon: <DollarSign size={15} /> },
  ];

  // Smart action button per tab
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
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#EC4899', marginBottom: '0.6rem' }}>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
              style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EC4899' }} />
            <span style={{ fontWeight: 900, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
              IPC Marketing OS — Axelor Edition
            </span>
          </div>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', background: 'linear-gradient(135deg, #EC4899, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Marketing Suite
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 0 0', fontSize: '0.9rem', maxWidth: 600, lineHeight: 1.5 }}>
            Gérez vos campagnes, e-mailings, événements et leads depuis un centre de commandement unique. Suivez votre ROI en temps réel.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Live indicator */}
          {activeCampaigns > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem 1.25rem', borderRadius: '3rem', border: '1px solid #EC489930' }}>
              <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#EC4899' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EC4899' }}>
                {activeCampaigns} Campagne{activeCampaigns > 1 ? 's' : ''} Active{activeCampaigns > 1 ? 's' : ''}
              </span>
            </motion.div>
          )}
          <button onClick={handleExportPDF} className="glass"
            style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem' }}>
            <Download size={16} /> Rapport PDF
          </button>
          <button onClick={action.onClick}
            style={{ padding: '0.75rem 1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900, fontSize: '0.9rem',
              background: action.color, color: 'white', border: 'none', cursor: 'pointer', boxShadow: `0 4px 24px ${action.color}40` }}>
            <Plus size={18} /> {action.label}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}>
          {tab === 'dashboard' && (
            <DashboardTab data={data} formatCurrency={formatCurrency}
              onNavigate={setTab} />
          )}
          {tab === 'campaigns' && (
            <CampaignsTab campaigns={campaigns} formatCurrency={formatCurrency}
              onOpenDetail={onOpenDetail}
              onNew={() => openModal('campaigns')} />
          )}
          {tab === 'emailing' && (
            <EmailingTab emailings={emailings} formatCurrency={formatCurrency}
              onNew={() => openModal('emailings')}
              onOpenDetail={onOpenDetail} />
          )}
          {tab === 'events' && (
            <EventsTab events={events}
              onNew={() => openModal('events')}
              onOpenDetail={onOpenDetail} />
          )}
          {tab === 'leads' && (
            <LeadsEntrantsTab leads={leads}
              onNew={() => openModal('leads')}
              onOpenDetail={onOpenDetail}
              navigateToCrm={() => navigateTo && navigateTo('crm')} />
          )}
          {tab === 'budget' && (
            <BudgetTab campaigns={campaigns} emailings={emailings} events={events}
              formatCurrency={formatCurrency} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Record Modal */}
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
