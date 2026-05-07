import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../../store';
import { 
  UserPlus, Mail, Lock, Briefcase, DollarSign, 
  Shield, Check, Calendar, Settings, AlertCircle, Loader,
  Search, Edit3, Save, Users, ToggleLeft, ToggleRight, ChevronRight,
  Eye, Pencil, ShieldOff, Trash2, AlertTriangle, User,
  FileSignature, ChevronLeft, Building2, Wallet, Target
} from 'lucide-react';
import { PermissionMatrix } from '../components/PermissionMatrix';

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
        <div className="input-wrapper">
          <Lock size={18} />
          <input required type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" />
        </div>
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
        <label>Date d'entrée</label>
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

const StepPermissions = ({ localPermissions, setLocalPermissions }) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass-card">
     <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Shield size={24} color="#8B5CF6" /> Gouvernance & Accès Modules
      </h3>
      <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Définissez le périmètre d'action du collaborateur dans l'ERP.</p>
    </div>
    <PermissionMatrix permissions={localPermissions} onChange={setLocalPermissions} />
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────
// SUB-PANEL : Modifier les accès d'un employé existant
// ─────────────────────────────────────────────────────────────────
const EditAccessPanel = ({ employee, onClose }) => {
  const { permissions, permanentlyDeleteUserRecord } = useStore();
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
// MAIN COMPONENT (HR 2.0 ONBOARDING)
// ─────────────────────────────────────────────────────────────────
const OnboardingTab = ({ accessLevel }) => {
  const { createFullUser, data, permissions } = useStore();
  const [step, setStep] = useState(1);
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
    salaire: '', hierarchy_level: 'Employee'
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
    try {
      await createFullUser({ ...formData, permissions: localPermissions });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setStep(1); setMode('edit'); }, 4000);
    } catch (err) {
      setError(err.message || "Erreur lors du provisionnement.");
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
             {/* Wizard Progress Bar */}
             <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ flex: 1, height: '6px', borderRadius: '3px', background: step >= i ? 'var(--accent)' : 'var(--border)', transition: '0.3s' }} />
                ))}
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
                 {step === 3 && <StepPermissions localPermissions={localPermissions} setLocalPermissions={setLocalPermissions} />}

                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                    <button disabled={step === 1 || loading} onClick={() => setStep(s => s - 1)} className="glass" style={{ padding: '0.8rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ChevronLeft size={18} /> Retour
                    </button>
                    {step < 3 ? (
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
