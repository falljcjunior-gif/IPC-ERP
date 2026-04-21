import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Plus, Search, Filter, 
  Globe, Bookmark, RefreshCcw, AlertTriangle 
} from 'lucide-react';
import EnterpriseView from '../../../components/EnterpriseView';
import { legalSchema } from '../../../schemas/legal.schema';
import { useBusiness } from '../../../BusinessContext';

const IPTab = ({ onOpenDetail }) => {
  const { data } = useBusiness();
  const assets = data.legal?.ip || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Chercher une marque, domaine..." 
            className="input-field glass" 
            style={{ paddingLeft: '3rem', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button className="glass" style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.85rem' }}>Dépôts INPI/OMPI</button>
           <button className="btn-primary" onClick={() => onOpenDetail(null, 'legal', 'ip')} style={{ padding: '0.6rem 1.5rem', borderRadius: '1rem', background: '#6366F1', borderColor: '#6366F1' }}>
              <Plus size={18} /> Nouveau Dépôt
           </button>
        </div>
      </div>

      {/* Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }}>
        {assets.length === 0 ? (
          <div className="glass" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', borderRadius: '2rem', border: '1px dashed var(--border)' }}>
             <ShieldCheck size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
             <p style={{ color: 'var(--text-muted)' }}>Aucun actif de propriété intellectuelle enregistré.</p>
          </div>
        ) : assets.map(asset => (
          <motion.div 
            key={asset.id}
            whileHover={{ y: -4 }}
            onClick={() => onOpenDetail(asset, 'legal', 'ip')}
            className="glass" 
            style={{ padding: '1.5rem', borderRadius: '1.5rem', cursor: 'pointer', border: '1px solid var(--border)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <ShieldCheck size={20} color="#6366F1" />
                  </div>
                  <div>
                     <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '0.5px' }}>{asset.nom}</div>
                     <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{asset.type}</div>
                  </div>
               </div>
               <div style={{ 
                  fontSize: '0.65rem', 
                  padding: '4px 10px', 
                  borderRadius: '3rem', 
                  background: '#10B98120',
                  color: '#10B981',
                  fontWeight: 900
               }}>
                  {asset.statut}
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.8rem' }}>
               <div>
                  <div style={{ fontSize: '0.65rem', marginBottom: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Territoire</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                     <Globe size={12} /> {asset.territoire || 'Monde'}
                  </div>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', marginBottom: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>Renouvellement</div>
                  <div style={{ fontWeight: 800, color: '#F59E0B' }}>{asset.dateRenouvellement || 'S/O'}</div>
               </div>
            </div>
            
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>N° Dépôt: <span style={{ color: 'var(--text)' }}>{asset.numeroDepot || 'En cours'}</span></div>
               <button className="glass" style={{ padding: '5px 10px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <RefreshCcw size={10} /> Renouveler
               </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Registry Table */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', background: 'var(--bg-subtle)' }}>
         <h4 style={{ margin: 0, fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <Globe size={18} color="#6366F1" /> Portefeuille IP Global
         </h4>
         <EnterpriseView 
            moduleId="legal" 
            modelId="ip" 
            schema={legalSchema} 
            onOpenDetail={onOpenDetail} 
         />
      </div>
    </div>
  );
};

export default IPTab;
