import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  CreditCard,
  FileText,
  Clock,
  User,
  Truck
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';

const Expenses = ({ onOpenDetail }) => {
  const { data, addRecord, updateRecord, userRole } = useBusiness();
  const [view, setView] = useState('mine'); // 'mine', 'to-validate'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize mock data if missing
  if (!data.hr.expenses) {
    data.hr.expenses = [
      { id: '1', employee: 'Jean Dupont', date: '2026-04-05', title: 'Déplacement Client Lyon', amount: 125.50, type: 'Transport', status: 'Payé', receipt: true },
      { id: '2', employee: 'Marie Leroy', date: '2026-04-08', title: 'Déjeuner Projet X', amount: 42.00, type: 'Repas', status: 'En attente', receipt: true },
      { id: '3', employee: 'Jean Dupont', date: '2026-04-09', title: 'Abonnement SaaS', amount: 29.99, type: 'Autre', status: 'En attente', receipt: true },
    ];
  }

  const { expenses } = data.hr;
  const isManager = userRole === 'ADMIN' || userRole === 'HR' || userRole === 'FINANCE';

  const handleSave = (formData) => {
    addRecord('hr', 'expenses', { ...formData, status: 'En attente', receipt: true });
    setIsModalOpen(false);
  };

  const handleAction = (id, newStatus) => {
    updateRecord('hr', 'expenses', id, { status: newStatus });
  };

  const filteredExpenses = view === 'mine' 
    ? expenses.filter(e => e.employee === 'Jean Dupont') 
    : expenses.filter(e => e.status === 'En attente');

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Notes de Frais</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gérez vo dépenses professionnelles et les remboursements collaborateurs.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.8rem', border: '1px solid var(--border)' }}>
            <button onClick={() => setView('mine')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'mine' ? 'var(--bg)' : 'transparent', color: view === 'mine' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Mes Frais</button>
            {isManager && (
               <button onClick={() => setView('to-validate')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'to-validate' ? 'var(--bg)' : 'transparent', color: view === 'to-validate' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>À Valider</button>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Déclarer un frais
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredExpenses.map(exp => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass"
            style={{ padding: '1.25rem 2rem', borderRadius: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            onClick={() => onOpenDetail(exp, 'hr', 'expenses')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)10', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {exp.type === 'Transport' ? <Truck size={20} /> : exp.type === 'Repas' ? <CreditCard size={20} /> : <FileText size={20} />}
                  </div>
                  <div>
                     <div style={{ fontWeight: 700, fontSize: '1rem' }}>{exp.title}</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} /> {exp.employee} • {exp.date}
                     </div>
                  </div>
               </div>
               
               <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{exp.type}</div>
               </div>

               <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Montant</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{exp.amount.toFixed(2)} FCFA</div>
               </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
               <span style={{ 
                 padding: '0.25rem 0.75rem', 
                 borderRadius: '0.6rem', 
                 background: exp.status === 'Payé' ? '#10B98115' : exp.status === 'Validé' ? '#3B82F615' : '#F59E0B15', 
                 color: exp.status === 'Payé' ? '#10B981' : exp.status === 'Validé' ? '#3B82F6' : '#F59E0B',
                 fontSize: '0.75rem',
                 fontWeight: 700
               }}>
                 {exp.status}
               </span>

               {view === 'to-validate' && (
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={(e) => { e.stopPropagation(); handleAction(exp.id, 'Rejeté'); }} className="glass" style={{ p: '0.5rem', borderRadius: '0.5rem', color: '#EF4444', border: 'none' }}><XCircle size={20} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleAction(exp.id, 'Validé'); }} className="btn btn-primary" style={{ padding: '0.5rem', borderRadius: '0.5rem' }}><CheckCircle2 size={20} /></button>
                 </div>
               )}
            </div>
          </motion.div>
        ))}
      </div>

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title="Nouvelle Note de Frais"
        fields={[
          { name: 'title', label: 'Libellé de la dépense', required: true },
          { name: 'amount', label: 'Montant TTC (FCFA)', type: 'number', required: true },
          { name: 'date', label: 'Date de la dépense', type: 'date', required: true },
          { name: 'type', label: 'Catégorie', type: 'select', options: ['Transport', 'Repas', 'Hébergement', 'Fournitures', 'Autre'], required: true },
          { name: 'employee', label: 'Collaborateur', type: 'select', options: data.hr.employees.map(e => e.nom), required: true },
        ]}
      />
    </div>
  );
};

export default Expenses;
