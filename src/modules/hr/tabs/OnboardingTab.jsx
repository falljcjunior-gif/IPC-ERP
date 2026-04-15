import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useBusiness } from '../../../BusinessContext';
import { 
  UserPlus, Mail, Lock, Briefcase, DollarSign, 
  Shield, Check, Calendar, Settings, AlertCircle, Loader
} from 'lucide-react';

const availableModules = [
  { id: 'home', label: 'Espace Personnel (Base)', role: 'STAFF', icon: '👤', color: '#10B981', locked: true },
  { id: 'connect', label: 'IPC Connect (Réseau)', role: 'STAFF', icon: '💬', color: '#8B5CF6' },
  { id: 'crm', label: 'CRM & Acquisition', role: 'SALES', icon: '🎯', color: '#3B82F6' },
  { id: 'sales', label: 'Gestion des Ventes', role: 'SALES', icon: '🛒', color: '#06B6D4' },
  { id: 'production', label: 'Atelier & Production', role: 'PRODUCTION', icon: '⚙️', color: '#F59E0B' },
  { id: 'inventory', label: 'Logistique & Stocks', role: 'LOGISTICS', icon: '📦', color: '#F97316' },
  { id: 'finance', label: 'Finance & Trésorerie', role: 'FINANCE', icon: '💰', color: '#6366F1' },
  { id: 'hr', label: 'Ressources Humaines', role: 'HR', icon: '👥', color: '#EC4899' },
  { id: 'admin', label: 'Administration Système', role: 'ADMIN', icon: '🛡️', color: '#EF4444' }
];

const OnboardingTab = () => {
  const { createFullUser } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nom: '', email: '', password: '', 
    poste: '', dept: 'Ventes', contratType: 'CDI', 
    contratDuree: '', salaire: ''
  });

  // 'home' is selected by default and cannot be unchecked
  const [selectedModules, setSelectedModules] = useState(['home']);

  const toggleModule = (modId) => {
    if (modId === 'home') return; // Locked
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
    
    // Auto-compute roles from modules
    const selectedRolesObj = {};
    selectedModules.forEach(modId => {
      const mod = availableModules.find(m => m.id === modId);
      if (mod && mod.role) selectedRolesObj[mod.role] = true;
    });
    const roles = Object.keys(selectedRolesObj);

    if (roles.length === 0) roles.push('STAFF');

    const finalUserData = {
      ...formData,
      roles,
      allowedModules: selectedModules,
    };

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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {success && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', background: '#10B98115', border: '1px solid #10B98150', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div style={{ background: '#10B981', color: 'white', padding: '10px', borderRadius: '50%' }}><Check size={24} /></div>
           <div>
              <h3 style={{ margin: 0, color: '#10B981', fontWeight: 800 }}>Onboarding Réussi !</h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Le compte de {formData.nom || 'l\'employé'} a été correctement injecté sur Firebase et les accès sont paramétrés.</p>
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
        
        {/* Colonne Gauche: Identité & Contrat */}
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
                        <option>Production</option>
                        <option>Finance</option>
                        <option>IT</option>
                        <option>RH</option>
                        <option>Logistique</option>
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
               Ce compte sera immédiatement provisionné sur les serveurs Firebase Auth. L'employé pourra s'y connecter dès validation.
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
                      <option>CDI</option>
                      <option>CDD</option>
                      <option>Stage</option>
                      <option>Freelance</option>
                      <option>Alternance</option>
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
                Cochez les applications auxquelles ce collaborateur aura accès. Les rôles de sécurité (ex: SALES, FINANCE) seront automatiquement déduits des modules cochés.
             </p>
             
             <div style={{ display: 'grid', gap: '0.75rem' }}>
                {availableModules.map(mod => {
                  const isSelected = selectedModules.includes(mod.id);
                  return (
                    <div 
                      key={mod.id} 
                      onClick={() => toggleModule(mod.id)}
                      style={{ 
                        padding: '1rem', 
                        borderRadius: '1rem', 
                        border: isSelected ? `2px solid ${mod.color}` : '2px solid transparent',
                        background: isSelected ? `${mod.color}15` : 'var(--bg-subtle)',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem',
                        cursor: mod.locked ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                       <div style={{ fontSize: '1.25rem' }}>{mod.icon}</div>
                       <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, color: isSelected ? mod.color : 'var(--text)' }}>{mod.label}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px', fontWeight: 700 }}>
                             Rôle induit : {mod.role}
                          </div>
                       </div>
                       <div>
                         <div style={{ 
                           width: '24px', height: '24px', borderRadius: '6px', 
                           background: isSelected ? mod.color : 'var(--border)',
                           display: 'flex', alignItems: 'center', justifyContent: 'center',
                           color: isSelected ? 'white' : 'transparent',
                           opacity: mod.locked ? 0.5 : 1
                         }}>
                           <Check size={16} />
                         </div>
                       </div>
                    </div>
                  );
                })}
             </div>

             <div style={{ marginTop: '2.5rem' }}>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary" 
                  style={{ width: '100%', padding: '1rem', borderRadius: '1rem', fontSize: '1rem', fontWeight: 800, background: '#10B981', borderColor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  {loading ? <Loader className="spin" size={20} /> : <UserPlus size={20} />}
                  {loading ? 'Création & Provisionnement...' : 'Générer le Collaborateur'}
                </button>
             </div>
           </div>
        </div>

      </form>
    </motion.div>
  );
};

export default OnboardingTab;
