import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../../store';
import { 
  UserPlus, Mail, Lock, Briefcase, DollarSign, 
  Shield, Check, Calendar, Settings, AlertCircle, Loader,
  Search, Edit3, Save, Users, ToggleLeft, ToggleRight, ChevronRight,
  Eye, Pencil, ShieldOff,
  User, MessageCircle, Target, ShoppingCart, Megaphone, Package, ShoppingBag, PieChart, Scale, Kanban, Headphones, Activity, BarChart2,
  Zap, Layout, Truck, Factory, CreditCard, Landmark as LandmarkIcon, Wallet, Users2, Heart, LifeBuoy, Folder, FileSignature
} from 'lucide-react';
import { FirestoreService } from '../../../services/firestore.service';
import { logger } from '../../../utils/logger';


const availableModules = [
  // --- Cockpit ---
  { id: 'command_center', category: 'Cockpit', label: 'Vue 360°', role: 'ADMIN', icon: Activity, color: '#3B82F6', desc: 'Tableau de bord global' },
  { id: 'connect', category: 'Cockpit', label: 'Connect Plus', role: 'STAFF', icon: Zap, color: '#8B5CF6', desc: 'Communications' },

  // --- CRM & Ventes ---
  { id: 'crm', category: 'CRM & Ventes', label: 'CRM & Ventes', role: 'SALES', icon: Users, color: '#3B82F6', desc: 'Pistes & Clients' },
  { id: 'sales', category: 'CRM & Ventes', label: 'Ventes & Devis', role: 'SALES', icon: ShoppingCart, color: '#06B6D4', desc: 'Devis & Commandes' },
  { id: 'commerce', category: 'CRM & Ventes', label: 'PdV & Abonnements', role: 'SALES', icon: ShoppingBag, color: '#10B981', desc: 'Ventes & Retail' },
  { id: 'website', category: 'CRM & Ventes', label: 'Sites Web', role: 'MARKETING', icon: Layout, color: '#8B5CF6', desc: 'Gestion site' },
  { id: 'marketing', category: 'CRM & Ventes', label: 'Marketing Digital', role: 'MARKETING', icon: Mail, color: '#F59E0B', desc: 'Campagnes & SEO' },

  // --- Opérations & Logistique ---
  { id: 'inventory', category: 'Opérations & Logistique', label: 'Stocks & Logistique', role: 'LOGISTICS', icon: Package, color: '#F97316', desc: 'Gestion des stocks' },
  { id: 'shipping', category: 'Opérations & Logistique', label: 'Expéditions', role: 'LOGISTICS', icon: Truck, color: '#F59E0B', desc: 'Livrables & Transports' },
  { id: 'purchase', category: 'Opérations & Logistique', label: 'Achats', role: 'PURCHASE', icon: ShoppingBag, color: '#64748B', desc: 'Commandes fournisseurs' },
  { id: 'production', category: 'Opérations & Logistique', label: 'Production & Usine', role: 'PRODUCTION', icon: Factory, color: '#10B981', desc: 'Atelier & Nomenclatures' },
  { id: 'projects', category: 'Opérations & Logistique', label: 'Projets', role: 'PROJECTS', icon: Briefcase, color: '#8B5CF6', desc: 'Tâches & Délais' },
  { id: 'fleet', category: 'Opérations & Logistique', label: 'Flotte', role: 'LOGISTICS', icon: Truck, color: '#06B6D4', desc: 'Parc automobile' },

  // --- Finance & Stratégie ---
  { id: 'finance', category: 'Finance & Stratégie', label: 'Finance & Comptabilité', role: 'FINANCE', icon: CreditCard, color: '#6366F1', desc: 'Trésorerie globale' },
  { id: 'legal', category: 'Finance & Stratégie', label: 'Juridique', role: 'LEGAL', icon: Scale, color: '#14B8A6', desc: 'Conformité & Contrats' },
  { id: 'accounting', category: 'Finance & Stratégie', label: 'Comptabilité', role: 'FINANCE', icon: LandmarkIcon, color: '#8B5CF6', desc: 'Bilans & Opérations' },
  { id: 'budget', category: 'Finance & Stratégie', label: 'Budget', role: 'FINANCE', icon: PieChart, color: '#F43F5E', desc: 'Planification budgétaire' },
  { id: 'expenses', category: 'Finance & Stratégie', label: 'Notes de Frais', role: 'FINANCE', icon: Wallet, color: '#EC4899', desc: 'Dépenses employés' },
  { id: 'bi', category: 'Finance & Stratégie', label: 'Business Intelligence', role: 'FINANCE', icon: PieChart, color: '#0EA5E9', desc: 'Tableaux de bord' },
  { id: 'analytics', category: 'Finance & Stratégie', label: 'Analyses Avancées', role: 'FINANCE', icon: BarChart2, color: '#6366F1', desc: 'Analytiques' },

  // --- RH & Collaboration ---
  { id: 'hr', category: 'RH & Collaboration', label: 'Ressources Humaines', role: 'HR', icon: Users2, color: '#EC4899', desc: 'Employés & Paie' },
  { id: 'talent', category: 'RH & Collaboration', label: 'People & Culture', role: 'HR', icon: Heart, color: '#F43F5E', desc: 'Recrutement & Talents' },
  { id: 'planning', category: 'RH & Collaboration', label: 'Planning & Événements', role: 'HR', icon: Calendar, color: '#10B981', desc: 'Absences & Horaires' },
  { id: 'helpdesk', category: 'RH & Collaboration', label: 'Support & Helpdesk', role: 'SUPPORT', icon: LifeBuoy, color: '#3B82F6', desc: 'Assistance tickets' },
  { id: 'dms', category: 'RH & Collaboration', label: 'Documents Cloud', role: 'STAFF', icon: Folder, color: '#8B5CF6', desc: 'Stockage & GED' },
  { id: 'signature', category: 'RH & Collaboration', label: 'Signature Électronique', role: 'ADMIN', icon: FileSignature, color: '#14B8A6', desc: 'Contrats signés' },

  // --- Configuration ---
  { id: 'control_hub', category: 'Configuration', label: 'Administration', role: 'ADMIN', icon: Settings, color: '#EF4444', desc: 'Paramètres système' },
];

