export const officeAdminSchema = {
  id: 'office_admin',
  title: 'Services Généraux & Administration',
  icon: 'inbox',
  collections: {
    // 📨 Gestion du Courrier & Colis
    mail_logs: {
      name: 'Courriers & Colis',
      fields: [
        { name: 'date', type: 'date', label: 'Date', required: true },
        { name: 'type', type: 'select', label: 'Type', options: ['entrant', 'sortant'], required: true },
        { name: 'category', type: 'select', label: 'Catégorie', options: ['lettre', 'colis', 'recommandé', 'facture'], required: true },
        { name: 'sender', type: 'string', label: 'Expéditeur' },
        { name: 'recipient', type: 'string', label: 'Destinataire (Interne)', required: true },
        { name: 'trackingNumber', type: 'string', label: 'Numéro de suivi' },
        { name: 'status', type: 'select', label: 'Statut', options: ['reçu', 'en_attente_distribution', 'distribué', 'envoyé'], default: 'reçu' },
        { name: 'notes', type: 'text', label: 'Notes' }
      ],
      views: {
        list: ['date', 'type', 'category', 'sender', 'recipient', 'status'],
        form: ['date', 'type', 'category', 'sender', 'recipient', 'trackingNumber', 'status', 'notes']
      }
    },
    
    // 🏢 Fournitures & Achats internes
    office_supplies: {
      name: 'Fournitures & Matériel',
      fields: [
        { name: 'itemName', type: 'string', label: 'Article', required: true },
        { name: 'category', type: 'select', label: 'Catégorie', options: ['papeterie', 'informatique', 'cuisine', 'mobilier', 'autre'] },
        { name: 'quantity', type: 'number', label: 'Quantité Demandée', required: true },
        { name: 'requestedBy', type: 'string', label: 'Demandeur' },
        { name: 'department', type: 'string', label: 'Département' },
        { name: 'status', type: 'select', label: 'Statut', options: ['brouillon', 'en_attente_validation', 'commandé', 'reçu', 'rejeté'], default: 'brouillon' },
        { name: 'priority', type: 'select', label: 'Priorité', options: ['basse', 'normale', 'urgente'], default: 'normale' },
        { name: 'estimatedCost', type: 'currency', label: 'Coût Estimé' },
        { name: 'supplier', type: 'string', label: 'Fournisseur Suggéré' }
      ],
      views: {
        list: ['itemName', 'quantity', 'requestedBy', 'status', 'priority'],
        form: ['itemName', 'category', 'quantity', 'requestedBy', 'department', 'priority', 'status', 'estimatedCost', 'supplier']
      }
    },

    // 🤝 Registre des Visiteurs
    visitors_log: {
      name: 'Registre des Visiteurs',
      fields: [
        { name: 'visitorName', type: 'string', label: 'Nom du Visiteur', required: true },
        { name: 'company', type: 'string', label: 'Entreprise' },
        { name: 'hostName', type: 'string', label: 'Hôte (Personne visitée)', required: true },
        { name: 'checkIn', type: 'datetime', label: 'Heure d\'arrivée', required: true },
        { name: 'checkOut', type: 'datetime', label: 'Heure de départ' },
        { name: 'purpose', type: 'string', label: 'Motif de la visite' },
        { name: 'badgeNumber', type: 'string', label: 'Numéro de Badge' },
        { name: 'status', type: 'select', label: 'Statut', options: ['attendu', 'sur_place', 'parti'], default: 'attendu' }
      ],
      views: {
        list: ['visitorName', 'hostName', 'checkIn', 'status', 'badgeNumber'],
        form: ['visitorName', 'company', 'hostName', 'purpose', 'checkIn', 'checkOut', 'badgeNumber', 'status']
      }
    },

    // 📅 Espaces & Interventions (Services Généraux)
    facilities_tickets: {
      name: 'Demandes d\'Intervention',
      fields: [
        { name: 'title', type: 'string', label: 'Problème', required: true },
        { name: 'location', type: 'string', label: 'Lieu / Salle', required: true },
        { name: 'description', type: 'text', label: 'Description', required: true },
        { name: 'reportedBy', type: 'string', label: 'Signalé par' },
        { name: 'priority', type: 'select', label: 'Urgence', options: ['faible', 'moyenne', 'haute', 'critique'], default: 'moyenne' },
        { name: 'type', type: 'select', label: 'Type d\'intervention', options: ['nettoyage', 'plomberie', 'électricité', 'climatisation', 'autre'] },
        { name: 'status', type: 'select', label: 'Statut', options: ['nouveau', 'en_cours', 'résolu', 'annulé'], default: 'nouveau' },
        { name: 'assignedTo', type: 'string', label: 'Assigné à (Prestataire/Tech)' }
      ],
      views: {
        list: ['title', 'location', 'priority', 'status', 'type'],
        form: ['title', 'location', 'type', 'priority', 'status', 'reportedBy', 'assignedTo', 'description']
      }
    }
  }
};
