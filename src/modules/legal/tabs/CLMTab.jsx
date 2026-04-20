import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileSignature, Plus, Search, Filter, 
  Clock, AlertCircle, CheckCircle2, ChevronRight 
} from 'lucide-react';
import EnterpriseView from '../../../components/EnterpriseView';
import { legalSchema } from '../../../schemas/legal.schema';
import { useBusiness } from '../../../BusinessContext';

const CLMTab = ({ onOpenDetail }) => {
  const { data, formatCurrency } = useBusiness();
  const contracts = data.legal?.contracts || [];

  // Logic for alert: Expiration < 30 days
  const getDaysRemaining = (dateStr) => {
    if (!dateStr) return null;
    const diffTime = new Date(dateStr) - new Date();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Rechercher un contrat, partenaire..." 
            className="input-field glass" 
            style={{ paddingLeft: '3rem', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button className="glass" style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.85rem' }}>Templates Partagés</button>
           <button className="btn-primary" onClick={() => onOpenDetail(null, 'legal', 'contracts')} style={{ padding: '0.6rem 1.5rem', borderRadius: '1rem', background: 'var(--accent)', borderColor: 'var(--accent)' }}>
              <Plus size={18} /> Nouveau Contrat
           </button>
        </div>
      </div>

      {/* Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {contracts.length === 0 ? (
          <div className="glass" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', borderRadius: '2rem', border: '1px dashed var(--border)' }}>
             <FileSignature size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
             <p style={{ color: 'var(--text-muted)' }}>Aucun contrat enregistré. Utilisez un template pour démarrer.</p>
          </div>
        ) : contracts.map(contract => {
          const daysLeft = getDaysRemaining(contract.dateExpiration);
          const isAtRisk = daysLeft !== null && daysLeft < 30;
          
          return (
            <motion.div 
              key={contract.id}
              whileHover={{ y: -4 }}
              onClick={() => onOpenDetail(contract, 'legal', 'contracts')}
              className="glass" 
              style={{ 
                padding: '1.5rem', 
                borderRadius: '1.5rem', 
                cursor: 'pointer',
                border: isAtRisk ? '1px solid #EF444450' : '1px solid var(--border)',
                background: isAtRisk ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(255,255,255,0) 100%)' : 'var(--bg-subtle)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: isAtRisk ? '#EF444420' : 'rgba(82, 153, 144, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <FileSignature size={20} color={isAtRisk ? '#EF4444' : 'var(--accent)'} />
                    </div>
                    <div>
                       <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{contract.titre}</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{contract.partie}</div>
                    </div>
                 </div>
                 <div style={{ 
                    fontSize: '0.65rem', 
                    padding: '4px 10px', 
                    borderRadius: '3rem', 
                    background: contract.statut === 'Signé' ? '#10B98120' : '#F59E0B20',
                    color: contract.statut === 'Signé' ? '#10B981' : '#F59E0B',
                    fontWeight: 900,
                    textTransform: 'uppercase'
                 }}>
                    {contract.statut}
                 </div>
              </div>

              {contract.modifie && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#EF444410', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #EF444420' }}>
                   <AlertCircle size={14} color="#EF4444" />
                   <span style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 700 }}>⚠️ Hors Template - Visa Requis</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
                 <div style={{ color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '0.65rem', marginBottom: '2px', textTransform: 'uppercase', fontWeight: 800 }}>Échéance</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: isAtRisk ? '#EF4444' : 'inherit' }}>
                       <Clock size={12} /> {contract.dateExpiration || 'Indéterminé'}
                    </div>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', marginBottom: '2px', textTransform: 'uppercase', fontWeight: 800 }}>Valeur</div>
                    <div style={{ fontWeight: 900 }}>{formatCurrency(contract.amount || 0)}</div>
                 </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', background: 'var(--bg-subtle)' }}>
         <h4 style={{ margin: 0, fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <CheckCircle2 size={18} color="#10B981" /> Vue Enterprise - Registre des Engagements
         </h4>
         <EnterpriseView 
            moduleId="legal" 
            modelId="contracts" 
            schema={legalSchema} 
            onOpenDetail={onOpenDetail} 
         />
      </div>
    </div>
  );
};

export default CLMTab;
