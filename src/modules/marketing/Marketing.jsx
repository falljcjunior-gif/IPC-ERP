import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Settings, Share2, BarChart2, Activity,
  BarChart3, MessageSquare, Zap, Target, Link as LinkIcon, 
  Calendar as CalendarIcon, ShieldCheck, Globe, Download
} from 'lucide-react';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useBusiness } from '../../BusinessContext';
import { marketingSchema } from '../../schemas/marketing.schema';

// Components
import TabBar from './components/TabBar';
import RecordModal from '../../components/RecordModal';

// Tabs
import AnalyticsTab from './tabs/AnalyticsTab';
import InboxTab from './tabs/InboxTab';
import PlanningTab from './tabs/PlanningTab';
import StrategyTab from './tabs/StrategyTab';
import ConnectTab from './tabs/ConnectTab';

const Marketing = () => {
  const { data, addRecord, formatCurrency, userRole } = useBusiness();
  const [mainTab, setMainTab] = useState('analytics');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('posts');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState({ facebook: { clientId: '', clientSecret: '' } });
  const [subNetwork, setSubNetwork] = useState('all');

  useEffect(() => {
    const fetchKeys = async () => {
      const snap = await getDoc(doc(db, 'system_config', 'marketing_apis'));
      if (snap.exists()) setApiKeys(snap.data());
    };
    fetchKeys();
  }, []);

  // Data Selectors
  const campaigns = useMemo(() => data?.marketing?.campaigns || [], [data?.marketing?.campaigns]);
  const posts = useMemo(() => data?.marketing?.posts || [], [data?.marketing?.posts]);
  const leads = useMemo(() => data?.crm?.leads || [], [data?.crm?.leads]);
  const accounts = useMemo(() => data?.marketing?.accounts || [
    { id: '1', nom: 'IPC Facebook', reseau: 'Facebook', statut: 'Connecté' },
    { id: '2', nom: 'IPC Instagram', reseau: 'Instagram', statut: 'Connecté' },
    { id: '3', nom: 'IPC LinkedIn', reseau: 'LinkedIn', statut: 'Déconnecté' },
    { id: '4', nom: 'IPC TikTok', reseau: 'TikTok', statut: 'Connecté' }
  ], [data?.marketing?.accounts]);

  const opportunities = useMemo(() => data?.crm?.opportunities || [], [data?.crm?.opportunities]);
  const messages = useMemo(() => data?.marketing?.messages || [
    { id: 'm1', sender: 'Moussa Diakité', source: 'WhatsApp', content: 'Bonjour, je souhaite un devis pour 50 blocs.', status: 'Nouveau', time: '10:15' },
    { id: 'm2', sender: 'Sarah Kone', source: 'Facebook', content: 'Quels sont vos tarifs pour la livraison à Yamoussoukro ?', status: 'Répondu', time: '09:30' },
    { id: 'm3', sender: 'BTP Int.', source: 'LinkedIn', content: 'Nous serions intéressés par un partenariat long terme.', status: 'Nouveau', time: 'Aujourd\'hui' }
  ], [data?.marketing?.messages]);

  /* ─── AI Strategic Computations ─── */
  const predictionData = useMemo(() => {
    const totalSpent = campaigns.reduce((s, c) => s + (Number(c.budget) || 0), 0);
    const wonDeals = opportunities.filter(o => o.etape === 'Gagné');
    const totalWon = wonDeals.reduce((s, o) => s + (Number(o.montant) || 0), 0);
    const avgOrderValue = wonDeals.length > 0 ? totalWon / wonDeals.length : 1500000;
    const conversionRate = leads.length > 0 ? (wonDeals.length / leads.length) : 0.05;
    const predictedNewLeads = 150;
    const predictedRevenue = Math.round(predictedNewLeads * conversionRate * avgOrderValue);
    return { predictedRevenue, totalWon, totalSpent, avgOrderValue, confidence: 92 };
  }, [campaigns, leads, opportunities]);

  const handleExportPDF = () => {
    const docPdf = new jsPDF();
    const pageWidth = docPdf.internal.pageSize.getWidth();
    docPdf.setFillColor(15, 23, 42); // Navy Dark
    docPdf.rect(0, 0, pageWidth, 40, 'F');
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(22);
    docPdf.text("RAPPORT DE CROISSANCE - IPC", 15, 25);
    docPdf.setFontSize(10);
    docPdf.text("Intelligence Artificielle IPC Business OS — " + new Date().toLocaleDateString(), 15, 33);
    
    docPdf.autoTable({
      startY: 50,
      head: [['MÉTRIQUE CLÉ', 'VALEUR ACTUELLE', 'INDICE IA']],
      body: [
        ['Budget Marketing Engagé', formatCurrency(predictionData.totalSpent, true), 'Stable'],
        ['Ventes Réelles Attribuées', formatCurrency(predictionData.totalWon, true), 'ROI 1.2x'],
        ['Prédiction CA (J+30)', formatCurrency(predictionData.predictedRevenue, true), 'Réaliste'],
        ['Coût par Lead Moyen', '12,500 FCFA', 'En baisse'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });
    docPdf.save(`IPC_Growth_Report_${new Date().toLocaleDateString()}.pdf`);
  };

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
    { id: 'inbox', label: 'Inbox CRM', icon: <MessageSquare size={16} /> },
    { id: 'planning', label: 'Calendrier', icon: <CalendarIcon size={16} /> },
    { id: 'strategy', label: 'Stratégie & IA', icon: <Zap size={16} /> },
    { id: 'connect', label: 'Connexions', icon: <LinkIcon size={16} /> },
  ];

  const modalConfig = {
    posts: { title: 'Programmer un Post Social', schema: marketingSchema.models.posts },
    campaigns: { title: 'Nouvelle Campagne Ads', schema: marketingSchema.models.campaigns }
  };

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '1000px', background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(59, 130, 246, 0.02) 100%)' }}>
      {/* Header Premium Experience */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#EC4899', marginBottom: '0.75rem' }}>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ background: '#EC489920', padding: '6px', borderRadius: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EC4899' }} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>IPC Growth Hub</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', color: 'var(--text)' }}>Command Centre</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.6rem 0 0 0', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            Votre infrastructure unifiée pour piloter la croissance, engager vos communautés et dominer vos marchés sur tous les réseaux.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           {/* Live Social Bridge Badge */}
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1.25rem', borderRadius: '3rem', border: '1px solid #10B98130' }}>
              <Globe size={16} color="#10B981" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981' }}>IPC Bridge: Actif</span>
           </div>

           {userRole === 'SUPER_ADMIN' && (
             <motion.button whileHover={{ rotate: 90 }} onClick={() => setIsConfigOpen(true)} className="glass" style={{ padding: '0.8rem', borderRadius: '1rem', color: 'var(--text-muted)' }}>
               <Settings size={20} />
             </motion.button>
           )}
          <button className="btn-primary" onClick={() => { setModalMode('posts'); setIsModalOpen(true); }} style={{ padding: '0.8rem 1.8rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Plus size={20} /> <span style={{ fontWeight: 800 }}>Nouvelle Action</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
        <TabBar tabs={tabs} active={mainTab} onChange={setMainTab} />
        <div style={{ height: '30px', width: '1px', background: 'var(--border)' }} />
        <button onClick={handleExportPDF} className="glass" style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '0.85rem' }}>
          <Download size={18} /> Rapport IA
        </button>
      </div>

      {/* Dynamic Content Frame */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mainTab}
          initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'relative' }}
        >
          {mainTab === 'analytics' && <AnalyticsTab subNetwork={subNetwork} setSubNetwork={setSubNetwork} />}
          {mainTab === 'inbox' && <InboxTab messages={messages} />}
          {mainTab === 'strategy' && <StrategyTab predictionData={predictionData} formatCurrency={formatCurrency} />}
          {mainTab === 'planning' && <PlanningTab posts={posts} setModalMode={setModalMode} setIsModalOpen={setIsModalOpen} />}
          {mainTab === 'ads' && <AdsTab campaigns={campaigns} formatCurrency={formatCurrency} />}
          {mainTab === 'connect' && <ConnectTab accounts={accounts} apiKeys={apiKeys} />}
        </motion.div>
      </AnimatePresence>

      {/* Advanced API Config Modal */}
      <AnimatePresence>
        {isConfigOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="glass" style={{ width: '500px', padding: '3rem', borderRadius: '2.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--accent)', color: 'white', padding: '12px', borderRadius: '1rem' }}><ShieldCheck size={24} /></div>
                <div>
                  <h2 style={{ fontWeight: 900, margin: 0, fontSize: '1.5rem', color: 'white' }}>Configuration Sécurisée</h2>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0 0' }}>Gestion des accès natifs Meta & Google.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>Meta App ID (Facebook)</label>
                  <input className="glass" style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white' }} value={apiKeys.facebook?.clientId} onChange={e => setApiKeys(p => ({ ...p, facebook: { ...p.facebook, clientId: e.target.value } }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px' }}>Meta App Secret</label>
                  <input type="password" className="glass" style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'white' }} value={apiKeys.facebook?.clientSecret} onChange={e => setApiKeys(p => ({ ...p, facebook: { ...p.facebook, clientSecret: e.target.value } }))} />
                </div>
                
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                  <button onClick={() => setIsConfigOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '1.25rem' }}>Annuler</button>
                  <button onClick={async () => {
                    await setDoc(doc(db, 'system_config', 'marketing_apis'), apiKeys);
                    setIsConfigOpen(false);
                    alert("🔑 Cluster de sécurité mis à jour !");
                  }} className="btn-primary" style={{ flex: 1, padding: '1rem', borderRadius: '1.25rem' }}>Confirmer</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalConfig[modalMode]?.title}
        fields={Object.entries(modalConfig[modalMode]?.schema?.fields || {}).map(([name, f]) => ({ ...f, name }))}
        onSave={(f) => {
          addRecord('marketing', modalMode, f);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Marketing;
