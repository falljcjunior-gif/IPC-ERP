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
  MoreVertical,
  Activity,
  Sparkles
} from 'lucide-react';
import { useStore } from '../store';
import BarcodeScanner from '../components/BarcodeScanner';
import { AnimatePresence } from 'framer-motion';

const Manufacturing = ({ onOpenDetail }) => {
  const { data, formatCurrency, shellView } = useStore();
  const [view, setView] = useState('orders'); // 'orders', 'bom'
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const workOrders = data.production?.workOrders || [];
  const boms = data.production?.boms || [];

  const handleScan = (code) => {
    setIsScannerOpen(false);
    const order = workOrders.find(o => o.id === code);
    if (order) {
      onOpenDetail(order, 'production', 'warehouses');
    } else {
      alert(`Ordre de Fabrication non trouvé pour le code : ${code}`);
    }
  };

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <AnimatePresence>
        {isScannerOpen && (
          <BarcodeScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />
        )}
      </AnimatePresence>

      {/* Nexus Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '6px', borderRadius: '10px' }}>
              <Factory size={16} color="white" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Nexus Manufacturing Intelligence
            </span>
          </div>
          <h1 className="nexus-gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>
            GPAO Core
          </h1>
          <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.1rem', fontWeight: 500, maxWidth: '650px', lineHeight: 1.6 }}>
            Optimisez vos lignes de production et vos nomenclatures complexes via le moteur d'exécution industriel Nexus.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
             className="nexus-card" 
             onClick={() => setIsScannerOpen(true)}
             style={{ width: '56px', height: '56px', background: 'white', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--nexus-border)', cursor: 'pointer' }}
          >
            <Layers size={22} color="var(--nexus-secondary)" />
          </button>

          <div className="nexus-card" style={{ display: 'flex', padding: '0.4rem', borderRadius: '1.25rem', background: 'white' }}>
            <button onClick={() => setView('orders')} style={{ padding: '0.6rem 1.5rem', borderRadius: '0.9rem', border: 'none', background: view === 'orders' ? 'var(--nexus-secondary)' : 'transparent', color: view === 'orders' ? 'white' : 'var(--nexus-text-muted)', cursor: 'pointer', fontWeight: 900, fontSize: '0.85rem' }}>Ordres</button>
            <button onClick={() => setView('bom')} style={{ padding: '0.6rem 1.5rem', borderRadius: '0.9rem', border: 'none', background: view === 'bom' ? 'var(--nexus-secondary)' : 'transparent', color: view === 'bom' ? 'white' : 'var(--nexus-text-muted)', cursor: 'pointer', fontWeight: 900, fontSize: '0.85rem' }}>Nomenclatures</button>
          </div>

          <button className="nexus-card" style={{ padding: '1rem 2rem', background: 'var(--nexus-primary)', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Plus size={20} strokeWidth={3} /> Créer OF
          </button>
        </div>
      </div>

      {/* KPI Bento Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        <div className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '10px', color: '#3B82F6' }}><ClipboardList size={20} /></div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#3B82F6' }}>RUNNING</div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>OF en cours</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{workOrders.filter(o => o.status === 'En cours').length || 8}</div>
        </div>

        <div className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-primary)' }}><CheckCircle2 size={20} /></div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>DONE</div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Terminés (Mois)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>124</div>
        </div>

        <div className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '10px', color: '#EF4444' }}><AlertTriangle size={20} /></div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#EF4444' }}>CRITICAL</div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Arrêts Machine</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>2</div>
        </div>

        <div className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-primary)' }}><Activity size={20} strokeWidth={3} /></div>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>EFFICIENT</div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Efficacité (TRS)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>92.8%</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ marginTop: '1rem' }}>
        {view === 'orders' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {workOrders.map(of => (
              <motion.div
                key={of.id}
                whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,1)' }}
                className="nexus-card"
                style={{ padding: '1.5rem 2.5rem', background: 'rgba(255,255,255,0.8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => onOpenDetail(of, 'production', 'warehouses')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                   <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div className="nexus-glow" style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--nexus-bg)', color: 'var(--nexus-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Wrench size={24} />
                      </div>
                      <div>
                         <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--nexus-secondary)' }}>{of.produit}</div>
                         <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--nexus-text-muted)', marginTop: '0.2rem' }}>OF-{of.id} • Lot: 2024-X4</div>
                      </div>
                   </div>

                   <div style={{ width: '250px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                         <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Progression Industrielle</span>
                         <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>{of.progress}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--nexus-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                         <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${of.progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{ height: '100%', background: 'var(--nexus-primary)', borderRadius: '4px' }} 
                         />
                      </div>
                   </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Échéance Livraison</div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--nexus-secondary)' }}>{of.due}</div>
                   </div>
                   <div style={{ 
                     padding: '0.5rem 1.25rem', 
                     borderRadius: '12px', 
                     background: of.status === 'Terminé' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                     color: of.status === 'Terminé' ? 'var(--nexus-primary)' : '#3B82F6',
                     fontSize: '0.8rem',
                     fontWeight: 900,
                     textTransform: 'uppercase',
                     letterSpacing: '1px'
                   }}>
                     {of.status}
                   </div>
                   <button className="nexus-card" style={{ padding: '0.6rem', background: 'white', border: '1px solid var(--nexus-border)' }}><MoreVertical size={20} color="var(--nexus-text-muted)" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }}>
             {boms.map(bom => (
               <motion.div 
                  key={bom.id} 
                  whileHover={{ y: -10 }}
                  className="nexus-card" style={{ padding: '2rem', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                     <div className="nexus-glow" style={{ background: 'var(--nexus-bg)', color: 'var(--nexus-primary)', padding: '0.75rem', borderRadius: '14px' }}><Layers size={22} /></div>
                     <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-text-muted)', background: 'var(--nexus-bg)', padding: '4px 10px', borderRadius: '8px' }}>REV. {bom.version}</div>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--nexus-secondary)', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>{bom.product}</h3>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--nexus-text-muted)', marginBottom: '2rem', lineHeight: 1.5 }}>{bom.components} composants critiques identifiés dans cette nomenclature {bom.type}.</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--nexus-bg)' }}>
                     <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>ID: {bom.id}</span>
                     <button className="nexus-card" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', fontWeight: 900, color: 'var(--nexus-primary)', background: 'white', border: '1px solid var(--nexus-primary)', cursor: 'pointer' }}>Détails Nexus</button>
                  </div>
               </motion.div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Manufacturing;
