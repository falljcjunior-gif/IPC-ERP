import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  Wallet, 
  Plus, 
  Mail, 
  Phone, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  ChevronRight,
  BarChart3,
  Layout,
  TrendingUp,
  UserCheck, 
  Check, 
  X 
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';
import { DonutChartComp } from '../components/BusinessCharts';

const HR = ({ onOpenDetail }) => {
  const { data, addRecord, approveRequest, rejectRequest, formatCurrency } = useBusiness();
  const [view, setView] = useState('dashboard'); // 'employees', 'leaves', 'expenses', 'dashboard'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { employees, leaves, expenses } = data.hr;

  const deptData = [
    { name: 'IT', value: employees.filter(e => e.dept === 'IT').length },
    { name: 'Ventes', value: employees.filter(e => e.dept === 'Ventes').length },
    { name: 'Production', value: employees.filter(e => e.dept === 'Production').length },
    { name: 'Finance', value: employees.filter(e => e.dept === 'Finance').length },
    { name: 'RH', value: employees.filter(e => e.dept === 'RH').length },
  ];

  const handleSave = (formData) => {
    const subModule = view === 'employees' ? 'employees' : view === 'leaves' ? 'leaves' : 'expenses';
    addRecord('hr', subModule, formData);
  };

  const modalFields = view === 'employees' ? [
    { name: 'nom', label: 'Nom Complet', required: true },
    { name: 'poste', label: 'Poste / Fonction', required: true },
    { name: 'dept', label: 'Département', type: 'select', options: ['IT', 'Ventes', 'RH', 'Finance', 'Production', 'Marketing'], required: true },
    { name: 'manager', label: 'Manager / Responsable', required: true },
    { name: 'dateEntree', label: 'Date d\'embauche', type: 'date', required: true },
    { name: 'avatar', label: 'Initiales (Avatar)', required: true, placeholder: 'Ex: JD' },
  ] : view === 'leaves' ? [
    { name: 'employe', label: 'Employé', type: 'select', options: employees.map(e => e.nom), required: true },
    { name: 'type', label: 'Type de Congé', type: 'select', options: ['Congés Payés', 'Maladie', 'RTT', 'Formation', 'Autre'], required: true },
    { name: 'du', label: 'Du', type: 'date', required: true },
    { name: 'au', label: 'Au', type: 'date', required: true },
    { name: 'statut', label: 'Statut', type: 'select', options: ['Brouillon', 'En attente', 'Validé', 'Refusé'], required: true },
  ] : [
    { name: 'employe', label: 'Employé', type: 'select', options: employees.map(e => e.nom), required: true },
    { name: 'objet', label: 'Objet de la dépense', required: true, placeholder: 'Ex: Déjeuner Client' },
    { name: 'montant', label: 'Montant (€)', type: 'number', required: true },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'statut', label: 'Statut', type: 'select', options: ['En attente', 'Approuvé', 'Remboursé', 'Refusé'], required: true },
  ];

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <KpiCard 
          title="Effectif Total" 
          value={employees.length}
          trend={2.4} 
          trendType="up" 
          icon={<Users size={24} />} 
          color="#3B82F6"
          sparklineData={[{val: 120}, {val: 122}, {val: 121}, {val: 124}, {val: 125}]}
        />
        <KpiCard 
          title="Taux d'Absence" 
          value="3.2%"
          trend={0.5} 
          trendType="down" 
          icon={<Clock size={24} />} 
          color="#EF4444"
          sparklineData={[{val: 4}, {val: 3.8}, {val: 4.2}, {val: 3.5}, {val: 3.2}]}
        />
        <KpiCard 
          title="Notes de Frais" 
          value={`${(expenses.reduce((sum, e) => sum + e.montant, 0) / 1000).toFixed(1)}k€`}
          trend={1.2} 
          trendType="up" 
          icon={<Wallet size={24} />} 
          color="#10B981"
          sparklineData={[{val: 10}, {val: 11}, {val: 10.5}, {val: 11.2}, {val: 12}]}
        />
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', maxWidth: '500px' }}>
        <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Répartition par Département</h3>
        <DonutChartComp data={deptData} />
      </div>
    </div>
  );

  const renderEmployees = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
      {employees.map((emp) => (
        <motion.div
           key={emp.id}
           whileHover={{ y: -5 }}
           onClick={() => onOpenDetail(emp, 'hr', 'employees')}
           className="glass"
           style={{ padding: '2rem', borderRadius: '1.5rem', textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 1.5rem' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyScroll: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700 }}>
              {emp.avatar}
            </div>
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{emp.nom}</h3>
          <p style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem' }}>{emp.poste}</p>
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
            <Briefcase size={14} /> {emp.dept}
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderLeaves = () => (
    <div className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <tr>
            <th style={{ padding: '1.25rem' }}>Employé</th>
            <th style={{ padding: '1.25rem' }}>Type</th>
            <th style={{ padding: '1.25rem' }}>Du / Au</th>
            <th style={{ padding: '1.25rem' }}>Statut</th>
            <th style={{ padding: '1.25rem' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.map((l) => (
            <tr key={l.id} style={{ borderTop: '1px solid var(--border)' }}>
              <td style={{ padding: '1.25rem', fontWeight: 600 }}>{l.employe}</td>
              <td style={{ padding: '1.25rem' }}>{l.type}</td>
              <td style={{ padding: '1.25rem' }}>{l.du} au {l.au}</td>
              <td style={{ padding: '1.25rem' }}>
                <span style={{ 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '0.5rem', 
                  background: l.statut === 'Validé' ? '#10B98115' : l.statut === 'Refusé' ? '#EF444415' : '#F59E0B15', 
                  color: l.statut === 'Validé' ? '#10B981' : l.statut === 'Refusé' ? '#EF4444' : '#F59E0B', 
                  fontSize: '0.75rem', 
                  fontWeight: 600
                }}>
                  {l.statut}
                </span>
              </td>
              <td style={{ padding: '1.25rem' }}>
                {l.statut === 'En attente' ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => approveRequest('hr', 'leaves', l.id)} style={{ padding: '0.4rem', borderRadius: '0.5rem', border: 'none', background: '#10B98120', color: '#10B981', cursor: 'pointer' }}><Check size={14} /></button>
                    <button onClick={() => rejectRequest('hr', 'leaves', l.id)} style={{ padding: '0.4rem', borderRadius: '0.5rem', border: 'none', background: '#EF444420', color: '#EF4444', cursor: 'pointer' }}><X size={14} /></button>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Traité</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Ressources Humaines</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gérez vos talents, congés et notes de frais.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-subtle)', 
            padding: '0.25rem', 
            borderRadius: '0.8rem',
            border: '1px solid var(--border)' 
          }}>
            <button 
              onClick={() => setView('dashboard')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: view === 'dashboard' ? 'var(--bg)' : 'transparent',
                color: view === 'dashboard' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <BarChart3 size={16} /> Dashboard
            </button>
            <button 
              onClick={() => setView('employees')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: view === 'employees' ? 'var(--bg)' : 'transparent',
                color: view === 'employees' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <Layout size={16} /> Employés
            </button>
            <button onClick={() => setView('leaves')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'leaves' ? 'var(--bg)' : 'transparent', color: view === 'leaves' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Congés</button>
            <button onClick={() => setView('expenses')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'expenses' ? 'var(--bg)' : 'transparent', color: view === 'expenses' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Frais</button>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
             <Plus size={18} /> Nouveau
          </button>
        </div>
      </div>

      {view === 'dashboard' && renderDashboard()}
      {view === 'employees' && renderEmployees()}
      {view === 'leaves' && renderLeaves()}
      {view === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {expenses.map(ex => (
             <div key={ex.id} className="glass" style={{ padding: '1rem 2rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{ex.employe}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{ex.objet}</div>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700 }}>{formatCurrency(ex.montant)}</div>
                  {ex.statut === 'En attente' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => approveRequest('hr', 'expenses', ex.id)} className="btn-icon" style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: '#10B98120', color: '#10B981', cursor: 'pointer' }}>Approuver</button>
                      <button onClick={() => rejectRequest('hr', 'expenses', ex.id)} className="btn-icon" style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: '#EF444420', color: '#EF4444', cursor: 'pointer' }}>Refuser</button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ex.statut === 'Validé' ? '#10B981' : '#EF4444' }}>{ex.statut}</span>
                  )}
                </div>
             </div>
          ))}
        </div>
      )}

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title="Créer une Ressource"
        fields={modalFields}
      />
    </div>
  );
};

export default HR;
