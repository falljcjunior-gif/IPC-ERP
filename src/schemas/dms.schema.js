export const dmsSchema = {
  id: 'dms',
  label: 'G.E.D (Documents)',
  models: {
    folders: {
      label: 'Dossiers',
      fields: {
        name: { label: 'Nom du dossier', type: 'text', required: true },
        parent: { label: 'Dossier Parent', type: 'text' }
      }
    },
    files: {
      label: 'Fichiers',
      fields: {
        name: { label: 'Nom', type: 'text', required: true },
        type: { type: 'selection', options: ['PDF', 'IMAGE', 'OTHER'] },
        size: { label: 'Taille', type: 'text' },
        folder: { label: 'Dossier', type: 'text' },
        owner: { label: 'Propriétaire', type: 'text' }
      }
    }
  }
};
