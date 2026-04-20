export const commerceSchema = {
  id: 'commerce',
  label: 'Point de Vente (POS)',
  models: {
    posOrders: {
      label: 'Tickets de caisse',
      fields: {
        id: { label: 'Ticket', type: 'text', required: true },
        client: { label: 'Client', type: 'text' },
        montant: { label: 'Montant (FCFA)', type: 'number' },
        items: { label: 'Articles', type: 'text' },
        statut: { type: 'selection', options: ['Payé', 'Remboursé'] }
      }
    }
  }
};
