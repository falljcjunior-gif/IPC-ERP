import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LifeBuoy, 
  MessageSquare, 
  Plus, 
  Search, 
  ChevronRight, 
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  ExternalLink
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KanbanBoard from '../components/KanbanBoard';

const Helpdesk = ({ onOpenDetail }) => {
  const { data, addRecord, updateRecord } = useBusiness();
  const [view, setView] = useState('kanban'); // 'list', 'kanban'
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Initialize mock data if missing
  if (!data.helpdesk) {
    data.helpdesk = {
      tickets: [
        { id: '1', num: 'TKT-2026-0001', client: 'Société Générale', titre: 'Problème accès API', priorite: 'Haute', statut: 'En cours', assigne: 'Raphaël', echeance: '2026-04-10' },
        { id: '2', num: 'TKT-2026-0002', client: 'Air France', titre: 'Erreur facturation TVA', priorite: 'Moyenne', statut: 'Nouveau', assigne: 'Sarah', echeance: '2026-04-12' },
      ]
    };
  }

  const { tickets } = data.helpdesk;
  const stages = ['Nouveau', 'En cours', 'En attente', 'Résolu'];

  const handleSave = (formData) => {
    addRecord('helpdesk', 'tickets', formData);
    setIsModalOpen(false);
  };

  const handleMoveTicket = (item, nextCol) => {
    updateRecord('helpdesk', 'tickets', item.id, { statut: nextCol });
  };

  const transformToTask = (ticket) => {
    addRecord('projects', 'tasks', {
      titre: `[SUPPORT] ${ticket.titre}`,
      projet: "Support Client Global",
      assigne: ticket.assigne,
      echeance: ticket.echeance,
      priorite: ticket.priorite,
      statut: 'À faire',
      description: `Généré depuis le ticket ${ticket.num}. Client: ${ticket.client}`
    });
    
    updateRecord('helpdesk', 'tickets', ticket.id, { hasTask: true });
    
    // Simulate notification
    alert(`Tâche projet créée pour le ticket ${ticket.num}`);
  };

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Support & Helpdesk</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gérez les incidents clients et transformez-les en actions concrètes.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.8rem', border: '1px solid var(--border)' }}>
            <button onClick={() => setView('kanban')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'kanban' ? 'var(--bg)' : 'transparent', color: view === 'kanban' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Kanban</button>
            <button onClick={() => setView('list')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'list' ? 'var(--bg)' : 'transparent', color: view === 'list' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Liste</button>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Nouveau Ticket
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <KanbanBoard 
          columns={stages}
          items={tickets}
          columnMapping="statut"
          onMove={handleMoveTicket}
          onItemClick={(t) => onOpenDetail(t, 'helpdesk', 'tickets')}
          renderCardContent={(t) => (
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{t.num}</span>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: t.priorite === 'Haute' ? '#EF4444' : t.priorite === 'Moyenne' ? '#F59E0B' : '#10B981' 
                }} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t.titre}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{t.client}</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                  <User size={12} /> {t.assigne}
                </div>
                {!t.hasTask && (
                   <button 
                    onClick={(e) => { e.stopPropagation(); transformToTask(t); }}
                    style={{ background: 'var(--primary)15', border: 'none', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ExternalLink size={10} /> Créer Tâche
                  </button>
                )}
                {t.hasTask && (
                  <span style={{ fontSize: '0.6rem', color: '#10B981', fontWeight: 700 }}>✔ Lié Projet</span>
                )}
              </div>
            </div>
          )}
        />
      ) : (
        <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem' }}>Référence</th>
                <th style={{ padding: '1rem 1.5rem' }}>Titre</th>
                <th style={{ padding: '1rem 1.5rem' }}>Client</th>
                <th style={{ padding: '1rem 1.5rem' }}>Assigné</th>
                <th style={{ padding: '1rem 1.5rem' }}>Priorité</th>
                <th style={{ padding: '1rem 1.5rem' }}>Statut</th>
                <th style={{ padding: '1rem 1.5rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => onOpenDetail(t, 'helpdesk', 'tickets')}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{t.num}</td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{t.titre}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{t.client}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{t.assigne}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ color: t.priorite === 'Haute' ? '#EF4444' : 'inherit' }}>{t.priorite}</span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>{t.statut}</td>
                  <td style={{ padding: '1rem 1.5rem' }}><ChevronRight size={18} /></td>
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
        title="Nouveau Ticket Support"
        fields={[
          { name: 'titre', label: 'Titre du problème', required: true },
          { name: 'client', label: 'Client', type: 'select', options: data.base.contacts.map(c => c.nom), required: true },
          { name: 'priorite', label: 'Priorité', type: 'select', options: ['Basse', 'Moyenne', 'Haute', 'Critique'], required: true },
          { name: 'assigne', label: 'Assigner à', type: 'select', options: data.hr.employees.map(e => e.nom), required: true },
          { name: 'echeance', label: 'Échéance souhaitée', type: 'date', required: true },
        ]}
      />
    </div>
  );
};

export default Helpdesk;
