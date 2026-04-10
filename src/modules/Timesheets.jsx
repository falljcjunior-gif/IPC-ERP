import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Calendar, 
  User, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';

const Timesheets = () => {
  const { data, addRecord, updateRecord, userRole } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Initialize mock data if missing
  if (!data.hr.timesheets) {
    data.hr.timesheets = [
      { id: '1', collaborateur: 'Jean Dupont', date: '2026-04-08', projet: 'Refonte Site Web', heures: 7.5, statut: 'Validé', commentaire: 'Phase de design terminée' },
      { id: '2', collaborateur: 'Jean Dupont', date: '2026-04-09', projet: 'Audit Sécurité', heures: 4, statut: 'En attente', commentaire: 'Analyse des logs' },
      { id: '3', collaborateur: 'Marie Leroy', date: '2026-04-09', projet: 'Formation Client', heures: 8, statut: 'En attente', commentaire: 'Session présentielle' },
    ];
  }

  const { timesheets } = data.hr;
  const isManager = userRole === 'ADMIN' || userRole === 'HR';

  const handleSave = (formData) => {
    addRecord('hr', 'timesheets', { ...formData, statut: 'En attente' });
    setIsModalOpen(false);
  };

  const handleValidation = (id, newStatut) => {
    updateRecord('hr', 'timesheets', id, { statut: newStatut });
  };

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Feuilles de Temps</h1>
          <p style={{ color: 'var(--text-muted)' }}>Suivez et validez le temps passé sur vos projets.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Saisir mes heures
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {timesheets.map(ts => (
          <motion.div 
            key={ts.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass"
            style={{ padding: '1.5rem 2rem', borderRadius: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <User size={20} color="var(--accent)" />
                </div>
                <div>
                   <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ts.collaborateur}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ts.date}</div>
                </div>
              </div>

              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projet / Activité</div>
                 <div style={{ fontWeight: 600 }}>{ts.projet}</div>
              </div>

              <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Durée</div>
                 <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>{ts.heures} h</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                borderRadius: '0.6rem', 
                background: ts.statut === 'Validé' ? '#10B98115' : ts.statut === 'Soumis' ? '#3B82F615' : '#F59E0B15', 
                color: ts.statut === 'Validé' ? '#10B981' : ts.statut === 'Soumis' ? '#3B82F6' : '#F59E0B',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {ts.statut}
              </span>

              {isManager && ts.statut === 'En attente' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleValidation(ts.id, 'Refusé')}
                    className="glass"
                    style={{ p: '0.5rem', borderRadius: '0.5rem', color: '#EF4444', border: '1px solid #EF444420' }}
                  >
                    <XCircle size={18} />
                  </button>
                  <button 
                    onClick={() => handleValidation(ts.id, 'Validé')}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem', borderRadius: '0.5rem' }}
                  >
                    <CheckCircle2 size={18} />
                  </button>
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
        title="Nouvelle Saisie de Temps"
        fields={[
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'projet', label: 'Projet', type: 'select', options: data.projects.projects.map(p => p.nom), required: true },
          { name: 'heures', label: 'Nombre d\'heures', type: 'number', required: true },
          { name: 'commentaire', label: 'Détail de l\'activité' },
          { name: 'collaborateur', label: 'Collaborateur', type: 'select', options: data.hr.employees.map(e => e.nom), required: true },
        ]}
      />
    </div>
  );
};

export default Timesheets;
