/**
 * Base Module Schema (Master Data)
 * Defines structure for Contacts and Catalog (Products)
 */
export const baseSchema = {
  id: 'base',
  label: 'Données Maîtres',
  models: {
    contacts: {
      label: 'Contacts & Partenaires',
      fields: {
        nom: { label: 'Nom / Raison Sociale', type: 'text', required: true, search: true },
        type: { 
          label: 'Type', 
          type: 'selection', 
          options: ['Client', 'Fournisseur', 'Prospect', 'Partenaire'],
          required: true,
          search: true
        },
        email: { label: 'Email', type: 'text', search: true },
        tel: { label: 'Téléphone', type: 'text' },
        ref: { label: 'Réf. Partenaire', type: 'text', search: true },
        tags: { label: 'Tags', type: 'text' }
      },
      views: {
        list: ['nom', 'type', 'email', 'tel', 'ref'],
        kanban: {
          groupField: 'type',
          titleField: 'nom',
          subtitleField: 'email',
          valueField: 'ref'
        },
        search: {
          filters: [
             { id: 'clients', label: 'Clients', domain: [['type', '==', 'Client']] },
             { id: 'vendors', label: 'Fournisseurs', domain: [['type', '==', 'Fournisseur']] }
          ],
          groups: [
             { id: 'type', label: 'Par Type' }
          ]
        }
      }
    },
    catalog: {
      label: 'Catalogue Articles',
      fields: {
        code: { label: 'Code Article', type: 'text', required: true, search: true },
        nom: { label: 'Désignation', type: 'text', required: true, search: true },
        type: { label: 'Type', type: 'selection', options: ['Bien', 'Service'], required: true },
        categorie: { label: 'Catégorie', type: 'selection', options: ['Matériel', 'Software', 'Prestation', 'Formation'], search: true },
        prixMoyen: { label: 'Prix de Vente', type: 'money', currency: 'FCFA', search: true, writeAccessRule: 'MANAGER' },
        unit: { label: 'Unité', type: 'selection', options: ['Unité', 'Heure', 'Jour', 'Licence', 'Forfait'] }
      },
      views: {
        list: ['code', 'nom', 'categorie', 'type', 'prixMoyen'],
        search: {
          groups: [
             { id: 'categorie', label: 'Par Catégorie' },
             { id: 'type', label: 'Par Type' }
          ]
        }
      }
    }
  }
};
