import React from 'react';
import { motion } from 'framer-motion';
import { 
  Gavel, Plus, Search, Scale, 
  AlertTriangle, DollarSign, User, ShieldAlert
} from 'lucide-react';
import EnterpriseView from '../../../components/EnterpriseView';
import { legalSchema } from '../../../schemas/legal.schema';
import { useBusiness } from '../../../BusinessContext';

const LitigationTab = ({ onOpenDetail }) => {
  const { data, formatCurrency } = useBusiness();
  const litigations = data.legal?.litigations || [];

  const totalRisk = litigations.reduce((acc, curr) => acc + (curr.risqueFinancier || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Rechercher un dossier, adversaire..." 
            className="input-field glass" 
            style={{ paddingLeft: '3rem', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="glass" style={{ padding: '0.6rem 1rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
              Risque Total : <span style={{ color: '#EF4444' }}>{formatCurrency(totalRisk)}</span>
            </div>
           <button className="btn-primary" onClick={() => onOpenDetail(null, 'legal', 'litigations')} style={{ padding: '0.6rem 1.5rem', borderRadius: '1rem', background: '#F59E0B', borderColor: '#F59E0B' }}>
              <Plus size={18} /> Nouveau Dossier
           </button>
        </div>
      </div>

      {/* Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {litigations.length === 0 ? (
          <div className="glass" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', borderRadius: '2rem', border: '1px dashed var(--border)' }}>
             <Gavel size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
             <p style={{ color: 'var(--text-muted)' }}>Aucun contentieux ou litige en cours.</p>
          </div>
        ) : litigations.map(litigation => (
          <motion.div 
            key={litigation.id}
            whileHover={{ y: -4 }}
            onClick={() => onOpenDetail(litigation, 'legal', 'litigations')}
            className="glass" 
            style={{ padding: '1.5rem', borderRadius: '1.5rem', cursor: 'pointer', border: '1px solid var(--border)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Gavel size={20} color="#F59E0B" />
                  </div>
                  <div>
                     <div style={{ fontWeight: 800, fontSize: '1rem' }}>{litigation.objet}</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{litigation.partieAdverse}</div>
                  </div>
               </div>
               <div style={{ 
                  fontSize: '0.65rem', 
                  padding: '4px 10px', 
                  borderRadius: '3rem', 
                  background: litigation.statut === 'En cours' ? '#F59E0B20' : '#10B98120',
                  color: litigation.statut === 'En cours' ? '#F59E0B' : '#10B981',
                  fontWeight: 900
               }}>
                  {litigation.statut}
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                     <ShieldAlert size={14} color="#EF4444" /> Provision Risque
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#EF4444' }}>
                     {formatCurrency(litigation.risqueFinancier || 0)}
                  </div>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                     <User size={14} /> Avocat Référent
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                     {litigation.avocat || 'Non assigné'}
                  </div>
               </div>
            </div>

            <div style={{ marginTop: '1.25rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Scale size={14} /> Dossier ouvert — Provision comptable générée automatiquement
            </div>
          </motion.div>
        ))}
      </div>

      {/* Registry */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', background: 'var(--bg-subtle)' }}>
         <h4 style={{ margin: 0, fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <AlertTriangle size={18} color="#F59E0B" /> Suivi Détaillé des Contentieux
         </h4>
         <EnterpriseView 
            moduleId="legal" 
            modelId="litigations" 
            schema={legalSchema} 
            onOpenDetail={onOpenDetail} 
         />
      </div>
    </div>
  );
};

export default LitigationTab;
