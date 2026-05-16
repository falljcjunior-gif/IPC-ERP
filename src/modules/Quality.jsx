import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, AlertOctagon, CheckCircle2, ClipboardCheck,
  Plus, ChevronRight, Filter, Target
} from 'lucide-react';
import { useStore } from '../store';
import RecordModal from '../components/RecordModal';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';
import '../components/GlobalDashboard.css';

const Quality = ({ onOpenDetail }) => {
  const { data, addRecord } = useStore();
  const [view, setView] = useState('controls');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const qualityData = useMemo(() => data.quality || { controls: [], nonConformities: [] }, [data.quality]);
  const { controls, nonConformities } = qualityData;

  const ncOuvertes = nonConformities.filter(n => n.status === 'Ouvert').length;
  const tauxConformite = controls.length > 0 ? Math.round((controls.filter(c => c.status === 'Conforme').length / controls.length) * 100) : 0;

  const handleSave = (formData) => {
    const subModule = view === 'controls' ? 'controls' : 'nonConformities';
    addRecord('quality', subModule, formData);
    setIsModalOpen(false);
  };

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="luxury-subtitle">ISO & Conformité Produit</div>
          <h1 className="luxury-title">Gestion de la <strong>Qualité</strong></h1>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {/* Frosted Tab Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '0.4rem', borderRadius: '1.25rem', backdropFilter: 'blur(10px)' }}>
            <button onClick={() => setView('controls')} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.875rem', border: 'none', cursor: 'pointer', fontWeight: 700, transition: 'all 0.3s', background: view === 'controls' ? 'white' : 'transparent', color: view === 'controls' ? '#111827' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardCheck size={16} /> Points de Contrôle
            </button>
            <button onClick={() => setView('non-conformities')} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.875rem', border: 'none', cursor: 'pointer', fontWeight: 700, transition: 'all 0.3s', background: view === 'non-conformities' ? 'white' : 'transparent', color: view === 'non-conformities' ? '#111827' : '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertOctagon size={16} /> Non-Conformités
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="luxury-widget" style={{ padding: '0.9rem 1.75rem', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 700, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', borderRadius: '1.5rem' }}>
            <Plus size={18} /> Nouveau
          </button>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
        {[
          { label: 'Taux de Conformité', value: tauxConformite, suffix: '%',         color: '#10B981', icon: <ShieldCheck size={24} /> },
          { label: 'NC Ouvertes',         value: ncOuvertes,    suffix: '',           color: '#EF4444', icon: <AlertOctagon size={24} /> },
          { label: 'Contrôles / Mois',    value: controls.length, suffix: '',         color: '#3B82F6', icon: <ClipboardCheck size={24} /> },
          { label: 'Actions Réussies',    value: 0,             suffix: '%',          color: '#8B5CF6', icon: <Target size={24} /> },
        ].map((k, i) => (
          <div key={i} className="luxury-widget" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ background: `${k.color}15`, padding: '12px', borderRadius: '1rem', color: k.color }}>{k.icon}</div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: k.color, textTransform: 'uppercase' }}>●</span>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{k.label}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b' }}>
                <AnimatedCounter from={0} to={k.value} duration={1.5} formatter={v => `${Math.round(v)}${k.suffix}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <AnimatePresence mode="wait">
        <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
          {view === 'controls' ? (
            <div className="luxury-widget" style={{ padding: '2.5rem', borderRadius: '1.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>
                    {['Article / Lot', 'Type', 'Inspecteur', 'Date', 'Résultat', ''].map(h => (
                      <th key={h} style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {controls.map(c => (
                    <motion.tr key={c.id} whileHover={{ background: '#f8fafc' }} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => onOpenDetail(c, 'quality', 'controls')}>
                      <td style={{ padding: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{c.item}</td>
                      <td style={{ padding: '1.25rem', color: '#475569' }}>{c.type}</td>
                      <td style={{ padding: '1.25rem', color: '#475569' }}>{c.inspector}</td>
                      <td style={{ padding: '1.25rem', color: '#475569' }}>{c.date}</td>
                      <td style={{ padding: '1.25rem' }}>
                        <span style={{ padding: '4px 14px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700,
                          background: c.status === 'Conforme' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: c.status === 'Conforme' ? '#10B981' : '#EF4444' }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem' }}><ChevronRight size={18} color="#cbd5e1" /></td>
                    </motion.tr>
                  ))}
                  {controls.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>
                      <CheckCircle2 size={48} opacity={0.2} style={{ margin: '0 auto 1rem', display: 'block' }} />
                      Aucun contrôle enregistré
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {nonConformities.map(n => (
                <motion.div key={n.id} whileHover={{ x: 4 }} className="luxury-widget" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #EF4444' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 800, marginBottom: '0.25rem' }}>{n.ref} · Gravité: {n.gravity}</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.25rem' }}>{n.item}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Détecté le {n.detection} ({n.source})</div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ padding: '4px 14px', borderRadius: '999px', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: '0.8rem', fontWeight: 700 }}>{n.status}</span>
                    <button onClick={() => onOpenDetail && onOpenDetail(n, 'quality', 'nonConformities')} className="luxury-widget" style={{ padding: '0.6rem 1.25rem', background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: '#475569', borderRadius: '0.75rem' }}>Plan d'Action</button>
                  </div>
                </motion.div>
              ))}
              {nonConformities.length === 0 && (
                <div className="luxury-widget" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                  <ShieldCheck size={48} opacity={0.2} style={{ margin: '0 auto 1rem', display: 'block' }} />
                  <p style={{ fontWeight: 600 }}>Aucune non-conformité déclarée</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <RecordModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave}
        title={view === 'controls' ? 'Nouveau Point de Contrôle' : 'Déclarer une Non-Conformité'}
        fields={view === 'controls' ? [
          { name: 'item',      label: 'Article / Lot',      required: true },
          { name: 'type',      label: 'Type de contrôle',   type: 'select', options: ['Réception', 'Encours Production', 'Final', 'Périodique'], required: true },
          { name: 'inspector', label: 'Inspecteur',         type: 'select', options: data.hr?.employees?.map(e => e.nom) || [], required: true },
          { name: 'status',    label: 'Résultat',           type: 'select', options: ['Conforme', 'Échec', 'Mise en quarantaine'], required: true },
          { name: 'result',    label: 'Observations',       type: 'textarea' },
        ] : [
          { name: 'item',      label: 'Article défectueux', required: true },
          { name: 'gravity',   label: 'Gravité',            type: 'select', options: ['Bénigne', 'Mineure', 'Majeure', 'Critique'], required: true },
          { name: 'source',    label: 'Origine',            type: 'select', options: ['Production', 'Fournisseur', 'Client', 'Logistique'], required: true },
          { name: 'detection', label: 'Date de détection',  type: 'date',   required: true },
        ]}
      />
    </div>
  );
};

export default React.memo(Quality);
