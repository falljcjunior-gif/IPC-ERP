import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, Palette, ShoppingBag, Store, Search, LayoutTemplate, Smartphone, Monitor, ShoppingCart
} from 'lucide-react';
import { useBusiness } from '../../BusinessContext';

const WebsiteHub = () => {
  const { data, updateRecord, addRecord, formatCurrency } = useBusiness();
  const [activeTab, setActiveTab] = useState('theme');
  const [previewMode, setPreviewMode] = useState('desktop');

  // Local state for theme config to provide instant live-preview without complex Context updates
  const [themeConfig, setThemeConfig] = useState(data.website?.config || {
    heroTitle: 'Bienvenue chez I.P.C.',
    heroSubtitle: 'Solutions et Produits B2B',
    ctaLabel: 'Découvrir',
    primaryColor: '#06B6D4'
  });

  const products = data.inventory?.products || [];
  const publishedProducts = products.filter(p => p.isPublishedOnWeb);

  const handleThemeChange = (field, value) => {
    setThemeConfig(prev => ({ ...prev, [field]: value }));
    // In a real database, we would debounce an API call here to save `website.config`
  };

  const toggleProductPublish = (product) => {
     updateRecord('inventory', 'products', product.id, { 
        ...product, 
        isPublishedOnWeb: !product.isPublishedOnWeb, 
        webPrice: product.webPrice || (parseFloat(product.coutUnit || 0) * 1.3) // 30% markup default
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
        statut: 'Brouillon',
        priority: 'Normale',
        source: 'Website'
     });
     alert(`🚀 BINGO ! Un client virtuel vient de créer un Devis pour [${product.nom}]. Vérifiez dans le module Ventes !`);
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'grid', gridTemplateColumns: '400px 1fr', gap: '2rem', padding: '1rem 2rem' }}>
      
      {/* LEFT PANEL : BACK-OFFICE CMS */}
      <div className="glass" style={{ borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
         {/* CMS Header */}
         <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <Globe size={20} color="var(--accent)"/> Web Studio
            </h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Gérez votre vitrine B2B & eCommerce en temps réel.</p>
         </div>

         {/* CMS Tabs */}
         <div style={{ display: 'flex', padding: '1rem 1.5rem', gap: '1rem', borderBottom: '1px solid var(--border)' }}>
            <button 
               onClick={() => setActiveTab('theme')}
               className={`btn ${activeTab === 'theme' ? 'btn-primary' : ''}`} 
               style={{ flex: 1, padding: '0.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
            >
               <Palette size={16} /> Thème
            </button>
            <button 
               onClick={() => setActiveTab('catalog')}
               className={`btn ${activeTab === 'catalog' ? 'btn-primary' : ''}`}
               style={{ flex: 1, padding: '0.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem', background: activeTab === 'catalog' ? '#F59E0B' : 'transparent', color: activeTab === 'catalog' ? 'white' : 'var(--text)' }}
            >
               <Store size={16} /> Catalogue
            </button>
         </div>

         {/* CMS Content Area */}
         <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
            {activeTab === 'theme' && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                     <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Titre Principal (Hero)</label>
                     <input type="text" className="form-control" value={themeConfig.heroTitle} onChange={(e) => handleThemeChange('heroTitle', e.target.value)} />
                  </div>
                  <div>
                     <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Sous-titre (Slogan)</label>
                     <textarea className="form-control" style={{ minHeight: '80px' }} value={themeConfig.heroSubtitle} onChange={(e) => handleThemeChange('heroSubtitle', e.target.value)} />
                  </div>
                  <div>
                     <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Texte du Bouton (CTA)</label>
                     <input type="text" className="form-control" value={themeConfig.ctaLabel} onChange={(e) => handleThemeChange('ctaLabel', e.target.value)} />
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
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Activez les articles de l'inventaire pour les rendre disponibles sur votre boutique en ligne.</p>
                  
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
         </div>
      </div>

      {/* RIGHT PANEL : LIVE PREVIEW */}
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
               <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Client Live Preview</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
               {/* Traffic dots simulation */}
               <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: '#10B98115', color: '#10B981', padding: '4px 10px', borderRadius: '2rem', fontWeight: 800 }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} /> 12 Visiteurs en ligne
               </span>
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
                  background: '#FFFFFF', 
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
               {/* PUBLIC WEBSITE HERO SECTION */}
               <div style={{ background: themeConfig.primaryColor, padding: previewMode === 'mobile' ? '3rem 1.5rem' : '5rem 3rem', textAlign: 'center', color: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h1 style={{ fontSize: previewMode === 'mobile' ? '2rem' : '3.5rem', fontWeight: 900, letterSpacing: '-1px', margin: 0, lineHeight: 1.1 }}>
                     {themeConfig.heroTitle || 'Votre Titre'}
                  </h1>
                  <p style={{ margin: '1.5rem 0 2rem', fontSize: previewMode === 'mobile' ? '1rem' : '1.25rem', opacity: 0.9, maxWidth: '600px' }}>
                     {themeConfig.heroSubtitle || 'Votre phrase d\'accroche persuasive.'}
                  </p>
                  <button style={{ background: '#FFFFFF', color: themeConfig.primaryColor, border: 'none', padding: '1rem 2.5rem', borderRadius: '3rem', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                     {themeConfig.ctaLabel || 'Action'}
                  </button>
               </div>

               {/* PUBLIC WEBSITE PRODUCTS GRID */}
               <div style={{ padding: previewMode === 'mobile' ? '2rem 1.5rem' : '4rem 3rem', background: '#F9FAFB', flex: 1 }}>
                  <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', color: '#111827' }}>Catalogue en ligne</h3>
                  
                  {publishedProducts.length === 0 ? (
                     <div style={{ textAlign: 'center', color: '#6B7280', padding: '3rem 0' }}>
                        <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                        <p>Aucun produit n'est actuellement publié sur la boutique.</p>
                     </div>
                  ) : (
                     <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${previewMode === 'mobile' ? '140px' : '220px'}, 1fr))`, gap: '1.5rem' }}>
                        {publishedProducts.map(p => (
                           <div key={p.id} style={{ background: '#FFFFFF', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                              <div style={{ height: '140px', background: `${themeConfig.primaryColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <Package size={48} color={themeConfig.primaryColor} opacity={0.5} />
                              </div>
                              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                 <div style={{ fontWeight: 800, fontSize: previewMode === 'mobile' ? '0.9rem' : '1rem', color: '#111827', marginBottom: '0.5rem' }}>{p.nom}</div>
                                 <div style={{ fontWeight: 900, color: themeConfig.primaryColor, fontSize: '1.1rem', marginTop: 'auto', marginBottom: '1rem' }}>
                                    {formatCurrency(p.webPrice || 0)}
                                 </div>
                                 <button 
                                    onClick={() => simulateCustomerBuy(p)}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '0.75rem', background: '#111827', color: 'white', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                 >
                                    <ShoppingCart size={16} /> Acheter
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
               
               {/* FOOTER */}
               <div style={{ background: '#111827', color: '#9CA3AF', padding: '2rem', textAlign: 'center', fontSize: '0.85rem' }}>
                  © 2026 I.P.C. Industrial OS — Tous droits réservés.
               </div>
            </motion.div>
         </div>
      </div>
    </div>
  );
};

export default WebsiteHub;
