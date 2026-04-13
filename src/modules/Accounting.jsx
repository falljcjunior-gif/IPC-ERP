import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, CreditCard, PieChart, Plus, Search, Download, ChevronRight,
  TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3, Zap,
  Clock, AlertTriangle, CheckCircle2, Target, RefreshCcw, Building2,
  Activity, ArrowUpRight, ArrowDownLeft, Scale, Layers, ListFilter,
  BookOpen, Calculator, Landmark, BookCopy, FileCheck
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, Tooltip, CartesianGrid, Line, Legend, Cell,
  PieChart as RechartsPie, Pie, ReferenceLine
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';

/* ─── Helpers ─── */
const fadeIn = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

const Chip = ({ label, color = '#64748B' }) => (
  <span style={{ padding: '2px 9px', borderRadius: '999px', background: `${color}10`, border: `1px solid ${color}30`, color, fontSize: '0.68rem', fontWeight: 700 }}>{label}</span>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '1rem', border: '1px solid var(--border)', gap: '0.2rem', width: 'fit-content', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: '0.5rem 1.1rem', borderRadius: '0.8rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', background: active === t.id ? 'var(--bg)' : 'transparent', color: active === t.id ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', boxShadow: active === t.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

const SectionHeader = ({ icon, title, subtitle, actions }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '0.25rem' }}>
        {icon} <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{subtitle}</span>
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{title}</h2>
    </div>
    <div style={{ display: 'flex', gap: '0.75rem' }}>{actions}</div>
  </div>
);

/* ════════════════════════════════════
   ACCOUNTING MODULE — Sage Edition
   Empowering Finance with Precision
   ════════════════════════════════════ */
