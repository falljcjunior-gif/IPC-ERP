/**
 *  NEXUS OS: IT OPERATIONS SCHEMA (ELITE 2.0)
 * Expanded for AIOps, Cybersecurity monitoring, and SLA tracking.
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
        health_score: { label: 'Health Score', type: 'number', min: 0, max: 100 }, // AIOps Score
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
        sla_target: { label: 'Cible SLA (min)', type: 'number' },
        sla_actual: { label: 'SLA Réel (min)', type: 'number' },
        sla_expiration: { label: 'Échéance SLA', type: 'datetime' }
      }
    },
    security_logs: {
      id: 'security_logs',
      label: 'Logs de Sécurité',
      fields: {
        timestamp: { label: 'Horodatage', type: 'datetime' },
        event_type: { label: 'Type d\'Événement', type: 'select', options: ['Login', 'Logout', 'Auth_Fail', 'Permission_Change', 'API_Key_Rotation'] },
        user_id: { label: 'Utilisateur', type: 'reference', collection: 'users' },
        ip_address: { label: 'Adresse IP', type: 'string' },
        location: { label: 'Localisation', type: 'string' }, // City, Country
        user_agent: { label: 'User Agent', type: 'string' },
        risk_level: { label: 'Niveau de Risque', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] }
      }
    },
    maintenance: {
      id: 'maintenance',
      label: 'Historique Maintenance',
      fields: {
        asset_id: { label: 'Asset', type: 'reference', collection: 'assets' },
        type: { label: 'Type', type: 'select', options: ['Corrective', 'Préventive', 'Évolutive'] },
        description: { label: 'Intervention', type: 'text' },
        technicien: { label: 'Technicien', type: 'string' },
        date: { label: 'Date', type: 'date' },
        cost: { label: 'Coût', type: 'number' }
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
