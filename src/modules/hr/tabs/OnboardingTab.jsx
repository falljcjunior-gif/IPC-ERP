import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../../store';
import {
  UserPlus, Mail, Lock, Briefcase,
  Shield, Check, Calendar, Loader,
  Search, Edit3, Save, ChevronRight,
  AlertTriangle, User,
  FileSignature, ChevronLeft, Building2, Wallet, Target,
  Banknote, CreditCard, LockKeyhole
} from 'lucide-react';
import { PermissionMatrix } from '../components/PermissionMatrix';
import { debugInteraction } from '../../../utils/InteractionAuditor';
import { SALARY_TYPES, CURRENCIES, PAYMENT_MODES } from '../../../schemas/payroll.schema';
import { getTenantContext } from '../../../services/TenantContext';

// ─────────────────────────────────────────────────────────────────
// WIZARD STEPS
// ─────────────────────────────────────────────────────────────────

const StepIdentity = ({ formData, handleInputChange }) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card">
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <User size={24} color="var(--accent)" /> Identité du Collaborateur
      </h3>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Informations de base pour la création du compte.</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div className="input-group">
        <label>Nom Complet</label>
        <div className="input-wrapper">
          <User size={18} />
          <input required type="text" name="nom" value={formData.nom} onChange={handleInputChange} placeholder="Ex: Jean Dupont" />
        </div>
      </div>
      <div className="input-group">
        <label>Adresse Email Pro</label>
        <div className="input-wrapper">
          <Mail size={18} />
          <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="jean.dupont@ipc.com" />
        </div>
      </div>
      <div className="input-group">
        <label>Mot de passe provisoire</label>
        <div className="input-wrapper" style={{ border: formData.password && formData.password.length < 6 ? '1px solid #EF4444' : '1px solid var(--border)' }}>
          <Lock size={18} />
          <input required type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" />
        </div>
        {formData.password && formData.password.length < 6 && (
          <p style={{ margin: '0.25rem 0 0 0.5rem', fontSize: '0.7rem', color: '#EF4444', fontWeight: 600 }}>
            Minimum 6 caractères requis.
          </p>
        )}
      </div>
      <div className="input-group">
        <label>Département</label>
        <div className="input-wrapper">
          <Building2 size={18} />
          <select name="dept" value={formData.dept} onChange={handleInputChange}>
            <option value="Production">Production</option>
            <option value="Ventes">Ventes</option>
            <option value="RH">Ressources Humaines</option>
            <option value="Finance">Finance</option>
            <option value="Logistique">Logistique</option>
            <option value="Direction">Direction</option>
          </select>
        </div>
      </div>
      <div className="input-group" style={{ gridColumn: 'span 2' }}>
        <label>Poste / Intitulé de mission</label>
        <div className="input-wrapper">
          <Briefcase size={18} />
          <input type="text" name="poste" value={formData.poste} onChange={handleInputChange} placeholder="Ex: Directeur de Production" />
        </div>
      </div>
    </div>
  </motion.div>
);

const StepContract = ({ formData, handleInputChange }) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card">
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <FileSignature size={24} color="#10B981" /> Conditions Contractuelles
      </h3>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Détails administratifs et financiers.</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div className="input-group">
        <label>Type de Contrat</label>
        <div className="input-wrapper">
          <FileSignature size={18} />
          <select name="contratType" value={formData.contratType} onChange={handleInputChange}>
            <option value="CDI">CDI</option>
            <option value="CDD">CDD</option>
            <option value="Stage">Stage</option>
            <option value="Freelance">Freelance</option>
          </select>
        </div>
      </div>
      <div className="input-group">
        <label>Date d&apos;entrée</label>
        <div className="input-wrapper">
          <Calendar size={18} />
          <input type="date" name="date_entree" value={formData.date_entree} onChange={handleInputChange} />
        </div>
      </div>
      <div className="input-group">
        <label>Salaire de base (Mensuel Brut)</label>
        <div className="input-wrapper">
          <Wallet size={18} />
          <input type="number" name="salaire" value={formData.salaire} onChange={handleInputChange} placeholder="0.00" />
        </div>
      </div>
      <div className="input-group">
        <label>Niveau Hiérarchique</label>
        <div className="input-wrapper">
          <Target size={18} />
          <select name="hierarchy_level" value={formData.hierarchy_level} onChange={handleInputChange}>
            <option value="Employee">Employé</option>
            <option value="Manager">Manager</option>
            <option value="Director">Directeur</option>
            <option value="Executive">Exécutif</option>
          </select>
        </div>
      </div>
    </div>
  </motion.div>
);

