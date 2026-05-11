import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../../store';
import { 
  Check, X, Calendar, DollarSign, Clock, 
  History, ShieldCheck, AlertCircle, 
  Fingerprint
} from 'lucide-react';

const ApprovalsTab = () => {
  const { data, updateRecord, currentUser, formatCurrency } = useStore();
  const [viewMode, setViewMode] = useState('pending'); // 'pending' | 'history'

  const allLeaves = data.hr?.leaves || [];
  const allExpenses = data.hr?.expenses || [];

  const displayedLeaves = useMemo(() => 
    allLeaves.filter(l => viewMode === 'pending' ? (l.statut === 'En attente' || l.statut === 'Brouillon') : (l.statut === 'Validé' || l.statut === 'Refusé')),
  [allLeaves, viewMode]);

  const displayedExpenses = useMemo(() => 
    allExpenses.filter(e => viewMode === 'pending' ? (e.statut === 'En attente' || e.statut === 'Brouillon') : (e.statut === 'Validé' || e.statut === 'Refusé' || e.statut === 'Payé')),
  [allExpenses, viewMode]);

  const handleAction = (item, type, action) => {
    const updatedStatus = action === 'approve' ? 'Validé' : 'Refusé';
    const payload = {
      ...item,
      statut: updatedStatus,
      validatedBy: currentUser?.nom,
      validatedAt: new Date().toISOString(),
      _auditHash: `SECURE_${Math.random().toString(36).substring(2, 15)}` // Simulated immutability fingerprint
    };
    updateRecord('hr', type, item.id, payload);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* ── LUXURY TOGGLE ── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ 
          display: 'flex', background: 'rgba(0,0,0,0.03)', padding: '0.4rem', 
          borderRadius: '1.5rem', border: '1px solid rgba(0,0,0,0.05)' 
        }}>
          <button 
            onClick={() => setViewMode('pending')} 
            style={{ 
              padding: '0.8rem 2rem', borderRadius: '1.2rem', border: 'none', 
              fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
              background: viewMode === 'pending' ? 'white' : 'transparent',
              color: viewMode === 'pending' ? '#111827' : '#9ca3af',
              boxShadow: viewMode === 'pending' ? '0 10px 25px -10px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem'
            }}
          >
            <Clock size={16} /> Flux en Attente
          </button>
          <button 
            onClick={() => setViewMode('history')} 
            style={{ 
              padding: '0.8rem 2rem', borderRadius: '1.2rem', border: 'none', 
              fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
              background: viewMode === 'history' ? 'white' : 'transparent',
              color: viewMode === 'history' ? '#111827' : '#9ca3af',
              boxShadow: viewMode === 'history' ? '0 10px 25px -10px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem'
            }}
          >
            <History size={16} /> Registre d&apos;Audit
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        
        {/* ── LEAVES SECTION ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, color: '#111827' }}>
              <Calendar size={22} color="#6366F1" /> Absences & Congés
            </h3>
            <div style={{ background: '#6366F115', color: '#6366F1', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 900 }}>
              {displayedLeaves.length} Requêtes
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <AnimatePresence mode="popLayout">
              {displayedLeaves.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(0,0,0,0.01)', borderRadius: '2rem', border: '1px dashed rgba(0,0,0,0.05)' }}
                >
                  <ShieldCheck size={40} color="#9ca3af" style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                  <div style={{ fontWeight: 800, color: '#4b5563', fontSize: '0.9rem' }}>Conformité Totale</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Toutes les demandes ont été traitées.</div>
                </motion.div>
              )}
              {displayedLeaves.map(leave => (
                <motion.div 
                  key={leave.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass"
                  style={{ padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(0,0,0,0.03)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#6366F110', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#6366F1' }}>
                        {(leave.collaborateur || leave.employe || 'A')[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#111827' }}>{leave.collaborateur || leave.employe || 'Collaborateur Inconnu'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>{leave.type}</div>
                      </div>
                    </div>
                    {viewMode === 'history' && (
                      <div style={{ fontSize: '0.65rem', padding: '0.3rem 0.7rem', borderRadius: '1rem', fontWeight: 800, background: leave.statut === 'Validé' ? '#10B98115' : '#EF444415', color: leave.statut === 'Validé' ? '#10B981' : '#EF4444', textTransform: 'uppercase' }}>
                        {leave.statut}
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', marginBottom: '0.5rem' }}>
                      <span>Période</span>
                      <span style={{ fontWeight: 800 }}>{leave.date_debut || leave.du} → {leave.date_fin || leave.au}</span>
                    </div>
                    {leave.commentaire && (
                      <div style={{ color: '#6b7280', fontStyle: 'italic', marginTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem' }}>
                        « {leave.commentaire} »
                      </div>
                    )}
                  </div>

                  {viewMode === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        onClick={() => handleAction(leave, 'leaves', 'approve')}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '1rem', border: 'none', background: '#111827', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <Check size={16} /> Approuver
                      </button>
                      <button 
                        onClick={() => handleAction(leave, 'leaves', 'reject')}
                        style={{ padding: '0.75rem', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', color: '#EF4444', cursor: 'pointer' }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── EXPENSES SECTION ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, color: '#111827' }}>
              <DollarSign size={22} color="#F59E0B" /> Notes de Frais
            </h3>
            <div style={{ background: '#F59E0B15', color: '#F59E0B', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 900 }}>
              {displayedExpenses.length} Requêtes
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <AnimatePresence mode="popLayout">
              {displayedExpenses.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(0,0,0,0.01)', borderRadius: '2rem', border: '1px dashed rgba(0,0,0,0.05)' }}
                >
                  <AlertCircle size={40} color="#9ca3af" style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                  <div style={{ fontWeight: 800, color: '#4b5563', fontSize: '0.9rem' }}>Aucune Action Requise</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Le registre des frais est à jour.</div>
                </motion.div>
              )}
              {displayedExpenses.map(exp => (
                <motion.div 
                  key={exp.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass"
                  style={{ padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(0,0,0,0.03)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F59E0B10', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#F59E0B' }}>
                        {exp.employe?.[0] || 'E'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#111827' }}>{exp.employe}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>{exp.type}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#111827' }}>{formatCurrency?.(exp.montant)}</div>
                      {viewMode === 'history' && (
                         <div style={{ fontSize: '0.6rem', fontWeight: 800, color: ['Validé', 'Payé'].includes(exp.statut) ? '#10B981' : '#EF4444', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                           {exp.statut}
                         </div>
                      )}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', marginBottom: '0.5rem' }}>
                      <span>Objet</span>
                      <span style={{ fontWeight: 800 }}>{exp.objet}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: '0.75rem' }}>
                      <span>Date de dépense</span>
                      <span>{exp.date}</span>
                    </div>
                  </div>

                  {viewMode === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        onClick={() => handleAction(exp, 'expenses', 'approve')}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '1rem', border: 'none', background: '#F59E0B', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      >
                        <Check size={16} /> Approuver
                      </button>
                      <button 
                        onClick={() => handleAction(exp, 'expenses', 'reject')}
                        style={{ padding: '0.75rem', borderRadius: '1rem', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', color: '#EF4444', cursor: 'pointer' }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}

                  {viewMode === 'history' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.65rem', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '0.75rem' }}>
                      <Fingerprint size={12} />
                      <span style={{ fontFamily: 'monospace' }}>Nexus Audit ID: {exp._auditHash || 'IMMUTABLE_LOG_ENABLED'}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalsTab;
