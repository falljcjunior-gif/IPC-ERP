import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, UtensilsCrossed, Trash2, Plus, Minus, CreditCard, Receipt, HandCoins, UserX } from 'lucide-react';
import { useStore } from '../../store';

const CommerceHub = () => {
  const [activeTab, setActiveTab] = useState('pos_boutique');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState('Passager');
  const { data, processPOSOrder, shellView } = useStore();

  const inventory = useMemo(() => data?.inventory?.products || [], [data]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const decreaseQty = (id) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.qty > 1) return { ...item, qty: item.qty - 1 };
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.pu * item.qty), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (processPOSOrder) {
      processPOSOrder({ cart, customer, totalAmount, type: activeTab });
    }
    setCart([]);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: shellView?.mobile ? '1fr' : 'minmax(0, 2fr) 450px', height: '100%', gap: '1px', background: 'var(--nexus-border)' }}>
      
      {/* LEFT: PRODUCTS GRID STUDIO */}
      <div style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* POS Header */}
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--nexus-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
          <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '6px', borderRadius: '8px' }}>
                   <Store size={14} color="white" />
                </div>
                <span style={{ fontWeight: 900, fontSize: '0.65rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>Nexus Retail Core</span>
             </div>
             <h1 className="nexus-gradient-text" style={{ fontSize: '2rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px' }}>
                Commerce Studio
             </h1>
          </div>
          <div className="nexus-card" style={{ padding: '0.5rem', borderRadius: '1rem', display: 'flex', background: 'var(--bg-subtle)' }}>
             <button onClick={() => setActiveTab('pos_boutique')} className="btn" style={{ background: activeTab === 'pos_boutique' ? 'white' : 'transparent', color: activeTab === 'pos_boutique' ? 'var(--nexus-primary)' : 'var(--nexus-text-muted)', padding: '0.6rem 1.2rem', display:'flex', gap:'8px', borderRadius: '0.75rem', boxShadow: activeTab === 'pos_boutique' ? 'var(--shadow-sm)' : 'none', fontWeight: 800 }}><Store size={16}/> Boutique</button>
             <button onClick={() => setActiveTab('pos_restaurant')} className="btn" style={{ background: activeTab === 'pos_restaurant' ? 'white' : 'transparent', color: activeTab === 'pos_restaurant' ? 'var(--nexus-primary)' : 'var(--nexus-text-muted)', padding: '0.6rem 1.2rem', display:'flex', gap:'8px', borderRadius: '0.75rem', boxShadow: activeTab === 'pos_restaurant' ? 'var(--shadow-sm)' : 'none', fontWeight: 800 }}><UtensilsCrossed size={16}/> Resto</button>
          </div>
        </div>

        {/* Internal Grid Layout */}
        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '1.5rem', alignContent: 'start' }}>
          {inventory.map((prod, idx) => (
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => addToCart(prod)}
              key={idx}
              className="nexus-card"
              style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'white', position: 'relative' }}
            >
              {prod.qte <= 5 && (
                 <div className="nexus-glow" style={{ position: 'absolute', top: '12px', right: '12px', background: '#EF4444', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 900 }}>
                    LOW STOCK: {prod.qte}
                 </div>
              )}
              <div style={{ fontWeight: 900, fontSize: '1.1rem', lineHeight: '1.2', color: 'var(--nexus-secondary)', letterSpacing: '-0.5px' }}>{prod.nom}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--nexus-text-muted)', fontWeight: 600 }}>{prod.categorie || 'Standard'} • {prod.um || 'Unité'}</div>
              <div style={{ marginTop: 'auto', fontWeight: 900, fontSize: '1.4rem', color: 'var(--nexus-primary)', letterSpacing: '-1px' }}>
                {prod.pu ? prod.pu.toLocaleString('fr-FR') : 0} <span style={{ fontSize:'0.8rem', fontWeight: 700 }}>FCFA</span>
              </div>
            </motion.div>
          ))}
          {inventory.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color:'var(--nexus-text-muted)', fontWeight: 600 }}>
               L'inventaire Nexus est actuellement vide ou en cours de synchronisation...
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: TICKET / CAISSE RECAP */}
      <div style={{ background: 'var(--bg-subtle)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--nexus-border)', position: 'relative' }}>
         <div style={{ padding: '2rem', borderBottom: '1px solid var(--nexus-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'white' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--nexus-secondary)' }}><Receipt size={22} color="var(--nexus-primary)" /> Flux Transactionnel</h2>
            <div className="nexus-card" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-subtle)', border: 'none' }}>
               <UserX size={18} color="var(--nexus-text-muted)" />
               <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Identifier un client..." style={{ border: 'none', background: 'transparent', flex: 1, outline: 'none', color: 'var(--nexus-secondary)', fontSize: '0.95rem', fontWeight: 700 }} />
            </div>
         </div>

         {/* Cart Lines */}
         <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <AnimatePresence>
               {cart.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--nexus-text-muted)', textAlign: 'center', margin: 'auto 0', fontSize: '1rem', fontWeight: 500, lineHeight: 1.6 }}>
                     Sélectionnez des actifs numériques ou physiques<br/>pour initialiser le flux de revenus.
                  </motion.div>
               )}
               {cart.map(item => (
                  <motion.div 
                     initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                     key={item.id} 
                     className="nexus-card"
                     style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', background: 'white' }}
                  >
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                           <span style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--nexus-secondary)' }}>{item.nom}</span>
                           <span style={{ color: 'var(--nexus-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>{item.pu.toLocaleString()} FCFA / {item.um}</span>
                        </div>
                        <span style={{ color: 'var(--nexus-primary)', fontWeight: 900, fontSize: '1.1rem' }}>{(item.pu * item.qty).toLocaleString()} FCFA</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '12px' }}>
                           <button onClick={() => decreaseQty(item.id)} className="btn-icon btn-sm" style={{ background: 'white', borderRadius: '8px' }}><Minus size={14} /></button>
                           <span style={{ fontWeight: 900, width: '30px', textAlign: 'center', fontSize: '1rem' }}>{item.qty}</span>
                           <button onClick={() => addToCart(item)} className="btn-icon btn-sm" style={{ background: 'white', borderRadius: '8px' }}><Plus size={14} /></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="btn-icon btn-sm" style={{ background: '#EF444410', color: '#EF4444' }}><Trash2 size={16} /></button>
                     </div>
                  </motion.div>
               ))}
            </AnimatePresence>
         </div>

         {/* Checkout Actions */}
         <div style={{ padding: '2.5rem', borderTop: '1px solid var(--nexus-border)', background: 'white', boxShadow: '0 -10px 40px rgba(15, 23, 42, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
               <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--nexus-text-muted)' }}>TOTAL TRANSACTION</span>
               <span style={{ color: 'var(--nexus-secondary)', fontSize: '2rem', fontWeight: 900, letterSpacing: '-1px' }}>{totalAmount.toLocaleString('fr-FR')} <span style={{ fontSize: '1rem' }}>FCFA</span></span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <button disabled={cart.length === 0} onClick={handleCheckout} className="nexus-card" style={{ padding: '1.25rem', background: 'var(--nexus-primary)', color: 'white', border: 'none', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', opacity: cart.length === 0 ? 0.5 : 1 }}>
                  <HandCoins size={20} /> ESPÈCES
               </button>
               <button disabled={cart.length === 0} onClick={handleCheckout} className="nexus-card" style={{ padding: '1.25rem', background: 'var(--nexus-secondary)', color: 'white', border: 'none', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', opacity: cart.length === 0 ? 0.5 : 1 }}>
                  <CreditCard size={20} /> CARTE / TPE
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CommerceHub;