const moduleCategories = [
  'Cockpit',
  'CRM & Ventes',
  'Opérations & Logistique',
  'Finance & Stratégie',
  'RH & Collaboration',
  'Configuration'
];

// ─────────────────────────────────────────────────────────────────
// SUB-PANEL : Modifier les accès d'un employé existant
// ─────────────────────────────────────────────────────────────────
const EditAccessPanel = ({ employee, onClose }) => {
  const { permissions } = useStore();

  const userPerms = permissions[employee?.id] || { roles: [], moduleAccess: {} };
  
  const [localAccess, setLocalAccess] = useState(() => {
    const access = { ...(userPerms.moduleAccess || {}) };
    if (!access['home']) access['home'] = 'write';
    return access;
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const setAccess = (modId, level) => {
    if (modId === 'home') return;
    setLocalAccess(prev => {
      const next = { ...prev };
      if (level === 'none') delete next[modId];
      else next[modId] = level;
      return next;
    });
  };

  const handleSave = async () => {
    setSaveError('');
    if (!employee?.id) {
      setSaveError("ID employé manquant.");
      return;
    }

    setSaving(true);
    try {
      const rolesMap = {};
      Object.entries(localAccess).forEach(([modId, level]) => {
        const mod = availableModules.find(m => m.id === modId);
        if (mod?.role && level !== 'none') rolesMap[mod.role] = true;
      });
      const newRoles = Object.keys(rolesMap);
      if (newRoles.length === 0) newRoles.push('STAFF');

      const newPerms = { roles: newRoles, moduleAccess: localAccess };

      await FirestoreService.setDocument('users', employee.id, { permissions: newPerms });
      await FirestoreService.setDocument('hr', employee.id, { permissions: newPerms, role: newRoles[0], subModule: 'employees' });

      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 2000);
    } catch (err) {
      logger.error('Access Update Error', err);
      setSaveError(`Erreur : ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', color: 'var(--accent)' }}>
            {(employee.nom || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{employee.nom}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{employee.poste}</div>
          </div>
        </div>
        <button onClick={onClose} className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
          Annuler
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} color="var(--accent)" /> Matrice des Habilitations
        </h4>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Définissez les niveaux d'accès par module (Lecture / Écriture).</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {moduleCategories.map(cat => {
           const mods = availableModules.filter(m => m.category === cat);
           if (mods.length === 0) return null;
           return (
             <div key={cat}>
               <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>{cat}</div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                 {mods.map(mod => {
                   const level = localAccess[mod.id] || 'none';
                   const Icon = mod.icon;
                   return (
                     <div key={mod.id} className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', background: level !== 'none' ? 'var(--bg-subtle)' : 'transparent', border: '1px solid var(--border)', transition: '0.2s' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 200px', minWidth: 0 }}>
                         <div style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '12px', background: `${mod.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: mod.color }}>
                           <Icon size={20} />
                         </div>
                         <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                           <span style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{mod.label}</span>
                           <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{mod.desc}</span>
                         </div>
                       </div>
                       
                       <div style={{ display: 'flex', gap: '4px', background: 'var(--bg)', padding: '6px', borderRadius: '0.75rem', border: '1px solid var(--border)', flexShrink: 0 }}>
                         <button onClick={() => setAccess(mod.id, 'none')} title="Aucun accès" style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: level === 'none' ? '#EF4444' : 'transparent', color: level === 'none' ? 'white' : 'var(--text-muted)', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.75rem' }}>
                           <ShieldOff size={16} /> <span style={{ display: level === 'none' ? 'block' : 'none' }}>Aucun</span>
                         </button>
                         <button onClick={() => setAccess(mod.id, 'read')} title="Regard (Lecture)" style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: level === 'read' ? 'var(--accent)' : 'transparent', color: level === 'read' ? 'white' : 'var(--text-muted)', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.75rem' }}>
                           <Eye size={16} /> <span style={{ display: level === 'read' ? 'block' : 'none' }}>Lecture</span>
                         </button>
                         <button onClick={() => setAccess(mod.id, 'write')} title="Modification (Écriture)" style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: level === 'write' ? '#10B981' : 'transparent', color: level === 'write' ? 'white' : 'var(--text-muted)', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.75rem' }}>
                           <Pencil size={16} /> <span style={{ display: level === 'write' ? 'block' : 'none' }}>Écriture</span>
                         </button>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
           );
        })}
      </div>

      <button onClick={handleSave} disabled={saving || saved} className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontWeight: 900, background: saved ? '#10B981' : 'var(--accent)', borderColor: saved ? '#10B981' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
        {saving ? <Loader className="spin" size={20} /> : saved ? <Check size={20} /> : <Save size={20} />}
        {saving ? 'Sauvegarde...' : saved ? 'Accès enregistrés !' : 'Enregistrer la matrice'}
      </button>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
