import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory, Plus, ClipboardList, Play, CheckCircle2,
  Layers, Wrench, AlertTriangle, MoreVertical, Activity
} from 'lucide-react';
import { useStore } from '../store';
import BarcodeScanner from '../components/BarcodeScanner';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';
import '../components/GlobalDashboard.css';

const Manufacturing = ({ onOpenDetail }) => {
  const { data, formatCurrency, shellView, updateRecord, addRecord } = useStore();
  const [view, setView] = useState('orders');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const toggleStatus = (of) => {
    const nextStatus   = of.status === 'En cours' ? 'Terminé' : 'En cours';
    const nextProgress = nextStatus === 'Terminé' ? 100 : 50;
    updateRecord('production', 'workOrders', of.id, { status: nextStatus, progress: nextProgress });
  };

  const workOrders = data.production?.workOrders || [];
  const boms       = data.production?.boms       || [];
  const enCours    = workOrders.filter(o => o.status === 'En cours').length;
  const termines   = workOrders.filter(o => o.status === 'Terminé').length;

  const handleScan = (code) => {
    setIsScannerOpen(false);
    const order = workOrders.find(o => o.id === code);
    if (order) onOpenDetail(order, 'production', 'warehouses');
    else alert(`Ordre de Fabrication non trouvé : ${code}`);
  };

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <AnimatePresence>
        {isScannerOpen && <BarcodeScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="luxury-subtitle">Nexus Manufacturing Intelligence</div>
          <h1 className="luxury-title">GPAO <strong>Core</strong></h1>
        </div>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ordres en production</div>
            <div className="luxury-value-massive" style={{ fontSize: '3rem', color: '#111827' }}>
              <AnimatedCounter from={0} to={enCours} duration={1.5} formatter={v => `${v}`} />
            </div>
          </div>

          {/* TRS Badge */}
          <div className="luxury-widget" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 2rem' }}>
            <Activity size={24} color="#10B981" />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Efficacité (TRS)</div>
              <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#111827' }}>92.8%</div>
            </div>
          </div>

          {/* Scanner */}
          <button onClick={() => setIsScannerOpen(true)} className="luxury-widget" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.8)' }}>
            <Layers size={24} color="#111827" />
          </button>

          {/* Create OF */}
          <button className="luxury-widget" style={{ padding: '1rem 2rem', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', borderRadius: '1.5rem' }}>
            <Plus size={20} /> <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>Créer OF</span>
          </button>
        </div>
      </div>

      {/* ── KPI BENTO ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', marginBottom: '3rem' }}>
        <div className="luxury-widget" style={{ gridColumn: 'span 3', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '1rem', color: '#3B82F6' }}><ClipboardList size={24} /></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Running</span>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>OF en cours</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b' }}>{enCours || 8}</div>
          </div>
        </div>

        <div className="luxury-widget" style={{ gridColumn: 'span 3', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '1rem', color: '#10B981' }}><CheckCircle2 size={24} /></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Done</span>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Terminés (mois)</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b' }}>{termines || 124}</div>
          </div>
        </div>

        <div className="luxury-widget" style={{ gridColumn: 'span 3', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '1rem', color: '#EF4444' }}><AlertTriangle size={24} /></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critical</span>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Arrêts Machine</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#EF4444' }}>2</div>
          </div>
        </div>

        <div className="luxury-widget" style={{ gridColumn: 'span 3', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '1rem', color: '#10B981' }}><Activity size={24} /></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Efficient</span>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Efficacité (TRS)</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b' }}>92.8%</div>
          </div>
        </div>
      </div>

      {/* ── FROSTED-GLASS VIEW TOGGLE ── */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '1.5rem', backdropFilter: 'blur(10px)', marginBottom: '2rem', width: 'fit-content' }}>
        {[
          { id: 'orders', label: 'Ordres de Fabrication', icon: <Wrench size={16} /> },
          { id: 'bom',    label: 'Nomenclatures',          icon: <Layers size={16} /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            style={{
              padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: view === t.id ? 'white' : 'transparent',
              color: view === t.id ? '#111827' : '#64748B',
              boxShadow: view === t.id ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {view === 'orders' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {workOrders.map(of => (
                <motion.div
                  key={of.id}
                  whileHover={{ x: 6, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                  className="luxury-widget"
                  style={{ padding: '2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.9)' }}
                  onClick={() => onOpenDetail(of, 'production', 'warehouses')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4rem' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.08)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wrench size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e293b' }}>{of.produit}</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginTop: '0.25rem' }}>OF-{of.id} · Lot 2024-X4</div>
                      </div>
                    </div>

                    <div style={{ width: '280px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Progression</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10B981' }}>{of.progress}%</span>
                      </div>
                      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${of.progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          style={{ height: '100%', background: '#10B981', borderRadius: '4px' }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Échéance</div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>{of.due}</div>
                    </div>

                    <div style={{ 
                      padding: '0.5rem 1.5rem', borderRadius: '1rem',
                      background: of.status === 'Terminé' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      color: of.status === 'Terminé' ? '#10B981' : '#3B82F6',
                      fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>
                      {of.status}
                    </div>

                    {of.status !== 'Terminé' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleStatus(of); }}
                        className="luxury-widget"
                        style={{ padding: '0.6rem 1.25rem', background: '#10B981', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, borderRadius: '0.75rem' }}
                      >
                        <CheckCircle2 size={18} /> Terminer
                      </button>
                    )}

                    <button className="luxury-widget" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: '#f8fafc', borderRadius: '0.75rem' }}>
                      <MoreVertical size={20} color="#94a3b8" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            // BOM grid
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))', gap: '2rem' }}>
               {boms.map(bom => (
                 <motion.div 
                   key={bom.id} 
                   whileHover={{ y: -8, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                   className="luxury-widget" 
                   style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.9)' }}
                 >
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                     <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', padding: '1rem', borderRadius: '1rem' }}>
                       <Layers size={24} />
                     </div>
                     <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9ca3af', background: '#f8fafc', padding: '6px 14px', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                       REV. {bom.version}
                     </div>
                   </div>
                   <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>{bom.product}</h3>
                   <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                     {bom.components} composants identifiés — nomenclature <strong>{bom.type}</strong>.
                   </p>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                     <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1' }}>ID: {bom.id}</span>
                     <button className="luxury-widget" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', fontWeight: 700, color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.07)', border: 'none', cursor: 'pointer', borderRadius: '0.75rem' }}>
                       Détails
                     </button>
                   </div>
                 </motion.div>
               ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default React.memo(Manufacturing);
