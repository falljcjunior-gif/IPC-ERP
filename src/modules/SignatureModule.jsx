import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileCheck, ShieldCheck, Download, Trash2, 
  Send, History, FileText, Landmark, PenTool 
} from 'lucide-react';
import { useStore } from '../store';
import { FirestoreService, StorageService } from '../services/firestore.service';
import SmartButton from '../components/SmartButton';
import '../components/GlobalDashboard.css';

const SignatureModule = () => {
  const { currentUser, data, updateRecord } = useStore();
  const sigPad = useRef({});
  const [isSigning, setIsSigning] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const docsToSign = [
    ...(data.crm?.contracts || []).filter(c => c.statut === 'A_SIGNER').map(c => ({ ...c, type: 'Contrat CRM', label: c.label || `Contrat CRM #${c.id.slice(0,6)}` })),
    ...(data.hr?.contracts || []).filter(c => c.statut === 'A_SIGNER').map(c => ({ ...c, type: 'Contrat RH', label: c.label || `Contrat RH #${c.id.slice(0,6)}` })),
    ...(data.finance?.invoices || []).filter(i => i.status === 'A_SIGNER').map(i => ({ ...i, type: 'Facture', label: `Facture #${i.id.slice(0,6)}` })),
    ...(data.dms?.files || []).filter(f => f.status === 'A_SIGNER').map(f => ({ ...f, type: 'Document', label: f.name }))
  ];

  const clear = () => sigPad.current.clear();

  const handleSave = async () => {
    if (sigPad.current.isEmpty()) {
      throw new Error("Veuillez signer avant d'enregistrer.");
    }
    
    setIsSaving(true);
    try {
      const dataUrl = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();
      
      const fileName = `signatures/${selectedDoc.id}_${Date.now()}.png`;
      const uploadUrl = await StorageService.uploadFile(blob, fileName);
      
      // Update document status in Firestore
      await FirestoreService.createDocument('signatures_archive', {
        docId: selectedDoc.id,
        docLabel: selectedDoc.label,
        docType: selectedDoc.type,
        signatureUrl: uploadUrl,
        signedBy: currentUser.nom,
        signedById: currentUser.id,
        timestamp: new Date().toISOString(),
        verificationHash: btoa(`${selectedDoc.id}-${Date.now()}`) // Simple hash for demo
      });

      // 3. Update employee profile if it's an HR-related document
      // 3. Update the source document status
      let collectionName = 'hr';
      if (selectedDoc.type === 'Contrat CRM') collectionName = 'crm';
      if (selectedDoc.type === 'Facture') collectionName = 'finance';
      if (selectedDoc.type === 'Document') collectionName = 'dms';

      await updateRecord(collectionName, selectedDoc.subModule || 'contracts', selectedDoc.id, {
        statut: 'SIGNÉ',
        status: 'SIGNED',
        signedAt: new Date().toISOString(),
        signatureUrl: uploadUrl,
        _signedBy: currentUser.nom
      });

      // Special case for HR employees profile link
      if (selectedDoc.type === 'Contrat RH' && selectedDoc.employeeId) {
        await updateRecord('hr', 'employees', selectedDoc.employeeId, {
          contractStatus: 'SIGNED',
          contractUrl: uploadUrl
        });
      }

      setSignatureUrl(uploadUrl);
      setIsSigning(false);
    } catch (err) {
      console.error("Signature Error:", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', background: 'var(--bg)' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ background: 'var(--accent)', padding: '8px', borderRadius: '12px' }}>
            <ShieldCheck size={20} color="white" />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>IPC Trust & Legal</span>
        </div>
        <h1 className="luxury-title" style={{ fontSize: '3rem' }}>Signature <strong>Électronique</strong></h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* LIST OF DOCS */}
        <div className="glass" style={{ padding: '2rem', borderRadius: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={20} color="var(--accent)" /> Documents en attente
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {docsToSign.map(doc => (
              <motion.div 
                key={doc.id}
                whileHover={{ x: 5 }}
                onClick={() => setSelectedDoc(doc)}
                style={{ 
                  padding: '1.25rem', borderRadius: '1.25rem', cursor: 'pointer',
                  background: selectedDoc?.id === doc.id ? 'var(--accent)' : 'white',
                  color: selectedDoc?.id === doc.id ? 'white' : 'var(--text)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{doc.label}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{doc.type} • {doc.client || 'Interne'}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SIGNATURE PAD AREA */}
        <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
          {selectedDoc ? (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Document Sélectionné</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{selectedDoc.label}</div>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  En signant ce document, vous certifiez avoir pris connaissance des clauses et validez l'exécution des travaux associés.
                </p>
              </div>

              <div style={{ flex: 1, background: '#f8fafc', borderRadius: '1.5rem', border: '2px dashed #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                <SignatureCanvas 
                  ref={sigPad}
                  penColor='black'
                  canvasProps={{ style: { width: '100%', height: '100%', cursor: 'crosshair' } }}
                />
                <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button onClick={clear} className="glass" style={{ padding: '0.75rem', borderRadius: '1rem', border: 'none', cursor: 'pointer', color: '#EF4444' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <SmartButton 
                  onClick={handleSave}
                  variant="primary"
                  icon={FileCheck}
                  successMessage="Document Signé & Archivé"
                  style={{ flex: 1, padding: '1.25rem', borderRadius: '1.25rem', boxShadow: '0 10px 20px rgba(139, 92, 246, 0.2)' }}
                >
                  VALIDER LA SIGNATURE
                </SmartButton>
                <SmartButton 
                  onClick={() => setSelectedDoc(null)} 
                  variant="ghost" 
                  style={{ padding: '1.25rem', borderRadius: '1.25rem' }}
                >
                  ANNULER
                </SmartButton>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <PenTool size={64} strokeWidth={1} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
              <p style={{ fontWeight: 700 }}>Veuillez sélectionner un document pour commencer</p>
            </div>
          )}
        </div>
      </div>

      {/* ARCHIVE FOOTER */}
      <div style={{ marginTop: '3rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <History size={20} color="#64748b" /> Dernières Signatures Certifiées
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          {[1,2,3].map(i => (
            <div key={i} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', opacity: 0.6 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Contrat #A9283B</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Signé le 28/04 par R. Yoman</div>
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '0.7rem', fontWeight: 900 }}>
                <ShieldCheck size={12} /> CERTIFIÉ IPC
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default SignatureModule;
