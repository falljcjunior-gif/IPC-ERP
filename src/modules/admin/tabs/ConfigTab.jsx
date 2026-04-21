import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, Globe, Clock, Building2, 
  Settings, Save, RefreshCcw, Landmark,
  Type, Hash, CreditCard, Layout,
  Monitor, Sidebar, Sparkles, Check, Upload, Image as ImageIcon, Loader2
} from 'lucide-react';
import { useBusiness } from '../../../BusinessContext';

const ConfigTab = () => {
  const { config, updateConfig, globalSettings, updateGlobalSettings, uploadLogo } = useBusiness();
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef();

  const handleLogoUpload = async (e) => {
     const file = e.target.files[0];
     if (!file) return;
     
     setUploading(true);
     try {
        await uploadLogo(file);
        alert("Logo mis à jour avec succès !");
     } catch (err) {
        alert("Erreur lors de l'upload : " + err.message);
     } finally {
        setUploading(false);
     }
  };

  const colorPresets = [
    { name: 'Pétrole (IPC)', primary: '#1F363D', accent: '#529990' },
    { name: 'Océan', primary: '#1E293B', accent: '#3B82F6' },
    { name: 'Émeraude', primary: '#064E3B', accent: '#10B981' },
    { name: 'Ardoise', primary: '#334155', accent: '#F59E0B' },
    { name: 'Améthyste', primary: '#4C1D95', accent: '#8B5CF6' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
       
       <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
          {/* Identity & Branding Workbench */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: '#0F172A' }}>Branding & Identité Visuelle</h4>
             <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                   <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                         <Building2 size={14} /> Nom de l'Organisation
                      </label>
                      <input className="form-input" value={globalSettings.companyName} onChange={(e) => updateGlobalSettings({ companyName: e.target.value })} />
                   </div>
                   <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                         <Globe size={14} /> Site Web Corporate
                      </label>
                      <input className="form-input" value={globalSettings.website} onChange={(e) => updateGlobalSettings({ website: e.target.value })} />
                   </div>
                </div>

                 <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                       <Monitor size={14} /> Logo Master (Branding)
                    </label>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                       <div className="glass" style={{ width: '80px', height: '80px', borderRadius: '1.25rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                          <img src={globalSettings.logoUrl || '/logo.png'} alt="Preview" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                       </div>
                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                             <input className="form-input" value={globalSettings.logoUrl} onChange={(e) => updateGlobalSettings({ logoUrl: e.target.value })} style={{ flex: 1, fontSize: '0.8rem', padding: '0.75rem 1rem' }} placeholder="https://..." />
                             <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="btn" 
                                style={{ padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid #3B82F6', color: '#3B82F6', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                             >
                                {uploading ? <Loader2 className="spin" size={14} /> : <Upload size={14} />} 
                                {uploading ? '...' : 'Upload'}
                             </button>
                             <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" style={{ display: 'none' }} />
                          </div>
                       </div>
                    </div>
                 </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                   <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Largeur Logo ({globalSettings.logoWidth}px)</label>
                      <input type="range" min="20" max="200" value={globalSettings.logoWidth ?? 40} onChange={(e) => updateGlobalSettings({ logoWidth: parseInt(e.target.value) })} style={{ width: '100%', accentColor: '#3B82F6' }} />
                   </div>
                   <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Hauteur Logo ({globalSettings.logoHeight}px)</label>
                      <input type="range" min="20" max="100" value={globalSettings.logoHeight ?? 40} onChange={(e) => updateGlobalSettings({ logoHeight: parseInt(e.target.value) })} style={{ width: '100%', accentColor: '#3B82F6' }} />
                   </div>
                </div>
             </div>
          </div>

          {/* Theme Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: '#0F172A' }}>Presets Graphiques</h4>
             <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {colorPresets.map(preset => (
                  <motion.div
                    key={preset.name}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => updateConfig({ theme: { ...config.theme, primary: preset.primary, accent: preset.accent } })}
                    style={{ 
                      width: 'calc(50% - 0.5rem)', height: '100px', borderRadius: '1.5rem', background: preset.primary, 
                      cursor: 'pointer', position: 'relative', overflow: 'hidden',
                      border: config.theme.primary === preset.primary ? '4px solid #3B82F6' : '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: preset.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {config.theme.primary === preset.primary && <Check size={18} color="white" />}
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '2rem' }}>
          {/* AI Intelligence Config */}
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: '#8B5CF615', color: '#8B5CF6' }}>
                   <Sparkles size={20} />
                </div>
                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>IPC Intelligence Core</h4>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Nom de l'Assistant</label>
                   <input className="form-input" value={config.aiName} onChange={(e) => updateConfig({ aiName: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                   <button onClick={() => updateConfig({ aiPreference: 'floating' })} style={{ flex: 1, padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', background: config.aiPreference === 'floating' ? '#8B5CF6' : 'transparent', color: config.aiPreference === 'floating' ? 'white' : 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Bouton Flottant</button>
                   <button onClick={() => updateConfig({ aiPreference: 'spotlight' })} style={{ flex: 1, padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', background: config.aiPreference === 'spotlight' ? '#8B5CF6' : 'transparent', color: config.aiPreference === 'spotlight' ? 'white' : 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>Spotlight</button>
                </div>
             </div>
          </div>

          {/* Localization & Master Data */}
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: '#3B82F615', color: '#3B82F6' }}>
                   <Landmark size={20} />
                </div>
                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Localisation & Trésorerie</h4>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                   <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Devise de Référence</label>
                   <select className="form-input" value={globalSettings.currency} onChange={(e) => updateGlobalSettings({ currency: e.target.value })}>
                      <option value="FCFA">FCFA (Franc CFA)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                   </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                   <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Format Date</label>
                      <select className="form-input" value={config.localization?.dateFormat} onChange={(e) => updateConfig({ localization: { ...config.localization, dateFormat: e.target.value } })}>
                         <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                         <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      </select>
                   </div>
                   <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Fuseau Horaire</label>
                      <select className="form-input" value={config.localization?.timezone} onChange={(e) => updateConfig({ localization: { ...config.localization, timezone: e.target.value } })}>
                         <option value="UTC+0">GMT (UTC+0)</option>
                         <option value="UTC+1">Paris (UTC+1)</option>
                      </select>
                   </div>
                </div>
             </div>
          </div>
       </div>

       <style>{`
          .form-input { 
            width: 100%; padding: 1rem 1.25rem; borderRadius: 1.25rem; 
            border: 1px solid var(--border); background: var(--bg-subtle); color: var(--text);
            font-size: 0.95rem; font-weight: 700; outline: none; transition: 0.2s;
          }
          .form-input:focus { border-color: #3B82F6; background: var(--bg); }
          select { appearance: none; cursor: pointer; }
       `}</style>
    </motion.div>
  );
};

export default ConfigTab;
