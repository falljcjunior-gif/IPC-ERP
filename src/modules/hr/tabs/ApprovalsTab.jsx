import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '../../../BusinessContext';
import { Check, X, Calendar, DollarSign, Clock, FileText } from 'lucide-react';

const ApprovalsTab = () => {
  const { data, updateRecord, currentUser, formatCurrency } = useBusiness();

  // Combine leaves and expenses
  const allLeaves = data.hr?.leaves || [];
  const allExpenses = data.hr?.expenses || [];

  const pendingLeaves = allLeaves.filter(l => l.statut === 'En attente' || l.statut === 'Brouillon');
  const pendingExpenses = allExpenses.filter(e => e.statut === 'En attente' || e.statut === 'Brouillon');

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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      {/* Leaves Column */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)' }}>
          <Calendar size={20} color="#6366F1" /> Déclarations d'Absences
          <span style={{ background: '#6366F120', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', color: '#6366F1' }}>
            {pendingLeaves.length}
          </span>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {pendingLeaves.length === 0 && (
               <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                 Aucune demande de congé en attente.
               </div>
            )}
            {pendingLeaves.map(leave => (
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
            {pendingExpenses.length}
          </span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {pendingExpenses.length === 0 && (
               <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                 Aucun frais à valider.
               </div>
            )}
            {pendingExpenses.map(exp => (
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ApprovalsTab;
