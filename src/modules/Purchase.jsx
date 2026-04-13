import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Truck, Plus, ChevronRight, Building2, DollarSign,
  Star, AlertTriangle, CheckCircle2, Clock, BarChart3, Zap,
  TrendingUp, TrendingDown, Filter, FileText, Scale, Target,
  ArrowUpRight, Activity, RefreshCcw, BarChart2
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import KpiCard from '../components/KpiCard';
import { purchaseSchema } from '../schemas/purchase.schema.js';

/* ─── Helpers ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const scoreColor = (s) => s >= 80 ? '#10B981' : s >= 60 ? '#F59E0B' : '#EF4444';

/* ════════════════════════════════════
   PURCHASE MODULE — Full Enterprise
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const Purchase = ({ onOpenDetail }) => {
  const { data, formatCurrency } = useBusiness();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'vendors', 'orders'

  const { orders = [] } = data.purchase || {};
  const vendors = useMemo(() => (data.base?.contacts || []).filter(c => c.type === 'Fournisseur'), [data.base?.contacts]);

  /* ─── Computed KPIs ─── */
  const kpis = useMemo(() => {
    const totalDepenses = orders.reduce((s, o) => s + (o.total || 0), 0);
    const enAttente = orders.filter(o => o.statut === 'Commandé').length;
    const avgScore = 84; // Dummy for scorecard
    return { totalDepenses, enAttente, avgScore };
  }, [orders]);

  /* ─── Dashboard Renderer ─── */
  const renderDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Dépenses Totales" value={formatCurrency(kpis.totalDepenses, true)} icon={<DollarSign size={20}/>} color="#3B82F6" />
        <KpiCard title="Score Fournisseurs" value={`${kpis.avgScore}/100`} icon={<Star size={20}/>} color="#F59E0B" />
        <KpiCard title="Livraisons en Attente" value={kpis.enAttente} icon={<Truck size={20}/>} color="#EF4444" />
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
         <h3 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Approvisionnement Stratégique</h3>
         <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Le moteur Achats IPC centralise vos demandes d'approbation et automatise les relances fournisseurs. Gérez vos contrats et vos conditions de paiement en un clic.</p>
               <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn glass"><Scale size={16} /> Comparatif Offres</button>
                  <button className="btn btn-primary"><Plus size={16} /> Demande d'Achat</button>
               </div>
            </div>
            <div style={{ background: 'var(--bg-subtle)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
               <Zap size={32} color="#F59E0B" style={{ marginBottom: '0.5rem' }} />
               <div style={{ fontWeight: 800 }}>Délai Moyen</div>
               <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>4.2 Jours</div>
            </div>
         </div>
      </div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Module Header Toolbar */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
             {[
               { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={16} /> },
               { id: 'vendors', label: 'Fournisseurs', icon: <Star size={16} /> },
               { id: 'orders', label: 'Bons de Commande', icon: <ShoppingBag size={16} /> }
             ].map(t => (
               <button
                 key={t.id}
                 onClick={() => setView(t.id)}
                 style={{
                   padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                   background: view === t.id ? 'var(--bg)' : 'transparent',
                   color: view === t.id ? 'var(--accent)' : 'var(--text-muted)',
                   fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px',
                   boxShadow: view === t.id ? 'var(--shadow-sm)' : 'none'
                 }}
               >
                 {t.icon} {t.label}
               </button>
             ))}
          </div>
       </div>

       <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
             <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderDashboard()}
             </motion.div>
          ) : (
             <motion.div key="records" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EnterpriseView 
                  moduleId="purchase" 
                  modelId={view}
                  schema={purchaseSchema}
                  onOpenDetail={onOpenDetail}
                />
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default Purchase;
