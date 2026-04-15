import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, BarChart3, MessageSquare, CalendarIcon, Megaphone, Download
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useBusiness } from '../../BusinessContext';
import TabBar from './components/TabBar';
import RecordModal from '../../components/RecordModal';
import { marketingSchema } from '../../schemas/marketing.schema';

// Tabs
import CampaignesTab from './tabs/CampaignesTab';
import PostsTab from './tabs/PostsTab';
import MessagesTab from './tabs/MessagesTab';
import StatsTab from './tabs/StatsTab';

const Marketing = () => {
  const { data, addRecord, formatCurrency } = useBusiness();
  const [tab, setTab] = useState('stats');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('posts');

  const campaigns = useMemo(() => data?.marketing?.campaigns || [], [data?.marketing?.campaigns]);
  const posts = useMemo(() => data?.marketing?.posts || [], [data?.marketing?.posts]);
  const messages = useMemo(() => data?.marketing?.messages || [], [data?.marketing?.messages]);
  const leads = useMemo(() => data?.crm?.leads || [], [data?.crm?.leads]);

  const newMsgCount = messages.filter(m => m.statut === 'Nouveau').length;

  const handleExportPDF = () => {
    const docPdf = new jsPDF();
    const W = docPdf.internal.pageSize.getWidth();
    docPdf.setFillColor(15, 23, 42);
    docPdf.rect(0, 0, W, 38, 'F');
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont('helvetica', 'bold');
    docPdf.setFontSize(20);
    docPdf.text('RAPPORT MARKETING — IPC', 15, 24);
    docPdf.setFontSize(9);
    docPdf.text(new Date().toLocaleDateString('fr-FR'), 15, 33);

    autoTable(docPdf, {
      startY: 48,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Campagnes actives', campaigns.filter(c => c.statut === 'Active').length],
        ['Budget total engagé', `${campaigns.reduce((s,c) => s+(c.budget||0),0).toLocaleString()} FCFA`],
        ['Posts publiés', posts.filter(p => p.statut === 'Publié').length],
        ['Posts programmés', posts.filter(p => p.statut === 'Programmé').length],
        ['Messages entrants', messages.length],
        ['Leads CRM générés', leads.length],
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });
    docPdf.save(`Rapport_Marketing_${new Date().toLocaleDateString('fr-FR')}.pdf`);
  };

  const tabs = [
    { id: 'stats', label: 'Vue d\'ensemble', icon: <BarChart3 size={15} /> },
    { id: 'campaigns', label: 'Campagnes', icon: <Megaphone size={15} /> },
    { id: 'posts', label: 'Calendrier Posts', icon: <CalendarIcon size={15} /> },
    { id: 'messages', label: `Messages${newMsgCount > 0 ? ` (${newMsgCount})` : ''}`, icon: <MessageSquare size={15} /> },
  ];

  const modalConfig = {
    posts: { title: 'Programmer un Post', schema: marketingSchema.models.posts },
    campaigns: { title: 'Nouvelle Campagne', schema: marketingSchema.models.campaigns }
  };

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#EC4899', marginBottom: '0.5rem' }}>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
              style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EC4899' }} />
            <span style={{ fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Marketing IPC</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>Command Centre</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.4rem 0 0 0', fontSize: '0.9rem' }}>
            Gérez vos campagnes, posts et messages depuis un seul endroit.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleExportPDF} className="glass"
            style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem' }}>
            <Download size={16} /> Rapport PDF
          </button>
          <button onClick={() => { setModalMode('campaigns'); setIsModalOpen(true); }} className="glass"
            style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem', color: '#EC4899' }}>
            <Plus size={16} /> Campagne
          </button>
          <button onClick={() => { setModalMode('posts'); setIsModalOpen(true); }} className="btn-primary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800 }}>
            <Plus size={18} /> Nouveau Post
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
          {tab === 'stats'     && <StatsTab campaigns={campaigns} posts={posts} messages={messages} leads={leads} formatCurrency={formatCurrency} />}
          {tab === 'campaigns' && <CampaignesTab campaigns={campaigns} formatCurrency={formatCurrency} addRecord={addRecord} />}
          {tab === 'posts'     && <PostsTab posts={posts} setModalMode={setModalMode} setIsModalOpen={setIsModalOpen} />}
          {tab === 'messages'  && <MessagesTab messages={messages} addRecord={addRecord} />}
        </motion.div>
      </AnimatePresence>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalConfig[modalMode]?.title}
        fields={Object.entries(modalConfig[modalMode]?.schema?.fields || {}).map(([name, f]) => ({ ...f, name }))}
        onSave={(f) => { addRecord('marketing', modalMode === 'posts' ? 'posts' : 'campaigns', f); setIsModalOpen(false); }}
      />
    </div>
  );
};

export default Marketing;
