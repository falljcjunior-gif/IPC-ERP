export const shippingSchema = {
  id: 'shipping',
  label: 'Logistique & Expéditions',
  models: {
    shipments: {
      label: 'Bon de Livraison',
      fields: {
        id: { label: 'Numéro BL', type: 'text', required: true },
        client: { label: 'Client', type: 'relation', ref: 'base.contacts' },
        dest: { label: 'Destination', type: 'text' },
        transporteur: { label: 'Transporteur', type: 'relation', ref: 'shipping.carriers' },
        date: { label: 'Date Expédition', type: 'date' },
        dateExpec: { label: 'Date Prévue', type: 'date' },
        colis: { label: 'Nb Colis', type: 'number' },
        poids: { label: 'Poids (kg)', type: 'text' },
        montant: { label: 'Valeur (FCFA)', type: 'number' },
        statut: { type: 'selection', options: ['Préparation', 'Expédié', 'En Transit', 'Livré', 'Retardé', 'Retourné'] },
        tracking: { label: 'Numéro Suivi', type: 'text' }
      }
    },
    carriers: {
      label: 'Transporteurs',
      fields: {
        nom: { label: 'Nom', type: 'text', required: true },
        color: { label: 'Couleur', type: 'text' },
        otif: { label: 'Taux OTIF', type: 'number' }
      }
    },
    fleet: {
      label: 'Flotte Véhicules',
      fields: {
        imm: { label: 'Immatriculation', type: 'text', required: true },
        modele: { label: 'Modèle', type: 'text' },
        statut: { type: 'selection', options: ['Disponible', 'En Course', 'Maintenance'] }
      }
    }
  }
};
