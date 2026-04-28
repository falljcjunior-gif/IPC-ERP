import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Search, MoreVertical, DollarSign, User, Calendar, Phone } from 'lucide-react';
import { useStore } from '../../store';
import { crmSchema } from '../../schemas/crm.schema';
import RecordModal from '../../components/RecordModal';
import AnimatedCounter from '../../components/Dashboard/AnimatedCounter';
import '../../components/GlobalDashboard.css'; // Pour les classes luxury

const STAGES = ['Nouveau', 'Qualification', 'Proposition', 'Négociation', 'Gagné'];
const STAGE_COLORS = { 
  'Nouveau': '#64748B', 
  'Qualification': '#3B82F6', 
  'Proposition': '#8B5CF6', 
  'Négociation': '#F59E0B', 
  'Gagné': '#10B981',
  'Perdu': '#EF4444'
};

const CRMCard = ({ deal, formatCurrency, onOpenDetail }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
      className="luxury-widget"
      style={{ padding: '1.5rem', borderRadius: '1.5rem', marginBottom: '1rem', cursor: 'grab', minHeight: 'auto', background: 'rgba(255, 255, 255, 0.8)' }}
      onClick={() => onOpenDetail && onOpenDetail(deal, 'crm', 'deals')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: '0.95rem', lineHeight: 1.3 }}>{deal.titre || 'Opportunité sans nom'}</h4>
        <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><MoreVertical size={16} /></button>
      </div>

      <div style={{ fontSize: '1.25rem', fontWeight: 300, color: '#111827', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
        {formatCurrency(deal.montant || 0, true)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>
          <User size={14} /> {deal.client || 'Client Inconnu'}
        </div>
        {(deal.contactPhone || deal.contactEmail) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>
            <Phone size={14} /> {deal.contactPhone || 'Contact'}
          </div>
        )}
      </div>

      {deal.probabilite && (
        <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.03)', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${deal.probabilite}%`, height: '100%', background: STAGE_COLORS[deal.etape] || '#111827' }} />
        </div>
      )}
    </motion.div>
  );
};

const CRM = ({ onOpenDetail, accessLevel }) => {
  const { data, addRecord, updateRecord, formatCurrency } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback si "deals" n'existe pas encore dans la DB (on utilise "opportunities" ou un tableau vide)
  const deals = data.crm?.deals || data.crm?.opportunities || [];

  const filteredDeals = useMemo(() => {
    return deals.filter(d => 
      (d.titre?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (d.client?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [deals, searchQuery]);

  // Statistiques d'en-tête
  const totalPipeline = deals.filter(d => d.etape !== 'Gagné' && d.etape !== 'Perdu').reduce((sum, d) => sum + Number(d.montant || 0), 0);
  const wonThisMonth = deals.filter(d => d.etape === 'Gagné').reduce((sum, d) => sum + Number(d.montant || 0), 0);
  const winRate = deals.length > 0 ? Math.round((deals.filter(d => d.etape === 'Gagné').length / deals.length) * 100) : 0;

  // Gestion du Drag & Drop HTML5 natif
  const handleDragStart = (e, dealId) => {
    e.dataTransfer.setData('dealId', dealId);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Nécessaire pour autoriser le drop
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (dealId) {
      updateRecord('crm', 'deals', dealId, { etape: targetStage });
    }
  };

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="luxury-subtitle">Direction Commerciale</div>
          <h1 className="luxury-title">CRM & <strong>Pipeline</strong></h1>
        </div>
        
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Valeur du Pipeline</div>
            <div className="luxury-value-massive" style={{ fontSize: '3rem' }}>
              <AnimatedCounter from={0} to={totalPipeline} duration={1.5} formatter={(v) => formatCurrency(v, true)} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Taux de Conversion</div>
            <div className="luxury-value-massive" style={{ fontSize: '3rem', color: '#10B981' }}>
              <AnimatedCounter from={0} to={winRate} duration={1.5} />%
            </div>
          </div>
          
          {accessLevel === 'write' && (
            <button 
              className="luxury-widget" 
              onClick={() => setIsModalOpen(true)}
              style={{ 
                padding: '1rem 2rem', minHeight: 'auto', background: '#111827', color: 'white', 
                display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)'
              }}
            >
              <Plus size={20} />
              <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>Nouvelle Affaire</span>
            </button>
          )}
        </div>
      </div>

      {/* ── RECHERCHE ── */}
      <div style={{ marginBottom: '3rem', maxWidth: '400px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input 
          type="text" 
          placeholder="Rechercher un deal ou un client..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            width: '100%', padding: '1rem 1rem 1rem 3rem', borderRadius: '2rem', 
            border: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)', fontSize: '0.9rem', outline: 'none', fontWeight: 500
          }} 
        />
      </div>

      {/* ── KANBAN BOARD ── */}
      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, overflowX: 'auto', paddingBottom: '2rem' }}>
        {STAGES.map(stage => {
          const stageDeals = filteredDeals.filter(d => (d.etape || 'Nouveau') === stage);
          const stageTotal = stageDeals.reduce((sum, d) => sum + Number(d.montant || 0), 0);
          
          return (
            <div 
              key={stage} 
              style={{ flex: '1 0 320px', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.02)', borderRadius: '2rem', padding: '1rem' }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Kanban Column Header */}
              <div style={{ padding: '0 1rem 1.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: STAGE_COLORS[stage] }} />
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#4b5563' }}>{stage}</h3>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#9ca3af' }}>{stageDeals.length}</div>
              </div>
              
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', padding: '0 1rem 1rem 1rem', marginTop: '-0.5rem' }}>
                {formatCurrency(stageTotal, true)}
              </div>

              {/* Kanban Column Cards */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <AnimatePresence>
                  {stageDeals.map(deal => (
                    <div 
                      key={deal.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                    >
                      <CRMCard deal={deal} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />
                    </div>
                  ))}
                </AnimatePresence>
                
                {stageDeals.length === 0 && (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', opacity: 0.3 }}>
                    <Target size={32} style={{ marginBottom: '1rem' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Aucune affaire</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Créer une Opportunité"
        fields={Object.entries(crmSchema.models.deals?.fields || crmSchema.models.opportunities?.fields || {}).map(([name, f]) => ({ ...f, name }))}
        onSave={(f) => {
          // Add default stage if missing
          addRecord('crm', 'deals', { etape: 'Nouveau', ...f });
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default React.memo(CRM);
