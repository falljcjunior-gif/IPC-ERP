import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Search, MoreVertical, CreditCard, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useStore } from '../../store';
import { salesSchema } from '../../schemas/sales.schema';
import RecordModal from '../../components/RecordModal';
import AnimatedCounter from '../../components/Dashboard/AnimatedCounter';
import '../../components/GlobalDashboard.css';

const SalesItem = ({ item, type, formatCurrency, onOpenDetail }) => {
  // Determine status color and icon
  const getStatusDisplay = () => {
    if (type === 'invoices') {
      switch (item.statut) {
        case 'Payé': return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircle size={14} /> };
        case 'En attente': return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', icon: <Clock size={14} /> };
        case 'En retard': return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <AlertCircle size={14} /> };
        default: return { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)', icon: <FileText size={14} /> };
      }
    } else { // quotes
      switch (item.statut) {
        case 'Accepté': return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', icon: <CheckCircle size={14} /> };
        case 'Envoyé': return { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', icon: <TrendingUp size={14} /> };
        case 'Refusé': return { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', icon: <AlertCircle size={14} /> };
        default: return { color: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)', icon: <FileText size={14} /> };
      }
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ scale: 1.01, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
      className="luxury-widget"
      style={{ 
        padding: '1.5rem 2rem', 
        borderRadius: '1.5rem', 
        marginBottom: '1rem', 
        cursor: 'pointer', 
        minHeight: 'auto', 
        background: 'rgba(255, 255, 255, 0.8)',
        display: 'grid',
        gridTemplateColumns: '2fr 1.5fr 1fr 1fr 50px',
        alignItems: 'center',
        gap: '2rem'
      }}
      onClick={() => onOpenDetail && onOpenDetail(item, 'sales', type)}
    >
      {/* Client & ID */}
      <div>
        <div style={{ fontWeight: 700, color: '#111827', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{item.client || 'Client Inconnu'}</div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em' }}>
          #{item.id?.substring(0, 8).toUpperCase() || 'REF-0000'}
        </div>
      </div>

      {/* Date */}
      <div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
          {type === 'invoices' ? 'Date d\'Échéance' : 'Valable jusqu\'au'}
        </div>
        <div style={{ fontWeight: 500, color: '#4b5563', fontSize: '0.9rem' }}>
          {item.dateEcheance ? new Date(item.dateEcheance).toLocaleDateString() : (item.date ? new Date(item.date).toLocaleDateString() : 'Non définie')}
        </div>
      </div>

      {/* Amount */}
      <div>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Montant TTC</div>
        <div style={{ fontWeight: 800, color: '#111827', fontSize: '1.1rem' }}>
          {formatCurrency(item.montant || 0, true)}
        </div>
      </div>

      {/* Status */}
      <div>
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem', 
          padding: '0.4rem 0.8rem', borderRadius: '1rem', 
          background: statusDisplay.bg, color: statusDisplay.color,
          fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          {statusDisplay.icon}
          {item.statut || 'Brouillon'}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '0.5rem' }}>
          <MoreVertical size={20} />
        </button>
      </div>
    </motion.div>
  );
};

const Sales = ({ onOpenDetail, accessLevel }) => {
  const { data, addRecord, formatCurrency } = useStore();
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'quotes'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const invoices = data.sales?.invoices || [];
  const quotes = data.sales?.quotes || data.sales?.orders || []; // Fallback orders

  const currentList = activeTab === 'invoices' ? invoices : quotes;

  const filteredList = useMemo(() => {
    return currentList.filter(item => 
      (item.client?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (item.id?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [currentList, searchQuery]);

  // Statistiques
  const totalInvoiced = invoices.filter(i => i.statut !== 'Annulé').reduce((sum, i) => sum + Number(i.montant || 0), 0);
  const totalCollected = invoices.filter(i => i.statut === 'Payé').reduce((sum, i) => sum + Number(i.montant || 0), 0);
  const pendingQuotes = quotes.filter(q => q.statut === 'Envoyé').reduce((sum, q) => sum + Number(q.montant || 0), 0);

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="luxury-subtitle">Administration des Ventes</div>
          <h1 className="luxury-title">Facturation & <strong>Devis</strong></h1>
        </div>
        
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Chiffre d'Affaires</div>
            <div className="luxury-value-massive" style={{ fontSize: '3rem' }}>
              <AnimatedCounter from={0} to={totalInvoiced} duration={1.5} formatter={(v) => formatCurrency(v, true)} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Encaissé</div>
            <div className="luxury-value-massive" style={{ fontSize: '3rem', color: '#10B981' }}>
              <AnimatedCounter from={0} to={totalCollected} duration={1.5} formatter={(v) => formatCurrency(v, true)} />
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
              <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>Nouveau Document</span>
            </button>
          )}
        </div>
      </div>

      {/* ── CONTROLS (TABS & SEARCH) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        {/* Segmented Control */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '1.5rem', backdropFilter: 'blur(10px)' }}>
          <button 
            onClick={() => setActiveTab('invoices')}
            style={{ 
              padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: activeTab === 'invoices' ? 'white' : 'transparent',
              color: activeTab === 'invoices' ? '#111827' : '#6b7280',
              boxShadow: activeTab === 'invoices' ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Factures
          </button>
          <button 
            onClick={() => setActiveTab('quotes')}
            style={{ 
              padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: activeTab === 'quotes' ? 'white' : 'transparent',
              color: activeTab === 'quotes' ? '#111827' : '#6b7280',
              boxShadow: activeTab === 'quotes' ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Devis & Propositions
          </button>
        </div>

        {/* Search */}
        <div style={{ width: '300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '2rem', 
              border: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(10px)', fontSize: '0.9rem', outline: 'none', fontWeight: 500
            }} 
          />
        </div>
      </div>

      {/* ── LIST ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
        <AnimatePresence mode="popLayout">
          {filteredList.map(item => (
            <SalesItem 
              key={item.id} 
              item={item} 
              type={activeTab} 
              formatCurrency={formatCurrency} 
              onOpenDetail={onOpenDetail} 
            />
          ))}
        </AnimatePresence>

        {filteredList.length === 0 && (
          <div style={{ padding: '5rem 1rem', textAlign: 'center', opacity: 0.3 }}>
            <FileText size={48} style={{ marginBottom: '1rem' }} />
            <div style={{ fontSize: '1rem', fontWeight: 500 }}>Aucun document trouvé.</div>
          </div>
        )}
      </div>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTab === 'invoices' ? "Créer une Facture" : "Créer un Devis"}
        fields={Object.entries(salesSchema.models[activeTab]?.fields || {}).map(([name, f]) => ({ ...f, name }))}
        onSave={(f) => {
          addRecord('sales', activeTab, { statut: activeTab === 'invoices' ? 'Brouillon' : 'Envoyé', ...f });
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default React.memo(Sales);
