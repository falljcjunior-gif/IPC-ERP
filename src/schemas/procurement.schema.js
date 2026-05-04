export const procurementSchema = {
  id: 'procurement',
  label: 'Appels d\'Offres',
  models: {
    tenders: {
      label: 'Appels d\'Offres',
      fields: {
        title: { label: 'Titre', type: 'text', required: true },
        status: { label: 'Statut', type: 'selection', options: ['Brouillon', 'Publié', 'En Évaluation', 'Attribué', 'Clôturé'], default: 'Brouillon' },
        deadline: { label: 'Date limite', type: 'date', required: true },
        budget: { label: 'Budget estimé', type: 'number' },
        category: { label: 'Catégorie', type: 'selection', options: ['Matières Premières', 'Équipements', 'Services', 'Transport', 'IT'] }
      }
    },
    suppliers: {
      label: 'Fournisseurs',
      fields: {
        name: { label: 'Raison Sociale', type: 'text', required: true },
        score: { label: 'Score Qualité', type: 'number', default: 50 },
        category: { label: 'Catégorie', type: 'selection', options: ['Ciment', 'Agrégats', 'Pigments', 'Moules', 'Transport'] },
        status: { label: 'Statut', type: 'selection', options: ['Actif', 'En évaluation', 'Suspendu'] }
      }
    }
  }
};
