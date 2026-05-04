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
  const canSeeField = useStore(s => s.canSeeField);
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
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} style={{ width: '100%', maxWidth: '600px', height: '100vh', position: 'relative', zIndex: 1001, background: '#FFFFFF', display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0,0,0,0.1)' }}>
            
            {/* Header Mini-Dashboard */}
            <div style={{ padding: '2rem 2rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid var(--nexus-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1, paddingRight: '1rem' }}>
                   <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.5rem' }}>
                     Insight Nexus / {appId} / {subModule}
                   </div>
                   <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)', margin: 0, lineHeight: 1.2 }}>
                     {record.titre || record.nom || record.num || "Nouveau Dossier"}
                   </h2>
                </div>
                <button onClick={onClose} style={{ background: 'white', border: '1px solid var(--nexus-border)', width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--nexus-text-muted)', boxShadow: 'var(--shadow-nexus)' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Status Badges */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {record.statut && (
                  <div style={{ background: record.statut === 'Annulé' ? '#FEE2E2' : 'var(--nexus-primary-glow)', color: record.statut === 'Annulé' ? '#EF4444' : 'var(--nexus-primary)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    {record.statut}
                  </div>
                )}
                {isLocked && (
                  <div style={{ background: '#FEE2E2', color: '#EF4444', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={12} /> VERROUILLÉ
                  </div>
                )}
                {!isLocked && (
                   <div style={{ background: '#E0F2FE', color: '#0284C7', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <ActivityIcon size={12} /> ÉDITION ACTIVE
                   </div>
                )}
              </div>
            </div>

            {/* Nexus Tabs - Mobile Friendly */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--nexus-border)', background: '#FFFFFF' }}>
              {[
                { id: 'infos', label: 'ANALYSE', icon: <FileText size={18} /> },
                { id: 'timeline', label: 'TRACEUR', icon: <ActivityIcon size={18} /> },
                { id: 'documents', label: 'ACTIFS', icon: <Download size={18} /> }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '1.25rem 0', background: 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '3px solid var(--nexus-primary)' : '3px solid transparent', color: activeTab === tab.id ? 'var(--nexus-primary)' : 'var(--nexus-text-muted)', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', transition: 'var(--transition-nexus)' }}>
                  {tab.icon} <span className="hide-mobile-text">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#FFFFFF' }}>
              {activeTab === 'infos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {Object.entries(formData).map(([key, value]) => {
                    const schema = registry.getSchema(appId);
                    const model = schema?.models?.[subModule];
                    const fieldDef = model?.fields?.[key];
                    const label = fieldDef?.label || key;
                    if (['id', 'avatar', 'createdAt', 'checklists', 'skills', '_domain', '_hasHydrated'].includes(key)) return null;
                    if (!canSeeField(appId, key)) return null;
                    
                    return (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{t(label)}</label>
                        {isLocked ? (
                          <div style={{ padding: '0.8rem 1rem', background: '#F8FAFC', borderRadius: '10px', fontWeight: 700, color: 'var(--nexus-secondary)', border: '1px solid var(--nexus-border)' }}>{value?.toString() || '—'}</div>
                        ) : (
                          <input type="text" value={value || ''} onChange={(e) => handleChange(key, e.target.value)} style={{ width: '100%', padding: '0.8rem 1rem', background: '#FFFFFF', border: '1px solid var(--nexus-border)', borderRadius: '10px', fontWeight: 700, outline: 'none', transition: 'var(--transition-nexus)' }} onFocus={(e) => e.target.style.borderColor = 'var(--nexus-primary)'} onBlur={(e) => e.target.style.borderColor = 'var(--nexus-border)'} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                   <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid var(--nexus-border)' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--nexus-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ActivityIcon size={18} color="var(--nexus-primary)" /> TRACEUR D'ACTIVITÉ NEXUS
                      </h3>
                      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
                        <input type="text" disabled={isLocked} placeholder="Annoter le dossier..." style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid var(--nexus-border)', fontWeight: 600, outline: 'none' }} />
                        <button disabled={isLocked} style={{ background: 'var(--nexus-primary)', color: 'white', padding: '0 1.2rem', borderRadius: '10px', border: 'none', cursor: isLocked ? 'not-allowed' : 'pointer' }}><Send size={16}/></button>
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
                  <div style={{ border: '2px dashed var(--nexus-border)', borderRadius: '14px', padding: '3rem 1rem', textAlign: 'center', background: '#F8FAFC' }}>
                    <Download size={40} color="var(--nexus-text-muted)" style={{ marginBottom: '1rem' }} />
                    <h4 style={{ fontWeight: 900, color: 'var(--nexus-secondary)', marginBottom: '0.5rem' }}>ACTIFS NUMÉRIQUES</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--nexus-text-muted)', fontWeight: 600 }}>Déposez vos documents pour archivage SSOT</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Actions Footer */}
            <div style={{ padding: '1.5rem 2rem', background: '#FFFFFF', borderTop: '1px solid var(--nexus-border)', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', bottom: 0, zIndex: 10 }}>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => generatePDF(record, appId, subModule)} style={{ flex: 1, padding: '0.8rem', background: '#F8FAFC', border: '1px solid var(--nexus-border)', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'var(--transition-nexus)' }}>
                  <FileText size={16} color="var(--nexus-primary)" /> <span className="hide-mobile-text">EXPORTER PDF</span>
                </button>
                {!isLocked && (
                  <button onClick={() => { if(window.confirm('Action critique : Confirmer suppression ?')) { deleteRecord(appId, subModule, record.id); onClose(); } }} style={{ padding: '0.8rem 1.2rem', background: '#FEF2F2', color: '#EF4444', fontWeight: 800, fontSize: '0.8rem', border: '1px solid #FEE2E2', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'var(--transition-nexus)' }}>
                    <Trash2 size={16} /> <span className="hide-mobile-text">SUPPRIMER</span>
                  </button>
                )}
              </div>
              
              {!isLocked && (
                 <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '1rem', background: 'transparent', border: 'none', fontWeight: 800, color: 'var(--nexus-text-muted)', cursor: 'pointer' }}>ANNULER</button>
                    <button onClick={handleSave} style={{ flex: 2, padding: '1rem', background: 'var(--nexus-primary)', color: 'white', fontWeight: 900, borderRadius: '10px', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-nexus-hover)' }}>ENREGISTRER</button>
                 </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DetailOverlay;
