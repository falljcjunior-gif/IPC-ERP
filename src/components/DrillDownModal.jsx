import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import SafeResponsiveChart from './charts/SafeResponsiveChart';

const DrillDownModal = ({ isOpen, onClose, title, data, config }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} 
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass"
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            background: 'var(--bg)',
            borderRadius: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* Header */}
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Analyse Détaillée: {title}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Exploration des causes racines et métriques sous-jacentes</p>
            </div>
            <button onClick={onClose} className="glass" style={{ padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', border: 'none' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '2rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Context/Summary Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', gap: '1rem' }}>
                 <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                   <Filter size={16} /> Par Catégorie
                 </div>
                 <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                   <Search size={16} /> Rechercher
                 </div>
               </div>
               <button className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 600 }}>
                 <Download size={16} /> Exporter CSV
               </button>
            </div>

            {/* Visual Breakdown */}
            <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', height: '300px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Répartition Globale</h3>
              <SafeResponsiveChart minHeight={260} fallbackHeight={260}>
                <BarChart data={data?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.5rem', color: 'var(--text)' }}
                    itemStyle={{ color: 'var(--text)' }}
                  />
                  <Bar dataKey="val" fill={config?.color || "var(--accent)"} radius={[4, 4, 0, 0]} />
                </BarChart>
              </SafeResponsiveChart>
            </div>

            {/* Table Details */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Registres Source</h3>
              <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead style={{ background: 'var(--bg-subtle)' }}>
                     <tr>
                       {config?.columns?.map((col, idx) => (
                         <th key={idx} style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{col.label}</th>
                       ))}
                     </tr>
                  </thead>
                  <tbody>
                     {data?.tableData?.map((row, idx) => (
                       <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                         {config?.columns?.map((col, cIdx) => (
                           <td key={cIdx} style={{ padding: '1rem' }}>
                             {col.format ? col.format(row[col.key]) : row[col.key]}
                           </td>
                         ))}
                       </tr>
                     ))}
                     {(!data?.tableData || data.tableData.length === 0) && (
                       <tr>
                         <td colSpan={config?.columns?.length || 1} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                           Aucune donnée détaillée disponible.
                         </td>
                       </tr>
                     )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DrillDownModal;
