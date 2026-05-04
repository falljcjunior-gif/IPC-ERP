/**
 * 🏭 NEXUS OS: GMAO (GESTION DE MAINTENANCE ASSISTÉE PAR ORDINATEUR) SCHEMA
 * Critical for factory operations (Presses, Mixers, Molds).
 */
export const maintenanceSchema = {
  id: 'maintenance',
  label: 'Maintenance Industrielle',
  models: {
    assets: {
      label: 'Parc Machines',
      fields: {
        name: { label: 'Nom de la Machine', type: 'text', required: true },
        code: { label: 'Code Asset', type: 'text', required: true },
        type: { label: 'Type', type: 'selection', options: ['Presse', 'Mixeur', 'Moule', 'Convoyeur', 'Autre'], required: true },
        status: { label: 'État Opérationnel', type: 'selection', options: ['Opérationnel', 'En Panne', 'En Maintenance', 'Arrêt Critique'], default: 'Opérationnel' },
        lastMaintenance: { label: 'Dernière Maintenance', type: 'date' },
        nextMaintenance: { label: 'Prochaine Maintenance', type: 'date' },
        healthScore: { label: 'Health Score (%)', type: 'number', default: 100 }
      }
    },
    workOrders: {
      label: 'Bons de Travail',
      fields: {
        title: { label: 'Titre de l\'intervention', type: 'text', required: true },
        assetId: { label: 'Machine Concernée', type: 'text', required: true },
        priority: { label: 'Priorité', type: 'selection', options: ['P1 - Critique', 'P2 - Haute', 'P3 - Normale', 'P4 - Préventive'], required: true },
        type: { label: 'Type', type: 'selection', options: ['Corrective', 'Préventive', 'Améliorative'], required: true },
        status: { label: 'Statut', type: 'selection', options: ['Nouveau', 'En cours', 'En attente de pièces', 'Terminé'], default: 'Nouveau' },
        assignedTo: { label: 'Technicien Responsable', type: 'text' },
        description: { label: 'Description de la panne/tâche', type: 'textarea' }
      }
    },
    spareParts: {
      label: 'Pièces de Rechange',
      fields: {
        name: { label: 'Désignation', type: 'text', required: true },
        reference: { label: 'Référence', type: 'text', required: true },
        stock: { label: 'Stock Actuel', type: 'number', default: 0 },
        minStock: { label: 'Stock Alerte', type: 'number', default: 2 }
      }
    }
  }
};
