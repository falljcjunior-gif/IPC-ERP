import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Paperclip, Reply, Forward, ShieldCheck, Zap, Lock, Globe, Mail, Cpu,
  Search, Filter, CheckCircle2, Trash2, MoreHorizontal, Send, Plus, X,
  Inbox, Star, Archive
} from 'lucide-react';
import { useStore } from '../../../store';
import { mailService } from '../../../services/mail.service';
import SmartButton from '../../../components/SmartButton';
import './MailTab.css';

const MailTab = () => {
  const currentUser = useStore(s => s.user);
  const [account, setAccount] = useState(null); // { provider, status }
  const [showSetup, setShowSetup] = useState(false);
  const [setupStep, setSetupStep] = useState('choice'); // choice | form
  const [selectedProvider, setSelectedProvider] = useState(null);

  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedMail, setSelectedMail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // Mock data for the demonstration
  const [mails, setMails] = useState([
    {
      id: '1',
      sender: 'Oumar Sylla',
      email: 'o.sylla@ipc-global.com',
      subject: 'Rapport Trimestriel - Q1 2026',
      preview: 'Bonjour l\'équipe, voici les derniers chiffres concernant la production de la semaine dernière...',
      content: 'Bonjour l\'équipe,\n\nVoici les derniers chiffres concernant la production de la semaine dernière. Nous avons atteint un OTIF de 94.2%, ce qui est une nette amélioration par rapport au mois précédent.\n\nCordialement,\nOumar.',
      date: '10:45',
      isUnread: true,
      isStarred: false,
      folder: 'inbox',
      avatar: 'OS'
    },
    {
      id: '2',
      sender: 'Banque Atlantique',
      email: 'notifications@banque-atlantique.ci',
      subject: 'Confirmation de virement - NEXUS_ERP_PAY',
      preview: 'Le virement groupé pour les salaires de Mars a été traité avec succès par nos services.',
      content: 'Cher client,\n\nNous vous confirmons que l\'ordre de virement groupé NEXUS_ERP_PAY a été traité avec succès.\n\nMontant total : 142,500,000 FCFA\nNombre de bénéficiaires : 142\n\nMerci de votre confiance.',
      date: 'Hier',
      isUnread: false,
      isStarred: true,
      folder: 'inbox',
      avatar: 'BA'
    },
    {
      id: '3',
      sender: 'Nexus AI Butler',
      email: 'butler@nexus-os.ai',
      subject: '🚨 Alerte : Stock critique sur Résine PVC',
      preview: 'Le stock de Résine PVC est passé sous le seuil d\'alerte. Commande suggérée : 50 tonnes.',
      content: 'Bonjour,\n\nJe détecte que le stock de Résine PVC (Réf: PVC-GEN-01) est de 1.2 tonnes. Votre consommation hebdomadaire moyenne est de 8.5 tonnes.\n\nJ\'ai préparé un brouillon de commande fournisseur dans le module Achats.\n\nNexus Butler.',
      date: 'Hier',
      isUnread: true,
      isStarred: false,
      folder: 'inbox',
      avatar: 'NB'
    }
  ]);

  const filteredMails = useMemo(() => {
    return mails.filter(m => 
      m.folder === activeFolder && 
      (m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
       m.sender.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [mails, activeFolder, searchQuery]);

  const unreadCount = mails.filter(m => m.folder === 'inbox' && m.isUnread).length;

  const folders = [
    { id: 'inbox', label: 'Boîte de réception', icon: <Inbox size={18} />, count: unreadCount },
    { id: 'starred', label: 'Suivis', icon: <Star size={18} /> },
    { id: 'sent', label: 'Envoyés', icon: <Send size={18} /> },
    { id: 'drafts', label: 'Brouillons', icon: <FileText size={18} /> },
    { id: 'archive', label: 'Archives', icon: <Archive size={18} /> },
    { id: 'trash', label: 'Corbeille', icon: <Trash2 size={18} /> },
  ];

  const handleConnect = async (provider, config = {}) => {
    await mailService.connectAccount(currentUser.uid, provider, config);
    setAccount({ provider, status: 'CONNECTED' });
    setShowSetup(false);
  };

  if (!account) {
    return (
      <div className="mail-setup-container luxury-glass">
        <div className="mail-setup-hero">
          <div className="hero-icon-stack">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="icon-ring">
              <Globe size={120} strokeWidth={0.5} opacity={0.1} />
            </motion.div>
            <Mail size={64} className="main-icon" />
          </div>
          <h1>Connectez votre <strong>Communication</strong></h1>
          <p>Choisissez votre fournisseur pour intégrer vos emails professionnels directement dans Nexus OS.</p>
          
          <div className="provider-grid">
            <motion.div whileHover={{ y: -5 }} className="provider-card" onClick={() => handleConnect('gmail')}>
              <div className="provider-logo gmail">G</div>
              <h3>Google Workspace</h3>
              <span>Gmail & Drive Integration</span>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="provider-card" onClick={() => handleConnect('outlook')}>
              <div className="provider-logo outlook">M</div>
              <h3>Microsoft 365</h3>
              <span>Outlook & Exchange</span>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="provider-card" onClick={() => { setSelectedProvider('private'); setSetupStep('form'); setShowSetup(true); }}>
              <div className="provider-logo private"><Cpu size={24} /></div>
              <h3>Serveur Privé</h3>
              <span>IMAP / SMTP Custom</span>
            </motion.div>
          </div>
        </div>

        {/* Private Server Modal */}
        <AnimatePresence>
          {showSetup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="setup-modal-overlay">
              <motion.div initial={{ y: 20, scale: 0.95 }} animate={{ y: 0, scale: 1 }} className="setup-modal">
                <h2>Configuration Serveur Privé</h2>
                <div className="setup-form">
                  <div className="form-group">
                    <label>Serveur IMAP</label>
                    <input type="text" placeholder="imap.ipc-global.com" />
                  </div>
                  <div className="form-group">
                    <label>Serveur SMTP</label>
                    <input type="text" placeholder="smtp.ipc-global.com" />
                  </div>
                  <div className="form-group">
                    <label>Email & Mot de passe</label>
                    <input type="email" placeholder="email@ipc-global.com" />
                    <input type="password" placeholder="••••••••" />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <SmartButton variant="outline" onClick={() => setShowSetup(false)}>Annuler</SmartButton>
                    <SmartButton variant="primary" onClick={() => handleConnect('private')}>Tester & Connecter</SmartButton>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="mail-container luxury-glass">
      {/* Sidebar Folders */}
      <div className="mail-sidebar">
        <div style={{ padding: '1.5rem' }}>
          <SmartButton 
            onClick={() => setIsComposing(true)}
            variant="primary" 
            fullWidth
            icon={Plus}
          >
            Nouveau Message
          </SmartButton>
        </div>

        <div className="mail-nav">
          {folders.map(f => (
            <button 
              key={f.id}
              className={`mail-nav-item ${activeFolder === f.id ? 'active' : ''}`}
              onClick={() => { setActiveFolder(f.id); setSelectedMail(null); }}
            >
              <div className="mail-nav-icon">{f.icon}</div>
              <span className="mail-nav-label">{f.label}</span>
              {f.count > 0 && <span className="mail-nav-badge">{f.count}</span>}
            </button>
          ))}
        </div>

        <div className="mail-sidebar-footer">
          <div className="ssot-badge">
            <ShieldCheck size={14} color="#10B981" />
            <span>Serveur Mail Chiffré IPC</span>
          </div>
        </div>
      </div>

      {/* Mail List */}
      <div className="mail-list-pane">
        <div className="mail-search-header">
          <div className="mail-search-bar">
            <Search size={18} color="#9ca3af" />
            <input 
              type="text" 
              placeholder="Rechercher dans vos emails..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="mail-filter-btn"><Filter size={18} /></button>
        </div>

        <div className="mail-items-scroll">
          {filteredMails.length === 0 ? (
            <div className="mail-empty-state">
              <div className="empty-icon-ring"><Mail size={48} strokeWidth={1} /></div>
              <h3>Aucun message ici</h3>
              <p>Votre boîte est parfaitement organisée.</p>
            </div>
          ) : (
            filteredMails.map(mail => (
              <div 
                key={mail.id} 
                className={`mail-item ${mail.isUnread ? 'unread' : ''} ${selectedMail?.id === mail.id ? 'selected' : ''}`}
                onClick={() => setSelectedMail(mail)}
              >
                <div className="mail-item-avatar">{mail.avatar}</div>
                <div className="mail-item-content">
                  <div className="mail-item-header">
                    <span className="mail-item-sender">{mail.sender}</span>
                    <span className="mail-item-date">{mail.date}</span>
                  </div>
                  <div className="mail-item-subject">{mail.subject}</div>
                  <div className="mail-item-preview">{mail.preview}</div>
                </div>
                {mail.isStarred && <Star size={14} fill="#F59E0B" color="#F59E0B" className="star-icon" />}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mail Viewer */}
      <div className="mail-viewer-pane">
        <AnimatePresence mode="wait">
          {selectedMail ? (
            <motion.div 
              key={selectedMail.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mail-viewer"
            >
              <div className="mail-viewer-header">
                <div className="mail-viewer-actions">
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="action-btn"><Reply size={18} /></button>
                    <button className="action-btn"><Forward size={18} /></button>
                    <button className="action-btn"><Archive size={18} /></button>
                    <button className="action-btn"><Trash2 size={18} /></button>
                  </div>
                  <button className="action-btn"><MoreHorizontal size={18} /></button>
                </div>

                <h2 className="mail-viewer-subject">{selectedMail.subject}</h2>
                
                <div className="mail-viewer-sender-info">
                  <div className="mail-viewer-avatar">{selectedMail.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="sender-name">{selectedMail.sender}</span>
                      <span className="sender-email">&lt;{selectedMail.email}&gt;</span>
                    </div>
                    <div className="recipient-to">À : moi (Directeur Nexus)</div>
                  </div>
                  <div className="mail-time">{selectedMail.date}</div>
                </div>
              </div>

              <div className="mail-viewer-body">
                {selectedMail.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>

              <div className="mail-viewer-footer">
                <div 
                  className="attachment-chip clickable" 
                  onClick={() => setPreviewAttachment({ name: 'rapport_mensuel.pdf', type: 'pdf', size: '1.2 MB' })}
                >
                  <Paperclip size={14} />
                  <span>rapport_mensuel.pdf (1.2 MB)</span>
                </div>
                
                <div className="quick-reply-box">
                  <textarea placeholder="Cliquez ici pour répondre rapidement..." />
                  <div className="quick-reply-actions">
                    <SmartButton variant="primary" onClick={() => alert('Réponse rapide envoyée.')} size="sm">
                      <Send size={16} /> Envoyer
                    </SmartButton>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="action-btn"><Plus size={16} /></button>
                      <button className="action-btn"><Zap size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="mail-viewer-empty">
              <div className="nexus-logo-bg">
                <Mail size={120} strokeWidth={0.5} opacity={0.1} />
              </div>
              <h2>Sélectionnez un message</h2>
              <p>Votre centre de communication unifié IPC.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {isComposing && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="compose-modal"
          >
            <div className="compose-header">
              <h3>Nouveau Message</h3>
              <button onClick={() => setIsComposing(false)}><X size={20} /></button>
            </div>
            <div className="compose-body">
              <input type="text" placeholder="À" className="compose-input" />
              <input type="text" placeholder="Sujet" className="compose-input" />
              <textarea placeholder="Écrivez votre message ici..." className="compose-textarea" />
            </div>
            <div className="compose-footer">
              <SmartButton variant="primary" onClick={() => { alert('Message envoyé avec succès via le Bridge IPC.'); setIsComposing(false); }} fullWidth>
                <Send size={18} /> Envoyer le message (Scellé)
              </SmartButton>
              <div className="compose-tools">
                <button className="tool-btn"><Paperclip size={18} /></button>
                <button className="tool-btn"><ShieldCheck size={18} /></button>
              </div>
            </div>
          </motion.div>
      {/* Attachment Preview Modal */}
      <AnimatePresence>
        {previewAttachment && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="setup-modal-overlay"
            onClick={() => setPreviewAttachment(null)}
            style={{ zIndex: 3000, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(20px)' }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass"
              onClick={e => e.stopPropagation()}
              style={{ width: '80%', height: '85%', borderRadius: '2.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--nexus-primary)', color: 'white' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'white' }}>{previewAttachment.name}</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>Scanné par Nexus Sentinel • Intégrité 100%</p>
                  </div>
                </div>
                <button onClick={() => setPreviewAttachment(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              <div style={{ flex: 1, background: 'white', margin: '1rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
                 <div className="nexus-glow" style={{ padding: '2rem', borderRadius: '50%', background: '#F1F5F9' }}>
                    <Mail size={64} color="#64748B" strokeWidth={1} />
                 </div>
                 <div style={{ textAlign: 'center' }}>
                    <h2 style={{ color: '#0F172A', fontWeight: 900 }}>Prévisualisation du Document</h2>
                    <p style={{ color: '#64748B', fontWeight: 600 }}>Le moteur de rendu PDF est en cours de chargement...</p>
                 </div>
                 <SmartButton variant="primary" onClick={() => window.open('#', '_blank')}>Ouvrir dans un nouvel onglet</SmartButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper components if needed
const FileText = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>;

export default MailTab;
