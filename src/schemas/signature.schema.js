export const signatureSchema = {
  id: 'signature',
  name: 'Signature Électronique',
  tables: [
    {
      id: 'requests',
      name: 'Demandes de signature',
      fields: [
        { name: 'num', type: 'string', label: 'Numéro', ro: true, width: 100 },
        { name: 'titre', type: 'string', label: 'Titre du document', required: true, width: 250 },
        { name: 'sourceId', type: 'string', label: 'Document Source (Devis/Cmd)', width: 200 },
        { name: 'documentUrl', type: 'string', label: 'Document', ui: 'file' },
        { name: 'destinataires', type: 'string', label: 'Destinataires', required: true, width: 200 },
        { 
          name: 'statut', 
          type: 'enum', 
          label: 'Statut', 
          options: ['Brouillon', 'Envoyé', 'Ouvert', 'Signé', 'Annulé'], 
          default: 'Brouillon',
          width: 120
        },
        { name: 'dateCreation', type: 'date', label: 'Créé le', ro: true },
        { name: 'dateSignature', type: 'date', label: 'Signé le' },
        { name: 'auditTrail', type: 'json', label: 'Dossier de Preuve', ro: true, width: 300 }
      ]
    },
    {
      id: 'templates',
      name: 'Modèles de document',
      fields: [
        { name: 'titre', type: 'string', label: 'Nom du modèle', required: true, width: 200 },
        { name: 'departement', type: 'string', label: 'Département' },
        { name: 'actif', type: 'boolean', label: 'Actif', default: true }
      ]
    }
  ],
  relations: []
};
