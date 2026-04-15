import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '../../../BusinessContext';
import { db } from '../../../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  UserPlus, Mail, Lock, Briefcase, DollarSign, 
  Shield, Check, Calendar, Settings, AlertCircle, Loader,
  Search, Edit3, Save, Users, ToggleLeft, ToggleRight, ChevronRight
} from 'lucide-react';

const availableModules = [
  { id: 'home',       label: 'Espace Personnel (Base)',     role: 'STAFF',      icon: '👤', color: '#10B981', locked: true },
  { id: 'connect',    label: 'IPC Connect (Réseau)',         role: 'STAFF',      icon: '💬', color: '#8B5CF6' },
  { id: 'crm',        label: 'CRM & Acquisition',            role: 'SALES',      icon: '🎯', color: '#3B82F6' },
  { id: 'sales',      label: 'Gestion des Ventes',           role: 'SALES',      icon: '🛒', color: '#06B6D4' },
  { id: 'production', label: 'Atelier & Production',         role: 'PRODUCTION', icon: '⚙️', color: '#F59E0B' },
  { id: 'inventory',  label: 'Logistique & Stocks',          role: 'LOGISTICS',  icon: '📦', color: '#F97316' },
  { id: 'finance',    label: 'Finance & Trésorerie',         role: 'FINANCE',    icon: '💰', color: '#6366F1' },
  { id: 'hr',         label: 'Ressources Humaines',          role: 'HR',         icon: '👥', color: '#EC4899' },
  { id: 'admin',      label: 'Administration Système',       role: 'ADMIN',      icon: '🛡️', color: '#EF4444' },
];

