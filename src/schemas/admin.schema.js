/**
 * Admin Module Schema (User Management)
 * Defines structure for User Accounts
 */
export const adminSchema = {
  id: 'admin',
  label: 'Administration',
  models: {
    users: {
      label: 'Comptes Utilisateurs',
      dataPath: 'base.users', // Targeting the users list
      fields: {
        nom: { label: 'Nom Complet', type: 'text', required: true, search: true },
        email: { label: 'Email Professionnel', type: 'text', required: true, search: true },
        role: { 
          label: 'Rôle Système', 
          type: 'selection', 
          options: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'GUEST'],
          required: true,
          search: true
        },
        statut: { 
          label: 'État du Compte', 
          type: 'selection', 
          options: ['Actif', 'Inactif', 'Suspendu'],
          default: 'Actif'
        },
        dernierAcces: { label: 'Dernier Accès', type: 'datetime' }
      },
      views: {
        list: ['nom', 'email', 'role', 'statut', 'dernierAcces'],
        kanban: {
          groupField: 'statut',
          titleField: 'nom',
          subtitleField: 'role',
          valueField: 'email'
        },
        search: {
          filters: [
             { id: 'admins', label: 'Administrateurs', domain: [['role', '==', 'SUPER_ADMIN']] },
             { id: 'inactive', label: 'Comptes Inactifs', domain: [['statut', '==', 'Inactif']] }
          ],
          groups: [
             { id: 'role', label: 'Par Rôle' },
             { id: 'statut', label: 'Par État' }
          ]
        }
      }
    }
  }
};
