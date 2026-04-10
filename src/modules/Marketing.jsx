import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Megaphone, 
  BarChart3, 
  Plus, 
  Search, 
  Share2, 
  Eye, 
  MousePointer2, 
  TrendingUp,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';

const Marketing = ({ onOpenDetail }) => {
  const { data, addRecord } = useBusiness();
  const [view, setView] = useState('campaigns'); // 'campaigns' or 'analytics'
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Safeguard: Ensure marketing and campaigns exist
  const campaigns = data?.marketing?.campaigns || [];

  const handleSave = (formData) => {
    addRecord('marketing', 'campaigns', formData);
  };

  const modalFields = [
    { name: 'nom', label: 'Nom de la Campagne', required: true, placeholder: 'Ex: Lancement Été 2026' },
    { name: 'type', label: 'Type de Campagne', type: 'select', options: ['E-mailing', 'Social Ads', 'Webinaire', 'SEO', 'Événement'], required: true },
    { name: 'budget', label: 'Budget Alloué (FCFA)', type: 'number', required: true },
    { name: 'statut', label: 'Statut', type: 'select', options: ['Planifié', 'En cours', 'Terminé', 'En pause'], required: true },
    { name: 'vues', label: 'Objectif Vues', type: 'number', placeholder: 'Ex: 10000' },
  ];

  const renderAnalytics = () => {
    const totalVues = campaigns.reduce((sum, c) => sum + (c.vues || 0), 0);
    const totalClics = campaigns.reduce((sum, c) => sum + (c.clics || 0), 0);
    const avgRoi = campaigns.length > 0 ? (campaigns.reduce((sum, c) => sum + (c.roi || 0), 0) / campaigns.length).toFixed(1) : 0;
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="analytics-container"
      >
        <div className="grid grid-3" style={{ marginBottom: '2.5rem' }}>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Taux de Clic Moyen</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)' }}>
              {totalVues > 0 ? ((totalClics / totalVues) * 100).toFixed(2) : 0}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.5rem', fontWeight: 600 }}>↑ 2.4% vs mois dernier</div>
          </div>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>ROI Global</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{avgRoi}x</div>
            <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '0.5rem', fontWeight: 600 }}>Cible: 4.5x</div>
          </div>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Budget Consommé</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F43F5E' }}>{totalBudget.toLocaleString()} FCFA</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>85% du budget trimestriel</div>
          </div>
        </div>

        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <BarChart3 size={20} color="var(--accent)" /> Répartition par Canal
          </h3>
          <div style={{ spaceY: '1rem' }}>
            {['E-mailing', 'Social Ads', 'Webinaire', 'SEO'].map(canal => {
              const canalCampaigns = campaigns.filter(c => c.type === canal);
              const canalVues = canalCampaigns.reduce((sum, c) => sum + (c.vues || 0), 0);
              const percentage = totalVues > 0 ? (canalVues / totalVues) * 100 : 0;
              
              return (
                <div key={canal} style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{canal}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{canalVues.toLocaleString()} vues ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      style={{ height: '100%', background: 'var(--accent)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderCampaigns = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
      {campaigns.map((camp) => (
        <motion.div
           key={camp.id}
           whileHover={{ y: -5 }}
           onClick={() => onOpenDetail(camp, 'marketing', 'campaigns')}
           className="glass"
           style={{ padding: '2rem', borderRadius: '1.5rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
             <div style={{ background: 'var(--accent)10', color: 'var(--accent)', padding: '0.75rem', borderRadius: '1rem' }}>
                <Megaphone size={24} />
             </div>
             <MoreVertical size={18} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{camp.nom}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{camp.type}</p>
          
          <div className="grid grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
             <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Eye size={12} /> Vues</div>
                <div style={{ fontWeight: 700 }}>{(camp.vues || 0).toLocaleString()}</div>
             </div>
             <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MousePointer2 size={12} /> Clics</div>
                <div style={{ fontWeight: 700 }}>{(camp.clics || 0).toLocaleString()}</div>
             </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
             <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>ROI: {camp.roi || 0}x</div>
             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{camp.statut}</span>
          </div>
        </motion.div>
      ))}
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={() => setIsModalOpen(true)}
        className="glass"
        style={{ padding: '2rem', borderRadius: '1.5rem', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', cursor: 'pointer', color: 'var(--text-muted)' }}
      >
        <Plus size={32} />
        <span>Nouvelle Campagne</span>
      </motion.div>
    </div>
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Marketing & Buzz</h1>
          <p style={{ color: 'var(--text-muted)' }}>Analysez vos performances et boostez votre visibilité.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Nouvelle Campagne
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '2.5rem' }}>
        {['campaigns', 'analytics'].map(t => (
          <div 
            key={t}
            onClick={() => setView(t)}
            style={{ 
              padding: '0.75rem 0', 
              cursor: 'pointer', 
              fontWeight: 600,
              color: view === t ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: view === t ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'var(--transition)',
              textTransform: 'capitalize'
            }}
          >
            {t === 'campaigns' ? 'Campagnes' : 'Analytiques'}
          </div>
        ))}
      </div>

      {view === 'campaigns' ? renderCampaigns() : renderAnalytics()}

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title="Paramètres de Campagne"
        fields={modalFields}
      />
    </div>
  );
};

export default Marketing;
