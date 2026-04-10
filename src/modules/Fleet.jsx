import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Truck, 
  Plus, 
  Fuel, 
  Wrench, 
  Calendar, 
  ChevronRight, 
  Search,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';

const Fleet = ({ onOpenDetail }) => {
  const { data, addRecord } = useBusiness();
  const [view, setView] = useState('vehicles'); // 'vehicles', 'maintenance', 'fuel'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize mock data if missing
  if (!data.fleet) {
    data.fleet = {
      vehicles: [
        { id: '1', name: 'Peugeot Partner', plate: 'AB-123-CD', driver: 'Jean Dupont', status: 'En service', location: 'Entrepôt A', odo: 45200 },
        { id: '2', name: 'Renault Master', plate: 'XY-987-ZZ', driver: 'Marie Leroy', status: 'En maintenance', location: 'Garage Central', odo: 128500 },
      ],
      maintenance: [
        { id: '1', vehicle: 'Renault Master', date: '2026-04-05', type: 'Révision', cost: 450, status: 'Terminé' },
      ]
    };
  }

  const { vehicles, maintenance } = data.fleet;

  const handleSave = (formData) => {
    const subModule = view === 'vehicles' ? 'vehicles' : 'maintenance';
    addRecord('fleet', subModule, formData);
    setIsModalOpen(false);
  };

  const renderVehicles = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
      {vehicles.map(v => (
        <motion.div
          key={v.id}
          whileHover={{ y: -5 }}
          onClick={() => onOpenDetail(v, 'fleet', 'vehicles')}
          className="glass"
          style={{ padding: '1.5rem', borderRadius: '1.25rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--accent)10', color: 'var(--accent)', padding: '0.6rem', borderRadius: '0.75rem' }}>
              <Truck size={22} />
            </div>
            <span style={{ 
              padding: '0.2rem 0.6rem', 
              borderRadius: '0.5rem', 
              background: v.status === 'En service' ? '#10B98115' : '#EF444415', 
              color: v.status === 'En service' ? '#10B981' : '#EF4444',
              fontSize: '0.7rem',
              fontWeight: 700
            }}>
              {v.status}
            </span>
          </div>
          
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{v.name}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{v.plate} • {v.odo.toLocaleString()} km</p>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Chauffeur</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.driver}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Localisation</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} /> {v.location}
              </div>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} /> Prochaine révision : +5000km
            </div>
            <ChevronRight size={18} color="var(--accent)" />
          </div>
        </motion.div>
      ))}
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={() => setIsModalOpen(true)}
        className="glass"
        style={{ padding: '2rem', borderRadius: '1.25rem', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', cursor: 'pointer', color: 'var(--text-muted)' }}
      >
        <Plus size={32} />
        <span>Nouveau Véhicule</span>
      </motion.div>
    </div>
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Gestion du Parc Auto</h1>
          <p style={{ color: 'var(--text-muted)' }}>Suivez vos véhicules, la maintenance et les consommations.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.8rem', border: '1px solid var(--border)' }}>
            <button onClick={() => setView('vehicles')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'vehicles' ? 'var(--bg)' : 'transparent', color: view === 'vehicles' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Véhicules</button>
            <button onClick={() => setView('maintenance')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'maintenance' ? 'var(--bg)' : 'transparent', color: view === 'maintenance' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Maintenance</button>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Nouveau
          </button>
        </div>
      </div>

      {view === 'vehicles' && renderVehicles()}
      {view === 'maintenance' && (
        <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem' }}>Véhicule</th>
                <th style={{ padding: '1rem 1.5rem' }}>Date</th>
                <th style={{ padding: '1rem 1.5rem' }}>Type</th>
                <th style={{ padding: '1rem 1.5rem' }}>Coût (FCFA)</th>
                <th style={{ padding: '1rem 1.5rem' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {maintenance.map(m => (
                <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{m.vehicle}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{m.date}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{m.type}</td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 700 }}>{m.cost.toLocaleString()} FCFA</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={view === 'vehicles' ? "Nouveau Véhicule" : "Nouvelle Maintenance"}
        fields={view === 'vehicles' ? [
          { name: 'name', label: 'Marque & Modèle', required: true },
          { name: 'plate', label: 'Immatriculation', required: true },
          { name: 'driver', label: 'Chauffeur titulaire', required: true },
          { name: 'odo', label: 'Kilométrage actuel', type: 'number', required: true },
          { name: 'location', label: 'Localisation', required: true },
        ] : [
          { name: 'vehicle', label: 'Véhicule', type: 'select', options: vehicles.map(v => v.name), required: true },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'type', label: 'Type d\'intervention', type: 'select', options: ['Révision', 'Réparation', 'Pneus', 'Contrôle Technique'], required: true },
          { name: 'cost', label: 'Coût (FCFA)', type: 'number', required: true },
        ]}
      />
    </div>
  );
};

export default Fleet;