// ─────────────────────────────────────────────────────────────────
// SUB-PANEL : Modifier les accès d'un employé existant
// ─────────────────────────────────────────────────────────────────
const EditAccessPanel = ({ employee, onClose }) => {
  const { permissions, setPermissions, addHint } = useBusiness();

  const userPerms = permissions[employee.id] || { roles: [], allowedModules: ['home'] };
  const [localModules, setLocalModules] = useState(
    Array.isArray(userPerms.allowedModules) ? userPerms.allowedModules : ['home']
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const toggleMod = (modId) => {
    if (modId === 'home') return;
    setLocalModules(prev =>
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
  };

  const handleSave = async () => {
    setSaveError('');
    if (!employee?.id) {
      setSaveError("ID employé manquant. Cet utilisateur n'est peut-être pas encore provisionné sur Firebase.");
      return;
    }

    setSaving(true);
    try {
      // Compute roles from selected modules
      const rolesMap = {};
      localModules.forEach(modId => {
        const mod = availableModules.find(m => m.id === modId);
        if (mod?.role) rolesMap[mod.role] = true;
      });
      const newRoles = Object.keys(rolesMap);
      if (newRoles.length === 0) newRoles.push('STAFF');

      const newPerms = { roles: newRoles, allowedModules: localModules };

      console.log('[EditAccess] Saving for UID:', employee.id, '| perms:', newPerms);

      // 1. Update local permissions state immediately (instant UI feedback)
      setPermissions(prev => ({ ...prev, [employee.id]: newPerms }));

      // 2. Write to Firestore users/{uid}
      await setDoc(doc(db, 'users', employee.id), { permissions: newPerms }, { merge: true });
      console.log('[EditAccess] users/ updated ✅');

      // 3. Write to Firestore hr/{uid}
      await setDoc(doc(db, 'hr', employee.id), { permissions: newPerms, role: newRoles[0], subModule: 'employees' }, { merge: true });
      console.log('[EditAccess] hr/ updated ✅');

      setSaved(true);
      addHint({ title: '✅ Accès mis à jour', message: `Habilitations de ${employee.nom || employee.email} sauvegardées.`, type: 'success' });
      setTimeout(() => { setSaved(false); onClose(); }, 2000);
    } catch (err) {
      console.error('[EditAccess] ERROR:', err);
      setSaveError(`Erreur Firebase : ${err.message || 'Vérifiez votre connexion et vos droits.'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="glass"
      style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid #8B5CF630', background: 'var(--bg)' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#8B5CF620', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>
            {(employee.nom || employee.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '1rem' }}>{employee.nom || employee.email}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{employee.poste || employee.email}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.4rem 0.9rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          ← Retour
        </button>
      </div>

      <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Shield size={16} color="#10B981" /> Habilitations & Accès Modules
      </h4>
      <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Cochez/décochez les modules auxquels cet employé peut accéder. Les rôles seront recalculés automatiquement.
      </p>

      {saveError && (
        <div style={{ padding: '0.75rem 1rem', background: '#EF444415', color: '#EF4444', borderRadius: '0.75rem', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={14} /> {saveError}
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '2rem' }}>
        {availableModules.map(mod => {
          const isActive = localModules.includes(mod.id);
          return (
            <div
              key={mod.id}
              onClick={() => toggleMod(mod.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.9rem',
                padding: '0.85rem 1rem', borderRadius: '1rem',
                border: isActive ? `2px solid ${mod.color}` : '2px solid transparent',
                background: isActive ? `${mod.color}12` : 'var(--bg-subtle)',
                cursor: mod.locked ? 'not-allowed' : 'pointer',
                transition: 'all 0.18s'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{mod.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: isActive ? mod.color : 'var(--text)' }}>{mod.label}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>Rôle : {mod.role}</div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: isActive ? mod.color : 'var(--text-muted)', display: 'flex' }}>
                {isActive ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Roles résumé */}
      <div style={{ padding: '0.9rem 1rem', borderRadius: '1rem', background: 'var(--bg-subtle)', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.25rem' }}>Rôles actifs :</span>
        {(() => {
          const rolesMap = {};
          localModules.forEach(modId => {
            const mod = availableModules.find(m => m.id === modId);
            if (mod?.role) rolesMap[mod.role] = mod.color;
          });
          return Object.entries(rolesMap).map(([role, color]) => (
            <span key={role} style={{ padding: '0.25rem 0.75rem', borderRadius: '2rem', background: `${color}20`, color, fontWeight: 800, fontSize: '0.75rem' }}>{role}</span>
          ));
        })()}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || saved}
        style={{
          width: '100%', padding: '1rem', borderRadius: '1rem',
          background: saved ? '#10B981' : '#8B5CF6',
          color: 'white', border: 'none', fontWeight: 900, fontSize: '0.95rem',
          cursor: saving ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
          transition: 'background 0.3s'
        }}
      >
        {saving ? <Loader size={18} className="spin" /> : saved ? <Check size={18} /> : <Save size={18} />}
        {saving ? 'Sauvegarde Firebase...' : saved ? 'Accès mis à jour !' : 'Sauvegarder les Accès'}
      </button>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
const OnboardingTab = () => {
  const { createFullUser, data, permissions } = useBusiness();
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

  const [selectedModules, setSelectedModules] = useState(['home']);

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

  const toggleModule = (modId) => {
    if (modId === 'home') return;
    setSelectedModules(prev =>
      prev.includes(modId) ? prev.filter(m => m !== modId) : [...prev, modId]
    );
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
    selectedModules.forEach(modId => {
      const mod = availableModules.find(m => m.id === modId);
      if (mod && mod.role) selectedRolesObj[mod.role] = true;
    });
    const roles = Object.keys(selectedRolesObj);
    if (roles.length === 0) roles.push('STAFF');

    const finalUserData = { ...formData, roles, allowedModules: selectedModules };

    try {
      const res = await createFullUser(finalUserData, 'hr');
      if (res && res.success) {
        setSuccess(true);
        setFormData({ nom: '', email: '', password: '', poste: '', dept: 'Ventes', contratType: 'CDI', contratDuree: '', salaire: '' });
        setSelectedModules(['home']);
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Impossible de provisionner le compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'var(--bg-subtle)', padding: '0.4rem', borderRadius: '1rem', width: 'fit-content' }}>
        {[
          { key: 'create', label: '+ Nouvel Employé', icon: <UserPlus size={16} /> },
          { key: 'edit', label: '✏️ Modifier les Accès', icon: <Edit3 size={16} /> },
        ].map(tab => (
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
                           <option>Ventes</option><option>Production</option><option>Finance</option>
                           <option>IT</option><option>RH</option><option>Logistique</option><option>Direction</option>
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
                 
                 <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {availableModules.map(mod => {
                      const isSelected = selectedModules.includes(mod.id);
                      return (
                        <div key={mod.id} onClick={() => toggleModule(mod.id)}
                          style={{ padding: '1rem', borderRadius: '1rem', border: isSelected ? `2px solid ${mod.color}` : '2px solid transparent', background: isSelected ? `${mod.color}15` : 'var(--bg-subtle)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: mod.locked ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                           <div style={{ fontSize: '1.25rem' }}>{mod.icon}</div>
                           <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 800, color: isSelected ? mod.color : 'var(--text)' }}>{mod.label}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px', fontWeight: 700 }}>Rôle induit : {mod.role}</div>
                           </div>
                           <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: isSelected ? mod.color : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSelected ? 'white' : 'transparent', opacity: mod.locked ? 0.5 : 1 }}>
                             <Check size={16} />
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
