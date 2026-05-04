/**
 * 🛠️ NEXUS OS: IT OPERATIONS SCHEMA
 * Defined for infrastructure monitoring, asset management, and service desk operations.
 */
export const itSchema = {
  id: 'it',
  label: 'IT Operations',
  icon: 'Shield',
  models: {
    assets: {
      id: 'assets',
      label: 'Parc Informatique',
      fields: {
        code: { label: 'Tag Asset', type: 'string', required: true },
        type: { label: 'Type', type: 'select', options: ['Laptop', 'Desktop', 'Server', 'Network', 'Mobile', 'Peripheral'] },
        marque: { label: 'Marque', type: 'string' },
        modele: { label: 'Modèle', type: 'string' },
        serial: { label: 'Numéro de Série', type: 'string' },
        assigneA: { label: 'Assigné à', type: 'reference', collection: 'users' },
        statut: { label: 'État', type: 'select', options: ['Opérationnel', 'En Réparation', 'Obsolète', 'Perdu', 'Stock'] },
        dateAchat: { label: 'Date d\'Achat', type: 'date' },
        finGarantie: { label: 'Fin de Garantie', type: 'date' },
        valeur: { label: 'Valeur Acquisition', type: 'number' }
      }
    },
    tickets: {
      id: 'tickets',
      label: 'Service Desk',
      fields: {
        titre: { label: 'Sujet', type: 'string', required: true },
        priorite: { label: 'Priorité', type: 'select', options: ['P1 - Critique', 'P2 - Haute', 'P3 - Moyenne', 'P4 - Basse'] },
        demandeur: { label: 'Demandeur', type: 'reference', collection: 'users' },
        technicien: { label: 'Technicien', type: 'reference', collection: 'users' },
        statut: { label: 'Statut', type: 'select', options: ['Nouveau', 'En cours', 'En attente', 'Résolu', 'Fermé'] },
        categorie: { label: 'Catégorie', type: 'select', options: ['Matériel', 'Logiciel', 'Réseau', 'Accès/MDP', 'Autre'] },
        description: { label: 'Description', type: 'text' },
        sla_expiration: { label: 'Échéance SLA', type: 'datetime' }
      }
    },
    licenses: {
      id: 'licenses',
      label: 'Logiciels & Licences',
      fields: {
        nom: { label: 'Logiciel', type: 'string', required: true },
        editeur: { label: 'Éditeur', type: 'string' },
        type: { label: 'Type', type: 'select', options: ['SaaS', 'On-Premise', 'Open Source'] },
        cout_mensuel: { label: 'Coût Mensuel', type: 'number' },
        date_renouvellement: { label: 'Prochain Renouvellement', type: 'date' },
        sieges_total: { label: 'Sièges Totaux', type: 'number' },
        sieges_utilises: { label: 'Sièges Utilisés', type: 'number' }
      }
    }
  }
};
