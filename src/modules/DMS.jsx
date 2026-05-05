import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, File, Upload, Plus, Grid, List as ListIcon, 
  ChevronRight, FileText, Image as ImageIcon, Shield, 
  MoreHorizontal, FolderPlus, X, Lock
} from 'lucide-react';
import { useStore } from '../store';
import { generatePDF } from '../utils/PDFExporter';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';
import SmartButton from '../components/SmartButton';
import { useToastStore } from '../store/useToastStore';
import '../components/GlobalDashboard.css';

const DMS = () => {
  const { data } = useStore();
  const [viewMode, setViewMode]     = useState('grid');
  const [currentFolder, setCurrentFolder] = useState('Racine');
  const [previewFile, setPreviewFile]     = useState(null);

  const folders = data.dms?.folders || [];
  const files   = (data.dms?.files || []).filter(f => f.folder === currentFolder || (currentFolder === 'Racine' && !f.folder));
  const totalFiles = (data.dms?.files || []).length;

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF':   return <FileText size={24} color="#EF4444" />;
      case 'IMAGE': return <ImageIcon size={24} color="#3B82F6" />;
      default:      return <File size={24} color="#64748b" />;
    }
  };

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="luxury-subtitle">Gestion Électronique des Documents</div>
          <h1 className="luxury-title">G.E.D <strong>Secure</strong></h1>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Documents stockés</div>
            <div className="luxury-value-massive" style={{ fontSize: '3rem', color: '#111827' }}>
              <AnimatedCounter from={0} to={totalFiles} duration={1.5} formatter={v => `${Math.round(v)}`} />
            </div>
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '0.4rem', borderRadius: '1rem', backdropFilter: 'blur(10px)' }}>
            <button onClick={() => setViewMode('grid')} style={{ padding: '0.6rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? 'white' : 'transparent', color: '#111827' }}><Grid size={18} /></button>
            <button onClick={() => setViewMode('list')} style={{ padding: '0.6rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? 'white' : 'transparent', color: '#111827' }}><ListIcon size={18} /></button>
          </div>

          <SmartButton 
            variant="secondary" 
            icon={Upload} 
            onClick={async () => useToastStore.getState().addToast('Ouverture du sélecteur de fichiers cryptés...', 'info')}
          >
            Téléverser
          </SmartButton>
          <SmartButton 
            variant="primary" 
            icon={Plus} 
            onClick={async () => useToastStore.getState().addToast('Nouveau document sémantique...', 'info')}
          >
            Nouveau
          </SmartButton>
        </div>
      </div>

      {/* ── BREADCRUMB ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', color: '#64748b', fontSize: '0.95rem' }}>
        <span style={{ fontWeight: 600 }}>Mon IPC</span>
        <ChevronRight size={16} color="#cbd5e1" />
        <span style={{ fontWeight: 800, color: '#111827', background: 'rgba(255,255,255,0.8)', padding: '4px 14px', borderRadius: '999px', fontSize: '0.85rem', border: '1px solid #e2e8f0' }}>{currentFolder}</span>
      </div>

      {/* ── FOLDERS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {folders.map(folder => {
          const folderFiles = (data.dms?.files || []).filter(f => f.folder === folder.name || (folder.name === 'Racine' && !f.folder));
          return (
            <motion.div
              key={folder.name}
              whileHover={{ y: -6, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
              className="luxury-widget"
              style={{ padding: '1.75rem', cursor: 'pointer', background: 'rgba(255,255,255,0.9)', borderRadius: '1.5rem' }}
              onClick={() => setCurrentFolder(folder.name)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '1rem', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Folder size={24} />
                </div>
                <MoreHorizontal size={20} color="#cbd5e1" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem', color: '#1e293b' }}>{folder.name}</h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{folderFiles.length} éléments</p>
            </motion.div>
          );
        })}

        <motion.div
          whileHover={{ y: -6 }}
          onClick={() => useToastStore.getState().addToast('Initialisation du nouveau dossier...', 'info')}
          className="luxury-widget"
          style={{ padding: '1.75rem', border: '2px dashed #e2e8f0', background: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', color: '#94a3b8', borderRadius: '1.5rem', transition: 'all 0.3s' }}
        >
          <FolderPlus size={32} color="#cbd5e1" />
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Créer Dossier</span>
        </motion.div>
      </div>

      {/* ── FILES TABLE ── */}
      <div className="luxury-widget" style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.9)', borderRadius: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e293b', margin: 0 }}>Derniers Fichiers</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.08)', padding: '6px 16px', borderRadius: '999px' }}>
            <Lock size={14} color="#10B981" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10B981' }}>Chiffrement AES actif</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Nom</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Propriétaire</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Dossier</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Taille</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}>Sécurité</th>
              <th style={{ padding: '1rem 1.25rem', fontWeight: 700 }}></th>
            </tr>
          </thead>
          <tbody>
            {files.map(file => (
              <motion.tr key={file.name} whileHover={{ background: '#f8fafc' }} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <td style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }} onClick={() => setPreviewFile(file)}>
                  {getFileIcon(file.type)}
                  <span style={{ fontWeight: 700, color: '#3B82F6', textDecoration: 'underline', fontSize: '0.95rem' }}>{file.name}</span>
                </td>
                <td style={{ padding: '1.25rem', fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>{file.owner}</td>
                <td style={{ padding: '1.25rem' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#f1f5f9', color: '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>{file.folder}</span>
                </td>
                <td style={{ padding: '1.25rem', fontWeight: 600, color: '#64748b', fontSize: '0.9rem' }}>{file.size}</td>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontSize: '0.8rem', fontWeight: 700 }}>
                    <Shield size={14} /> Chiffré AES
                  </div>
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <button 
                    onClick={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      if (file.type === 'PDF' && file.metadata) generatePDF(file.metadata, file.metadata._appId || 'hr', file.metadata._subModule || 'payslip');
                    }}
                    style={{ background: 'white', border: '1px solid #e2e8f0', padding: '6px 16px', borderRadius: '0.75rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: '#475569' }}
                  >
                    Télécharger
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── PREVIEW MODAL ── */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', flexDirection: 'column', padding: '3rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {getFileIcon(previewFile.type)}
                <div>
                  <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem' }}>{previewFile.name}</h2>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>{previewFile.size} · {previewFile.owner}</p>
                </div>
              </div>
              <button onClick={() => setPreviewFile(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.75rem', borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                <File size={80} opacity={0.3} />
                <div>
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', margin: '0 0 0.5rem 0' }}>Prévisualisation sémantique</p>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>Taille: {previewFile.size} · Propriétaire: {previewFile.owner}</p>
                </div>
                <button 
                  onClick={() => {
                    if (previewFile.metadata) generatePDF(previewFile.metadata, previewFile.metadata._appId || 'hr', previewFile.metadata._subModule || 'payslip');
                    else alert('Mode demo: fichier factice.');
                  }} 
                  style={{ padding: '1rem 2.5rem', borderRadius: '2rem', background: '#10B981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', boxShadow: '0 10px 25px rgba(16,185,129,0.3)' }}
                >
                  Télécharger la copie originale cryptée
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(DMS);
