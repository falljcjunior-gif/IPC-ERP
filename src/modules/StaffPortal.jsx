import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Wallet, Plus, Clock, CheckCircle2,
  FileText, LayoutDashboard, Briefcase, User,
  Building2, BadgeCheck, CreditCard, Banknote,
  Shield, Mail, Lock, TrendingUp, Award,
  ChevronRight, AlertCircle
} from 'lucide-react';
import { useStore } from '../store';
import RecordModal from '../components/RecordModal';
import { generatePDF } from '../utils/PDFExporter';
import { FirestoreService } from '../services/firestore.service';
import '../components/GlobalDashboard.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => (Number(n) || 0).toLocaleString('fr-FR') + ' XOF';

const InfoRow = ({ label, value, icon: Icon, color = '#64748B' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 0', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}>
    {Icon && <Icon size={16} color={color} style={{ flexShrink: 0 }} />}
    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9ca3af', minWidth: '160px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>{value || '—'}</span>
  </div>
);

const SectionCard = ({ title, icon: Icon, color, children }) => (
  <div className="luxury-widget" style={{ padding: '1.75rem', borderRadius: '1.5rem', borderTop: `3px solid ${color}` }}>
    <h4 style={{ margin: '0 0 1.25rem 0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#1e293b', fontSize: '1rem' }}>
      <Icon size={18} color={color} /> {title}
    </h4>
    {children}
  </div>
);

const StaffPortal = ({ embedded }) => {
  const { data, currentUser, addRecord, formatCurrency, navigateTo } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mySalary, setMySalary] = useState(null);
  const [myContract, setMyContract] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(true);

  // Filter data for the current user
  const myEmployeeRecord = data.hr?.employees?.find(e =>
    e.id === currentUser?.id || e.email === currentUser?.email
  );
  const myLeaves = (data.hr?.leaves || []).filter(l =>
    l.ownerId === currentUser?.id || l.employe === currentUser?.nom || l.collaborateur === currentUser?.nom
  );
  const myExpenses = (data.hr?.expenses || []).filter(e =>
    e.ownerId === currentUser?.id || e.employe === currentUser?.nom
  );
  const myProjects = (data.projects?.projects || []).filter(p =>
    p.team?.some(t => t.nom === currentUser?.nom || t.id === currentUser?.id) || p.chefProjet === currentUser?.nom
  );
  const myPayslips = (data.dms?.files || []).filter(f =>
    f.owner === currentUser?.nom && f.metadata?._subModule === 'payslip'
  );

  const pendingExpenses = myExpenses
    .filter(e => e.statut === 'En attente')
    .reduce((sum, e) => sum + (e.montant || 0), 0);

  // Subscribe to personal salary + contract docs from Firestore
  useEffect(() => {
    if (!currentUser?.id) return;
    setLoadingDossier(true);
    let unsubSal, unsubCon;

    // salaries/{uid}
    unsubSal = FirestoreService.subscribeToDocument(
      'salaries', currentUser.id,
      (doc) => { setMySalary(doc || null); setLoadingDossier(false); },
      (err) => { console.warn('[StaffPortal] salary sub:', err?.message); setLoadingDossier(false); }
    );

    // contracts/{uid}
    unsubCon = FirestoreService.subscribeToDocument(
      'contracts', currentUser.id,
      (doc) => { setMyContract(doc || null); },
      (err) => console.warn('[StaffPortal] contract sub:', err?.message)
    );

    return () => {
      typeof unsubSal === 'function' && unsubSal();
      typeof unsubCon === 'function' && unsubCon();
    };
  }, [currentUser?.id]);

  const handleSave = (formData) => {
    const subModule = activeTab === 'leaves' ? 'leaves' : 'expenses';
    const record = {
      ...formData,
      employe: currentUser?.nom,
      collaborateur: currentUser?.nom,
      email: currentUser?.email,
      statut: 'En attente'
    };
    addRecord('hr', subModule, record);
    setIsModalOpen(false);
  };

  const modalFields = activeTab === 'leaves' ? [
    { name: 'type', label: 'Type de Congé', type: 'select', options: ['Congé Payé', 'Maladie', 'Maternité', 'Sans Solde'], required: true },
    { name: 'date_debut', label: 'Date de début', type: 'date', required: true },
    { name: 'date_fin', label: 'Date de fin', type: 'date', required: true },
    { name: 'commentaire', label: 'Commentaire / Justification', placeholder: 'Ex: Vacances annuelles' },
  ] : [
    { name: 'objet', label: 'Objet de la dépense', required: true, placeholder: 'Ex: Taxi RDV Client' },
    { name: 'montant', label: 'Montant (FCFA)', type: 'number', required: true },
    { name: 'date', label: 'Date de la dépense', type: 'date', required: true },
    { name: 'type', label: 'Catégorie', type: 'select', options: ['Transport', 'Repas', 'Hébergement', 'Divers'], required: true },
  ];

  // ── TABS ──────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'dashboard', label: "Vue d'ensemble", icon: <LayoutDashboard size={15} /> },
    { id: 'dossier',   label: 'Mon Dossier RH', icon: <User size={15} /> },
    { id: 'leaves',    label: 'Congés',          icon: <Calendar size={15} /> },
    { id: 'expenses',  label: 'Notes de Frais',  icon: <Wallet size={15} /> },
    { id: 'payslips',  label: 'Fiches de Paie',  icon: <FileText size={15} /> },
  ];

  // ── RENDER DASHBOARD ──────────────────────────────────────────────────────
  const renderDashboard = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{req.date_debut || req.du || req.date}</div>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '1rem', background: req.statut === 'Validé' ? '#d1fae5' : '#fef3c7', color: req.statut === 'Validé' ? '#059669' : '#d97706', fontWeight: 700, textTransform: 'uppercase' }}>
                  {req.statut}
                </span>
              </div>
            ))}
            {[...myLeaves, ...myExpenses].length === 0 && (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem 0' }}>Aucune demande récente.</p>
            )}
          </div>
        </div>

        <div className="luxury-widget" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#111827', fontSize: '1.25rem' }}>
              <FileText size={20} color="#9ca3af" /> Documents RH
            </h3>
            <button onClick={() => navigateTo && navigateTo('dms')} style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              Tout voir →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myContract ? (
              <div style={{ padding: '1rem', borderRadius: '1rem', background: '#f0fdf4', border: '1px solid #34d39940', cursor: 'pointer' }}
                onClick={() => setActiveTab('dossier')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BadgeCheck size={16} color="#10B981" />
                    <span style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700 }}>
                      Contrat {myContract.type} — Actif
                    </span>
                  </div>
                  <ChevronRight size={14} color="#10B981" />
                </div>
                <p style={{ margin: '0.25rem 0 0 1.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                  Depuis le {myContract.date_debut || '—'}
                </p>
              </div>
            ) : (
              <div style={{ padding: '1rem', borderRadius: '1rem', background: '#f8fafc', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Contrat de travail</p>
              </div>
            )}
            {myPayslips.slice(0, 1).map((f, i) => (
              <div key={i} style={{ padding: '1rem', borderRadius: '1rem', background: '#f0fdf4', border: '1px dashed #34d399', textAlign: 'center', cursor: 'pointer' }}
                onClick={() => generatePDF(f.metadata, 'hr', 'payslip')}>
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
            <button onClick={() => navigateTo && navigateTo('projects')} style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
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
                  <div style={{ width: (p.progression || 0) + '%', height: '100%', background: p.color || '#10B981', borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  // ── RENDER MON DOSSIER RH ─────────────────────────────────────────────────
  const renderDossier = () => {
    const emp = myEmployeeRecord;
    const primesTotal = mySalary
      ? (Number(mySalary.prime_transport) || 0) + (Number(mySalary.prime_logement) || 0)
        + (Number(mySalary.prime_performance) || 0) + (Number(mySalary.prime_anciennete) || 0)
        + (Number(mySalary.indemnite_representation) || 0)
      : 0;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* Identity card */}
        <SectionCard title="Identité & Poste" icon={User} color="#3B82F6">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
            <InfoRow label="Nom complet"         value={emp?.nom}                                icon={User}      color="#3B82F6" />
            <InfoRow label="Email professionnel" value={emp?.email || currentUser?.email}        icon={Mail}      color="#3B82F6" />
            <InfoRow label="Poste"               value={emp?.poste}                              icon={Briefcase} color="#3B82F6" />
            <InfoRow label="Département"         value={emp?.dept || emp?.departement}           icon={Building2} color="#3B82F6" />
            <InfoRow label="Niveau hiérarchique" value={emp?.hierarchy_level || '—'}             icon={TrendingUp} color="#3B82F6" />
            <InfoRow label="Date d'entrée"       value={emp?.hr?.date_entree || emp?.date_entree} icon={Calendar} color="#3B82F6" />
          </div>
        </SectionCard>

        {/* Contract card */}
        <SectionCard title="Contrat de Travail" icon={BadgeCheck} color="#10B981">
          {myContract ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
              <InfoRow label="Type de contrat"  value={myContract.type}           icon={FileText}  color="#10B981" />
              <InfoRow label="Date de début"    value={myContract.date_debut}     icon={Calendar}  color="#10B981" />
              <InfoRow label="Date de fin"      value={myContract.date_fin || 'Indéterminée'} icon={Calendar} color="#10B981" />
              <InfoRow label="Poste contractuel" value={myContract.poste}         icon={Briefcase} color="#10B981" />
              <InfoRow label="Statut"           value={myContract.statut || 'Actif'} icon={CheckCircle2} color="#10B981" />
              <InfoRow label="Devise"           value={myContract.devise || 'XOF'} icon={Banknote} color="#10B981" />
            </div>
          ) : loadingDossier ? (
            <p style={{ color: '#9ca3af', fontWeight: 600, padding: '1rem 0' }}>Chargement du contrat...</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F59E0B', fontWeight: 700, padding: '0.75rem 0' }}>
              <AlertCircle size={16} /> Aucun contrat trouvé. Contactez votre service RH.
            </div>
          )}
        </SectionCard>

        {/* Salary card */}
        <SectionCard title="Structure Salariale" icon={Banknote} color="#F59E0B">
          {mySalary ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
              <InfoRow label="Salaire de base"   value={fmt(mySalary.salaire_base)} icon={Banknote}   color="#F59E0B" />
              <InfoRow label="Type"              value={mySalary.type_remuneration || 'Mensuel'} icon={TrendingUp} color="#F59E0B" />
              <InfoRow label="Prime transport"   value={fmt(mySalary.prime_transport)}   icon={Wallet} color="#F59E0B" />
              <InfoRow label="Prime logement"    value={fmt(mySalary.prime_logement)}    icon={Wallet} color="#F59E0B" />
              <InfoRow label="Prime performance" value={fmt(mySalary.prime_performance)} icon={Award}  color="#F59E0B" />
              <InfoRow label="Prime ancienneté"  value={fmt(mySalary.prime_anciennete)}  icon={Award}  color="#F59E0B" />
              {Number(mySalary.indemnite_representation) > 0 && (
                <InfoRow label="Indemnité représentation" value={fmt(mySalary.indemnite_representation)} icon={Shield} color="#F59E0B" />
              )}
              <InfoRow label="Total Primes"      value={fmt(primesTotal)}               icon={TrendingUp} color="#059669" />
              <InfoRow label="Brut total estimé" value={fmt(Number(mySalary.salaire_base) + primesTotal)} icon={Banknote} color="#059669" />
              <InfoRow label="Mode de paiement"  value={mySalary.mode_paiement}         icon={CreditCard} color="#F59E0B" />
              {mySalary.banque && <InfoRow label="Banque" value={mySalary.banque} icon={Building2} color="#F59E0B" />}
            </div>
          ) : loadingDossier ? (
            <p style={{ color: '#9ca3af', fontWeight: 600, padding: '1rem 0' }}>Chargement de la structure salariale...</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F59E0B', fontWeight: 700, padding: '0.75rem 0' }}>
              <AlertCircle size={16} /> Salaire non configuré. Contactez votre service RH.
            </div>
          )}
        </SectionCard>

        {/* Payslips shortcut */}
        <SectionCard title="Fiches de Paie Récentes" icon={FileText} color="#8B5CF6">
          {myPayslips.length === 0 ? (
            <p style={{ color: '#9ca3af', fontWeight: 600 }}>Aucune fiche de paie générée pour le moment.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {myPayslips.slice(0, 3).map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', background: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{f.metadata.salariesMois}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: 900, color: '#059669' }}>{formatCurrency(f.metadata.netAPayer)}</span>
                    <button onClick={() => generatePDF(f.metadata, 'hr', 'payslip')}
                      style={{ padding: '4px 12px', borderRadius: '0.6rem', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FileText size={12} color="#10B981" /> Télécharger
                    </button>
                  </div>
                </div>
              ))}
              {myPayslips.length > 3 && (
                <button onClick={() => setActiveTab('payslips')}
                  style={{ background: 'none', border: 'none', color: '#8B5CF6', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left' }}>
                  Voir tout ({myPayslips.length} fiches) →
                </button>
              )}
            </div>
          )}
        </SectionCard>
      </motion.div>
    );
  };

  return (
    <div className={embedded ? '' : 'luxury-dashboard-container'}
      style={{ padding: embedded ? '0' : '3rem', minHeight: embedded ? 'auto' : '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* HEADER */}
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
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => navigateTo && navigateTo('timesheets')} className="luxury-widget"
                style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer' }}>
                <Clock size={16} /> <span style={{ fontWeight: 600 }}>Saisir Temps</span>
              </button>
              <button onClick={() => navigateTo && navigateTo('planning')} className="luxury-widget"
                style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', cursor: 'pointer' }}>
                <Calendar size={16} /> <span style={{ fontWeight: 600 }}>Planning</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '1.5rem', backdropFilter: 'blur(10px)', flexWrap: 'wrap', gap: '0.25rem' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.7rem 1.25rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
                background: activeTab === tab.id ? 'white' : 'transparent',
                color: activeTab === tab.id ? '#111827' : '#6b7280',
                boxShadow: activeTab === tab.id ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none',
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem',
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {(activeTab === 'leaves' || activeTab === 'expenses') && (
          <button className="luxury-widget" onClick={() => setIsModalOpen(true)}
            style={{ padding: '0.8rem 2rem', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', borderRadius: '1.5rem' }}>
            <Plus size={18} />
            <span style={{ fontWeight: 600 }}>Nouvelle Demande</span>
          </button>
        )}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, paddingBottom: '2rem' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'dossier'   && renderDossier()}

          {(activeTab === 'leaves' || activeTab === 'expenses') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="luxury-widget" style={{ borderRadius: '1.5rem', overflow: 'hidden', padding: 0 }}>
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
                        {activeTab === 'leaves' ? `${req.date_debut || req.du || '—'} au ${req.date_fin || req.au || '—'}` : req.objet}
                      </td>
                      <td style={{ padding: '1.5rem', color: '#475569', fontWeight: 500 }}>
                        {activeTab === 'leaves' ? req.type : formatCurrency(req.montant)}
                      </td>
                      <td style={{ padding: '1.5rem' }}>
                        <span style={{ padding: '0.4rem 1rem', borderRadius: '1rem', background: req.statut === 'Validé' ? '#d1fae5' : '#fef3c7', color: req.statut === 'Validé' ? '#059669' : '#d97706', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="luxury-widget" style={{ borderRadius: '1.5rem', overflow: 'hidden', padding: 0 }}>
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
                      <td style={{ padding: '1.5rem', fontWeight: 700, color: '#1e293b' }}>{f.metadata.salariesMois}</td>
                      <td style={{ padding: '1.5rem', color: '#10B981', fontWeight: 800, fontSize: '1.1rem' }}>{formatCurrency(f.metadata.netAPayer)}</td>
                      <td style={{ padding: '1.5rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>{f.name}</td>
                      <td style={{ padding: '1.5rem' }}>
                        <button onClick={() => generatePDF(f.metadata, 'hr', 'payslip')}
                          style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
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
        title={activeTab === 'leaves' ? 'Demande de Congés' : 'Note de Frais'}
        fields={modalFields}
      />
    </div>
  );
};

export default React.memo(StaffPortal);
