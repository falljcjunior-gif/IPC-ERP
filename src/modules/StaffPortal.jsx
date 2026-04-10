import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Wallet, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  User,
  LayoutDashboard
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';

const StaffPortal = () => {
  const { data, currentUser, addRecord, formatCurrency } = useBusiness();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'leaves', 'expenses'
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter data for the current user
  const myLeaves = data.hr.leaves.filter(l => l.employe === currentUser.nom);
  const myExpenses = data.hr.expenses.filter(e => e.employe === currentUser.nom);

  const handleSave = (formData) => {
    const subModule = activeTab === 'leaves' ? 'leaves' : 'expenses';
    // Force the employee name to current user
    addRecord('hr', subModule, { ...formData, employe: currentUser.nom, statut: 'En attente' });
    setIsModalOpen(false);
  };

  const modalFields = activeTab === 'leaves' ? [
    { name: 'type', label: 'Type de Congé', type: 'select', options: ['Congés Payés', 'Maladie', 'RTT', 'Formation'], required: true },
    { name: 'du', label: 'Date de début', type: 'date', required: true },
    { name: 'au', label: 'Date de fin', type: 'date', required: true },
    { name: 'commentaire', label: 'Commentaire / Justification', placeholder: 'Ex: Vacances annuelles' },
  ] : [
    { name: 'objet', label: 'Objet de la dépense', required: true, placeholder: 'Ex: Taxi RDV Client' },
    { name: 'montant', label: 'Montant (FCFA)', type: 'number', required: true },
    { name: 'date', label: 'Date de la dépense', type: 'date', required: true },
    { name: 'type', label: 'Catégorie', type: 'select', options: ['Transport', 'Repas', 'Hébergement', 'Divers'], required: true },
  ];

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <KpiCard 
          title="Solde Congés" 
          value="18.5 Jours"
          trend={2} 
          trendType="up" 
          icon={<Calendar size={24} />} 
          color="var(--accent)"
        />
        <KpiCard 
          title="Frais en attente" 
          value={formatCurrency(myExpenses.filter(e => e.statut === 'En attente').reduce((sum, e) => sum + e.montant, 0))}
          icon={<Wallet size={24} />} 
          color="#F59E0B"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} /> Demandes Récentes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...myLeaves, ...myExpenses].slice(0, 4).map((req, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--bg-subtle)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.type || req.objet}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.du || req.date}</div>
                </div>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  background: req.statut === 'Validé' ? '#10B98120' : '#F59E0B20',
                  color: req.statut === 'Validé' ? '#10B981' : '#F59E0B',
                  fontWeight: 700
                }}>
                  {req.statut}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} /> Documents RH
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <li style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
               <span>Fiche de paie - Mars 2026</span>
               <div style={{ color: 'var(--accent)' }}>Télécharger</div>
            </li>
            <li style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
               <span>Contrat de Travail</span>
               <div style={{ color: 'var(--accent)' }}>Voir</div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Bienvenue, {currentUser.nom}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Votre espace collaborateur I.P.C</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="glass" style={{ padding: '0.25rem', borderRadius: '1rem', display: 'flex', gap: '0.25rem' }}>
            <button 
              onClick={() => setActiveTab('dashboard')}
              style={{ 
                padding: '0.5rem 1.25rem', 
                borderRadius: '0.75rem', 
                border: 'none', 
                background: activeTab === 'dashboard' ? 'var(--accent)' : 'transparent', 
                color: activeTab === 'dashboard' ? 'white' : 'var(--text-muted)', 
                cursor: 'pointer', 
                fontWeight: 600, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}
            >
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('leaves')}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '0.75rem', border: 'none', background: activeTab === 'leaves' ? 'var(--accent)' : 'transparent', color: activeTab === 'leaves' ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
            >
              Congés
            </button>
            <button 
              onClick={() => setActiveTab('expenses')}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '0.75rem', border: 'none', background: activeTab === 'expenses' ? 'var(--accent)' : 'transparent', color: activeTab === 'expenses' ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}
            >
              Frais
            </button>
          </div>
          {activeTab !== 'dashboard' && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} /> Nouvelle Demande
            </button>
          )}
        </div>
      </div>

      {activeTab === 'dashboard' && renderDashboard()}

      {(activeTab === 'leaves' || activeTab === 'expenses') && (
        <div className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-subtle)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <tr>
                <th style={{ padding: '1.25rem' }}>{activeTab === 'leaves' ? 'Période' : 'Objet'}</th>
                <th style={{ padding: '1.25rem' }}>{activeTab === 'leaves' ? 'Type' : 'Montant'}</th>
                <th style={{ padding: '1.25rem' }}>Statut</th>
                <th style={{ padding: '1.25rem' }}>Détails</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'leaves' ? myLeaves : myExpenses).map((req, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '1.25rem', fontWeight: 600 }}>
                    {activeTab === 'leaves' ? `${req.du} au ${req.au}` : req.objet}
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    {activeTab === 'leaves' ? req.type : formatCurrency(req.montant)}
                  </td>
                  <td style={{ padding: '1.25rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '0.5rem', 
                      background: req.statut === 'Validé' ? '#10B98115' : '#F59E0B15', 
                      color: req.statut === 'Validé' ? '#10B981' : '#F59E0B', 
                      fontSize: '0.75rem', 
                      fontWeight: 700 
                    }}>
                      {req.statut}
                    </span>
                  </td>
                  <td style={{ padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {req.validatedAt ? `Validé par ${req.validatedBy}` : 'En cours de revue...'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={activeTab === 'leaves' ? "Demande de Congés" : "Note de Frais"}
        fields={modalFields}
      />
    </div>
  );
};

export default StaffPortal;
