import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Palette, ShoppingBag, Store, Search, LayoutTemplate, Smartphone, Monitor, ShoppingCart, Package,
  MessageCircle, FileText, User, CreditCard, Send, CheckCircle2
} from 'lucide-react';
import { useStore } from '../../store';
import EnterpriseView from '../../components/EnterpriseView';
import { websiteSchema } from '../../schemas/website.schema';

const WebsiteHub = () => {
  const { data, updateRecord, addRecord, formatCurrency, addAccountingEntry, currentUser } = useStore();
  
  if (!data) return null;

  const [activeTab, setActiveTab] = useState('theme'); // 'theme', 'catalog', 'inbox'
  const [previewMode, setPreviewMode] = useState('desktop');
  const [portalTab, setPortalTab] = useState('catalog'); // 'catalog', 'account', 'support'

  // Local state for theme config to provide instant live-preview without complex Context updates
  // [AUDIT] Sécurité: Optional chaining et valeurs par défaut robustes
  const websiteData = data?.website || {};
  const [themeConfig, setThemeConfig] = useState(websiteData.config || {
    primaryColor: '#06B6D4',
    heroTitle: 'Bienvenue sur votre Espace B2B',
    heroSubtitle: 'Gérez vos commandes, factures et tickets support en ligne.',
    ctaLabel: 'Voir le Catalogue'
  });

  const products = (data?.inventory?.products || []).filter(p => p && p.nom);
  const publishedProducts = products.filter(p => p.isPublishedOnWeb);
  
  const [chatMessage, setChatMessage] = useState('');
  
  // [FIX] Sécurité renforcée pour les commandes client
  const clientOrders = (data?.sales?.orders || []).filter(o => 
    o && 
    o.client && 
    (String(o.client).includes('Web') || o.source === 'Website')
  );

  const handleThemeChange = (field, value) => {
    setThemeConfig(prev => ({ ...prev, [field]: value }));
  };

  const toggleProductPublish = (product) => {
     updateRecord('inventory', 'products', product.id, { 
        ...product, 
        isPublishedOnWeb: !product.isPublishedOnWeb, 
        webPrice: product.webPrice || (parseFloat(product.coutUnit || 0) * 1.3)
     });
  };

  const handleWebPriceChange = (product, newPrice) => {
     updateRecord('inventory', 'products', product.id, {
        ...product,
        webPrice: parseFloat(newPrice || 0)
     });
  };

  // --- LIVE PREVIEW FRONT-END ACTIONS ---
  const simulateCustomerBuy = (product) => {
     addRecord('sales', 'orders', {
        client: '🛒 Client Web (eCommerce)',
        produits: product.nom,
        montant: parseFloat(product.webPrice || 0),
        statut: 'Envoyé', // Waiting for payment
        priority: 'Haute',
        source: 'Website'
     });
     alert(`✅ Article ajouté à l'Espace Client. Allez dans "Mon Espace" pour payer la facture.`);
  };

  const simulateCustomerPay = (order) => {
      // 1. Mark order as paid
      updateRecord('sales', 'orders', order.id, { ...order, statut: 'Payé', datePaiement: new Date().toISOString() });
      
      // 2. Add an income trace in Finance
      addRecord('finance', 'incomes', {
         date: new Date().toISOString().split('T')[0],
         client: order.client,
         montant: order.montant,
         reference: `WEB-${order.id.substring(0,6).toUpperCase()}`,
         statut: 'Payé'
      });

      // 3. Generate double-entry accounting!
      // Debit 521100 (Banque) / Credit 411100 (Client)
      if (addAccountingEntry) {
         addAccountingEntry(
            { date: new Date().toISOString().split('T')[0], libelle: `Paiement Extranet B2B - ${order.client}`, piece: `EXT-${order.id.substring(0,4)}` },
            [
               { accountId: '521100', label: `Encaissement Facture ${order.id}`, debit: order.montant, credit: 0 },
               { accountId: '411100', label: `Solde compte client`, debit: 0, credit: order.montant }
            ]
         );
      }
      
      alert(`🎉 Paiement validé ! L'argent est arrivé en Finance et l'Écriture Comptable Bilan a été générée automatiquement !`);
  };

  const submitSupportTicket = () => {
      if(!chatMessage) return;
      addRecord('website', 'chats', {
         visiteur: 'Client Web (Connecté)',
         message: chatMessage,
         statut: 'Nouveau',
         date: new Date().toISOString()
      });
      setChatMessage('');
      alert('Message envoyé au support I.P.C.');
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2rem', padding: '1rem 2rem' }}>
      
      {/* LEFT PANEL : BACK-OFFICE CMS */}
      <div className="glass" style={{ borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
         {/* CMS Header */}
         <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Globe size={20} color="var(--accent)"/> Extranet B2B
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Gérez votre portail client et répondez au support.</p>
         </div>

         {/* CMS Tabs */}
         <div style={{ display: 'flex', padding: '1rem 1.5rem', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            <button 
               onClick={() => setActiveTab('theme')}
               className={`btn ${activeTab === 'theme' ? 'btn-primary' : ''}`} 
               style={{ flex: 1, padding: '0.5rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 800 }}
            >
               <Palette size={14} /> Thème
            </button>
            <button 
               onClick={() => setActiveTab('catalog')}
               className={`btn ${activeTab === 'catalog' ? 'btn-primary' : ''}`}
               style={{ flex: 1, padding: '0.5rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 800, background: activeTab === 'catalog' ? '#F59E0B' : 'transparent', color: activeTab === 'catalog' ? 'white' : 'var(--text)' }}
            >
               <Store size={14} /> Articles
            </button>
            <button 
               onClick={() => setActiveTab('inbox')}
               className={`btn ${activeTab === 'inbox' ? 'btn-primary' : ''}`}
               style={{ flex: 1, padding: '0.5rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 800, background: activeTab === 'inbox' ? '#8B5CF6' : 'transparent', color: activeTab === 'inbox' ? 'white' : 'var(--text)' }}
            >
               <MessageCircle size={14} /> Inbox
            </button>
         </div>

         {/* CMS Content Area */}
         <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
            <AnimatePresence mode="wait">
               {activeTab === 'theme' && (
                  <motion.div key="theme" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                     <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Titre Principal (Hero)</label>
                        <input type="text" className="form-control" value={themeConfig.heroTitle} onChange={(e) => handleThemeChange('heroTitle', e.target.value)} />
                     </div>
                     <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Sous-titre (Slogan)</label>
                        <textarea className="form-control" style={{ minHeight: '80px' }} value={themeConfig.heroSubtitle} onChange={(e) => handleThemeChange('heroSubtitle', e.target.value)} />
                     </div>
                     <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Couleur Primaire de la Marque</label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                           <input type="color" value={themeConfig.primaryColor} onChange={(e) => handleThemeChange('primaryColor', e.target.value)} style={{ width: '40px', height: '40px', borderRadius: '8px', border: 'none', cursor: 'pointer', padding: 0 }} />
                           <input type="text" className="form-control" value={themeConfig.primaryColor} onChange={(e) => handleThemeChange('primaryColor', e.target.value)} style={{ flex: 1 }} />
                        </div>
                     </div>
                  </motion.div>
               )}

               {activeTab === 'catalog' && (
                  <motion.div key="cat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                     <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Activez les articles de l'inventaire pour le portail B2B.</p>
                     
                     {products.map(p => (
                        <div key={p.id} className="glass" style={{ padding: '1rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: p.isPublishedOnWeb ? '1px solid #10B981' : '1px solid var(--border)' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                 <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{p.nom}</div>
                                 <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Coût int. : {formatCurrency(p.coutUnit || 0)}</div>
                              </div>
                              <button 
                                 onClick={() => toggleProductPublish(p)}
                                 className="btn"
                                 style={{ 
                                    background: p.isPublishedOnWeb ? '#10B981' : 'var(--bg)', 
                                    color: p.isPublishedOnWeb ? 'white' : 'var(--text-muted)',
                                    border: p.isPublishedOnWeb ? 'none' : '1px solid var(--border)',
                                    padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 700
                                 }}
                              >
                                 {p.isPublishedOnWeb ? 'Publié' : 'Hors-ligne'}
                              </button>
                           </div>
                           {p.isPublishedOnWeb && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem' }}>
                                 <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Prix B2C :</span>
                                 <input 
                                    type="number" 
                                    className="form-control"
                                    value={p.webPrice || 0}
                                    onChange={(e) => handleWebPriceChange(p, e.target.value)}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', flex: 1, minHeight: 'unset' }}
                                 />
                              </div>
                           )}
                        </div>
                     ))}
                  </motion.div>
               )}

               {activeTab === 'inbox' && (
                  <motion.div key="inbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                     <EnterpriseView 
                        moduleId="website" 
                        modelId="chats"
                        schema={websiteSchema}
                     />
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>

      {/* RIGHT PANEL : LIVE PORTAL PREVIEW */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
         {/* Preview Toolbar */}
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-card)', padding: '0.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                  <button onClick={() => setPreviewMode('desktop')} className="btn" style={{ padding: '0.4rem', borderRadius: '0.75rem', background: previewMode === 'desktop' ? 'var(--bg-subtle)' : 'transparent', color: previewMode === 'desktop' ? 'var(--text)' : 'var(--text-muted)' }}>
                     <Monitor size={16} />
                  </button>
                  <button onClick={() => setPreviewMode('mobile')} className="btn" style={{ padding: '0.4rem', borderRadius: '0.75rem', background: previewMode === 'mobile' ? 'var(--bg-subtle)' : 'transparent', color: previewMode === 'mobile' ? 'var(--text)' : 'var(--text-muted)' }}>
                     <Smartphone size={16} />
                  </button>
               </div>
               <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Aperçu Portail Client (Extranet)</span>
            </div>
         </div>

         {/* Preview Frame */}
         <div style={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: 'center', 
            background: 'repeating-linear-gradient(45deg, var(--bg-subtle), var(--bg-subtle) 10px, transparent 10px, transparent 20px)',
            borderRadius: '1.5rem', 
            overflow: 'hidden',
            padding: '2rem 1rem'
         }}>
            <motion.div 
               animate={{ width: previewMode === 'desktop' ? '100%' : '375px' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               style={{ 
                  background: '#F9FAFB', 
                  color: '#1F2937',
                  height: '100%', 
                  borderRadius: previewMode === 'mobile' ? '2.5rem' : '1rem',
                  border: previewMode === 'mobile' ? '8px solid #111827' : '1px solid var(--border)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column'
               }}
            >
               {/* PORTAL NAVIGATION */}
               <div style={{ background: '#FFFFFF', padding: '1rem', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 900, color: themeConfig.primaryColor, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>
                     I.P.C. <span style={{ color: '#111827' }}>Connect</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setPortalTab('catalog')} style={{ background: 'none', border: 'none', color: portalTab === 'catalog' ? themeConfig.primaryColor : '#6B7280', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>Catalogue</button>
                    <button onClick={() => setPortalTab('account')} style={{ background: 'none', border: 'none', color: portalTab === 'account' ? themeConfig.primaryColor : '#6B7280', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>Mon Espace</button>
                    <button onClick={() => setPortalTab('support')} style={{ background: 'none', border: 'none', color: portalTab === 'support' ? themeConfig.primaryColor : '#6B7280', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>Support</button>
                  </div>
               </div>

               <AnimatePresence mode="wait">
                  {portalTab === 'catalog' && (
                     <motion.div key="s_catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        {/* HERO SECTION */}
                        <div style={{ background: themeConfig.primaryColor, padding: previewMode === 'mobile' ? '3rem 1.5rem' : '4rem 3rem', textAlign: 'center', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                           <h1 style={{ fontSize: previewMode === 'mobile' ? '1.8rem' : '3rem', fontWeight: 900, letterSpacing: '-1px', margin: 0, lineHeight: 1.1 }}>
                              {themeConfig.heroTitle || 'Votre Titre'}
                           </h1>
                           <p style={{ margin: '1rem 0 2rem', fontSize: previewMode === 'mobile' ? '0.9rem' : '1.1rem', opacity: 0.9, maxWidth: '600px' }}>
                              {themeConfig.heroSubtitle || "Votre phrase d'accroche persuasive."}
                           </p>
                           <button onClick={() => setPortalTab('catalog')} style={{ background: '#FFFFFF', color: themeConfig.primaryColor, border: 'none', padding: '0.8rem 2rem', borderRadius: '3rem', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                              {themeConfig.ctaLabel || 'Action'}
                           </button>
                        </div>

                        {/* PRODUCTS GRID */}
                        <div style={{ padding: previewMode === 'mobile' ? '2rem 1.5rem' : '3rem', flex: 1 }}>
                           {publishedProducts.length === 0 ? (
                              <div style={{ textAlign: 'center', color: '#6B7280', padding: '3rem 0' }}>
                                 <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                                 <p>Aucun produit n'est actuellement publié.</p>
                              </div>
                           ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${previewMode === 'mobile' ? '140px' : '200px'}, 1fr))`, gap: '1.5rem' }}>
                                 {publishedProducts.map(p => (
                                    <div key={p.id} style={{ background: '#FFFFFF', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                       <div style={{ height: '120px', background: `${themeConfig.primaryColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <Package size={40} color={themeConfig.primaryColor} opacity={0.5} />
                                       </div>
                                       <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                          <div style={{ fontWeight: 800, fontSize: previewMode === 'mobile' ? '0.85rem' : '0.9rem', color: '#111827', marginBottom: '0.5rem' }}>{p.nom}</div>
                                          <div style={{ fontWeight: 900, color: themeConfig.primaryColor, fontSize: '1rem', marginTop: 'auto', marginBottom: '1rem' }}>
                                             {formatCurrency(p.webPrice || 0)}
                                          </div>
                                          <button 
                                             onClick={() => simulateCustomerBuy(p)}
                                             style={{ width: '100%', padding: '0.6rem', borderRadius: '0.5rem', background: '#111827', color: 'white', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}
                                          >
                                             <ShoppingCart size={14} /> Ajouter
                                          </button>
                                       </div>
                                    </div>
                                 ))}
                              </div>
                           )}
                        </div>
                     </motion.div>
                  )}

                  {portalTab === 'account' && (
                     <motion.div key="s_account" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: previewMode === 'mobile' ? '1.5rem' : '3rem', flex: 1, background: '#F3F4F6' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 1.5rem 0', color: '#111827' }}>Factures & Paiements</h2>
                        {clientOrders.length === 0 ? (
                           <div style={{ textAlign: 'center', padding: '3rem', background: '#FFFFFF', borderRadius: '1rem', border: '1px solid #E5E7EB' }}>
                              <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                              <div style={{ fontWeight: 800, color: '#374151' }}>Aucune facture en attente</div>
                              <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>Vos commandes s'afficheront ici.</div>
                           </div>
                        ) : (
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {clientOrders.map(Order => (
                                 <div key={Order.id} style={{ background: '#FFFFFF', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                       <div>
                                          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#111827', marginBottom: '4px' }}>{Order.produits}</div>
                                          <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 600 }}>Réf: #{Order.id.substring(0,8).toUpperCase()}</div>
                                       </div>
                                       <div style={{ fontWeight: 900, color: themeConfig.primaryColor, fontSize: '1.2rem' }}>
                                          {formatCurrency(Order.montant)}
                                       </div>
                                    </div>
                                    {Order.statut === 'Payé' ? (
                                       <div style={{ padding: '0.75rem', background: '#10B98115', color: '#10B981', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.85rem' }}>
                                          <CheckCircle2 size={16} /> Payé & Comptabilisé
                                       </div>
                                    ) : (
                                       <button 
                                          onClick={() => simulateCustomerPay(Order)}
                                          style={{ width: '100%', padding: '0.8rem', background: themeConfig.primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                       >
                                          <CreditCard size={16} /> Régler la facture maintenant
                                       </button>
                                    )}
                                 </div>
                              ))}
                           </div>
                        )}
                     </motion.div>
                  )}

                  {portalTab === 'support' && (
                     <motion.div key="s_support" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: previewMode === 'mobile' ? '1.5rem' : '3rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 1.5rem 0', color: '#111827' }}>Support Sécurisé</h2>
                        <div style={{ flex: 1, background: '#FFFFFF', borderRadius: '1rem', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                           <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '10px', height: '10px', background: '#10B981', borderRadius: '50%' }}></div>
                              <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Conseiller IPC en ligne</span>
                           </div>
                           <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              {data.website?.chats?.filter(c => c.visiteur === 'Client Web (Connecté)').map((chat, idx) => (
                                 <div key={idx} style={{ alignSelf: 'flex-end', background: themeConfig.primaryColor, color: 'white', padding: '0.75rem 1rem', borderRadius: '1rem 1rem 0 1rem', maxWidth: '80%', fontSize: '0.85rem' }}>
                                    {chat.message}
                                 </div>
                              ))}
                           </div>
                           <div style={{ padding: '1rem', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '0.5rem', background: '#F9FAFB' }}>
                              <input 
                                 type="text" 
                                 value={chatMessage}
                                 onChange={(e) => setChatMessage(e.target.value)}
                                 onKeyDown={(e) => e.key === 'Enter' && submitSupportTicket()}
                                 placeholder="Décrivez votre problème..." 
                                 style={{ flex: 1, padding: '0.75rem', borderRadius: '2rem', border: '1px solid #E5E7EB', outline: 'none', fontSize: '0.85rem' }} 
                              />
                              <button onClick={submitSupportTicket} style={{ width: '40px', height: '40px', borderRadius: '50%', background: themeConfig.primaryColor, color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                 <Send size={16} />
                              </button>
                           </div>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
               
               {/* FOOTER */}
               <div style={{ background: '#111827', color: '#9CA3AF', padding: '2rem', textAlign: 'center', fontSize: '0.85rem', marginTop: 'auto' }}>
                  © 2026 I.P.C. Industrial OS — Tous droits réservés.
               </div>
            </motion.div>
         </div>
      </div>
    </div>
  );
};

export default WebsiteHub;
