import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Calculator, Landmark, BookCopy, FileCheck, 
  Search, Filter, Plus, Info, RefreshCcw, Save, 
  Trash2, ChevronRight, Scale, BookMarked
} from 'lucide-react';
import EnterpriseView from '../../../components/EnterpriseView';
import { accountingSchema } from '../../../schemas/accounting.schema';

import { useBusiness } from '../../../BusinessContext';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const AccountingTab = ({ onOpenDetail, addAccountingEntry }) => {
  const { data } = useBusiness();
  const accounts = data?.finance?.accounts || [];
  const lines = data?.finance?.lines || [];
  const [view, setView] = useState('ledger'); // 'ledger', 'saisie', 'coe' (Chart of Accounts), 'balance'
  
  // Saisie State
  const [saisieLines, setSaisieLines] = useState([
    { accountId: '', label: '', debit: 0, credit: 0 },
    { accountId: '', label: '', debit: 0, credit: 0 }
  ]);
  const [header, setHeader] = useState({ libelle: '', date: new Date().toISOString().split('T')[0], piece: '' });

  const handleSave = () => {
    if (addAccountingEntry) {
      addAccountingEntry(header, saisieLines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0)));
      setView('ledger');
    }
  };

  const calculateTotals = () => {
    const d = saisieLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const c = saisieLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return { debit: d, credit: c, balanced: d === c && d > 0 };
  };

  const totals = calculateTotals();

  // Balance Calculation
  const balanceGenerale = () => {
    const balanceMap = {};
    accounts.forEach(acc => {
      balanceMap[acc.code] = { code: acc.code, label: acc.label, debit: 0, credit: 0 };
    });
    
    lines.forEach(line => {
      if (!balanceMap[line.accountId]) {
        balanceMap[line.accountId] = { code: line.accountId, label: 'Compte Inconnu', debit: 0, credit: 0 };
      }
      balanceMap[line.accountId].debit += Number(line.debit || 0);
      balanceMap[line.accountId].credit += Number(line.credit || 0);
    });

    const results = Object.values(balanceMap).map(b => ({
      ...b,
      soldeDebit: b.debit > b.credit ? b.debit - b.credit : 0,
      soldeCredit: b.credit > b.debit ? b.credit - b.debit : 0
    })).filter(b => b.debit > 0 || b.credit > 0);

    const totalD = results.reduce((s, b) => s + b.debit, 0);
    const totalC = results.reduce((s, b) => s + b.credit, 0);
    const totalSoldeD = results.reduce((s, b) => s + b.soldeDebit, 0);
    const totalSoldeC = results.reduce((s, b) => s + b.soldeCredit, 0);

    return { lines: results, totalD, totalC, totalSoldeD, totalSoldeC };
  };

  const currentBalance = balanceGenerale();

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Sub-Navigation Accounting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="glass" style={{ display: 'flex', padding: '0.4rem', borderRadius: '1rem', background: 'var(--bg-subtle)' }}>
           {[
             { id: 'ledger', label: 'Grand Livre', icon: <BookOpen size={14} /> },
             { id: 'saisie', label: 'Saisie Journal', icon: <BookCopy size={14} /> },
             { id: 'coe', label: 'Plan de Comptes', icon: <BookMarked size={14} /> },
             { id: 'balance', label: 'Balance', icon: <Scale size={14} /> },
           ].map(t => (
             <button
               key={t.id}
               onClick={() => setView(t.id)}
               style={{
                 padding: '0.5rem 1.25rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
                 background: view === t.id ? 'var(--bg)' : 'transparent',
                 color: view === t.id ? '#6366F1' : 'var(--text-muted)',
                 fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
                 boxShadow: view === t.id ? 'var(--shadow-sm)' : 'none', transition: '0.2s'
               }}
             >
               {t.icon} {t.label}
             </button>
           ))}
        </div>

        {view === 'ledger' && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="glass" style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.85rem' }}>Exporter Balance</button>
            <button className="btn-primary" onClick={() => setView('saisie')} style={{ padding: '0.6rem 1.5rem', borderRadius: '1rem', background: '#6366F1', borderColor: '#6366F1' }}>
               <Plus size={18} /> Saisie Directe
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Content */}
      <AnimatePresence mode="wait">
        <datalist id="ohada-accounts">
           {accounts.map(acc => (
              <option key={acc.code} value={acc.code}>{acc.label}</option>
           ))}
        </datalist>
        {view === 'saisie' ? (
          <motion.div 
            key="saisie" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="glass" 
            style={{ padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--border)' }}
          >
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Nouvelle Écriture Journal</h3>
                <div style={{ padding: '0.5rem 1rem', borderRadius: '1rem', background: totals.balanced ? '#10B98115' : '#EF444415', color: totals.balanced ? '#10B981' : '#EF4444', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  {totals.balanced ? 'Balance Ajustée' : 'Hors Balance'}
                </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div>
                   <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Date d'écriture</label>
                   <input type="date" value={header.date} onChange={e => setHeader({...header, date: e.target.value})} className="input-field glass" style={{ width: '100%' }} />
                </div>
                <div>
                   <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Libellé Global</label>
                   <input type="text" placeholder="ex: Facture G034 - SOGEA" value={header.libelle} onChange={e => setHeader({...header, libelle: e.target.value})} className="input-field glass" style={{ width: '100%' }} />
                </div>
                <div>
                   <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>N° Pièce Comptable</label>
                   <input type="text" placeholder="REF-000" value={header.piece} onChange={e => setHeader({...header, piece: e.target.value})} className="input-field glass" style={{ width: '100%' }} />
                </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr 1fr 1fr 40px', gap: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                   <div>Compte</div>
                   <div>Libellé Ligne</div>
                   <div style={{ textAlign: 'right' }}>Débit</div>
                   <div style={{ textAlign: 'right' }}>Crédit</div>
                   <div />
                </div>
                {saisieLines.map((l, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr 1fr 1fr 40px', gap: '1rem', alignItems: 'center' }}>
                     <input list="ohada-accounts" value={l.accountId} onChange={e => {
                        const n = [...saisieLines]; n[i].accountId = e.target.value; setSaisieLines(n);
                     }} placeholder="411..." className="input-field glass" style={{ width: '100%', fontSize: '0.85rem' }} />
                     <input value={l.label} onChange={e => {
                        const n = [...saisieLines]; n[i].label = e.target.value; setSaisieLines(n);
                     }} placeholder="Description..." className="input-field glass" style={{ width: '100%', fontSize: '0.85rem' }} />
                     <input type="number" value={l.debit} onChange={e => {
                        const n = [...saisieLines]; n[i].debit = parseFloat(e.target.value) || 0; setSaisieLines(n);
                     }} className="input-field glass" style={{ width: '100%', textAlign: 'right', fontWeight: 800 }} />
                     <input type="number" value={l.credit} onChange={e => {
                        const n = [...saisieLines]; n[i].credit = parseFloat(e.target.value) || 0; setSaisieLines(n);
                     }} className="input-field glass" style={{ width: '100%', textAlign: 'right', fontWeight: 800 }} />
                     <button onClick={() => setSaisieLines(saisieLines.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', opacity: saisieLines.length > 2 ? 1 : 0.3, cursor: 'pointer' }}>
                        <Trash2 size={16} />
                     </button>
                  </div>
                ))}
                <button className="glass" onClick={() => setSaisieLines([...saisieLines, { accountId: '', label: '', debit: 0, credit: 0 }])} style={{ padding: '0.75rem', borderRadius: '1rem', fontWeight: 800, border: '1px dashed var(--border)' }}>
                   + Ajouter une ligne
                </button>
             </div>

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '3rem' }}>
                   <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Débit</div>
                      <div style={{ fontWeight: 900, fontSize: '1.25rem' }}>{totals.debit.toLocaleString()}</div>
                   </div>
                   <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Crédit</div>
                      <div style={{ fontWeight: 900, fontSize: '1.25rem' }}>{totals.credit.toLocaleString()}</div>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                   <button className="btn-secondary" onClick={() => setView('ledger')} style={{ padding: '0.8rem 1.8rem', borderRadius: '1.25rem' }}>Annuler</button>
                   <button 
                     disabled={!totals.balanced}
                     className="btn-primary" 
                     onClick={handleSave} 
                     style={{ padding: '0.8rem 2.5rem', borderRadius: '1.25rem', background: '#6366F1', opacity: totals.balanced ? 1 : 0.5 }}
                   >
                     Valider l'Écriture
                   </button>
                </div>
             </div>
          </motion.div>
        ) : view === 'balance' ? (
           <motion.div
             key="balance"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="glass"
             style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}
           >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                 <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Balance Générale</h3>
              </div>
              
              <div style={{ width: '100%', overflowX: 'auto' }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
                    <thead>
                       <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800, borderRadius: '1rem 0 0 1rem' }}>Compte</th>
                          <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800 }}>Libellé</th>
                          <th style={{ padding: '1rem', fontWeight: 800 }}>Mouvements Débit</th>
                          <th style={{ padding: '1rem', fontWeight: 800 }}>Mouvements Crédit</th>
                          <th style={{ padding: '1rem', fontWeight: 800 }}>Solde Débiteur</th>
                          <th style={{ padding: '1rem', fontWeight: 800, borderRadius: '0 1rem 1rem 0' }}>Solde Créditeur</th>
                       </tr>
                    </thead>
                    <tbody>
                       {currentBalance.lines.length === 0 && (
                          <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aucun mouvement comptable</td></tr>
                       )}
                       {currentBalance.lines.map((b, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                             <td style={{ padding: '1rem', textAlign: 'left', fontWeight: 800 }}>{b.code}</td>
                             <td style={{ padding: '1rem', textAlign: 'left' }}>{b.label}</td>
                             <td style={{ padding: '1rem', fontWeight: 600 }}>{b.debit.toLocaleString()}</td>
                             <td style={{ padding: '1rem', fontWeight: 600 }}>{b.credit.toLocaleString()}</td>
                             <td style={{ padding: '1rem', fontWeight: 800, color: b.soldeDebit > 0 ? '#10B981' : 'inherit' }}>{b.soldeDebit > 0 ? b.soldeDebit.toLocaleString() : '-'}</td>
                             <td style={{ padding: '1rem', fontWeight: 800, color: b.soldeCredit > 0 ? '#6366F1' : 'inherit' }}>{b.soldeCredit > 0 ? b.soldeCredit.toLocaleString() : '-'}</td>
                          </tr>
                       ))}
                    </tbody>
                    <tfoot>
                       <tr style={{ fontWeight: 900, background: 'var(--bg-subtle)', fontSize: '0.95rem' }}>
                          <td colSpan="2" style={{ padding: '1.5rem 1rem', textAlign: 'left', borderRadius: '1rem 0 0 1rem' }}>TOTAUX GÉNÉRAUX</td>
                          <td style={{ padding: '1.5rem 1rem' }}>{currentBalance.totalD.toLocaleString()}</td>
                          <td style={{ padding: '1.5rem 1rem' }}>{currentBalance.totalC.toLocaleString()}</td>
                          <td style={{ padding: '1.5rem 1rem', color: '#10B981' }}>{currentBalance.totalSoldeD.toLocaleString()}</td>
                          <td style={{ padding: '1.5rem 1rem', color: '#6366F1', borderRadius: '0 1rem 1rem 0' }}>{currentBalance.totalSoldeC.toLocaleString()}</td>
                       </tr>
                    </tfoot>
                 </table>
              </div>
           </motion.div>
        ) : (
          <motion.div 
            key="ledger" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
          >
             <EnterpriseView 
               moduleId="finance" 
               modelId={view === 'ledger' ? 'entries' : 'accounts'}
               schema={accountingSchema}
               onOpenDetail={onOpenDetail}
             />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AccountingTab;
