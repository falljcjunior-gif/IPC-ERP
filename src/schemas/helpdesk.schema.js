export const helpdeskSchema = {
  id: 'helpdesk',
  label: 'Support & Helpdesk',
  description: 'Gestion des tickets de support interne et externe avec suivi SLA.',
  tables: {
    tickets: {
      id: 'tickets',
      label: 'Tickets',
      icon: 'Tag',
      fields: [
        { id: 'num', label: 'N° Ticket', type: 'text', required: true, primary: true },
        { id: 'titre', label: 'Sujet', type: 'text', required: true },
        { id: 'description', label: 'Description', type: 'textarea' },
        { id: 'demandeur', label: 'Demandeur', type: 'text' },
        { id: 'categorie', label: 'Catégorie', type: 'select', options: ['IT', 'RH', 'Logistique', 'Finance', 'Production', 'Autre'] },
        { id: 'priorite', label: 'Priorité', type: 'select', options: ['Basse', 'Normale', 'Haute', 'Urgent'] },
        { id: 'statut', label: 'Statut', type: 'select', options: ['Ouvert', 'En cours', 'En attente', 'Résolu', 'Fermé'] },
        { id: 'slaHeures', label: 'SLA (Heures)', type: 'number', defaultValue: 24 },
        { id: 'createdAt', label: 'Date Création', type: 'datetime' }
      ]
    },
    alerts: {
      id: 'alerts',
      label: 'Alertes SLA',
      icon: 'Zap',
      fields: [
        { id: 'ticketId', label: 'Ticket', type: 'text' },
        { id: 'type', label: 'Type Alerte', type: 'text' },
        { id: 'expiresAt', label: 'Échéance', type: 'datetime' }
      ]
    }
  }
};
