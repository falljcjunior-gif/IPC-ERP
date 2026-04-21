import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, UtensilsCrossed, Trash2, Plus, Minus, CreditCard, Receipt, HandCoins, UserX } from 'lucide-react';
import { useBusiness } from '../../BusinessContext';

const CommerceHub = () => {
  const [activeTab, setActiveTab] = useState('pos_boutique');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState('Passager');
  const { data, processPOSOrder } = useBusiness();

  // Using inventory products, filtering out those with no stock if needed, or just all.
  const inventory = useMemo(() => data?.inventory?.products || [], [data]);

  // Helper to add item to cart
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
    } else {
      // Fallback if processPOSOrder isn't implemented yet
      console.log('Checkout:', { cart, customer, totalAmount });
    }
    setCart([]); // Clear cart
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 400px', height: '100%', gap: '1px', background: 'var(--border)' }}>
      
      {/* LEFT: PRODUCTS GRID STUDIO */}
      <div style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        {/* POS Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
             <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Store size={22} color="var(--accent)" /> IPC Point de Vente
             </h1>
             <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Caisse Rapide & Tactile</div>
          </div>
          <div className="glass" style={{ padding: '0.35rem', borderRadius: '0.8rem', display: 'flex' }}>
             <button onClick={() => setActiveTab('pos_boutique')} className="btn" style={{ background: activeTab === 'pos_boutique' ? 'var(--bg)' : 'transparent', color: activeTab === 'pos_boutique' ? 'var(--accent)' : 'var(--text-muted)', padding: '0.5rem 1rem', display:'flex', gap:'6px' }}><Store size={15}/> Boutique</button>
             <button onClick={() => setActiveTab('pos_restaurant')} className="btn" style={{ background: activeTab === 'pos_restaurant' ? 'var(--bg)' : 'transparent', color: activeTab === 'pos_restaurant' ? 'var(--accent)' : 'var(--text-muted)', padding: '0.5rem 1rem', display:'flex', gap:'6px' }}><UtensilsCrossed size={15}/> Restauration</button>
          </div>
        </div>

        {/* Internal Grid Layout */}
        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: '1.25rem', alignContent: 'start' }}>
          {inventory.map((prod, idx) => (
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addToCart(prod)}
              key={idx}
              className="glass"
              style={{ padding: '1.25rem', borderRadius: '1rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--border)', position: 'relative' }}
            >
              {prod.qte <= 5 && (
                 <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#EF4444', color: 'white', padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>
                    Stock: {prod.qte}
                 </div>
              )}
              <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: '1.2', color: 'var(--text)' }}>{prod.nom}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prod.categorie || 'Standard'} • {prod.um || 'Unité'}</div>
              <div style={{ marginTop: 'auto', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>
                {prod.pu ? prod.pu.toLocaleString('fr-FR') : 0} <span style={{ fontSize:'0.75rem' }}>FCFA</span>
              </div>
            </motion.div>
          ))}
          {inventory.length === 0 && <div style={{ color:'var(--text-muted)' }}>Aucun produit en stock ou inventaire vide..</div>}
        </div>
      </div>

      {/* RIGHT: TICKET / CAISSE RECAP */}
      <div style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)' }}>
         <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Receipt size={18} /> Ticket Électronique</h2>
            <div className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <UserX size={16} color="var(--text-muted)" />
               <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Nom du client (optionnel)" style={{ border: 'none', background: 'transparent', flex: 1, outline: 'none', color: 'var(--text)', fontSize: '0.9rem', fontWeight: 600 }} />
            </div>
         </div>

         {/* Cart Lines */}
         <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AnimatePresence>
               {cart.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--text-muted)', textAlign: 'center', margin: 'auto 0', fontSize: '0.95rem' }}>
                     Scannez ou cliquez sur un article pour l'ajouter au ticket.
                  </motion.div>
               )}
               {cart.map(item => (
                  <motion.div 
                     initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                     key={item.id} 
                     style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: '1px dashed var(--border)', paddingBottom: '1rem' }}
                  >
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem' }}>
                        <span>{item.nom}</span>
                        <span style={{ color: 'var(--accent)' }}>{(item.pu * item.qty).toLocaleString()} FCFA</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.pu.toLocaleString()} FCFA / {item.um}</span>
                        <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', padding: '0.2rem' }}>
                           <button onClick={() => decreaseQty(item.id)} className="btn" style={{ background: 'transparent', padding: '0.3rem' }}><Minus size={12} /></button>
                           <span style={{ fontWeight: 700, width: '20px', textAlign: 'center', fontSize: '0.85rem' }}>{item.qty}</span>
                           <button onClick={() => addToCart(item)} className="btn" style={{ background: 'transparent', padding: '0.3rem' }}><Plus size={12} /></button>
                           <button onClick={() => removeFromCart(item.id)} className="btn" style={{ background: '#EF444415', color: '#EF4444', padding: '0.3rem', marginLeft: '0.5rem', borderRadius: '0.4rem' }}><Trash2 size={12} /></button>
                        </div>
                     </div>
                  </motion.div>
               ))}
            </AnimatePresence>
         </div>

         {/* Checkout Actions */}
         <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>
               <span>TOTAL à Payer</span>
               <span style={{ color: 'var(--accent)' }}>{totalAmount.toLocaleString('fr-FR')} FCFA</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
               <button disabled={cart.length === 0} onClick={handleCheckout} className="btn" style={{ padding: '1rem', background: 'var(--accent)', color: 'white', borderRadius: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: cart.length === 0 ? 0.5 : 1 }}>
                  <HandCoins size={18} /> Espèces
               </button>
               <button disabled={cart.length === 0} onClick={handleCheckout} className="btn" style={{ padding: '1rem', background: '#10B981', color: 'white', borderRadius: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: cart.length === 0 ? 0.5 : 1 }}>
                  <CreditCard size={18} /> Carte / TPE
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default CommerceHub;
