import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  File, 
  Search, 
  Upload, 
  Plus, 
  Grid, 
  List as ListIcon, 
  ChevronRight, 
  FileText, 
  Image as ImageIcon, 
  Shield, 
  MoreHorizontal,
  FolderPlus
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { generatePDF } from '../utils/PDFExporter';
import { X } from 'lucide-react';

const DMS = () => {
  const { data } = useBusiness();
  const [viewMode, setViewMode] = useState('grid');
  const [currentFolder, setCurrentFolder] = useState('Racine');
  const [previewFile, setPreviewFile] = useState(null);

  const folders = data.dms?.folders || [];
  const files = (data.dms?.files || []).filter(f => f.folder === currentFolder || (currentFolder === 'Racine' && !f.folder));

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF': return <FileText size={24} color="#EF4444" />;
      case 'IMAGE': return <ImageIcon size={24} color="#3B82F6" />;
      default: return <File size={24} color="var(--text-muted)" />;
    }
  };

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>G.E.D</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestion Électronique des Documents et archivage sécurisé.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="glass" style={{ display: 'flex', padding: '0.25rem', borderRadius: '0.75rem' }}>
            <button onClick={() => setViewMode('grid')} className="btn" style={{ background: viewMode === 'grid' ? 'var(--bg)' : 'transparent', padding: '0.5rem' }}><Grid size={18} /></button>
            <button onClick={() => setViewMode('list')} className="btn" style={{ background: viewMode === 'list' ? 'var(--bg)' : 'transparent', padding: '0.5rem' }}><ListIcon size={18} /></button>
          </div>
          <button className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={18} /> Téléverser
          </button>
          <button className="btn btn-primary">
            <Plus size={18} /> Nouveau
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <span>Mon IPC</span> <ChevronRight size={14} /> <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{currentFolder}</span>
      </div>

      {/* Folders Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {folders.map(folder => {
          const folderFiles = (data.dms?.files || []).filter(f => f.folder === folder.name || (folder.name === 'Racine' && !f.folder));
          const numFiles = folderFiles.length;
          
          return (
            <motion.div
              key={folder.name}
              whileHover={{ y: -5 }}
              className="glass"
              style={{ padding: '1.5rem', borderRadius: '1.25rem', cursor: 'pointer' }}
              onClick={() => setCurrentFolder(folder.name)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent)15', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Folder size={24} />
                 </div>
                 <MoreHorizontal size={18} color="var(--text-muted)" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{folder.name}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{numFiles} éléments</p>
            </motion.div>
          );
        })}
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass"
            style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
            <FolderPlus size={24} />
            <span style={{ fontSize: '0.8rem' }}>Créer Dossier</span>
        </motion.div>
      </div>

      <div className="glass" style={{ borderRadius: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Derniers Fichiers</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '1rem' }}>Nom</th>
              <th style={{ padding: '1rem' }}>Propriétaire</th>
              <th style={{ padding: '1rem' }}>Dossier</th>
              <th style={{ padding: '1rem' }}>Taille</th>
              <th style={{ padding: '1rem' }}>Protection</th>
              <th style={{ padding: '1rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {files.map(file => (
              <tr key={file.name} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => setPreviewFile(file)}>
                  {getFileIcon(file.type)}
                  <span style={{ fontWeight: 600, color: 'var(--accent)', textDecoration: 'underline' }}>{file.name}</span>
                </td>
                <td style={{ padding: '1rem' }}>{file.owner}</td>
                <td style={{ padding: '1rem' }}><span className="badge">{file.folder}</span></td>
                <td style={{ padding: '1rem' }}>{file.size}</td>
                <td style={{ padding: '1rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>
                      <Shield size={12} /> Chiffré AES
                   </div>
                </td>
                <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (file.type === 'PDF' && file.metadata) {
                          generatePDF(file.metadata, file.metadata._appId || 'hr', file.metadata._subModule || 'payslip');
                        }
                      }}
                      className="btn" 
                      style={{ background: 'transparent', border: '1px solid var(--border)', fontSize: '0.8rem' }}
                    >
                      Télécharger
                    </button>
                    <MoreHorizontal size={18} cursor="pointer" style={{ marginLeft: '1rem' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Prévisualisation */}
      <AnimatePresence>
         {previewFile && (
            <motion.div
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', flexDirection: 'column', padding: '2rem' }}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                     {getFileIcon(previewFile.type)}
                     <h2 style={{ margin: 0, fontWeight: 700 }}>{previewFile.name}</h2>
                  </div>
                  <button onClick={() => setPreviewFile(null)} className="glass" style={{ color: 'white', padding: '0.6rem', borderRadius: '50%' }}>
                     <X size={24} />
                  </button>
               </div>

               <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyItems: 'center', background: 'var(--bg-subtle)', borderRadius: '1rem', overflow: 'hidden', position: 'relative' }}>
                  {/* Fake viewer box */}
                  <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                     <File size={80} opacity={0.3} />
                     <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Prévisualisation sémantique</span>
                     <span>Taille: {previewFile.size} • Propriétaire: {previewFile.owner}</span>
                     <button onClick={() => {
                        if (previewFile.metadata) generatePDF(previewFile.metadata, previewFile.metadata._appId || 'hr', previewFile.metadata._subModule || 'payslip');
                        else alert('Mode demo: Impossible de télécharger le fichier factice.');
                     }} className="btn-primary" style={{ marginTop: '1rem', padding: '0.8rem 1.5rem', borderRadius: '2rem' }}>
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

export default DMS;
