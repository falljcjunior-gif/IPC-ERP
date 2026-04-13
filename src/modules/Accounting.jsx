import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, CreditCard, PieChart, Plus, Search, Download, ChevronRight,
  TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3, Zap,
  Clock, AlertTriangle, CheckCircle2, Target, RefreshCcw, Building2,
  Activity, ArrowUpRight, ArrowDownLeft, Scale, Layers, ListFilter,
  BookOpen, Calculator, Landmark, BookCopy, FileCheck, BarChart2
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import KpiCard from '../components/KpiCard';
import { accountingSchema } from '../schemas/accounting.schema.js';

/* ─── Helpers ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

/* ════════════════════════════════════
   ACCOUNTING MODULE — Full Enterprise
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const Accounting = ({ onOpenDetail }) => {
  const { data, formatCurrency, addAccountingEntry, journals = [] } = useBusiness();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'accounts', 'entries', 'saisie'
  const [activeJournal, setActiveJournal] = useState('J-VT');

  /* ─── Saisie Grid State (Custom logic kept) ─── */
  const [saisieLines, setSaisieLines] = useState([
    { accountId: '', label: '', debit: 0, credit: 0 },
    { accountId: '', label: '', debit: 0, credit: 0 }
  ]);
  const [saisieHeader, setSaisieHeader] = useState({ libelle: '', date: new Date().toISOString().split('T')[0], piece: '' });

  const handleSaveSaisie = () => {
    const success = addAccountingEntry({ 
      ...saisieHeader, 
      journalId: activeJournal 
    }, saisieLines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0)));

    if (success) {
      setSaisieLines([{ accountId: '', label: '', debit: 0, credit: 0 }, { accountId: '', label: '', debit: 0, credit: 0 }]);
      setSaisieHeader({ libelle: '', date: new Date().toISOString().split('T')[0], piece: '' });
      setView('entries');
    }
  };

  /* ─── Dashboard Renderer ─── */
  const renderDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Résultat Net" value={formatCurrency(12450000, true)} icon={<Calculator size={20} />} color="#3B82F6" />
        <KpiCard title="Chiffre d'Affaires" value={formatCurrency(45000000, true)} icon={<TrendingUp size={20} />} color="#10B981" />
        <KpiCard title="Charges Totales" value={formatCurrency(32550000, true)} icon={<TrendingDown size={20} />} color="#EF4444" />
        <KpiCard title="Écritures YTD" value="1,248" icon={<FileCheck size={20} />} color="#8B5CF6" />
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', background: 'var(--bg-subtle)' }}>
         <Scale size={48} color="var(--accent)" />
         <h3 style={{ fontWeight: 800 }}>Balance de Vérification Automatisée</h3>
         <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Utilisez le pôle Plan de Comptes pour consulter vos soldes en temps réel.</p>
         <button className="btn btn-primary" onClick={() => setView('accounts')}>Ouvrir le Plan de Comptes</button>
      </div>
    </motion.div>
  );

  const renderSaisie = () => (
    <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
       <h3 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Grille de Saisie Directe</h3>
       <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <input type="date" value={saisieHeader.date} onChange={e => setSaisieHeader({...saisieHeader, date: e.target.value})} className="input-field" />
          <input type="text" placeholder="Libellé de l'écriture" value={saisieHeader.libelle} onChange={e => setSaisieHeader({...saisieHeader, libelle: e.target.value})} className="input-field" />
          <input type="text" placeholder="N° Pièce" value={saisieHeader.piece} onChange={e => setSaisieHeader({...saisieHeader, piece: e.target.value})} className="input-field" />
       </div>
       <table style={{ width: '100%', marginBottom: '2rem' }}>
          <thead>
             <tr style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <th>Compte</th><th>Libellé Ligne</th><th>Débit</th><th>Crédit</th>
             </tr>
          </thead>
          <tbody>
             {saisieLines.map((line, i) => (
                <tr key={i}>
                   <td><input value={line.accountId} onChange={e => {
                      const newLines = [...saisieLines];
                      newLines[i].accountId = e.target.value;
                      setSaisieLines(newLines);
                   }} className="input-field" /></td>
                   <td><input value={line.label} onChange={e => {
                      const newLines = [...saisieLines];
                      newLines[i].label = e.target.value;
                      setSaisieLines(newLines);
                   }} className="input-field" /></td>
                   <td><input type="number" value={line.debit} onChange={e => {
                      const newLines = [...saisieLines];
                      newLines[i].debit = parseFloat(e.target.value);
                      setSaisieLines(newLines);
                   }} className="input-field" /></td>
                   <td><input type="number" value={line.credit} onChange={e => {
                      const newLines = [...saisieLines];
                      newLines[i].credit = parseFloat(e.target.value);
                      setSaisieLines(newLines);
                   }} className="input-field" /></td>
                </tr>
             ))}
          </tbody>
       </table>
       <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn glass" onClick={() => setSaisieLines([...saisieLines, { accountId: '', label: '', debit: 0, credit: 0 }])}>+ Ligne</button>
          <button className="btn btn-primary" onClick={handleSaveSaisie}>Valider l'Écriture</button>
       </div>
    </div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Module Header Toolbar */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
             {[
               { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={16} /> },
               { id: 'accounts', label: 'Plan de Comptes', icon: <ListFilter size={16} /> },
               { id: 'entries', label: 'Grand Livre', icon: <BookOpen size={16} /> },
               { id: 'saisie', label: 'Saisie Journal', icon: <BookCopy size={16} /> }
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
          ) : view === 'saisie' ? (
             <motion.div key="saisie" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderSaisie()}
             </motion.div>
          ) : (
             <motion.div key="records" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EnterpriseView 
                  moduleId="finance" 
                  modelId={view === 'accounts' ? 'accounts' : 'entries'}
                  schema={accountingSchema}
                  onOpenDetail={onOpenDetail}
                />
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default Accounting;
