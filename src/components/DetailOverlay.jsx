import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Trash2, 
  History, 
  FileText, 
  Settings, 
  Star, 
  CheckCircle2,
  ArrowRight,
  Plus,
  Send,
  Download,
  User,
  Activity as ActivityIcon,
  Target,
  Lock
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import SafeResponsiveChart from '../components/charts/SafeResponsiveChart';
import { generatePDF } from '../utils/PDFExporter';
import Timeline from './Timeline';
import { registry } from '../services/Registry';
import { useStore } from '../store';
//
import { useTranslation } from 'react-i18next';

const DetailOverlay = ({ isOpen, onClose, record, appId, subModule, onUpdate }) => {
  const { t } = useTranslation();
  const hasPermission = useStore(s => s.hasPermission);
  const userRole = useStore(s => s.userRole);
  const config = useStore(s => s.config);
  const navigateTo = useStore(s => s.navigateTo);
  const deleteRecord = useStore(s => s.deleteRecord);
  const activities = useStore(s => s.activities);
  const products = useStore(s => s.data?.inventory?.products);
  const contracts = useStore(s => s.data?.legal?.contracts);
  const logAction = useStore(s => s.logAction);
  const [activeTab, setActiveTab] = useState('infos');
  const [formData, setFormData] = useState({});

  const productsArr = products || [];
  const contractsArr = contracts || [];
  const activitiesArr = activities || [];

  const customFields = config?.customFields?.[appId] || [];

  const isLockedByStatus = (appId === 'sales' || appId === 'crm') && (formData.statut === 'Signé' || formData.etape === 'Gagné' || formData.statut === 'Gagné');
  const isWriteAllowed = userRole === 'SUPER_ADMIN' || hasPermission(appId, 'write');
  const isLocked = isLockedByStatus || !isWriteAllowed;

  React.useEffect(() => {
    if (record) setFormData(record);
    else setFormData({});
  }, [record]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const schema = registry.getSchema(appId);
    const model = schema?.models?.[subModule];
    const targetAppId = model?.dataPath ? model.dataPath.split('.')[0] : appId;
    const targetSubModule = model?.dataPath ? model.dataPath.split('.')[1] : subModule;
    onUpdate(targetAppId, targetSubModule, record.id, formData);
    onClose();
  };

  if (!record) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', justifyContent: 'flex-end' }}>
          
          {/* Nexus Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', zIndex: 1000 }} />

          {/* Nexus Drawer */}
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="nexus-card" style={{ width: '100%', maxWidth: '560px', height: '100vh', position: 'relative', zIndex: 1001, background: 'white', border: 'none', borderRadius: 0, display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0,0,0,0.1)' }}>
            
            {/* Header */}
            <div style={{ padding: '2rem', background: 'var(--nexus-bg)', borderBottom: '1px solid var(--nexus-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                   <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.5rem' }}>
                     Insight Nexus / {appId} / {subModule}
                   </div>
                   <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)', margin: 0 }}>
                     {record.titre || record.nom || record.num || "Détails"}
                   </h2>
                </div>
                <button onClick={onClose} style={{ background: 'white', border: '1px solid var(--nexus-border)', width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--nexus-text-muted)', boxShadow: 'var(--shadow-nexus)' }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {isLocked && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={12} /> ARCHIVE VERROUILLÉE
                  </div>
                )}
                {!isLocked && (
                   <div style={{ background: 'var(--nexus-primary-glow)', color: 'var(--nexus-primary)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <ActivityIcon size={12} /> SESSION ACTIVE
                   </div>
                )}
              </div>
            </div>

            {/* Nexus Tabs */}
            <div style={{ display: 'flex', padding: '0 1rem', borderBottom: '1px solid var(--nexus-border)', background: 'white' }}>
              {[
                { id: 'infos', label: 'ANALYSE', icon: <FileText size={16} /> },
                { id: 'timeline', label: 'TRACEUR', icon: <ActivityIcon size={16} /> },
                { id: 'documents', label: 'ACTIFS', icon: <Download size={16} /> },
                { id: 'actions', label: 'WORKFLOW', icon: <Settings size={16} /> },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '1.25rem', background: 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--nexus-primary)' : '3px solid transparent', color: activeTab === tab.id ? 'var(--nexus-primary)' : 'var(--nexus-text-muted)', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', transition: 'var(--transition-nexus)' }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Content Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', background: 'white' }}>
              {activeTab === 'infos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {Object.entries(formData).map(([key, value]) => {
                    const schema = registry.getSchema(appId);
                    const model = schema?.models?.[subModule];
                    const fieldDef = model?.fields?.[key];
                    const label = fieldDef?.label || key;
                    if (['id', 'avatar', 'createdAt', 'checklists', 'skills', '_domain', '_hasHydrated'].includes(key)) return null;
                    
                    return (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t(label)}</label>
                        <div style={{ position: 'relative' }}>
                          {isLocked ? (
                            <div style={{ padding: '1rem', background: 'var(--nexus-bg)', borderRadius: '14px', fontWeight: 800, color: 'var(--nexus-secondary)', border: '1px solid var(--nexus-border)' }}>{value?.toString() || '—'}</div>
                          ) : (
                            <input type="text" value={value || ''} onChange={(e) => handleChange(key, e.target.value)} style={{ width: '100%', padding: '1rem', background: 'white', border: '2px solid var(--nexus-border)', borderRadius: '14px', fontWeight: 700, outline: 'none', transition: 'var(--transition-nexus)' }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                   <div className="nexus-card" style={{ padding: '2rem', background: 'var(--nexus-bg)' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--nexus-secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ActivityIcon size={18} color="var(--nexus-primary)" /> TRACEUR D'ACTIVITÉ NEXUS
                      </h3>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <input type="text" disabled={isLocked} placeholder="Annoter le dossier..." style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '2px solid var(--nexus-border)', fontWeight: 700 }} />
                        <button disabled={isLocked} className="nexus-card" style={{ background: 'var(--nexus-primary)', color: 'white', padding: '0.8rem 1.2rem', border: 'none' }}><Send size={18}/></button>
                      </div>
                      <Timeline events={activitiesArr.filter(a => String(a.targetId) === String(record.id)).map(a => ({
                        title: a.action,
                        time: new Date(a.timestamp).toLocaleString(),
                        description: a.detail,
                        user: a.user,
                        color: 'var(--nexus-primary)'
                      }))} />
                   </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ border: '3px dashed var(--nexus-border)', borderRadius: '20px', padding: '3rem', textAlign: 'center', background: 'var(--nexus-bg)' }}>
                    <Download size={48} color="var(--nexus-primary)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <h4 style={{ fontWeight: 900, color: 'var(--nexus-secondary)' }}>ACTIFS NUMÉRIQUES</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--nexus-text-muted)', fontWeight: 700 }}>Déposez vos documents pour archivage SSOT</p>
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button onClick={() => generatePDF(record, appId, subModule)} className="nexus-card" style={{ padding: '1.5rem', background: 'white', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                    <FileText size={20} color="var(--nexus-primary)" /> EXPORTER DOSSIER PDF
                  </button>
                  {!isLocked && (
                    <button onClick={() => { if(window.confirm('Action critique : Confirmer suppression ?')) { deleteRecord(appId, subModule, record.id); onClose(); } }} style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', color: '#EF4444', fontWeight: 900, border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Trash2 size={20} /> SUPPRIMER L'ENREGISTREMENT
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Nexus Footer */}
            {!isLocked && (
               <div style={{ padding: '2rem', background: 'var(--nexus-bg)', borderTop: '1px solid var(--nexus-border)', display: 'flex', gap: '1.5rem' }}>
                  <button onClick={onClose} style={{ flex: 1, padding: '1.25rem', background: 'white', border: '1px solid var(--nexus-border)', borderRadius: '14px', fontWeight: 800, color: 'var(--nexus-text-muted)', cursor: 'pointer' }}>ANNULER</button>
                  <button onClick={handleSave} className="nexus-card" style={{ flex: 2, padding: '1.25rem', background: 'var(--nexus-primary)', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-nexus-hover)' }}>ENREGISTRER NEXUS</button>
               </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DetailOverlay;
