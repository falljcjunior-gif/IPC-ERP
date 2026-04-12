import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Factory, 
  Plus, 
  Settings, 
  ClipboardList, 
  Play, 
  CheckCircle2, 
  Clock, 
  Layers,
  Wrench,
  AlertTriangle,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';

const Manufacturing = ({ onOpenDetail }) => {
  useBusiness();
  const [view, setView] = useState('orders'); // 'orders', 'bom'

  const workOrders = [
    { id: 'OF-2026-001', produit: 'Moteur Électrique X1', qte: 50, progress: 85, status: 'En cours', due: '2026-04-15' },
    { id: 'OF-2026-002', produit: 'Batterie Lithium-Ion 5kW', qte: 100, progress: 20, status: 'Planifié', due: '2026-04-20' },
    { id: 'OF-2026-003', produit: 'Châssis Aluminium ModA', qte: 10, progress: 100, status: 'Terminé', due: '2026-04-10' },
    { id: 'OF-2026-004', produit: 'Capteur Proximité S-4', qte: 500, progress: 0, status: 'Brouillon', due: '2026-04-25' },
  ];

  const boms = [
    { id: 'BOM-001', product: 'Moteur Électrique X1', components: 12, version: '2.4', type: 'Production' },
    { id: 'BOM-002', product: 'Châssis Aluminium ModA', components: 5, version: '1.0', type: 'Assemblage' },
  ];

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Manufacturing (GPAO)</h1>
          <p style={{ color: 'var(--text-muted)' }}>Pilotez vos lignes de production et vos nomenclatures complexes.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="glass" style={{ display: 'flex', padding: '0.25rem', borderRadius: '0.8rem' }}>
            <button onClick={() => setView('orders')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'orders' ? 'var(--bg)' : 'transparent', color: view === 'orders' ? 'var(--accent)' : 'var(--text-(muted)', cursor: 'pointer', fontWeight: 600 }}>Ordres Fab.</button>
            <button onClick={() => setView('bom')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'bom' ? 'var(--bg)' : 'transparent', color: view === 'bom' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Nomenclatures</button>
          </div>
          <button className="btn btn-primary">
            <Plus size={18} /> Créer OF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2.5rem' }}>
         <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem', borderLeft: '4px solid #3B82F6' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>OF EN COURS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>12</div>
         </div>
         <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem', borderLeft: '4px solid #10B981' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>TERMINÉS (MOIS)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>84</div>
         </div>
         <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem', borderLeft: '4px solid #F59E0B' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>ARRÊT MACHINE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EF4444' }}>2</div>
         </div>
         <div className="glass" style={{ padding: '1.25rem', borderRadius: '1rem', borderLeft: '4px solid var(--accent)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>EFFICACITÉ (TRS)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>92.4%</div>
         </div>
      </div>

      {view === 'orders' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {workOrders.map(of => (
            <motion.div
              key={of.id}
              whileHover={{ x: 5 }}
              className="glass"
              style={{ padding: '1.25rem 2rem', borderRadius: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => onOpenDetail(of, 'production', 'warehouses')} // Simulated link
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)10', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Factory size={22} />
                    </div>
                    <div>
                       <div style={{ fontWeight: 800, fontSize: '1rem' }}>{of.produit}</div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OF: {of.id} • Qte: {of.qte}</div>
                    </div>
                 </div>

                 <div style={{ width: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>
                       <span>Avancement</span>
                       <span>{of.progress}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                       <div style={{ width: `${of.progress}%`, height: '100%', background: 'var(--accent)', borderRadius: '3px' }} />
                    </div>
                 </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                 <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Échéance</div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{of.due}</div>
                 </div>
                 <span style={{ 
                   padding: '0.25rem 0.75rem', 
                   borderRadius: '0.6rem', 
                   background: of.status === 'Terminé' ? '#10B98115' : of.status === 'Planifié' ? '#3B82F615' : of.status === 'Brouillon' ? 'var(--bg-subtle)' : '#F59E0B15', 
                   color: of.status === 'Terminé' ? '#10B981' : of.status === 'Planifié' ? '#3B82F6' : of.status === 'Brouillon' ? 'var(--text-muted)' : '#F59E0B',
                   fontSize: '0.75rem',
                   fontWeight: 700
                 }}>
                   {of.status}
                 </span>
                 <button className="glass" style={{ padding: '0.5rem', borderRadius: '0.75rem', border: 'none' }}><MoreVertical size={18} /></button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
           {boms.map(bom => (
             <div key={bom.id} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                   <div style={{ background: 'var(--accent)15', color: 'var(--accent)', padding: '0.6rem', borderRadius: '0.8rem' }}><Layers size={20} /></div>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>V{bom.version}</div>
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{bom.product}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{bom.components} composants • {bom.type}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>ID: {bom.id}</span>
                   <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Éditer</button>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default Manufacturing;
