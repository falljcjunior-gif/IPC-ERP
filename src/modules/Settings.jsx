import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Layout, 
  Target, 
  Layers, 
  Settings as SettingsIcon, 
  Check, 
  RotateCcw,
  Monitor,
  Sidebar,
  Sparkles,
  Globe,
  Shield,
  Bell,
  Database,
  Info,
  CreditCard,
  Clock,
  Lock,
  Building2,
  Maximize2,
  Trash2,
  Save
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';

const Settings = () => {
  const { config, updateConfig, globalSettings, updateGlobalSettings, userRole, currentUser } = useBusiness();
  const [activeTab, setActiveTab] = useState('general');

  const colorPresets = [
    { name: 'Pétrole (IPC)', primary: '#1F363D', accent: '#529990' },
    { name: 'Océan', primary: '#1E293B', accent: '#3B82F6' },
    { name: 'Émeraude', primary: '#064E3B', accent: '#10B981' },
    { name: 'Ardoise', primary: '#334155', accent: '#F59E0B' },
    { name: 'Améthyste', primary: '#4C1D95', accent: '#8B5CF6' },
  ];

  const allTabs = [
    { id: 'general', label: userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' ? 'Général' : 'Mon Profil', icon: <Building2 size={18} /> },
    { id: 'appearance', label: 'Apparence', icon: <Palette size={18} /> },
    { id: 'ai', label: 'IPC Intelligence', icon: <Sparkles size={18} /> },
    { id: 'localization', label: 'Localisation', icon: <Globe size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Sécurité', icon: <Shield size={18} /> },
    { id: 'system', label: 'Système', icon: <Database size={18} /> },
  ];

  const tabs = allTabs.filter(tab => {
    if (userRole === 'SUPER_ADMIN') return true;
    if (userRole === 'ADMIN') return !['system'].includes(tab.id);
    if (userRole === 'STAFF') return ['general', 'appearance', 'ai', 'notifications'].includes(tab.id);
    return ['general', 'appearance', 'notifications'].includes(tab.id);
  });

  const handleUpdate = (section, key, value) => {
    updateConfig({
      [section]: { ...config[section], [key]: value }
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general': {
        const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN';
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>{isAdmin ? 'Paramètres Société' : 'Mon Profil Personnel'}</h2>
            
            <div className="grid grid-2" style={{ gap: '2rem' }}>
               <div className="card glass">
                  <h3>{isAdmin ? 'Identité de l\'Application' : 'Mes Informations'}</h3>
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                      <label>{isAdmin ? 'Nom de l\'organisation' : 'Nom Complet'}</label>
                      <input 
                        className="form-input" 
                        value={isAdmin ? globalSettings.companyName : currentUser.nom} 
                        onChange={(e) => isAdmin 
                          ? updateGlobalSettings({ companyName: e.target.value })
                          : null
                        }
                        readOnly={!isAdmin}
                      />
                    </div>
                    <div>
                      <label>{isAdmin ? 'Site Web' : 'Email Professionnel'}</label>
                      <input 
                        className="form-input" 
                        value={isAdmin ? globalSettings.website : currentUser.email} 
                        onChange={(e) => isAdmin 
                          ? updateGlobalSettings({ website: e.target.value })
                          : null
                        }
                        readOnly={!isAdmin}
                      />
                    </div>
                    {!isAdmin && (
                      <div style={{ padding: '1rem', background: 'var(--accent)10', borderRadius: '0.75rem', fontSize: '0.8rem' }}>
                        Poste : <strong>{currentUser.poste || 'Collaborateur'}</strong>
                      </div>
                    )}
                  </div>
               </div>

               {userRole === 'SUPER_ADMIN' ? (
                 <div className="card glass" style={{ border: '2px solid var(--accent)40' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <Lock size={18} color="var(--accent)" />
                      <h3 style={{ margin: 0 }}>Branding Global (Admin)</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div>
                        <label>URL du Logo</label>
                        <input 
                          className="form-input" 
                          value={globalSettings.logoUrl} 
                          onChange={(e) => updateGlobalSettings({ logoUrl: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-2" style={{ gap: '1rem' }}>
                        <div>
                          <label>Largeur Logo ({globalSettings.logoWidth}px)</label>
                          <input 
                            type="range" min="20" max="200" 
                            value={globalSettings.logoWidth ?? 40} 
                            onChange={(e) => updateGlobalSettings({ logoWidth: parseInt(e.target.value) })}
                            style={{ width: '100%', accentColor: 'var(--accent)' }}
                          />
                        </div>
                        <div>
                          <label>Hauteur Logo ({globalSettings.logoHeight}px)</label>
                          <input 
                            type="range" min="20" max="100" 
                            value={globalSettings.logoHeight ?? 40} 
                            onChange={(e) => updateGlobalSettings({ logoHeight: parseInt(e.target.value) })}
                            style={{ width: '100%', accentColor: 'var(--accent)' }}
                          />
                        </div>
                      </div>
                    </div>
                 </div>
               ) : !isAdmin && (
                 <div className="card glass">
                    <h3>Sécurité du compte</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                      Gérez votre mot de passe et vos accès.
                    </p>
                    <button className="btn btn-secondary" style={{ width: '100%' }}>Changer le mot de passe</button>
                 </div>
               )}
            </div>
          </motion.div>
        );
      }

      case 'appearance':
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Design & Interface</h2>
            
            <div className="card glass" style={{ marginBottom: '2rem' }}>
               <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.5rem' }}>Palettes de couleurs enregistrées</p>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {colorPresets.map(preset => (
                    <motion.div
                      key={preset.name}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => updateConfig({ theme: { ...config.theme, primary: preset.primary, accent: preset.accent } })}
                      style={{ 
                        width: '140px', height: '90px', borderRadius: '1rem', background: preset.primary, 
                        cursor: 'pointer', position: 'relative', overflow: 'hidden',
                        border: config.theme.primary === preset.primary ? '3px solid var(--accent)' : '1px solid var(--border)'
                      }}
                    >
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: preset.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {config.theme.primary === preset.primary && <Check size={14} color="white" />}
                      </div>
                    </motion.div>
                  ))}
               </div>
            </div>

            <div className="grid grid-2" style={{ gap: '2rem' }}>
               <div className="card glass">
                 <label style={{ display: 'block', fontWeight: 700, marginBottom: '1rem' }}>Rayon des bordures</label>
                 <input 
                    type="range" min="0" max="2" step="0.1" 
                    value={parseFloat(config.theme.borderRadius || '1.25')}
                    onChange={(e) => updateConfig({ theme: { ...config.theme, borderRadius: `${e.target.value}rem` } })}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                 />
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    <span>Sharp</span>
                    <span>Modern Rounded</span>
                 </div>
               </div>

               <div className="card glass" onClick={() => updateConfig({ theme: { ...config.theme, isCompact: !config.theme.isCompact } })} style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>Densité Compacte</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Réduit la taille de la navigation latérale.</div>
                    </div>
                    <div style={{ 
                      width: '40px', height: '20px', borderRadius: '10px', 
                      background: config.theme.isCompact ? 'var(--accent)' : 'var(--border)',
                      position: 'relative'
                    }}>
                       <div style={{ 
                         width: '14px', height: '14px', borderRadius: '50%', background: 'white',
                         position: 'absolute', top: '3px', left: config.theme.isCompact ? '23px' : '3px',
                         transition: '0.2s'
                       }} />
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        );

      case 'ai':
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
             <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>IPC Intelligence</h2>
             <div className="card glass" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                   <div>
                      <label>Nom de votre Assistant</label>
                      <input 
                        className="form-input" 
                        value={config.aiName} 
                        onChange={(e) => updateConfig({ aiName: e.target.value })}
                      />
                   </div>
                   <div>
                      <label>Mode d'activation favori</label>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <button 
                          onClick={() => updateConfig({ aiPreference: 'floating' })}
                          style={{ flex: 1, padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: config.aiPreference === 'floating' ? 'var(--accent)' : 'transparent', color: config.aiPreference === 'floating' ? 'white' : 'inherit', cursor: 'pointer' }}
                        >
                          Bouton Flottant
                        </button>
                        <button 
                          onClick={() => updateConfig({ aiPreference: 'spotlight' })}
                          style={{ flex: 1, padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: config.aiPreference === 'spotlight' ? 'var(--accent)' : 'transparent', color: config.aiPreference === 'spotlight' ? 'white' : 'inherit', cursor: 'pointer' }}
                        >
                          Spotlight (Cmd+K)
                        </button>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        );

      case 'localization':
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
             <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Localisation & Formatage</h2>
             <div className="grid grid-2" style={{ gap: '2rem' }}>
                <div className="card glass">
                   <label>Devise par défaut</label>
                    <select 
                     className="form-input" 
                     value={globalSettings.currency}
                     onChange={(e) => updateGlobalSettings({ currency: e.target.value })}
                    >
                      <option value="FCFA">FCFA (Franc CFA)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                </div>
                <div className="card glass">
                   <label>Format de Date</label>
                   <select 
                    className="form-input" 
                    value={config.localization?.dateFormat}
                    onChange={(e) => handleUpdate('localization', 'dateFormat', e.target.value)}
                   >
                     <option value="DD/MM/YYYY">31/12/2026</option>
                     <option value="MM/DD/YYYY">12/31/2026</option>
                     <option value="YYYY-MM-DD">2026-12-31</option>
                   </select>
                </div>
                <div className="card glass">
                   <label>Fuseau Horaire</label>
                   <select 
                    className="form-input" 
                    value={config.localization?.timezone}
                    onChange={(e) => handleUpdate('localization', 'timezone', e.target.value)}
                   >
                     <option value="UTC+0">GMT / UTC+0</option>
                     <option value="UTC+1">Paris / Casablanca (UTC+1)</option>
                     <option value="UTC-5">New York (UTC-5)</option>
                   </select>
                </div>
             </div>
          </motion.div>
        );

      case 'notifications':
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
             <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Alertes & Notifications</h2>
             <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { key: 'systemAlerts', label: 'Alertes système', desc: 'Recevoir des notifications lors d\'actions critiques.' },
                  { key: 'emailDigest', label: 'Résumé Email', desc: 'Envoyer un rapport quotidien par email.' },
                  { key: 'chatSound', label: 'Sons du Chat', desc: 'Émettre un son lors de nouveaux messages.' }
                ].map((n) => (
                  <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{n.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.desc}</div>
                    </div>
                    <div 
                      onClick={() => handleUpdate('notifications', n.key, !config.notifications?.[n.key])}
                      style={{ 
                        width: '40px', height: '20px', borderRadius: '10px', 
                        background: config.notifications?.[n.key] ? 'var(--accent)' : 'var(--border)',
                        cursor: 'pointer', position: 'relative'
                      }}
                    >
                       <div style={{ 
                         width: '14px', height: '14px', borderRadius: '50%', background: 'white',
                         position: 'absolute', top: '3px', left: config.notifications?.[n.key] ? '23px' : '3px',
                         transition: '0.2s'
                       }} />
                    </div>
                  </div>
                ))}
             </div>
          </motion.div>
        );

      case 'security':
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
             <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Sécurité & Accès</h2>
             <div className="grid grid-2" style={{ gap: '2rem' }}>
                <div className="card glass">
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3>Double Authentification (2FA)</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Renforcez la sécurité de votre compte.</p>
                      </div>
                      <button className="btn" style={{ background: config.security?.tfaEnabled ? '#EF4444' : 'var(--accent)', color: 'white' }}>
                        {config.security?.tfaEnabled ? 'Désactiver' : 'Activer'}
                      </button>
                   </div>
                </div>
                <div className="card glass">
                   <label>Expiration de session (minutes)</label>
                   <input 
                    type="number" className="form-input" 
                    value={config.security?.sessionTimeout}
                    onChange={(e) => handleUpdate('security', 'sessionTimeout', parseInt(e.target.value))}
                   />
                </div>
             </div>
          </motion.div>
        );

      case 'system':
        return (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
             <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Maintenance Système</h2>
             <div className="grid grid-2" style={{ gap: '2rem' }}>
                <div className="card glass">
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text)' }}>
                      <Database size={24} />
                      <div>
                        <div style={{ fontWeight: 700 }}>Exportation des données</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Téléchargez l'intégralité de vos enregistrements au format JSON.</div>
                      </div>
                   </div>
                   <button className="btn btn-secondary" style={{ marginTop: '1.5rem', width: '100%' }}>Exporter JSON</button>
                </div>
                <div className="card glass" style={{ border: '1px solid #EF4444' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#EF4444' }}>
                      <Trash2 size={24} />
                      <div>
                        <div style={{ fontWeight: 700 }}>Réinitialisation Usine</div>
                        <div style={{ fontSize: '0.75rem' }}>Supprime toutes les données locales et paramètres.</div>
                      </div>
                   </div>
                   <button className="btn" style={{ marginTop: '1.5rem', width: '100%', background: '#EF4444', color: 'white' }}>Tout Effacer</button>
                </div>
             </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
      {/* Settings Navigation Sidebar */}
      <div style={{ 
        width: '280px', 
        background: 'var(--bg)', 
        borderRight: '1px solid var(--border)',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{ padding: '0 1rem', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Paramètres</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gérez votre plateforme</p>
        </div>

        {tabs.map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', 
              borderRadius: '0.75rem', cursor: 'pointer', transition: '0.2s',
              background: activeTab === tab.id ? 'var(--accent)15' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 500
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </div>
        ))}

        <div style={{ flex: 1 }} />
        
        <div style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <Info size={16} color="var(--accent)" />
           <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Version 1.0.4-enterprise
           </div>
        </div>
      </div>

      {/* Main Settings Content */}
      <div style={{ flex: 1, padding: '3rem', overflowY: 'auto', background: 'var(--bg-subtle)' }}>
        <AnimatePresence mode="wait">
          <div key={activeTab} style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {renderContent()}
          </div>
        </AnimatePresence>
      </div>

      <style>{`
        .card { padding: 2rem; borderRadius: 1.5rem; }
        .form-input { 
          width: 100%; padding: 0.85rem 1.25rem; borderRadius: 0.75rem; 
          border: 1px solid var(--border); background: var(--bg); color: var(--text);
          font-size: 0.9rem; outline: none; margin-top: 0.5rem;
        }
        .form-input:focus { border-color: var(--accent); }
        label { font-size: 0.85rem; font-weight: 700; color: var(--text-muted); }
        h3 { fontSize: 1.1rem; marginBottom: 1.25rem; fontWeight: 700; color: var(--text); }
      `}</style>
    </div>
  );
};

export default Settings;
