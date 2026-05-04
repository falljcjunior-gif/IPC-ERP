export const esgSchema = {
  id: 'esg',
  label: 'ESG & Environnement',
  models: {
    emissions: {
      label: 'Émissions Carbone',
      fields: {
        source: { label: 'Source', type: 'selection', options: ['Production', 'Transport', 'Énergie', 'Déchets'], required: true },
        value: { label: 'Tonnes CO₂', type: 'number', required: true },
        period: { label: 'Période', type: 'text', required: true }
      }
    },
    resources: {
      label: 'Consommation Ressources',
      fields: {
        type: { label: 'Ressource', type: 'selection', options: ['Eau (m³)', 'Électricité (kWh)', 'Gaz (m³)', 'Carburant (L)'], required: true },
        value: { label: 'Quantité', type: 'number', required: true },
        period: { label: 'Période', type: 'text', required: true }
      }
    }
  }
};
