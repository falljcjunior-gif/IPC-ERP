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
    },

    entities: {
      label: 'Entités & Filiales',
      fields: {
        nom: {
          label: 'Raison Sociale',
          type: 'text',
          required: true,
          search: true,
          placeholder: 'Ex: Ma Filiale Industrielle'
        },
        code: {
          label: 'Code Entité',
          type: 'text',
          required: true,
          search: true,
          placeholder: 'Ex: IPC-CI-001'
        },
        statut: {
          label: 'Statut',
          type: 'selection',
          options: ['Principal', 'Filiale', 'Bureau', 'Joint-Venture', 'Partenaire Stratégique'],
          required: true,
          default: 'Filiale'
        },
        pays: {
          label: 'Pays',
          type: 'selection',
          options: [
            "Côte d'Ivoire", 'Sénégal', 'Mali', 'Burkina Faso', 'Niger', 'Guinée',
            'Ghana', 'Bénin', 'Togo', 'Cameroun', 'France', 'Belgique', 'Maroc', 'Autre'
          ],
          required: true,
          search: true,
          default: "Côte d'Ivoire"
        },
        devise: {
          label: 'Devise Principale',
          type: 'selection',
          options: ['XOF (FCFA)', 'EUR (Euro)', 'USD (Dollar)', 'GHS (Cedi)', 'MAD (Dirham)', 'XAF (FCFA Centrafrique)'],
          required: true,
          default: 'XOF (FCFA)'
        },
        formeJuridique: {
          label: 'Forme Juridique',
          type: 'selection',
          options: ['SA', 'SARL', 'SAS', 'GIE', 'SNC', 'Succursale', 'Bureau de représentation']
        },
        rccm: {
          label: 'N° RCCM / SIRET',
          type: 'text',
          search: true,
          placeholder: 'Ex: CI-ABJ-2019-B-12345'
        },
        nif: {
          label: 'N° Fiscal (NIF/TVA)',
          type: 'text',
          placeholder: 'Ex: 1234567A'
        },
        capital: {
          label: 'Capital Social',
          type: 'money',
          currency: 'FCFA'
        },
        chiffreAffaires: {
          label: 'CA Annuel',
          type: 'money',
          currency: 'FCFA',
          writeAccessRule: 'MANAGER'
        },
        adresse: {
          label: 'Adresse du Siège',
          type: 'textarea',
          placeholder: 'Rue, Quartier, Ville'
        },
        telephone: {
          label: 'Téléphone',
          type: 'text'
        },
        email: {
          label: 'Email Officiel',
          type: 'text',
          search: true
        },
        directeur: {
          label: 'Directeur Général / Gérant',
          type: 'text',
          search: true,
          placeholder: 'Nom complet du dirigeant'
        },
        dateCreation: {
          label: 'Date de Création',
          type: 'date'
        },
        consolidee: {
          label: 'Inclure dans la consolidation',
          type: 'selection',
          options: ['Oui', 'Non'],
          default: 'Oui'
        },
        notes: {
          label: 'Notes Internes',
          type: 'textarea'
        }
      },
      views: {
        list: ['nom', 'code', 'statut', 'pays', 'devise', 'directeur', 'chiffreAffaires'],
        search: {
          filters: [
            { id: 'actives', label: 'Entités Consolidées', domain: [['consolidee', '==', 'Oui']] },
            { id: 'filiales', label: 'Filiales', domain: [['statut', '==', 'Filiale']] },
            { id: 'bureaux', label: 'Bureaux', domain: [['statut', '==', 'Bureau']] }
          ],
          groups: [
            { id: 'pays', label: 'Par Pays' },
            { id: 'statut', label: 'Par Statut' },
            { id: 'devise', label: 'Par Devise' }
          ]
        }
      }
    }
  }
};
