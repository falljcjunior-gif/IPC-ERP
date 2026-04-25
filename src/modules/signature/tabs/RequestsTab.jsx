import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Clock, CheckCircle2, User, Send, Plus, X, Upload, ShieldCheck, Lock
} from 'lucide-react';
import { useStore } from '../../../store';
import SignaturePad from '../../../components/SignaturePad';

const RequestsTab = () => {
  const { data, addRecord, updateRecord, formatCurrency, logAction } = useStore();
  const requests = data.signature?.requests || [];
  const salesOrders = data.sales?.orders || [];

  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newReq, setNewReq] = useState({ titre: '', destinataires: '', documentUrl: '', sourceId: '' });
  const [otpCode, setOtpCode] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const generateHash = async (content) => {
    const msgUint8 = new TextEncoder().encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const verifyOtp = (e) => {
    e.preventDefault();
    if (otpCode === '1234') setIsOtpVerified(true);
    else alert('Code OTP incorrect (utilisez 1234 pour le test)');
  };

  const handleSign = (req) => {
    setSelectedRequest(req);
    setIsSignModalOpen(true);
  };

  const handleSaveSignature = async (dataUrl) => {
    if (selectedRequest) {
      const hash = await generateHash(`${selectedRequest.titre}-${selectedRequest.destinataires}-${Date.now()}`);
      const auditTrail = {
        hashDocument: hash,
        signatureBase64: dataUrl,
        ipAddress: '192.168.1.42', // Mock PII
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        otpVerifiedAt: new Date().toISOString()
      };

      updateRecord('signature', 'requests', selectedRequest.id, {
        statut: 'Signé',
        dateSignature: new Date().toISOString(),
        auditTrail
      });
      logAction('Signature Électronique', `Document scellé cryptographiquement (Hash: ${hash.substring(0,8)}...)`, 'signature', selectedRequest.id);
    }
    setIsSignModalOpen(false);
    setSelectedRequest(null);
    setIsOtpVerified(false);
    setOtpCode('');
  };

  const handleCreateRequest = (e) => {
    e.preventDefault();
    addRecord('signature', 'requests', {
      ...newReq,
      statut: 'Envoyé',
      num: `REQ-${Date.now().toString().slice(-4)}`
    });
    setIsNewModalOpen(false);
    setNewReq({ titre: '', destinataires: '', documentUrl: '', sourceId: '' });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Demandes en cours</h2>
          <p style={{ color: 'var(--text-muted)' }}>{requests.length} document(s) enregistré(s).</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setIsNewModalOpen(true)}
        >
          <Plus size={16} /> Nouvelle Demande
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
        {requests.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'var(--bg-subtle)', borderRadius: '1.5rem' }}>
            <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h3>Aucune demande de signature</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0.5rem auto' }}>Créez une nouvelle demande pour importer un document et l'envoyer pour signature.</p>
          </div>
        ) : (
          requests.map(req => (
            <motion.div 
              key={req.id} 
              className="glass"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} color="var(--accent)" />
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 700,
                    background: req.statut === 'Signé' ? '#10B98120' : req.statut === 'Envoyé' ? '#3B82F620' : '#F59E0B20',
                    color: req.statut === 'Signé' ? '#10B981' : req.statut === 'Envoyé' ? '#3B82F6' : '#F59E0B'
                  }}>
                    {req.statut}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600 }}>{req.titre}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                  <User size={14} /> {req.destinataires}
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={14} /> {req.dateCreation ? new Date(req.dateCreation).toLocaleDateString('fr-FR') : 'Récent'}
                </p>
              </div>
              
              <div style={{ marginTop: '1.5rem' }}>
                {req.statut !== 'Signé' ? (
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => handleSign(req)}
                  >
                    <FileText size={16} /> Signer Document
                  </button>
                ) : (
                  <button 
                    className="btn"
                    style={{ width: '100%', justifyContent: 'center', background: '#10B98115', color: '#10B981', borderColor: '#10B98130' }}
                    disabled
                  >
                    <ShieldCheck size={16} /> Certifié IPC
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Signature */}
      <AnimatePresence>
        {isSignModalOpen && selectedRequest && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass"
              style={{ width: '100%', maxWidth: '900px', background: 'var(--bg-color)', borderRadius: '1.5rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
            >
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Signature de "{selectedRequest.titre}"</h3>
                <button className="btn" style={{ padding: '0.5rem' }} onClick={() => setIsSignModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'row' }}>
                {/* Mock PDF Viewer */}
                <div style={{ flex: 1, background: '#f8fafc', padding: '2rem', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '100%', maxWidth: '600px', minHeight: '800px', background: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '3rem', position: 'relative' }}>
                     <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>{selectedRequest.titre}</h1>
                     <p>Ceci est un aperçu généré pour le document à signer.</p>
                     <br/>
                     <p>Destinataire : {selectedRequest.destinataires}</p>
                     <p>Date : {new Date().toLocaleDateString('fr-FR')}</p>
                     <div style={{ marginTop: '150px', borderTop: '1px solid #ccc', paddingTop: '1rem', width: '200px' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Signature du destinataire</p>
                        {selectedRequest.statut === 'Signé' && selectedRequest.auditTrail && (
                           <div style={{ marginTop: '1rem', border: '2px solid #10B981', padding: '0.5rem', borderRadius: '0.5rem', transform: 'rotate(-5deg)' }}>
                              <div style={{ color: '#10B981', fontWeight: 900, textAlign: 'center', fontSize: '1.2rem' }}>CERTIFIÉ IPC</div>
                              <div style={{ fontSize: '0.5rem', color: '#10B981', textAlign: 'center' }}>{selectedRequest.auditTrail.hashDocument.substring(0, 16)}...</div>
                           </div>
                        )}
                     </div>
                  </div>
                </div>
                {/* Signature Panel */}
                <div style={{ width: '380px', padding: '2rem', borderLeft: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                   {selectedRequest.statut === 'Signé' && selectedRequest.auditTrail ? (
                      <div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', marginBottom: '1rem' }}>
                            <ShieldCheck size={24} /> <h3 style={{ margin: 0 }}>Dossier de Preuve</h3>
                         </div>
                         <div className="glass" style={{ padding: '1rem', borderRadius: '1rem', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                            <p><strong>Hash (SHA-256):</strong><br/>{selectedRequest.auditTrail.hashDocument}</p>
                            <hr style={{ margin: '0.5rem 0', borderColor: 'var(--border-color)' }} />
                            <p><strong>IP:</strong> {selectedRequest.auditTrail.ipAddress}</p>
                            <p><strong>Horodatage:</strong> {new Date(selectedRequest.auditTrail.timestamp).toLocaleString('fr-FR')}</p>
                            <p><strong>OTP Vérifié:</strong> Oui</p>
                            <p><strong>Agent:</strong> {selectedRequest.auditTrail.userAgent.substring(0, 40)}...</p>
                         </div>
                      </div>
                   ) : !isOtpVerified ? (
                      <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                         <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <Lock size={48} color="var(--accent)" style={{ margin: '0 auto 1rem' }} />
                            <h3>Authentification 2FA</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Un SMS a été envoyé au signataire pour valider son identité.</p>
                         </div>
                         <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Code OTP (ex: 1234)" 
                            required
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value)}
                            style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.2rem', marginBottom: '1rem' }}
                         />
                         <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Vérifier l'identité</button>
                      </form>
                   ) : (
                      <>
                         <h4 style={{ marginBottom: '1rem' }}>Identité vérifiée <CheckCircle2 size={16} color="#10B981" style={{ verticalAlign: 'middle' }}/></h4>
                         <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Veuillez tracer votre signature ci-dessous pour sceller le document cryptographiquement.</p>
                         <SignaturePad onSave={handleSaveSignature} onCancel={() => setIsSignModalOpen(false)} />
                      </>
                   )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Nouvelle Demande */}
      <AnimatePresence>
        {isNewModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass"
              style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-color)', borderRadius: '1.5rem', overflow: 'hidden' }}
            >
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Nouvelle Demande de Signature</h3>
                <button className="btn" style={{ padding: '0.5rem' }} onClick={() => setIsNewModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateRequest} style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Titre du document *</label>
                  <input 
                    type="text" required
                    className="form-control" 
                    placeholder="ex: Contrat de prestation de services" 
                    value={newReq.titre}
                    onChange={e => setNewReq({...newReq, titre: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Objet Lié (Devis/Commande)</label>
                  <select 
                    className="form-control" 
                    value={newReq.sourceId}
                    onChange={e => setNewReq({...newReq, sourceId: e.target.value})}
                  >
                    <option value="">-- Aucun document source --</option>
                    {salesOrders.map(so => (
                       <option key={so.id} value={so.id}>{so.num} - {so.client}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Destinataires (Email ou Nom) *</label>
                  <input 
                    type="text" required
                    className="form-control" 
                    placeholder="ex: jean.dupont@entreprise.com"
                    value={newReq.destinataires}
                    onChange={e => setNewReq({...newReq, destinataires: e.target.value})}
                  />
                </div>
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Fichier PDF</label>
                  <div style={{ 
                    border: '2px dashed var(--border-color)', 
                    borderRadius: '1rem', 
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer'
                  }}>
                     <Upload size={24} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
                     <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cliquez pour uploader un PDF<br/>(Mode simulation actif)</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn" onClick={() => setIsNewModalOpen(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Send size={16} /> Envoyer la demande
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RequestsTab;
