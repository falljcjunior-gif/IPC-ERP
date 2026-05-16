import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Landmark, Clock, CheckCircle2, 
  Plus, Search, Filter, Download, MoreVertical,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  Mail, Phone, Send
} from 'lucide-react';
import EnterpriseView from '../../../components/EnterpriseView';
import { financeSchema } from '../../../schemas/finance.schema';
import Chip from '../../marketing/components/Chip';
import { useStore } from '../../../store';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const InvoicingTab = ({ onOpenDetail, formatCurrency }) => {
  const { data } = useStore();
  const [activeView, setActiveView] = useState('invoices'); // 'invoices', 'vendor_bills'

  const handleExportJournal = () => {
    const invoices = data?.finance?.invoices || [];
    if (invoices.length === 0) { alert('Aucune facture à exporter.'); return; }
    const header_csv = ['N° Facture', 'Client', 'Date', 'Échéance', 'Montant TTC', 'Statut'].join(';');
    const rows = invoices.map(inv => [
      inv.number || inv.id || '—',
      `"${inv.clientName || inv.client || '—'}"`,
      inv.date || inv.createdAt?.slice(0, 10) || '—',
      inv.dueDate || '—',
      Number(inv.amountTTC || inv.totalTTC || inv.montant || 0).toFixed(0),
      inv.status || inv.statut || '—',
    ].join(';'));
    const csv = [header_csv, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-factures-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Financial Operations KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
         <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '1.75rem', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Recevables (AR)</div>
               <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{formatCurrency && formatCurrency(0)}</div>
               <div style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 800, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> 0 Facture en retard
               </div>
            </div>
            <div style={{ background: '#F59E0B15', padding: '16px', borderRadius: '1.25rem', color: '#F59E0B' }}>
               <ArrowUpRight size={28} />
            </div>
         </motion.div>

         <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '1.75rem', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Payables (AP)</div>
               <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{formatCurrency && formatCurrency(0)}</div>
               <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 800, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Flux de trésorerie neutre
               </div>
            </div>
            <div style={{ background: '#6366F115', padding: '16px', borderRadius: '1.25rem', color: '#6366F1' }}>
               <ArrowDownLeft size={28} />
            </div>
         </motion.div>
      </div>

      {/* List Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div className="glass" style={{ display: 'flex', padding: '0.4rem', borderRadius: '1rem', background: 'var(--bg-subtle)' }}>
           {[
             { id: 'invoices', label: 'Ventes (Clients)', icon: <FileText size={14} /> },
             { id: 'vendor_bills', label: 'Achats (Fournisseurs)', icon: <Landmark size={14} /> },
           ].map(t => (
             <button
               key={t.id}
               onClick={() => setActiveView(t.id)}
               style={{
                 padding: '0.6rem 1.5rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
                 background: activeView === t.id ? 'var(--bg)' : 'transparent',
                 color: activeView === t.id ? '#6366F1' : 'var(--text-muted)',
                 fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.8rem',
                 boxShadow: activeView === t.id ? 'var(--shadow-sm)' : 'none', transition: '0.2s'
               }}
             >
               {t.icon} {t.label}
             </button>
           ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
           <button className="glass" onClick={handleExportJournal} style={{ padding: '0.7rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', border: '1px solid var(--border)' }}>
             <Download size={18} /> Export Journal
           </button>
           <button 
             onClick={() => onOpenDetail && onOpenDetail(null, 'finance', 'invoices')}
             className="btn-primary" style={{ padding: '0.7rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: '#6366F1', borderColor: '#6366F1' }}>
             <Plus size={20} /> Nouvelle Facture
           </button>
        </div>
      </div>

      {/* Invoicing List */}
      <motion.div variants={item}>
         <EnterpriseView 
            moduleId="finance" 
            modelId={activeView}
            schema={financeSchema}
            onOpenDetail={onOpenDetail}
         />
      </motion.div>
    </motion.div>
  );
};

export default InvoicingTab;
