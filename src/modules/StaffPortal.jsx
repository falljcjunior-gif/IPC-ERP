import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Wallet, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  User,
  LayoutDashboard,
  Briefcase
} from 'lucide-react';
import { useStore } from '../store';
import RecordModal from '../components/RecordModal';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';
import { generatePDF } from '../utils/PDFExporter';
import '../components/GlobalDashboard.css';

const StaffPortal = ({ embedded }) => {
  const { data, currentUser, addRecord, formatCurrency, navigateTo } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'leaves', 'expenses', 'payslips'
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Filter data for the current user
  const myEmployeeRecord = data.hr?.employees?.find(e => e.id === currentUser?.id || e.email === currentUser?.email);
  const myLeaves = (data.hr?.leaves || []).filter(l => l.employe === currentUser?.nom);
  const myExpenses = (data.hr?.expenses || []).filter(e => e.employe === currentUser?.nom);
  const myProjects = (data.projects?.projects || []).filter(p => 
    p.team?.some(t => t.nom === currentUser?.nom) || p.chefProjet === currentUser?.nom
  );
  const myPayslips = (data.dms?.files || []).filter(f => f.owner === currentUser?.nom && f.metadata?._subModule === 'payslip');

  const pendingExpenses = myExpenses.filter(e => e.statut === 'En attente').reduce((sum, e) => sum + (e.montant || 0), 0);

  const handleSave = (formData) => {
    const subModule = activeTab === 'leaves' ? 'leaves' : 'expenses';
    // Force the employee name to current user
    addRecord('hr', subModule, { ...formData, employe: currentUser?.nom, statut: 'En attente' });
    setIsModalOpen(false);
  };

  const modalFields = activeTab === 'leaves' ? [
    { name: 'type', label: 'Type de Congé', type: 'select', options: ['Congés Payés', 'Maladie', 'RTT', 'Formation'], required: true },
    { name: 'du', label: 'Date de début', type: 'date', required: true },
    { name: 'au', label: 'Date de fin', type: 'date', required: true },
    { name: 'commentaire', label: 'Commentaire / Justification', placeholder: 'Ex: Vacances annuelles' },
  ] : [
    { name: 'objet', label: 'Objet de la dépense', required: true, placeholder: 'Ex: Taxi RDV Client' },
    { name: 'montant', label: 'Montant (FCFA)', type: 'number', required: true },
    { name: 'date', label: 'Date de la dépense', type: 'date', required: true },
    { name: 'type', label: 'Catégorie', type: 'select', options: ['Transport', 'Repas', 'Hébergement', 'Divers'], required: true },
  ];

  const renderDashboard = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
        <div className="luxury-widget" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '1rem', borderRadius: '1rem' }}>
            <Calendar size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Solde Congés</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827' }}>{myEmployeeRecord?.congesRestants || 0} Jours</div>
          </div>
        </div>

        <div className="luxury-widget" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '1rem', borderRadius: '1rem' }}>
            <Wallet size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Frais en attente</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827' }}>{formatCurrency(pendingExpenses)}</div>
          </div>
        </div>

        <div className="luxury-widget" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', padding: '1rem', borderRadius: '1rem' }}>
            <Briefcase size={28} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Missions Actives</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827' }}>{myProjects.filter(p => p.statut !== 'Livré').length}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="luxury-widget" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#111827', fontSize: '1.25rem' }}>
            <Clock size={20} color="#9ca3af" /> Demandes Récentes
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...myLeaves, ...myExpenses].slice(0, 4).map((req, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '1rem', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{req.type || req.objet}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{req.du || req.date}</div>
                </div>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '4px 12px', 
                  borderRadius: '1rem', 
                  background: req.statut === 'Validé' ? '#d1fae5' : '#fef3c7',
                  color: req.statut === 'Validé' ? '#059669' : '#d97706',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {req.statut}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="luxury-widget" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#111827', fontSize: '1.25rem' }}>
              <FileText size={20} color="#9ca3af" /> Documents RH
            </h3>
            <button onClick={() => navigateTo('dms')} style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
               Tout voir →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: '1rem', background: '#f8fafc', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
               <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Contrat de travail IPC_2024.pdf</p>
            </div>
            {myPayslips.slice(0, 1).map((f, i) => (
              <div key={i} style={{ padding: '1rem', borderRadius: '1rem', background: '#f0fdf4', border: '1px dashed #34d399', textAlign: 'center', cursor: 'pointer' }} onClick={() => generatePDF(f.metadata, 'hr', 'payslip')}>
                 <p style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>Dernière Fiche de Paie {f.metadata.salariesMois}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="luxury-widget" style={{ padding: '2rem', borderRadius: '1.5rem', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#111827', fontSize: '1.25rem' }}>
              <Briefcase size={20} color="#9ca3af" /> Mes Missions & Projets
            </h3>
            <button onClick={() => navigateTo('projects')} style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
               Explorer →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
            {myProjects.length === 0 ? (
              <div style={{ gridColumn: 'span 3', padding: '3rem', textAlign: 'center', color: '#9ca3af', background: '#f8fafc', borderRadius: '1rem' }}>
                Aucune mission assignée pour le moment.
              </div>
            ) : myProjects.map((p, i) => (
              <div key={i} style={{ padding: '1.5rem', borderRadius: '1rem', borderTop: `4px solid ${p.color || '#10B981'}`, background: '#f8fafc', border: '1px solid #e2e8f0', borderTopWidth: '4px' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem', color: '#1e293b' }}>{p.nom}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', fontWeight: 500 }}>{p.client}</div>
                <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: p.progression + '%', height: '100%', background: p.color || '#10B981', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={embedded ? "" : "luxury-dashboard-container"} style={{ padding: embedded ? '0' : '3rem', minHeight: embedded ? 'auto' : '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HEADER ── */}
      {!embedded && (
        <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="luxury-subtitle">Portail Collaborateur</div>
            <h1 className="luxury-title">Espace <strong>Personnel</strong></h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Statut</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={24} /> Actif
              </div>
            </div>
            {/* Quick Actions pour Navigation */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => navigateTo('timesheets')} className="luxury-widget" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer' }}>
                <Clock size={16} /> <span style={{ fontWeight: 600 }}>Saisir Temps</span>
              </button>
              <button onClick={() => navigateTo('planning')} className="luxury-widget" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer' }}>
                <Calendar size={16} /> <span style={{ fontWeight: 600 }}>Planning</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CONTROLS (TABS & ACTIONS) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '1.5rem', backdropFilter: 'blur(10px)' }}>
          <button 
            onClick={() => setActiveTab('dashboard')}
            style={{ 
              padding: '0.8rem 1.5rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: activeTab === 'dashboard' ? 'white' : 'transparent',
              color: activeTab === 'dashboard' ? '#111827' : '#6b7280',
              boxShadow: activeTab === 'dashboard' ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <LayoutDashboard size={16} /> Vue d'ensemble
          </button>
          <button 
            onClick={() => setActiveTab('leaves')}
            style={{ 
              padding: '0.8rem 1.5rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: activeTab === 'leaves' ? 'white' : 'transparent',
              color: activeTab === 'leaves' ? '#111827' : '#6b7280',
              boxShadow: activeTab === 'leaves' ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Congés
          </button>
          <button 
            onClick={() => setActiveTab('expenses')}
            style={{ 
              padding: '0.8rem 1.5rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: activeTab === 'expenses' ? 'white' : 'transparent',
              color: activeTab === 'expenses' ? '#111827' : '#6b7280',
              boxShadow: activeTab === 'expenses' ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Notes de Frais
          </button>
          <button 
            onClick={() => setActiveTab('payslips')}
            style={{ 
              padding: '0.8rem 1.5rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: activeTab === 'payslips' ? 'white' : 'transparent',
              color: activeTab === 'payslips' ? '#111827' : '#6b7280',
              boxShadow: activeTab === 'payslips' ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Fiches de Paie
          </button>
        </div>

        {(activeTab === 'leaves' || activeTab === 'expenses') && (
          <button 
            className="luxury-widget" 
            onClick={() => setIsModalOpen(true)}
            style={{ 
              padding: '0.8rem 2rem', background: '#111827', color: 'white', 
              display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', borderRadius: '1.5rem'
            }}
          >
            <Plus size={18} />
            <span style={{ fontWeight: 600 }}>Nouvelle Demande</span>
          </button>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, paddingBottom: '2rem' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && renderDashboard()}

          {(activeTab === 'leaves' || activeTab === 'expenses') && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="luxury-widget" style={{ borderRadius: '1.5rem', overflow: 'hidden', padding: 0 }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeTab === 'leaves' ? 'Période' : 'Objet'}</th>
                    <th style={{ padding: '1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeTab === 'leaves' ? 'Type' : 'Montant'}</th>
                    <th style={{ padding: '1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statut</th>
                    <th style={{ padding: '1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'leaves' ? myLeaves : myExpenses).map((req, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
                        {activeTab === 'leaves' ? `${req.du} au ${req.au}` : req.objet}
                      </td>
                      <td style={{ padding: '1.5rem', color: '#475569', fontWeight: 500 }}>
                        {activeTab === 'leaves' ? req.type : formatCurrency(req.montant)}
                      </td>
                      <td style={{ padding: '1.5rem' }}>
                        <span style={{ 
                          padding: '0.4rem 1rem', 
                          borderRadius: '1rem', 
                          background: req.statut === 'Validé' ? '#d1fae5' : '#fef3c7', 
                          color: req.statut === 'Validé' ? '#059669' : '#d97706', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {req.statut}
                        </span>
                      </td>
                      <td style={{ padding: '1.5rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                        {req.validatedAt ? `Validé par ${req.validatedBy}` : 'En cours de revue...'}
                      </td>
                    </tr>
                  ))}
                  {(activeTab === 'leaves' ? myLeaves : myExpenses).length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontWeight: 500 }}>
                        Aucune demande trouvée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}

          {activeTab === 'payslips' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="luxury-widget" style={{ borderRadius: '1.5rem', overflow: 'hidden', padding: 0 }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mois</th>
                    <th style={{ padding: '1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net à Payer</th>
                    <th style={{ padding: '1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document</th>
                    <th style={{ padding: '1.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myPayslips.map((f, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                        {f.metadata.salariesMois}
                      </td>
                      <td style={{ padding: '1.5rem', color: '#10B981', fontWeight: 800, fontSize: '1.1rem' }}>
                        {formatCurrency(f.metadata.netAPayer)}
                      </td>
                      <td style={{ padding: '1.5rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                        {f.name}
                      </td>
                      <td style={{ padding: '1.5rem' }}>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            generatePDF(f.metadata, 'hr', 'payslip');
                          }}
                          style={{ 
                            background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', 
                            borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                        >
                          <FileText size={16} color="#10B981" /> Télécharger
                        </button>
                      </td>
                    </tr>
                  ))}
                  {myPayslips.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontWeight: 500 }}>
                        Aucune fiche de paie générée pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={activeTab === 'leaves' ? "Demande de Congés" : "Note de Frais"}
        fields={modalFields}
      />
    </div>
  );
};

export default React.memo(StaffPortal);
