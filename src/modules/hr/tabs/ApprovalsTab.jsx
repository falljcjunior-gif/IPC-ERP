import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '../../../BusinessContext';
import { Check, X, Calendar, DollarSign, Clock, FileText, History } from 'lucide-react';

const ApprovalsTab = () => {
  const { data, updateRecord, currentUser, formatCurrency } = useBusiness();
  const [viewMode, setViewMode] = React.useState('pending'); // 'pending' | 'history'

  // Combine leaves and expenses
  const allLeaves = data.hr?.leaves || [];
  const allExpenses = data.hr?.expenses || [];

  const displayedLeaves = allLeaves.filter(l => viewMode === 'pending' ? (l.statut === 'En attente' || l.statut === 'Brouillon') : (l.statut === 'Validé' || l.statut === 'Refusé'));
  const displayedExpenses = allExpenses.filter(e => viewMode === 'pending' ? (e.statut === 'En attente' || e.statut === 'Brouillon') : (e.statut === 'Validé' || e.statut === 'Refusé' || e.statut === 'Payé'));

  const handleAction = (item, type, action) => {
    const updatedStatus = action === 'approve' ? 'Validé' : 'Refusé';
    const payload = {
      ...item,
      statut: updatedStatus,
      validatedBy: currentUser?.nom,
      validatedAt: new Date().toISOString()
    };
    updateRecord('hr', type, item.id, payload);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={() => setViewMode('pending')} className="btn" style={{ background: viewMode === 'pending' ? 'var(--accent)' : 'transparent', color: viewMode === 'pending' ? 'white' : 'var(--text-muted)', border: viewMode === 'pending' ? 'none' : '1px solid var(--border)', padding: '0.5rem 1.5rem', borderRadius: '2rem', fontWeight: 700 }}>
           <Clock size={16} /> En attente
        </button>
        <button onClick={() => setViewMode('history')} className="btn" style={{ background: viewMode === 'history' ? 'var(--accent)' : 'transparent', color: viewMode === 'history' ? 'white' : 'var(--text-muted)', border: viewMode === 'history' ? 'none' : '1px solid var(--border)', padding: '0.5rem 1.5rem', borderRadius: '2rem', fontWeight: 700 }}>
           <History size={16} /> Historique
        </button>
      </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      {/* Leaves Column */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
          <Calendar size={20} color="#6366F1" /> Déclarations d'Absences
          <span style={{ background: '#6366F120', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', color: '#6366F1' }}>
            {displayedLeaves.length}
          </span>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {displayedLeaves.length === 0 && (
               <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                 {viewMode === 'pending' ? 'Aucune demande de congé en attente.' : 'Aucun historique de congé.'}
               </div>
            )}
            {displayedLeaves.map(leave => (
              <motion.div 
                key={leave.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '1rem', border: '1px solid var(--border)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                   <div style={{ fontWeight: 700 }}>{leave.employe || leave.collaborateur}</div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{leave.type}</div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                   Du <span style={{ fontWeight: 600 }}>{leave.du || leave.date_debut}</span> au <span style={{ fontWeight: 600 }}>{leave.au || leave.date_fin}</span>
                   {leave.commentaire && <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>« {leave.commentaire} »</div>}
                </div>
                {viewMode === 'pending' ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button 
                       onClick={() => handleAction(leave, 'leaves', 'approve')}
                       className="btn" 
                       style={{ flex: 1, background: '#10B981', color: 'white', border: 'none', display: 'flex', justifyContent: 'center' }}
                     >
                       <Check size={16} /> Approuver
                     </button>
                     <button 
                       onClick={() => handleAction(leave, 'leaves', 'reject')}
                       className="btn" 
                       style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', display: 'flex', justifyContent: 'center' }}
                     >
                       <X size={16} /> Refuser
                     </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '1rem', fontWeight: 700, background: leave.statut === 'Validé' ? '#10B98120' : '#EF444420', color: leave.statut === 'Validé' ? '#10B981' : '#EF4444' }}>
                      {leave.statut}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Expenses Column */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
          <DollarSign size={20} color="#F59E0B" /> Notes de Frais
          <span style={{ background: '#F59E0B20', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', color: '#F59E0B' }}>
            {displayedExpenses.length}
          </span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {displayedExpenses.length === 0 && (
               <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                 {viewMode === 'pending' ? 'Aucun frais à valider.' : 'Aucun historique de notes de frais.'}
               </div>
            )}
            {displayedExpenses.map(exp => (
              <motion.div 
                key={exp.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '1rem', border: '1px solid var(--border)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                   <div style={{ fontWeight: 700 }}>{exp.employe}</div>
                   <div style={{ fontSize: '1rem', color: '#F59E0B', fontWeight: 800 }}>{formatCurrency?.(exp.montant)}</div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                   {exp.type} • Le {exp.date}
                   <div style={{ marginTop: '0.25rem', fontWeight: 500, color: 'var(--text)' }}>Objet: {exp.objet}</div>
                </div>
                {viewMode === 'pending' ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button 
                       onClick={() => handleAction(exp, 'expenses', 'approve')}
                       className="btn" 
                       style={{ flex: 1, background: '#10B981', color: 'white', border: 'none', display: 'flex', justifyContent: 'center' }}
                     >
                       <Check size={16} /> Approuver
                     </button>
                     <button 
                       onClick={() => handleAction(exp, 'expenses', 'reject')}
                       className="btn" 
                       style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', display: 'flex', justifyContent: 'center' }}
                     >
                       <X size={16} /> Refuser
                     </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '1rem', fontWeight: 700, background: ['Validé', 'Payé'].includes(exp.statut) ? '#10B98120' : '#EF444420', color: ['Validé', 'Payé'].includes(exp.statut) ? '#10B981' : '#EF4444' }}>
                      {exp.statut}
                    </span>
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
