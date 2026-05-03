export const officeAdminSchema = {
  id: 'office_admin',
  title: 'Services Généraux & Administration',
  icon: 'inbox',
  models: {
    // 📨 Gestion du Courrier & Colis
    mail_logs: {
      label: 'Courriers & Colis',
      fields: {
        date: { type: 'date', label: 'Date', required: true },
        type: { type: 'selection', label: 'Type', options: ['entrant', 'sortant'], required: true },
        category: { type: 'selection', label: 'Catégorie', options: ['lettre', 'colis', 'recommandé', 'facture'], required: true },
        sender: { type: 'text', label: 'Expéditeur' },
        recipient: { type: 'text', label: 'Destinataire (Interne)', required: true },
        trackingNumber: { type: 'text', label: 'Numéro de suivi' },
        status: { type: 'selection', label: 'Statut', options: ['reçu', 'en_attente_distribution', 'distribué', 'envoyé'], default: 'reçu' },
        notes: { type: 'textarea', label: 'Notes' }
      },
      views: {
        list: ['date', 'type', 'category', 'sender', 'recipient', 'status'],
        form: ['date', 'type', 'category', 'sender', 'recipient', 'trackingNumber', 'status', 'notes']
      }
    },
    
    // 🏢 Fournitures & Achats internes
    office_supplies: {
      label: 'Fournitures & Matériel',
      fields: {
        itemName: { type: 'text', label: 'Article', required: true },
        category: { type: 'selection', label: 'Catégorie', options: ['papeterie', 'informatique', 'cuisine', 'mobilier', 'autre'] },
        quantity: { type: 'number', label: 'Quantité Demandée', required: true },
        requestedBy: { type: 'text', label: 'Demandeur' },
        department: { type: 'text', label: 'Département' },
        status: { type: 'selection', label: 'Statut', options: ['brouillon', 'en_attente_validation', 'commandé', 'reçu', 'rejeté'], default: 'brouillon' },
        priority: { type: 'selection', label: 'Priorité', options: ['basse', 'normale', 'urgente'], default: 'normale' },
        estimatedCost: { type: 'money', label: 'Coût Estimé' },
        supplier: { type: 'text', label: 'Fournisseur Suggéré' }
      },
      views: {
        list: ['itemName', 'quantity', 'requestedBy', 'status', 'priority'],
        form: ['itemName', 'category', 'quantity', 'requestedBy', 'department', 'priority', 'status', 'estimatedCost', 'supplier']
      }
    },

    // 🤝 Registre des Visiteurs
    visitors_log: {
      label: 'Registre des Visiteurs',
      fields: {
        visitorName: { type: 'text', label: 'Nom du Visiteur', required: true },
        company: { type: 'text', label: 'Entreprise' },
        hostName: { type: 'text', label: 'Hôte (Personne visitée)', required: true },
        checkIn: { type: 'date', label: 'Heure d\'arrivée', required: true },
        checkOut: { type: 'date', label: 'Heure de départ' },
        purpose: { type: 'text', label: 'Motif de la visite' },
        badgeNumber: { type: 'text', label: 'Numéro de Badge' },
        status: { type: 'selection', label: 'Statut', options: ['attendu', 'sur_place', 'parti'], default: 'attendu' }
      },
      views: {
        list: ['visitorName', 'hostName', 'checkIn', 'status', 'badgeNumber'],
        form: ['visitorName', 'company', 'hostName', 'purpose', 'checkIn', 'checkOut', 'badgeNumber', 'status']
      }
    },

    // 📅 Espaces & Interventions (Services Généraux)
    facilities_tickets: {
      label: 'Demandes d\'Intervention',
      fields: {
        title: { type: 'text', label: 'Problème', required: true },
        location: { type: 'text', label: 'Lieu / Salle', required: true },
        description: { type: 'textarea', label: 'Description', required: true },
        reportedBy: { type: 'text', label: 'Signalé par' },
        priority: { type: 'selection', label: 'Urgence', options: ['faible', 'moyenne', 'haute', 'critique'], default: 'moyenne' },
        type: { type: 'selection', label: 'Type d\'intervention', options: ['nettoyage', 'plomberie', 'électricité', 'climatisation', 'autre'] },
        status: { type: 'selection', label: 'Statut', options: ['nouveau', 'en_cours', 'résolu', 'annulé'], default: 'nouveau' },
        assignedTo: { type: 'text', label: 'Assigné à (Prestataire/Tech)' }
      },
      views: {
        list: ['title', 'location', 'priority', 'status', 'type'],
        form: ['title', 'location', 'type', 'priority', 'status', 'reportedBy', 'assignedTo', 'description']
      }
    }
  }
};
