import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building, Plus, Search, Users, 
  FileText, Landmark, MapPin, PieChart 
} from 'lucide-react';
import EnterpriseView from '../../../components/EnterpriseView';
import { legalSchema } from '../../../schemas/legal.schema';
import { useBusiness } from '../../../BusinessContext';

const CorporateTab = ({ onOpenDetail }) => {
  const { data, formatCurrency } = useBusiness();
  const corporateEntities = data.legal?.corporate || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Info */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'rgba(15, 23, 42, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: '#0F172A', color: 'white' }}>
               <Landmark size={24} />
            </div>
            <div>
               <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Secrétariat Corporate Groupe</h3>
               <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gestion des entités légales, AG et capital social.</p>
            </div>
         </div>
         <button className="btn-primary" onClick={() => onOpenDetail(null, 'legal', 'corporate')} style={{ padding: '0.6rem 1.5rem', borderRadius: '1rem', background: '#0F172A', borderColor: '#0F172A' }}>
            <Plus size={18} /> Nouvelle Entité
         </button>
      </div>

      {/* Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '1.5rem' }}>
        {corporateEntities.length === 0 ? (
          <div className="glass" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', borderRadius: '2rem', border: '1px dashed var(--border)' }}>
             <Building size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
             <p style={{ color: 'var(--text-muted)' }}>Aucune entité légale enregistrée pour le groupe.</p>
          </div>
        ) : corporateEntities.map(entity => (
          <motion.div 
            key={entity.id}
            whileHover={{ y: -4 }}
            onClick={() => onOpenDetail(entity, 'legal', 'corporate')}
            className="glass" 
            style={{ padding: '2rem', borderRadius: '2rem', cursor: 'pointer', border: '1px solid var(--border)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
               <div>
                  <div style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.5px' }}>{entity.entite}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 800, fontSize: '0.8rem', marginTop: '4px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(82, 153, 144, 0.1)' }}>{entity.type}</span>
                  </div>
               </div>
               <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--bg-subtle)' }}>
                  <Building size={24} color="var(--text-muted)" />
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
               <div className="glass" style={{ padding: '1rem', borderRadius: '1rem', border: 'none' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Capital Social</div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{formatCurrency(entity.capitalSocial || 0)}</div>
               </div>
               <div className="glass" style={{ padding: '1rem', borderRadius: '1rem', border: 'none' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Date Création</div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{entity.dateCreation || 'N/A'}</div>
               </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <MapPin size={16} color="var(--text-muted)" />
                  <span style={{ color: 'var(--text-muted)' }}>Siège : <span style={{ color: 'var(--text)', fontWeight: 600 }}>{entity.siège}</span></span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                  <FileText size={16} color="var(--text-muted)" />
                  <span style={{ color: 'var(--text-muted)' }}>Documents : <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Statuts, Kbis, AG 2025</span></span>
               </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
               <button className="glass" style={{ padding: '8px 15px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PieChart size={14} /> Actionnariat
               </button>
               <button className="glass" style={{ padding: '8px 15px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)' }}>
                  Gérer l'entité
               </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '2rem' }}>
         <h4 style={{ margin: 0, fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <Building size={18} color="#0F172A" /> Registre Corporate Privé
         </h4>
         <EnterpriseView 
            moduleId="legal" 
            modelId="corporate" 
            schema={legalSchema} 
            onOpenDetail={onOpenDetail} 
         />
      </div>
    </div>
  );
};

export default CorporateTab;
