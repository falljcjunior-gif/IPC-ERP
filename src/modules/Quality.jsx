import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  AlertOctagon, 
  CheckCircle2, 
  ClipboardCheck, 
  Plus, 
  Search, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';

const Quality = ({ onOpenDetail }) => {
  const { data, addRecord, updateRecord } = useBusiness();
  const [view, setView] = useState('controls'); // 'controls', 'non-conformities', 'plans'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize mock data if missing
  if (!data.quality) {
    data.quality = {
      controls: [
        { id: '1', item: 'Tige Inox 304', type: 'Réception', date: '2026-04-09', inspector: 'Marc Lucas', status: 'Conforme', result: 'Dimensions OK, pas de rayures.' },
        { id: '2', item: 'Boîtier Plastique X', type: 'Production', date: '2026-04-08', inspector: 'Sarah Connor', status: 'Échec', result: 'Défaut de moulage sur 5% du lot.' },
      ],
      nonConformities: [
        { id: '1', ref: 'NC-2026-001', item: 'Boîtier Plastique X', source: 'Production', gravity: 'Majeure', status: 'Ouvert', detection: '2026-04-08' },
      ]
    };
  }

  const { controls, nonConformities } = data.quality;

  const handleSave = (formData) => {
    const subModule = view === 'controls' ? 'controls' : 'nonConformities';
    addRecord('quality', subModule, formData);
    setIsModalOpen(false);
  };

  const renderControls = () => (
    <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <tr>
            <th style={{ padding: '1rem 1.5rem' }}>Article / Lot</th>
            <th style={{ padding: '1rem 1.5rem' }}>Type</th>
            <th style={{ padding: '1rem 1.5rem' }}>Inspecteur</th>
            <th style={{ padding: '1rem 1.5rem' }}>Date</th>
            <th style={{ padding: '1rem 1.5rem' }}>Résultat</th>
            <th style={{ padding: '1rem 1.5rem' }}></th>
          </tr>
        </thead>
        <tbody>
          {controls.map(c => (
            <tr key={c.id} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => onOpenDetail(c, 'quality', 'controls')}>
              <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{c.item}</td>
              <td style={{ padding: '1rem 1.5rem' }}>{c.type}</td>
              <td style={{ padding: '1rem 1.5rem' }}>{c.inspector}</td>
              <td style={{ padding: '1rem 1.5rem' }}>{c.date}</td>
              <td style={{ padding: '1rem 1.5rem' }}>
                <span style={{ 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '0.5rem', 
                  background: c.status === 'Conforme' ? '#10B98115' : '#EF444415', 
                  color: c.status === 'Conforme' ? '#10B981' : '#EF4444',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {c.status}
                </span>
              </td>
              <td style={{ padding: '1rem 1.5rem' }}><ChevronRight size={18} color="var(--text-muted)" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Gestion de la Qualité</h1>
          <p style={{ color: 'var(--text-muted)' }}>Assurez la conformité de vos produits et gérez les anomalies.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.8rem', border: '1px solid var(--border)' }}>
            <button onClick={() => setView('controls')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'controls' ? 'var(--bg)' : 'transparent', color: view === 'controls' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Points de Contrôle</button>
            <button onClick={() => setView('non-conformities')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'non-conformities' ? 'var(--bg)' : 'transparent', color: view === 'non-conformities' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Non-Conformités</button>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
             <Plus size={18} /> Nouveau
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>TAUX DE CONFORMITÉ</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10B981' }}>98.2%</div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>NC OUVERTES</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#EF4444' }}>{nonConformities.filter(n => n.status === 'Ouvert').length}</div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>CONTRÔLES / MOIS</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>142</div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>ACTIONS RÉUSSIES</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)' }}>89%</div>
         </div>
      </div>

      {view === 'controls' ? renderControls() : (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {nonConformities.map(n => (
              <div key={n.id} className="glass" style={{ padding: '1.25rem 2rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <div style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 800 }}>{n.ref} • Grave : {n.gravity}</div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{n.item}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Détecté le {n.detection} ({n.source})</div>
                 </div>
                 <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.status}</span>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Ouvrir Plan d'Action</button>
                 </div>
              </div>
            ))}
         </div>
      )}

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={view === 'controls' ? "Nouveau Point de Contrôle" : "Déclarer une Non-Conformité"}
        fields={view === 'controls' ? [
          { name: 'item', label: 'Article / Lot', required: true },
          { name: 'type', label: 'Type de contrôle', type: 'select', options: ['Réception', 'Encours Production', 'Final', 'Périodique'], required: true },
          { name: 'inspector', label: 'Inspecteur', type: 'select', options: data.hr.employees.map(e => e.nom), required: true },
          { name: 'status', label: 'Résultat', type: 'select', options: ['Conforme', 'Échec', 'Mise en quarantaine'], required: true },
          { name: 'result', label: 'Observations détaillées', type: 'textarea' },
        ] : [
          { name: 'item', label: 'Article défectueux', required: true },
          { name: 'gravity', label: 'Gravité', type: 'select', options: ['Bénigne', 'Mineure', 'Majeure', 'Critique'], required: true },
          { name: 'source', label: 'Origine', type: 'select', options: ['Production', 'Fournisseur', 'Client', 'Logistique'], required: true },
          { name: 'detection', label: 'Date de détection', type: 'date', required: true },
        ]}
      />
    </div>
  );
};

export default Quality;