const StepSalaire = ({ formData, handleInputChange }) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card">
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Banknote size={24} color="#F59E0B" /> Structure Salariale
        </h3>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '3px 10px', borderRadius: '999px', background: '#F59E0B15', color: '#F59E0B', fontSize: '0.7rem', fontWeight: 800, border: '1px solid #F59E0B30' }}>
          <LockKeyhole size={12} /> Données Confidentielles
        </span>
      </div>
      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Rémunération, primes et modalités de paiement (accès restreint RH).</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div className="input-group">
        <label>Salaire de Base Mensuel Brut *</label>
        <div className="input-wrapper">
          <Wallet size={18} />
          <input required type="number" name="salaire_base" value={formData.salaire_base} onChange={handleInputChange} placeholder="0.00" min="0" />
        </div>
      </div>
      <div className="input-group">
        <label>Devise</label>
        <div className="input-wrapper">
          <Banknote size={18} />
          <select name="devise" value={formData.devise} onChange={handleInputChange}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="input-group">
        <label>Type de Rémunération</label>
        <div className="input-wrapper">
          <Target size={18} />
          <select name="type_remuneration" value={formData.type_remuneration} onChange={handleInputChange}>
            {Object.values(SALARY_TYPES).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="input-group">
        <label>Périodicité</label>
        <div className="input-wrapper">
          <Calendar size={18} />
          <select name="periodicite" value={formData.periodicite} onChange={handleInputChange}>
            <option value="Mensuel">Mensuel</option>
            <option value="Bimensuel">Bimensuel</option>
            <option value="Hebdomadaire">Hebdomadaire</option>
            <option value="Journalier">Journalier</option>
          </select>
        </div>
      </div>
      <div className="input-group">
        <label>Prime de Transport (XOF)</label>
        <div className="input-wrapper">
          <Wallet size={18} />
          <input type="number" name="prime_transport" value={formData.prime_transport} onChange={handleInputChange} placeholder="0" min="0" />
        </div>
      </div>
      <div className="input-group">
        <label>Prime de Logement (XOF)</label>
        <div className="input-wrapper">
          <Wallet size={18} />
          <input type="number" name="prime_logement" value={formData.prime_logement} onChange={handleInputChange} placeholder="0" min="0" />
        </div>
      </div>
      <div className="input-group">
        <label>Prime de Performance (XOF)</label>
        <div className="input-wrapper">
          <Wallet size={18} />
          <input type="number" name="prime_performance" value={formData.prime_performance} onChange={handleInputChange} placeholder="0" min="0" />
        </div>
      </div>
      <div className="input-group">
        <label>Prime d&apos;Ancienneté (XOF)</label>
        <div className="input-wrapper">
          <Wallet size={18} />
          <input type="number" name="prime_anciennete" value={formData.prime_anciennete} onChange={handleInputChange} placeholder="0" min="0" />
        </div>
      </div>
      <div className="input-group">
        <label>Indemnité de Représentation (XOF)</label>
        <div className="input-wrapper">
          <Wallet size={18} />
          <input type="number" name="indemnite_representation" value={formData.indemnite_representation} onChange={handleInputChange} placeholder="0" min="0" />
        </div>
      </div>
      <div className="input-group">
        <label>Mode de Paiement</label>
        <div className="input-wrapper">
          <CreditCard size={18} />
          <select name="mode_paiement" value={formData.mode_paiement} onChange={handleInputChange}>
            {PAYMENT_MODES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="input-group">
        <label>Banque</label>
        <div className="input-wrapper">
          <Building2 size={18} />
          <input type="text" name="banque" value={formData.banque} onChange={handleInputChange} placeholder="Ex: BICICI, UBA, SGBCI..." />
        </div>
      </div>
      <div className="input-group">
        <label>Numéro de Compte Bancaire</label>
        <div className="input-wrapper">
          <CreditCard size={18} />
          <input type="text" name="compte_bancaire" value={formData.compte_bancaire} onChange={handleInputChange} placeholder="Ex: CI012..." />
        </div>
      </div>
      <div className="input-group" style={{ gridColumn: 'span 2' }}>
        <label>Date d&apos;Effet du Salaire</label>
        <div className="input-wrapper">
          <Calendar size={18} />
          <input type="date" name="date_effet_salaire" value={formData.date_effet_salaire} onChange={handleInputChange} />
        </div>
      </div>
    </div>
  </motion.div>
);

const StepPermissions = ({ localPermissions, setLocalPermissions }) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card">
     <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Shield size={24} color="#8B5CF6" /> Gouvernance & Accès Modules
      </h3>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Définissez le périmètre d&apos;action du collaborateur dans l&apos;ERP.</p>
    </div>
    <PermissionMatrix permissions={localPermissions} onChange={setLocalPermissions} />
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────
// SUB-PANEL : Modifier les accès d'un employé existant
// ─────────────────────────────────────────────────────────────────
const EditAccessPanel = ({ employee, onClose }) => {
  const permissions = useStore(state => state.permissions);
  const permanentlyDeleteUserRecord = useStore(state => state.permanentlyDeleteUserRecord);
  const userPerms = permissions[employee?.id] || { hierarchy_level: 'Employee', modules: {} };
  
  const [localPerms, setLocalPerms] = useState(userPerms);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    setSaveError('');
    if (!employee?.id) return;
    setSaving(true);
    try {
      await useStore.getState().updateUserPermissions(employee.id, localPerms);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 2000);
    } catch (err) {
      setSaveError(`Erreur : ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg)', gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', color: 'var(--accent)' }}>
            {(employee.nom || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{employee.nom}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{employee.poste} — <span style={{ color: 'var(--accent)' }}>{localPerms.hierarchy_level}</span></div>
          </div>
        </div>
        <button onClick={onClose} className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
          Fermer
        </button>
      </div>

      <PermissionMatrix permissions={localPerms} onChange={setLocalPerms} />

      <div style={{ marginTop: '2.5rem' }}>
        {saveError && <div style={{ color: '#EF4444', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 700 }}>{saveError}</div>}
        <button onClick={handleSave} disabled={saving || saved} className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontWeight: 900, background: saved ? '#10B981' : 'var(--accent)', borderColor: saved ? '#10B981' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          {saving ? <Loader className="spin" size={20} /> : saved ? <Check size={20} /> : <Save size={20} />}
          {saving ? 'Sauvegarde...' : saved ? 'Appliqué !' : 'Mettre à jour'}
        </button>
      </div>

      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px dashed #EF444440' }}>
        <h4 style={{ color: '#EF4444', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', fontSize: '0.9rem' }}>
          <AlertTriangle size={18} /> ZONE DE DANGER
        </h4>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #EF444430', background: '#EF444405', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>Suppression Définitive</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Purge Auth + Firestore (Unified 2.0).</div>
          </div>
          <button onClick={() => { if (window.confirm('Action irréversible. Confirmer ?')) { permanentlyDeleteUserRecord(employee.id); onClose(); } }} style={{ padding: '0.75rem 1.25rem', borderRadius: '0.8rem', background: '#EF4444', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
            Supprimer le Compte
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────
// ENTITY BADGE — affiche l'entité active en haut du wizard
// ─────────────────────────────────────────────────────────────────
const SPACE_CONFIG = {
  HOLDING:    { label: 'Holding Groupe', color: '#059669', bg: '#ECFDF5', border: '#10B98130', icon: '🏛️' },
  SUBSIDIARY: { label: 'Filiale',        color: '#3B82F6', bg: '#EFF6FF', border: '#3B82F630', icon: '🏢' },
  FOUNDATION: { label: 'Fondation',      color: '#F59E0B', bg: '#FFFBEB', border: '#F59E0B30', icon: '🤝' },
};

const EntityBadge = ({ ctx }) => {
  const type = ctx?.entity_type || 'SUBSIDIARY';
  const cfg  = SPACE_CONFIG[type] || SPACE_CONFIG.SUBSIDIARY;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.25rem', borderRadius: '1rem', background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: '1.75rem' }}>
      <span style={{ fontSize: '1.2rem' }}>{cfg.icon}</span>
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: '1px' }}>{cfg.label}</div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
          {ctx?.entity_name || ctx?.entity_id || '—'}
          <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>· ID: {ctx?.entity_id || '—'}</span>
        </div>
      </div>
      <div style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: cfg.color + '20', color: cfg.color }}>
        Affectation automatique
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT (HR 2.0 ONBOARDING)
// ─────────────────────────────────────────────────────────────────
const OnboardingTab = ({ accessLevel }) => {
  const createFullUser = useStore(state => state.createFullUser);
  const data = useStore(state => state.data);
  const permissions = useStore(state => state.permissions);
  const [step, setStep] = useState(1);
  const currentTenant = getTenantContext();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('create'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    nom: '', email: '', password: '',
    poste: '', dept: 'Production', contratType: 'CDI',
    date_entree: new Date().toISOString().split('T')[0],
    salaire: '', hierarchy_level: 'Employee',
    // Salary structure fields
    salaire_base: '',
    devise: 'XOF',
    type_remuneration: 'Mensuel',
    periodicite: 'Mensuel',
    prime_transport: '',
    prime_logement: '',
    prime_performance: '',
    prime_anciennete: '',
    indemnite_representation: '',
    mode_paiement: 'Virement Bancaire',
    banque: '',
    compte_bancaire: '',
    date_effet_salaire: new Date().toISOString().split('T')[0],
  });

  const [localPermissions, setLocalPermissions] = useState({
    hierarchy_level: 'Employee',
    modules: { home: { access: 'write', subTabs: {} } }
  });

  const allEmployees = useMemo(() => data?.employees || [], [data?.employees]);
  
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return allEmployees;
    const q = searchQuery.toLowerCase();
    return allEmployees.filter(e =>
      (e.nom || '').toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q)
    );
  }, [allEmployees, searchQuery]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProvision = async () => {
    setLoading(true);
    setError('');
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      setLoading(false);
      return;
    }

    // Inject current tenant context so the new employee lands in the right space
    const tenantCtx = currentTenant || getTenantContext();

    const finalData = {
      ...formData,
      salaire: parseFloat(formData.salaire_base) || parseFloat(formData.salaire) || 0,
      salaire_base: parseFloat(formData.salaire_base) || 0,
      devise: formData.devise || 'XOF',
      type_remuneration: formData.type_remuneration || 'Mensuel',
      periodicite: formData.periodicite || 'Mensuel',
      prime_transport: parseFloat(formData.prime_transport) || 0,
      prime_logement: parseFloat(formData.prime_logement) || 0,
      prime_performance: parseFloat(formData.prime_performance) || 0,
      prime_anciennete: parseFloat(formData.prime_anciennete) || 0,
      indemnite_representation: parseFloat(formData.indemnite_representation) || 0,
      mode_paiement: formData.mode_paiement || 'Virement Bancaire',
      banque: formData.banque || '',
      compte_bancaire: formData.compte_bancaire || '',
      date_effet_salaire: formData.date_effet_salaire || new Date().toISOString().split('T')[0],
      role: formData.hierarchy_level === 'Employee' ? 'STAFF' : (formData.hierarchy_level === 'Executive' ? 'ADMIN' : 'STAFF'),
      permissions: localPermissions,
      // [MULTI-TENANT] Pass the space where the employee is created
      // so their users/{uid} document gets the right entity_type/entity_id
      // and App.jsx routes them to the correct space on login.
      entity_type: tenantCtx?.entity_type || 'SUBSIDIARY',
      entity_id:   tenantCtx?.entity_id   || 'ipc_green_blocks',
      entity_name: tenantCtx?.entity_name || tenantCtx?.entity_id || 'IPC Group',
      tenant_id:   tenantCtx?.tenant_id   || 'ipc_group',
    };
    try {
      await createFullUser(finalData);
      setSuccess(true);
      debugInteraction('hr_provision_success', { email: formData.email, role: finalData.role });
      // On laisse l'utilisateur profiter du message de succès avant de reset
      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setMode('edit');
        setFormData({
          nom: '', email: '', password: '', dept: 'Production', poste: '', contratType: 'CDI',
          date_entree: '', salaire: '', hierarchy_level: 'Employee',
          salaire_base: '', devise: 'XOF', type_remuneration: 'Mensuel', periodicite: 'Mensuel',
          prime_transport: '', prime_logement: '', prime_performance: '', prime_anciennete: '',
          indemnite_representation: '', mode_paiement: 'Virement Bancaire', banque: '', compte_bancaire: '',
          date_effet_salaire: new Date().toISOString().split('T')[0],
        });
      }, 5000);
    } catch (err) {
      console.error('[Onboarding] Provisioning failed:', err);
      setError(err.message || "Échec du provisionnement. Vérifiez la connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Navigation Mode */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--bg-subtle)', padding: '0.4rem', borderRadius: '1rem', width: 'fit-content' }}>
        <button onClick={() => setMode('create')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', background: mode === 'create' ? 'var(--accent)' : 'transparent', color: mode === 'create' ? 'white' : 'var(--text-muted)' }}>
          <UserPlus size={16} /> Nouvel Employé
        </button>
        <button onClick={() => setMode('edit')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', background: mode === 'edit' ? 'var(--accent)' : 'transparent', color: mode === 'edit' ? 'white' : 'var(--text-muted)' }}>
          <Edit3 size={16} /> Gérer les Accès
        </button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'create' ? (
          <motion.div key="wizard">
             {/* Entity badge — auto-affectation de l'espace actif */}
             <EntityBadge ctx={currentTenant} />

             {/* Wizard Progress Bar (4 steps) */}
             <div style={{ marginBottom: '2rem' }}>
               <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                 {[1, 2, 3, 4].map(i => (
                   <div key={i} style={{ flex: 1, height: '6px', borderRadius: '3px', background: step >= i ? 'var(--accent)' : 'var(--border)', transition: '0.3s' }} />
                 ))}
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                 <span style={{ color: step >= 1 ? 'var(--accent)' : 'var(--text-muted)' }}>Identité</span>
                 <span style={{ color: step >= 2 ? 'var(--accent)' : 'var(--text-muted)' }}>Contrat</span>
                 <span style={{ color: step >= 3 ? '#F59E0B' : 'var(--text-muted)' }}>Salaire</span>
                 <span style={{ color: step >= 4 ? '#8B5CF6' : 'var(--text-muted)' }}>Accès</span>
               </div>
             </div>

             {success ? (
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass" style={{ textAlign: 'center', padding: '4rem', borderRadius: '2rem', border: '2px solid #10B98120', background: '#10B98105' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto', boxShadow: '0 20px 40px #10B98130' }}>
                    <Check size={40} />
                  </div>
                  <h2 style={{ fontWeight: 900, color: '#064E3B', fontSize: '2rem' }}>Provisionnement Terminé !</h2>
                  <p style={{ color: '#064E3B', opacity: 0.7, fontWeight: 600 }}>Le compte est actif et les accès sont configurés.</p>
               </motion.div>
             ) : (
               <>
                 {step === 1 && <StepIdentity formData={formData} handleInputChange={handleInputChange} />}
                 {step === 2 && <StepContract formData={formData} handleInputChange={handleInputChange} />}
                 {step === 3 && <StepSalaire formData={formData} handleInputChange={handleInputChange} />}
                 {step === 4 && <StepPermissions localPermissions={localPermissions} setLocalPermissions={setLocalPermissions} />}

                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                    <button disabled={step === 1 || loading} onClick={() => setStep(s => s - 1)} className="glass" style={{ padding: '0.8rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ChevronLeft size={18} /> Retour
                    </button>
                    {step < 4 ? (
                      <button onClick={() => setStep(s => s + 1)} className="btn-primary" style={{ padding: '0.8rem 2rem', borderRadius: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Suivant <ChevronRight size={18} />
                      </button>
                    ) : (
                      <button disabled={loading} onClick={handleProvision} className="btn-primary" style={{ padding: '0.8rem 2.5rem', borderRadius: '1rem', fontWeight: 900, background: '#10B981', borderColor: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {loading ? <Loader className="spin" size={20} /> : <Check size={20} />}
                        {loading ? 'Création...' : 'Finaliser le Recrutement'}
                      </button>
                    )}
                 </div>
                 {error && <div style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.85rem', marginTop: '1rem', textAlign: 'center' }}>{error}</div>}
               </>
             )}
          </motion.div>
        ) : (
          <motion.div key="edit" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
             <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..." style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto' }}>
                  {filteredEmployees.map(emp => (
                    <div key={emp.id} onClick={() => setSelectedEmployee(emp)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', borderRadius: '1rem', cursor: 'pointer', background: selectedEmployee?.id === emp.id ? 'var(--accent-subtle)' : 'transparent', border: `1px solid ${selectedEmployee?.id === emp.id ? 'var(--accent)' : 'transparent'}` }}>
                       <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--accent)' }}>
                        {(emp.nom || '?')[0].toUpperCase()}
                       </div>
                       <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{emp.nom}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.poste || emp.role}</div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>
             {selectedEmployee ? (
               <EditAccessPanel employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
             ) : (
               <div className="glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', opacity: 0.3, minHeight: '400px' }}>
                  <Shield size={64} />
                  <p style={{ fontWeight: 700 }}>Sélectionnez un profil</p>
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .glass-card {
          background: var(--bg);
          border: 1px solid var(--border);
          padding: 2.5rem;
          border-radius: 2rem;
          box-shadow: 0 20px 50px rgba(0,0,0,0.05);
        }
        .input-group label {
          display: block;
          font-weight: 800;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          color: var(--text-muted);
        }
        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--bg-subtle);
          border: 1px solid var(--border);
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          transition: 0.3s;
        }
        .input-wrapper:focus-within {
          border-color: var(--accent);
          background: var(--bg);
          box-shadow: 0 0 0 4px var(--accent-subtle);
        }
        .input-wrapper input, .input-wrapper select {
          background: none;
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text);
        }
      `}</style>
    </motion.div>
  );
};

export default OnboardingTab;