const Accounting = ({ onOpenDetail }) => {
  const { data, addRecord, updateRecord, formatCurrency, addAccountingEntry } = useBusiness();
  const [tab, setTab] = useState('dashboard');
  const [activeJournal, setActiveJournal] = useState('J-VT');
  const [modal, setModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { finance = {} } = data;
  const { accounts = [], journals = [], entries = [], lines = [], invoices = [] } = finance;

  /* ─── Saisie Grille State ─── */
  const [saisieLines, setSaisieLines] = useState([
    { accountId: '', label: '', debit: 0, credit: 0 },
    { accountId: '', label: '', debit: 0, credit: 0 }
  ]);
  const [saisieHeader, setSaisieHeader] = useState({ libelle: '', date: new Date().toISOString().split('T')[0], piece: '' });

  /* ─── Calculations ─── */
  const balance = useMemo(() => {
    const map = {};
    accounts.forEach(acc => { map[acc.code] = { ...acc, debit: 0, credit: 0, solde: 0 } });
    lines.forEach(line => {
      if (map[line.accountId]) {
        map[line.accountId].debit += parseFloat(line.debit || 0);
        map[line.accountId].credit += parseFloat(line.credit || 0);
      }
    });
    Object.keys(map).forEach(k => {
      map[k].solde = map[k].debit - map[k].credit;
    });
    return Object.values(map).sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts, lines]);

  const kpis = useMemo(() => {
    const totalVentes = lines.filter(l => l.accountId.startsWith('7')).reduce((s, l) => s + parseFloat(l.credit), 0);
    const totalCharges = lines.filter(l => l.accountId.startsWith('6')).reduce((s, l) => s + parseFloat(l.debit), 0);
    const result = totalVentes - totalCharges;
    const treasury = balance.filter(a => a.code.startsWith('5')).reduce((s, a) => s + a.solde, 0);
    return { result, totalVentes, totalCharges, treasury };
  }, [balance, lines]);

  /* ─── Action Handlers ─── */
  const handleSaveSaisie = () => {
    const success = addAccountingEntry({ 
      ...saisieHeader, 
      journalId: activeJournal 
    }, saisieLines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0)));

    if (success) {
      setSaisieLines([{ accountId: '', label: '', debit: 0, credit: 0 }, { accountId: '', label: '', debit: 0, credit: 0 }]);
      setSaisieHeader({ libelle: '', date: new Date().toISOString().split('T')[0], piece: '' });
    }
  };

  /* ═══════════ RENDERERS ═══════════ */

  // 1. DASHBOARD
  const renderDashboard = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <SectionHeader icon={<TrendingUp size={16}/>} title="Pilotage Financier" subtitle="Performance en temps réel" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Résultat Net" value={formatCurrency(kpis.result, true)} icon={<Target size={20}/>} color={kpis.result >= 0 ? "#10B981" : "#EF4444"} trend={0} trendType="up" sparklineData={[]} />
        <KpiCard title="Chiffre d'Affaires" value={formatCurrency(kpis.totalVentes, true)} icon={<TrendingUp size={20}/>} color="#6366F1" trend={0} trendType="up" sparklineData={[]} />
        <KpiCard title="Trésorerie Disponible" value={formatCurrency(kpis.treasury, true)} icon={<Landmark size={20}/>} color="#F59E0B" trend={0} trendType="up" sparklineData={[]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
           <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calculator size={18} color="var(--accent)"/> Structure des Charges</h3>
           <ResponsiveContainer width="100%" height={260}>
              <RechartsPie>
                <Pie 
                  data={balance.filter(a => a.code.startsWith('6') && a.debit > 0)} 
                  dataKey="debit" nameKey="label" cx="50%" cy="50%" outerRadius={80} label
                >
                  {balance.filter(a => a.code.startsWith('6')).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPie>
           </ResponsiveContainer>
        </div>
        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
           <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Radar Flux Bancaires</h3>
           {/* Placeholder for complex banking charting */}
           <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border)', borderRadius: '1rem' }}>
              Interface bancaire connectée ... 
           </div>
        </div>
      </div>
    </motion.div>
  );

  // 2. PLAN COMPTABLE
  const renderPlanComptable = () => (
    <motion.div variants={fadeIn} initial="hidden" animate="show">
      <SectionHeader icon={<ListFilter size={16}/>} title="Plan Comptable" subtitle="SYSCOHADA / PCG Standard" actions={[
        <button key="add" className="btn btn-primary" style={{ padding: '0.55rem 1rem' }}><Plus size={16}/> Ajouter un compte</button>
      ]} />
      
      <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead style={{ background: 'var(--bg-subtle)' }}>
            <tr>{['Numéro', 'Intitulé', 'Nature', 'Type', 'Solde Actuel'].map((h, i) => (
              <th key={i} style={{ padding: '1rem 1.5rem', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.725rem', textTransform: 'uppercase' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {accounts.map((acc, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 800, color: 'var(--accent)' }}>{acc.code}</td>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{acc.label}</td>
                <td style={{ padding: '1rem 1.5rem' }}><Chip label={acc.nature} color={acc.nature === 'Bilan' ? '#3B82F6' : '#10B981'} /></td>
                <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{acc.type}</td>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 700, textAlign: 'right' }}>{formatCurrency(balance.find(b => b.code === acc.code)?.solde || 0, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  // 3. SAISIE JOURNAL (Sage-Style Grid)
  const renderSaisie = () => (
    <motion.div variants={fadeIn} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionHeader icon={<BookCopy size={16}/>} title="Saisie de Journal" subtitle="Écritures en partie double" />
      
      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', background: 'var(--bg-subtle)' }}>
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1.5fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>JOURNAL</label>
               <select value={activeJournal} onChange={(e) => setActiveJournal(e.target.value)} style={{ padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg)', fontWeight: 600 }}>
                  {journals.map(j => <option key={j.id} value={j.id}>{j.code} - {j.label}</option>)}
               </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>LIBELLÉ DE L'ÉCRITURE</label>
               <input type="text" value={saisieHeader.libelle} onChange={e => setSaisieHeader({...saisieHeader, libelle: e.target.value})} placeholder="Ex: Paiement facture..." style={{ padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>DATE</label>
               <input type="date" value={saisieHeader.date} onChange={e => setSaisieHeader({...saisieHeader, date: e.target.value})} style={{ padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>N° PIÈCE</label>
               <input type="text" value={saisieHeader.piece} onChange={e => setSaisieHeader({...saisieHeader, piece: e.target.value})} placeholder="REF-2026-X" style={{ padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg)' }} />
            </div>
         </div>

         {/* Grid Saisie */}
         <div style={{ background: 'var(--bg)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  <tr style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>
                     <th style={{ padding: '0.75rem 1rem', textAlign: 'left', width: '20%' }}>Compte</th>
                     <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Libellé Ligne</th>
                     <th style={{ padding: '0.75rem 1rem', textAlign: 'right', width: '15%' }}>Débit</th>
                     <th style={{ padding: '0.75rem 1rem', textAlign: 'right', width: '15%' }}>Crédit</th>
                     <th style={{ width: '50px' }}></th>
                  </tr>
               </thead>
               <tbody>
                  {saisieLines.map((line, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                       <td style={{ padding: '0.5rem' }}>
                          <select value={line.accountId} onChange={e => {
                             const newList = [...saisieLines];
                             newList[idx].accountId = e.target.value;
                             setSaisieLines(newList);
                          }} style={{ width: '100%', padding: '0.6rem', border: 'none', background: 'transparent', fontWeight: 700, color: 'var(--accent)' }}>
                             <option value="">Choisir...</option>
                             {accounts.map(a => <option key={a.code} value={a.code}>{a.code} - {a.label}</option>)}
                          </select>
                       </td>
                       <td style={{ padding: '0.5rem' }}>
                          <input type="text" value={line.label} onChange={e => {
                             const newList = [...saisieLines];
                             newList[idx].label = e.target.value;
                             setSaisieLines(newList);
                          }} placeholder="Détail..." style={{ width: '100%', padding: '0.6rem', border: 'none', background: 'transparent' }} />
                       </td>
                       <td style={{ padding: '0.5rem' }}>
                          <input type="number" value={line.debit} onFocus={e => e.target.select()} onChange={e => {
                             const newList = [...saisieLines];
                             newList[idx].debit = parseFloat(e.target.value) || 0;
                             setSaisieLines(newList);
                          }} style={{ width: '100%', padding: '0.6rem', border: 'none', background: 'transparent', textAlign: 'right', fontWeight: 700 }} />
                       </td>
                       <td style={{ padding: '0.5rem' }}>
                          <input type="number" value={line.credit} onFocus={e => e.target.select()} onChange={e => {
                             const newList = [...saisieLines];
                             newList[idx].credit = parseFloat(e.target.value) || 0;
                             setSaisieLines(newList);
                          }} style={{ width: '100%', padding: '0.6rem', border: 'none', background: 'transparent', textAlign: 'right', fontWeight: 700 }} />
                       </td>
                       <td style={{ textAlign: 'center' }}>
                          {saisieLines.length > 2 && <button onClick={() => setSaisieLines(saisieLines.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}>×</button>}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
            <button onClick={() => setSaisieLines([...saisieLines, { accountId: '', label: '', debit: 0, credit: 0 }])} style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-subtle)', border: 'none', color: 'var(--accent)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
               + Ajouter une ligne
            </button>
         </div>

         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '2rem' }}>
               <div><span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOTAL DÉBIT</span> <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{formatCurrency(saisieLines.reduce((s,l)=>s+l.debit,0))}</div></div>
               <div><span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TOTAL CRÉDIT</span> <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>{formatCurrency(saisieLines.reduce((s,l)=>s+l.credit,0))}</div></div>
               <div style={{ display: 'flex', alignItems: 'center' }}>
                  {Math.abs(saisieLines.reduce((s,l)=>s+l.debit,0) - saisieLines.reduce((s,l)=>s+l.credit,0)) < 0.01 ? 
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981', fontWeight: 700, fontSize: '0.8rem' }}><CheckCircle2 size={16}/> ÉQUILIBRÉ</div> : 
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontWeight: 700, fontSize: '0.8rem' }}><AlertTriangle size={16}/> HORS ÉQUILIBRE</div>
                  }
               </div>
            </div>
            <button onClick={handleSaveSaisie} className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>
               Valider et Valider l'Écriture
            </button>
         </div>
      </div>
    </motion.div>
  );

  // 4. BALANCE
  const renderBalance = () => (
    <motion.div variants={fadeIn} initial="hidden" animate="show">
      <SectionHeader icon={<Scale size={16}/>} title="Balance de Vérification" subtitle="Équilibre général des comptes" actions={[
        <button key="pdf" className="btn glass" style={{ border: '1px solid var(--border)' }}><Download size={14}/> CSV</button>
      ]} />
      <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead style={{ background: 'var(--bg-subtle)' }}>
            <tr style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem 1.5rem', width: '15%' }}>Compte</th>
              <th style={{ padding: '1rem 1.5rem', width: '35%' }}>Libellé</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Mvt Débit</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Mvt Crédit</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Solde Net</th>
            </tr>
          </thead>
          <tbody>
            {balance.filter(b => b.debit !== 0 || b.credit !== 0).map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.9rem 1.5rem', fontWeight: 800 }}>{row.code}</td>
                <td style={{ padding: '0.9rem 1.5rem' }}>{row.label}</td>
                <td style={{ padding: '0.9rem 1.5rem', textAlign: 'right' }}>{formatCurrency(row.debit)}</td>
                <td style={{ padding: '0.9rem 1.5rem', textAlign: 'right' }}>{formatCurrency(row.credit)}</td>
                <td style={{ padding: '0.9rem 1.5rem', textAlign: 'right', fontWeight: 800, color: row.solde > 0 ? '#10B981' : row.solde < 0 ? '#EF4444' : 'inherit' }}>
                  {formatCurrency(row.solde)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ background: 'var(--bg-subtle)', fontWeight: 900, fontSize: '0.9rem' }}>
            <tr>
               <td colSpan={2} style={{ padding: '1.5rem' }}>TOTAUX GÉNÉRAUX</td>
               <td style={{ padding: '1.5rem', textAlign: 'right' }}>{formatCurrency(balance.reduce((s, b) => s + b.debit, 0))}</td>
               <td style={{ padding: '1.5rem', textAlign: 'right' }}>{formatCurrency(balance.reduce((s, b) => s + b.credit, 0))}</td>
               <td style={{ padding: '1.5rem', textAlign: 'right' }}>{formatCurrency(balance.reduce((s, b) => s + b.solde, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Landmark size={32} color="var(--accent)"/> Comptabilité Sage Edition
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>Gestion financière, lettrage et rapports certifiés</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button onClick={() => setTab('saisie')} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}><BookOpen size={18}/> Nouvelle Écriture</button>
        </div>
      </div>

      <TabBar tabs={[
        { id: 'dashboard', label: 'Espace Pilotage', icon: <TrendingUp size={16}/> },
        { id: 'saisie', label: 'Saisie Journal', icon: <BookCopy size={16}/> },
        { id: 'plan', label: 'Plan de Comptes', icon: <ListFilter size={16}/> },
        { id: 'balance', label: 'Balance Générale', icon: <Scale size={16}/> },
        { id: 'ledger', label: 'Grand Livre', icon: <BookOpen size={16}/> },
        { id: 'reporting', label: 'Bilan & P&L', icon: <PieChart size={16}/> },
        { id: 'invoices', label: 'Factures Clients', icon: <FileText size={16}/> },
      ]} active={tab} onChange={setTab} />

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
          {tab === 'dashboard' && renderDashboard()}
          {tab === 'plan' && renderPlanComptable()}
          {tab === 'saisie' && renderSaisie()}
          {tab === 'balance' && renderBalance()}
          
          {tab === 'ledger' && (
             <motion.div variants={fadeIn} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <SectionHeader icon={<BookOpen size={16}/>} title="Grand Livre Détaillé" subtitle="Mouvements par compte" />
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                   <div style={{ position: 'relative', flex: 1 }}>
                      <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                      <input type="text" placeholder="Rechercher un compte ou une pièce..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg)' }} />
                   </div>
                </div>
                <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                      <thead style={{ background: 'var(--bg-subtle)' }}>
                         <tr>{['Date', 'Journal', 'Compte', 'Libellé', 'Pièce', 'Débit', 'Crédit'].map(h => <th key={h} style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)' }}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                         {lines.filter(l => l.label.toLowerCase().includes(searchQuery.toLowerCase()) || l.accountId.includes(searchQuery) || l.entryId.includes(searchQuery)).map((l, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                               <td style={{ padding: '0.75rem 1rem' }}>{l.createdAt?.split('T')[0]}</td>
                               <td style={{ padding: '0.75rem 1rem' }}><Chip label={entries.find(e => e.id === l.entryId)?.journalId || 'OD'} /></td>
                               <td style={{ padding: '0.75rem 1rem', fontWeight: 800 }}>{l.accountId}</td>
                               <td style={{ padding: '0.75rem 1rem' }}>{l.label}</td>
                               <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{entries.find(e => e.id === l.entryId)?.piece || '—'}</td>
                               <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>{l.debit > 0 ? formatCurrency(l.debit) : '—'}</td>
                               <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700 }}>{l.credit > 0 ? formatCurrency(l.credit) : '—'}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </motion.div>
          )}

          {tab === 'reporting' && (
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                   <SectionHeader icon={<FileCheck size={16}/>} title="Bilan (Actif/Passif)" subtitle="État du Patrimoine" />
                   {/* Table Simplifiée pour le Bilan */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1.5px solid var(--border)', fontWeight: 800 }}><span>Actif Immobilisé</span><span>{formatCurrency(balance.filter(b=>b.code.startsWith('2')).reduce((s,b)=>s+b.solde,0))}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}><span>Stocks</span><span>{formatCurrency(balance.filter(b=>b.code.startsWith('3')).reduce((s,b)=>s+b.solde,0))}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}><span>Créances Clients</span><span>{formatCurrency(balance.filter(b=>b.code.startsWith('41')).reduce((s,b)=>s+b.solde,0))}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}><span>Trésorerie</span><span>{formatCurrency(balance.filter(b=>b.code.startsWith('5')).reduce((s,b)=>s+b.solde,0))}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0.5rem', marginTop: '1rem', background: 'var(--accent)10', borderRadius: '0.5rem', fontWeight: 900, color: 'var(--accent)' }}><span>TOTAL ACTIF</span><span>{formatCurrency(balance.filter(b => ['2','3','41','5'].some(p => b.code.startsWith(p))).reduce((s,b)=>s+b.solde,0))}</span></div>
                   </div>
                </div>
                <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                   <SectionHeader icon={<Activity size={16}/>} title="Compte de Résultat" subtitle="Performance d'exploitation" />
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1.5px solid var(--border)', fontWeight: 800 }}><span>Total des Produits (Classe 7)</span><span>{formatCurrency(Math.abs(balance.filter(b=>b.code.startsWith('7')).reduce((s,b)=>s+b.solde,0)))}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1.5px solid var(--border)', fontWeight: 800 }}><span>Total des Charges (Classe 6)</span><span>{formatCurrency(balance.filter(b=>b.code.startsWith('6')).reduce((s,b)=>s+b.solde,0))}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0.5rem', marginTop: '1rem', background: kpis.result >= 0 ? '#10B98110' : '#EF444410', borderRadius: '0.5rem', fontWeight: 900, color: kpis.result >= 0 ? '#10B981' : '#EF4444' }}>
                        <span>RÉSULTAT NET (Bénéfice/Perte)</span>
                        <span>{formatCurrency(kpis.result)}</span>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {tab === 'invoices' && (
            <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ background: 'var(--bg-subtle)' }}>
                  <tr>{['Numéro', 'Client', 'Montant TTC', 'Statut', 'Actions'].map(h => <th key={h} style={{ padding: '1rem', textAlign: 'left' }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {invoices.map((inv, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 800 }}>{inv.num}</td>
                      <td style={{ padding: '1rem' }}>{inv.client}</td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>{formatCurrency(inv.montant)}</td>
                      <td style={{ padding: '1rem' }}><Chip label={inv.statut} color={inv.statut === 'Payé' ? '#10B981' : '#F59E0B'} /></td>
                      <td style={{ padding: '1rem' }}>
                        {inv.statut !== 'Payé' && (
                          <button onClick={() => updateRecord('finance', 'invoices', inv.id, { statut: 'Payé' })} className="btn" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', border: '1px solid var(--accent)', color: 'var(--accent)' }}>Marquer Payé</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {modal && (
        <RecordModal isOpen={true} onClose={() => setModal(null)} title="Configuration" fields={[]} onSave={() => setModal(null)} />
      )}
    </div>
  );
};

export default Accounting;
