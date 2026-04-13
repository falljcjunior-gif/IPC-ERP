import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ArrowUpRight, ArrowDownLeft, Plus, Search, AlertTriangle,
  History, ChevronRight, Database, BarChart3, Truck, Zap, Activity,
  TrendingUp, TrendingDown, RefreshCcw, Target, MapPin, Clock,
  Star, CheckCircle2, XCircle, Filter, Download, BarChart2, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Cell, PieChart, Pie, LineChart, Line, ComposedChart, Area, AreaChart, Legend
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import KpiCard from '../components/KpiCard';
import { inventorySchema } from '../schemas/inventory.schema.js';

/* ─── Helpers ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

/* ════════════════════════════════════
   INVENTORY MODULE — Full Enterprise
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const Inventory = ({ onOpenDetail }) => {
  const { data, formatCurrency } = useBusiness();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'products', 'movements', 'warehouses'
  
  const { warehouses = [] } = data.inventory || {};
  const products = data.base?.catalog || [];

  /* ─── Computed KPIs (Dashboard only) ─── */
  const kpis = useMemo(() => {
    const enAlerte = products.filter(p => p.stock <= (p.alerte || 0));
    const valeurTotale = products.reduce((s, p) => s + (p.stock || 0) * ((p.prixMoyen || 0) * 0.6), 0);
    return { enAlerte, valeurTotale, otif: 94.2, serviceRate: 97.1 };
  }, [products]);

  /* ─── Dashboard Renderer ─── */
  const renderDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Valeur Stock" value={formatCurrency(kpis.valeurTotale, true)} icon={<Package size={20} />} color="#3B82F6" onClick={() => setView('products')} />
        <KpiCard title="OTIF" value={`${kpis.otif}%`} icon={<Target size={20} />} color="#10B981" />
        <KpiCard title="Taux de Service" value={`${kpis.serviceRate}%`} icon={<CheckCircle2 size={20} />} color="#8B5CF6" />
        <KpiCard title="Alertes Stock" value={kpis.enAlerte.length} icon={<AlertTriangle size={20} />} color="#EF4444" onClick={() => setView('products')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Rotation Mensuelle</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[{m:'Jan',v:78},{m:'Fév',v:82},{m:'Mar',v:85},{m:'Avr',v:81}]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="m" axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="v" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>État des Entrepôts</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {warehouses.map(wh => (
              <div key={wh.id} style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--bg-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{wh.nom}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{wh.taux}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '999px', overflow: 'hidden' }}>
                   <div style={{ width: `${wh.taux}%`, height: '100%', background: wh.taux > 80 ? '#EF4444' : '#10B981' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderWarehouses = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
      {warehouses.map(wh => (
        <div key={wh.id} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{wh.nom}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>{wh.lieu}</p>
            </div>
            <MapPin size={20} color="var(--accent)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
             <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '0.75rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Capacité</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{wh.capacite} m³</p>
             </div>
             <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '0.75rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Taux Occ.</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{wh.taux}%</p>
             </div>
          </div>
          <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
             <div style={{ width: `${wh.taux}%`, height: '100%', background: wh.taux > 80 ? '#EF4444' : '#3B82F6' }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Module Header Toolbar */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
             {[
               { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={16} /> },
               { id: 'products', label: 'Stocks', icon: <Package size={16} /> },
               { id: 'movements', label: 'Mouvements', icon: <History size={16} /> },
               { id: 'warehouses', label: 'Entrepôts', icon: <MapPin size={16} /> }
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
          ) : view === 'warehouses' ? (
             <motion.div key="warehouses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderWarehouses()}
             </motion.div>
          ) : (
             <motion.div key="records" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EnterpriseView 
                  moduleId="inventory"
                  modelId={view}
                  schema={inventorySchema}
                  onOpenDetail={onOpenDetail}
                />
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default Inventory;
