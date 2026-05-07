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
import { PermissionMatrix } from '../components/PermissionMatrix';
import { FirestoreService } from '../../../services/firestore.service';
import { logger } from '../../../utils/logger';
import { db } from '../../../firebase/config';
import { collection, getDocs, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────
// SUB-PANEL : Modifier les accès d'un employé existant
// ─────────────────────────────────────────────────────────────────
const EditAccessPanel = ({ employee, onClose }) => {
  const { permissions } = useStore();
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
      const auditLog = {
        action: 'PERMISSIONS_UPDATE',
        targetId: employee.id,
        targetName: employee.nom,
        before: userPerms,
        after: localPerms,
        timestamp: serverTimestamp()
      };

      await FirestoreService.setDocument('users', employee.id, { 
        permissions: localPerms,
        hierarchy_level: localPerms.hierarchy_level 
      });
      
      await FirestoreService.addDocument('permissions_audit', auditLog);

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

      <PermissionMatrix 
        permissions={localPerms} 
        onChange={setLocalPerms} 
      />

      <div style={{ marginTop: '2.5rem' }}>
        {saveError && <div style={{ color: '#EF4444', fontSize: '0.8rem', marginBottom: '1rem', fontWeight: 700 }}>{saveError}</div>}
        <button onClick={handleSave} disabled={saving || saved} className="btn-primary" style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontWeight: 900, background: saved ? '#10B981' : 'var(--accent)', borderColor: saved ? '#10B981' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          {saving ? <Loader className="spin" size={20} /> : saved ? <Check size={20} /> : <Save size={20} />}
          {saving ? 'Sauvegarde des droits...' : saved ? 'Gouvernance appliquée !' : 'Mettre à jour la Gouvernance'}
        </button>
      </div>
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
  const [mode, setMode] = useState('create'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    nom: '', email: '', password: '', 
    poste: '', dept: 'Ventes', contratType: 'CDI', 
    contratDuree: '', salaire: ''
  });

  const [localPermissions, setLocalPermissions] = useState({
    hierarchy_level: 'Employee',
    modules: { home: { access: 'write', subTabs: {} } }
  });

  const allEmployees = useMemo(() => {
    // [STRATEGY] Use data.employees (synced from 'users' collection) as master list
    // Fallback to data.hr.employees for HR-specific records if master list is unavailable
    const masterList = data?.employees || [];
    const hrList = data?.hr?.employees || [];
    
    // Merge or prioritize masterList
    return masterList.length > 0 ? masterList : hrList;
  }, [data?.employees, data?.hr?.employees]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return allEmployees;
    const q = searchQuery.toLowerCase();
    return allEmployees.filter(e =>
      (e.nom || '').toLowerCase().includes(q) ||
      (e.email || '').toLowerCase().includes(q) ||
      (e.poste || '').toLowerCase().includes(q)
    );
  }, [allEmployees, searchQuery]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const finalUserData = { 
      ...formData, 
      permissions: localPermissions,
      hierarchy_level: localPermissions.hierarchy_level 
    };

    try {
      const res = await createFullUser(finalUserData, 'hr');
      if (res && res.success) {
        setSuccess(true);
        setFormData({ nom: '', email: '', password: '', poste: '', dept: 'Ventes', contratType: 'CDI', contratDuree: '', salaire: '' });
        setLocalPermissions({ hierarchy_level: 'Employee', modules: { home: { access: 'write', subTabs: {} } } });
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      console.error('[OnboardingTab] createFullUser failed:', err.code, err.message, err);
      const code = err.code || err.name || 'UNKNOWN';
      const detail = err.message || "Impossible de provisionner le compte.";
      setError(`[${code}] ${detail}`);
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

      <AnimatePresence mode="wait">
      {mode === 'edit' && (
        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {!selectedEmployee ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Users size={20} color="#8B5CF6" /> Sélectionner un Employé
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Choisissez un collaborateur existant pour modifier ses habilitations et accès modules.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'var(--bg-subtle)', padding: '0.6rem 1rem', borderRadius: '0.9rem', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                  <Search size={16} color="var(--text-muted)" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher par nom, email, poste…" style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.88rem', width: '100%', color: 'var(--text)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {filteredEmployees.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                      <Users size={40} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
                      <p>Aucun employé trouvé.</p>
                    </div>
                  ) : filteredEmployees.map(emp => {
                    const perms = permissions[emp.id] || {};
                    const mods = perms.modules ? Object.keys(perms.modules).length : 0;
                    return (
                      <div key={emp.id} onClick={() => setSelectedEmployee(emp)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', borderRadius: '1rem', background: 'var(--bg-subtle)', cursor: 'pointer', border: '1px solid transparent', transition: '0.2s' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#8B5CF615', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
                          {(emp.nom || emp.profile?.nom || emp.email || emp.profile?.email || '?')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{emp.nom || emp.profile?.nom || emp.email || emp.profile?.email}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{emp.poste || emp.profile?.poste || emp.dept || emp.profile?.dept}</div>
                        </div>
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.65rem', background: '#8B5CF620', color: '#8B5CF6', padding: '2px 8px', borderRadius: '2rem', fontWeight: 800 }}>
                              {mods} Apps
                            </span>
                            <ChevronRight size={14} color="var(--text-muted)" />
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '400px', color: 'var(--text-muted)' }}>
                <Shield size={48} style={{ opacity: 0.15 }} />
                <p style={{ textAlign: 'center', fontSize: '0.9rem', maxWidth: '260px' }}>Sélectionnez un collaborateur pour modifier ses droits.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontWeight: 900 }}>Collaborateurs</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '500px', overflowY: 'auto' }}>
                  {filteredEmployees.map(emp => {
                    const isSelected = selectedEmployee?.id === emp.id;
                    return (
                      <div key={emp.id} onClick={() => setSelectedEmployee(emp)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', borderRadius: '1rem', background: isSelected ? '#8B5CF615' : 'var(--bg-subtle)', cursor: 'pointer', border: isSelected ? '2px solid #8B5CF6' : '2px solid transparent', transition: '0.2s' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#8B5CF615', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
                          {(emp.nom || emp.email || '?')[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{emp.nom || emp.email}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.poste}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <EditAccessPanel employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
            </div>
          )}
        </motion.div>
      )}

      {mode === 'create' && (
        <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {success && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', background: '#10B98108', border: '2px solid #10B98120', marginBottom: '3rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
               <div style={{ background: '#10B981', color: 'white', padding: '16px', borderRadius: '1.25rem', boxShadow: '0 10px 20px rgba(16,185,129,0.2)' }}><Check size={32} /></div>
               <div style={{ flex: 1 }}>
                 <h3 style={{ margin: '0 0 0.5rem 0', color: '#064E3B', fontWeight: 900, fontSize: '1.5rem' }}>Onboarding Réussi !</h3>
                 <p style={{ margin: 0, color: '#064E3B', opacity: 0.7, fontWeight: 600 }}>Le compte a été provisionné et les accès IT sont en cours de création.</p>
               </div>
               <div style={{ display: 'flex', gap: '1rem' }}>
                 <button 
                   onClick={() => {
                     const lastEmp = allEmployees[allEmployees.length - 1]; // Approximation for demo
                     import('../../../utils/PDFExporter').then(({ IPCReportGenerator }) => {
                       IPCReportGenerator.generateEmploymentContract(lastEmp || formData);
                     });
                   }}
                   style={{ padding: '1rem 2rem', borderRadius: '1rem', background: '#10B981', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 10px 25px rgba(16,185,129,0.2)' }}
                 >
                   <FileSignature size={20} /> Générer le Contrat
                 </button>
                 <button 
                   onClick={() => setSuccess(false)}
                   style={{ padding: '1rem 1.5rem', borderRadius: '1rem', background: 'white', color: '#10B981', border: '1px solid #10B981', fontWeight: 800, cursor: 'pointer' }}
                 >
                   Terminer
                 </button>
               </div>
            </motion.div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.8fr)', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 800 }}><UserPlus size={20} color="var(--accent)" /> Identité</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                   <input required type="text" name="nom" value={formData.nom} onChange={handleInputChange} placeholder="Nom Complet" className="glass" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }} />
                   <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" className="glass" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }} />
                   <input required type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Mot de passe" className="glass" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }} />
                   <input type="text" name="poste" value={formData.poste} onChange={handleInputChange} placeholder="Poste" className="glass" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }} />
                   <input type="number" name="salaire" value={formData.salaire} onChange={handleInputChange} placeholder="Salaire Brut" className="glass" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }} />
                </div>
              </div>
            </div>
            <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)' }}>
               <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 800 }}><Shield size={20} color="#10B981" /> Gouvernance Matrix</h3>
               <PermissionMatrix permissions={localPermissions} onChange={setLocalPermissions} />
               <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '1.25rem', borderRadius: '1rem', fontWeight: 900, background: '#10B981', borderColor: '#10B981', marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                 {loading ? <Loader className="spin" size={20} /> : <Check size={20} />}
                 {loading ? 'Provisionnement...' : 'Générer le Profil Stratégique'}
               </button>
            </div>
          </form>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OnboardingTab;