const OnboardingTab = ({ accessLevel }) => {
  const { createFullUser, data, permissions } = useStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('create'); // 'create' | 'edit'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    nom: '', email: '', password: '', 
    poste: '', dept: 'Ventes', contratType: 'CDI', 
    contratDuree: '', salaire: ''
  });

  const [localAccess, setLocalAccess] = useState({ home: 'write' });

  // Load all employees from HR data
  const allEmployees = useMemo(() => {
    return data?.hr?.employees || [];
  }, [data?.hr?.employees]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return allEmployees;
    const q = searchQuery.toLowerCase();
    return allEmployees.filter(e =>
      (e.nom || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.poste || '').toLowerCase().includes(q)
    );
  }, [allEmployees, searchQuery]);

  const setAccess = (modId, level) => {
    if (modId === 'home') return;
    setLocalAccess(prev => {
      const next = { ...prev };
      if (level === 'none') {
        delete next[modId];
      } else {
        next[modId] = level;
      }
      return next;
    });
  };

  const toggleCreateCategory = (cat, forceLevel = 'write') => {
    const catMods = availableModules.filter(m => m.category === cat && !m.locked).map(m => m.id);
    const allSelected = catMods.every(m => localAccess[m]);
    
    setLocalAccess(prev => {
      const next = { ...prev };
      if (allSelected && forceLevel === 'write') {
        catMods.forEach(m => delete next[m]);
      } else {
        catMods.forEach(m => next[m] = forceLevel);
      }
      return next;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const selectedRolesObj = {};
    const moduleAccess = { ...localAccess };
    
    Object.entries(localAccess).forEach(([modId, level]) => {
      const mod = availableModules.find(m => m.id === modId);
      if (mod && mod.role && level !== 'none') selectedRolesObj[mod.role] = true;
    });
    
    const roles = Object.keys(selectedRolesObj);
    if (roles.length === 0) roles.push('STAFF');

    const finalUserData = { ...formData, roles, moduleAccess };

    try {
      const res = await createFullUser(finalUserData, 'hr');
      if (res && res.success) {
        setSuccess(true);
        setFormData({ nom: '', email: '', password: '', poste: '', dept: 'Ventes', contratType: 'CDI', contratDuree: '', salaire: '' });
        setLocalAccess({ home: 'write' });
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Impossible de provisionner le compte.");
    } finally {
      setLoading(false);
    }
  };

  const onboardingTabs = useMemo(() => {
    const tabs = [];
    if (accessLevel === 'write') tabs.push({ key: 'create', label: '+ Nouvel Employé', icon: <UserPlus size={16} /> });
    tabs.push({ key: 'edit', label: '✏️ Modifier les Accès', icon: <Edit3 size={16} /> });
    return tabs;
  }, [accessLevel]);

  useEffect(() => {
    if (accessLevel !== 'write' && mode === 'create') setMode('edit');
  }, [accessLevel, mode]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--bg-subtle)', padding: '0.4rem', borderRadius: '1rem', width: 'fit-content' }}>
        {onboardingTabs.map(tab => (
          <button key={tab.key} onClick={() => { setMode(tab.key); setSelectedEmployee(null); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s',
              background: mode === tab.key ? '#8B5CF6' : 'transparent',
              color: mode === tab.key ? 'white' : 'var(--text-muted)' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── MODE EDIT: Modifier accès employé existant ── */}
      <AnimatePresence mode="wait">
      {mode === 'edit' && (
        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {!selectedEmployee ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Colonne gauche : liste */}
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Users size={20} color="#8B5CF6" /> Sélectionner un Employé
                </h3>
                <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Choisissez un collaborateur existant pour modifier ses habilitations et accès modules.
                </p>

                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--bg-subtle)', padding: '0.6rem 1rem', borderRadius: '0.9rem', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                  <Search size={16} color="var(--text-muted)" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, email, poste…"
                    style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.88rem', width: '100%', color: 'var(--text)' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {filteredEmployees.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <Users size={40} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
                      <p>Aucun employé trouvé.<br/>Créez d'abord des collaborateurs via l'onglet "Nouvel Employé".</p>
                    </div>
                  ) : filteredEmployees.map(emp => {
                    const perms = permissions[emp.id] || {};
                    const mods = Array.isArray(perms.allowedModules) ? perms.allowedModules : [];
                    return (
                      <div key={emp.id}
                        onClick={() => setSelectedEmployee(emp)}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', borderRadius: '1rem', background: 'var(--bg-subtle)', cursor: 'pointer', border: '1px solid transparent', transition: '0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.border = '1px solid #8B5CF650'}
                        onMouseLeave={e => e.currentTarget.style.border = '1px solid transparent'}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#8B5CF615', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
                          {(emp.nom || emp.email || '?')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.nom || emp.email}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{emp.poste || emp.dept || '—'}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                          <span style={{ fontSize: '0.68rem', background: mods.length > 1 ? '#10B98120' : '#EF444420', color: mods.length > 1 ? '#10B981' : '#EF4444', padding: '2px 8px', borderRadius: '2rem', fontWeight: 800 }}>
                            {mods.length} module{mods.length !== 1 ? 's' : ''}
                          </span>
                          <ChevronRight size={14} color="var(--text-muted)" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Colonne droite : placeholder */}
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '400px', color: 'var(--text-muted)' }}>
                <Shield size={48} style={{ opacity: 0.15 }} />
                <p style={{ textAlign: 'center', fontSize: '0.9rem', maxWidth: '260px', lineHeight: 1.6 }}>
                  Sélectionnez un collaborateur à gauche pour modifier ses accès modules et ses rôles.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Colonne gauche : liste avec sélection visible */}
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Users size={20} color="#8B5CF6" /> Collaborateurs
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {filteredEmployees.map(emp => {
                    const isSelected = selectedEmployee?.id === emp.id;
                    const perms = permissions[emp.id] || {};
                    const mods = Array.isArray(perms.allowedModules) ? perms.allowedModules : [];
                    return (
                      <div key={emp.id}
                        onClick={() => setSelectedEmployee(emp)}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', borderRadius: '1rem', background: isSelected ? '#8B5CF615' : 'var(--bg-subtle)', cursor: 'pointer', border: isSelected ? '2px solid #8B5CF6' : '2px solid transparent', transition: '0.2s' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#8B5CF615', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0, fontSize: '0.9rem' }}>
                          {(emp.nom || emp.email || '?')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{emp.nom || emp.email}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{mods.length} module(s)</div>
                        </div>
                        {isSelected && <Check size={16} color="#8B5CF6" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Panneau édition */}
              <AnimatePresence>
                {selectedEmployee && (
                  <EditAccessPanel
                    key={selectedEmployee.id}
                    employee={selectedEmployee}
                    onClose={() => setSelectedEmployee(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* ── MODE CREATE: Nouvel employé ── */}
      {mode === 'create' && (
        <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {success && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', background: '#10B98115', border: '1px solid #10B98150', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
               <div style={{ background: '#10B981', color: 'white', padding: '10px', borderRadius: '50%' }}><Check size={24} /></div>
               <div>
                  <h3 style={{ margin: 0, color: '#10B981', fontWeight: 800 }}>Onboarding Réussi !</h3>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Le compte a été correctement injecté sur Firebase et les accès sont paramétrés.</p>
               </div>
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', background: '#EF444415', border: '1px solid #EF444450', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
               <AlertCircle size={24} color="#EF4444" />
               <div style={{ color: '#EF4444', fontWeight: 600 }}>{error}</div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '2.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

              {/* Bloc Identité */}
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
                   <UserPlus size={20} color="var(--accent)" /> Identité du Collaborateur
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                   <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Nom Complet *</label>
                      <input required type="text" name="nom" value={formData.nom} onChange={handleInputChange} className="glass" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                   </div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Poste</label>
                        <input required type="text" name="poste" value={formData.poste} onChange={handleInputChange} className="glass" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} placeholder="Ex: Développeur Senior" />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Département</label>
                        <select name="dept" value={formData.dept} onChange={handleInputChange} className="glass" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                           <option>Ventes</option>
                           <option>Marketing</option>
                           <option>Production</option>
                           <option>Logistique</option>
                           <option>Achats</option>
                           <option>Finance</option>
                           <option>RH</option>
                           <option>Juridique</option>
                           <option>IT</option>
                           <option>Support/SAV</option>
                           <option>Projets</option>
                           <option>Direction</option>
                        </select>
                      </div>
                   </div>
                </div>
              </div>

              {/* Bloc Sécurité */}
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
                   <Lock size={20} color="#F59E0B" /> Sécurité & Firebase
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                   <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Email (Identifiant) *</label>
                      <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="glass" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} placeholder="prenom.nom@entreprise.com" />
                   </div>
                   <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Mot de passe temporaire *</label>
                      <input required type="text" name="password" minLength="6" value={formData.password} onChange={handleInputChange} className="glass" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} placeholder="Ex: Start2026!" />
                   </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
                  Ce compte sera immédiatement provisionné sur les serveurs Firebase Auth.
                </div>
              </div>

              {/* Bloc Contrat */}
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
                   <Briefcase size={20} color="#8B5CF6" /> Contrat & Salarié
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                   <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Type de Contrat</label>
                      <select name="contratType" value={formData.contratType} onChange={handleInputChange} className="glass" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                         <option>CDI</option><option>CDD</option><option>Stage</option><option>Freelance</option><option>Alternance</option>
                      </select>
                   </div>
                   <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Durée / Fin estimée</label>
                      <input type="text" name="contratDuree" value={formData.contratDuree} onChange={handleInputChange} className="glass" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} placeholder="Ex: Indéterminée ou 6 mois" />
                   </div>
                   <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>Salaire Brut Mensuel (FCFA)</label>
                      <input required type="number" name="salaire" value={formData.salaire} onChange={handleInputChange} className="glass" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} placeholder="Ex: 500000" />
                   </div>
                </div>
              </div>
            </div>

            {/* Colonne Droite: Matrice des Accès */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
               <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)', position: 'sticky', top: '2rem' }}>
                 <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800 }}>
                    <Shield size={20} color="#10B981" /> Habilitations & Accès Modules
                 </h3>
                 <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    Cochez les applications auxquelles ce collaborateur aura accès. Les rôles seront automatiquement déduits.
                 </p>
                 
                 <div style={{ display: 'grid', gap: '1.25rem' }}>
                    {moduleCategories.map(cat => {
                      const mods = availableModules.filter(m => m.category === cat);
                      if (mods.length === 0) return null;
                      
                      const lockedMods = mods.filter(m => m.locked).map(m => m.id);
                      const unlockableMods = mods.filter(m => !m.locked).map(m => m.id);
                      const allUnlockedSelected = unlockableMods.length > 0 && unlockableMods.every(m => localAccess[m]);

                      return (
                        <div key={cat} style={{ background: 'var(--bg-subtle)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                          <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                              {cat}
                            </span>
                            {unlockableMods.length > 0 && (
                              <button type="button" onClick={(e) => { e.preventDefault(); toggleCreateCategory(cat); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800, color: '#8B5CF6' }}>
                                {allUnlockedSelected ? 'Désélectionner' : 'Sélectionner tout'}
                              </button>
                            )}
                          </div>
                          
                          <div style={{ padding: '0.75rem', display: 'grid', gap: '4px' }}>
                            {mods.map(mod => {
                              const level = localAccess[mod.id] || 'none';
                              const Icon = mod.icon;
                              return (
                                <div key={mod.id} className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', background: level !== 'none' ? 'var(--bg)' : 'transparent', border: '1px solid var(--border)', transition: '0.2s' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 200px', minWidth: 0 }}>
                                    <div style={{ width: '38px', height: '38px', flexShrink: 0, borderRadius: '12px', background: `${mod.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: mod.color }}>
                                      <Icon size={20} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                      <span style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{mod.label}</span>
                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{mod.role} - {mod.desc}</span>
                                    </div>
                                  </div>
                                  
                                  <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-subtle)', padding: '6px', borderRadius: '0.75rem', border: '1px solid var(--border)', flexShrink: 0 }}>
                                    <button 
                                      type="button"
                                      onClick={() => setAccess(mod.id, 'none')} 
                                      title="Aucun accès" 
                                      style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: 'none', cursor: mod.locked ? 'not-allowed' : 'pointer', background: level === 'none' ? '#EF4444' : 'transparent', color: level === 'none' ? 'white' : 'var(--text-muted)', opacity: mod.locked ? 0.5 : 1, transition: '0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.75rem' }}>
                                      <ShieldOff size={16} /> <span style={{ display: level === 'none' ? 'block' : 'none' }}>Aucun</span>
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => setAccess(mod.id, 'read')} 
                                      title="Lecture" 
                                      style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: 'none', cursor: mod.locked ? 'not-allowed' : 'pointer', background: level === 'read' ? 'var(--accent)' : 'transparent', color: level === 'read' ? 'white' : 'var(--text-muted)', opacity: mod.locked ? 0.5 : 1, transition: '0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.75rem' }}>
                                      <Eye size={16} /> <span style={{ display: level === 'read' ? 'block' : 'none' }}>Lecture</span>
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => setAccess(mod.id, 'write')} 
                                      title="Écriture" 
                                      style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: 'none', cursor: mod.locked ? 'not-allowed' : 'pointer', background: level === 'write' ? '#10B981' : 'transparent', color: level === 'write' ? 'white' : 'var(--text-muted)', opacity: mod.locked ? 0.5 : 1, transition: '0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.75rem' }}>
                                      <Pencil size={16} /> <span style={{ display: level === 'write' ? 'block' : 'none' }}>Écriture</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                 </div>

                 <div style={{ marginTop: '2.5rem' }}>
                    <button type="submit" disabled={loading} className="btn-primary"
                      style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontSize: '1rem', fontWeight: 800, background: '#10B981', borderColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      {loading ? <Loader className="spin" size={20} /> : <UserPlus size={20} />}
                      {loading ? 'Création & Provisionnement...' : 'Générer le Collaborateur'}
                    </button>
                 </div>
               </div>
            </div>
          </form>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingTab;
