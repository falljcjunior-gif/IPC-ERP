/**
 * Legal Module Schema
 * Defines structure for Contracts, Intellectual Property, Litigations and Corporate records
 */
export const legalSchema = {
  id: 'legal',
  label: 'Juridique',
  models: {
    contracts: {
      label: 'Contrats',
      fields: {
        titre: { label: 'Titre du Contrat', type: 'text', required: true, search: true },
        type: { label: 'Type', type: 'selection', options: ['CDI', 'CDD', 'NDA', 'Vente', 'Fournisseur', 'Bail', 'Partenariat'], required: true },
        partie: { label: 'Partie Adverse', type: 'text', required: true, search: true },
        dateEffet: { label: 'Date d\'Effet', type: 'date', required: true },
        dateExpiration: { label: 'Date d\'Expiration', type: 'date' },
        statut: { 
          label: 'Statut', 
          type: 'selection', 
          options: ['Brouillon', 'En révision', 'Approuvé', 'Signé', 'Expiré', 'Annulé'],
          default: 'Brouillon'
        },
        modifie: { label: 'Modifié (Hors Template)', type: 'boolean', default: false },
        visaJuridique: { label: 'Visa Juridique', type: 'boolean', default: false },
        amount: { label: 'Valeur (FCFA)', type: 'money', currency: 'FCFA' }
      },
      views: {
        list: ['titre', 'type', 'partie', 'dateExpiration', 'statut'],
        kanban: {
          groupField: 'statut',
          titleField: 'titre',
          subtitleField: 'partie',
          valueField: 'amount'
        }
      }
    },
    ip: {
      label: 'Propriété Intellectuelle',
      fields: {
        nom: { label: 'Nom/Marque', type: 'text', required: true, search: true },
        type: { label: 'Type', type: 'selection', options: ['Marque', 'Brevet', 'Droit d\'Auteur', 'Modèle', 'Nom de Domaine'] },
        territoire: { label: 'Territoire', type: 'text' },
        numeroDepot: { label: 'N° de Dépôt', type: 'text', search: true },
        dateDepot: { label: 'Date de Dépôt', type: 'date' },
        dateRenouvellement: { label: 'Échéance Renouvellement', type: 'date' },
        statut: { label: 'Statut', type: 'selection', options: ['Déposé', 'Enregistré', 'En cours', 'Rejeté', 'Expiré'] }
      },
      views: {
        list: ['nom', 'type', 'territoire', 'dateRenouvellement', 'statut']
      }
    },
    litigations: {
      label: 'Litiges & Contentieux',
      fields: {
        objet: { label: 'Objet du Litige', type: 'text', required: true, search: true },
        type: { label: 'Type', type: 'selection', options: ['Prud\'hommes', 'Impayé Client', 'Conflit Fournisseur', 'Fiscal', 'Autre'] },
        partieAdverse: { label: 'Partie Adverse', type: 'text', search: true },
        risqueFinancier: { label: 'Risque Financier Estimé', type: 'money', currency: 'FCFA' },
        avocat: { label: 'Avocat Référent', type: 'text' },
        statut: { label: 'Statut', type: 'selection', options: ['En cours', 'Amiable', 'Tribunal', 'Gagné', 'Perdu', 'Clos'] }
      },
      views: {
        list: ['objet', 'type', 'partieAdverse', 'risqueFinancier', 'statut']
      }
    },
    corporate: {
      label: 'Corporate / Secrétariat',
      fields: {
        entite: { label: 'Entité Légale', type: 'text', required: true, search: true },
        type: { label: 'Forme Juridique', type: 'selection', options: ['SARL', 'SA', 'SAS', 'SUARL', 'GIE'] },
        capitalSocial: { label: 'Capital Social', type: 'money', currency: 'FCFA' },
        dateCreation: { label: 'Date de Création', type: 'date' },
        siège: { label: 'Siège Social', type: 'text' }
      },
      views: {
        list: ['entite', 'type', 'capitalSocial', 'siège']
      }
    }
  }
};
