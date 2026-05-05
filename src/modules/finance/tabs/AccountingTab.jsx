import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Calculator, Landmark, BookCopy, FileCheck, 
  Search, Filter, Plus, Info, RefreshCcw, Save, 
  Trash2, ChevronRight, Scale, BookMarked, PieChart, TrendingUp
} from 'lucide-react';
import EnterpriseView from '../../../components/EnterpriseView';
import { accountingSchema } from '../../../schemas/accounting.schema';

import { useStore } from '../../../store';
import SmartButton from '../../../components/SmartButton';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };

const AccountingTab = ({ onOpenDetail, addAccountingEntry }) => {
  const { data } = useStore();
  const accounts = data?.finance?.accounts || [];
  const lines = data?.finance?.lines || [];
  const [view, setView] = useState('ledger'); // 'ledger', 'saisie', 'coe', 'balance', 'bilan_sheet', 'pnl'
  
  // Saisie State
  const [saisieLines, setSaisieLines] = useState([
    { accountId: '', label: '', debit: 0, credit: 0 },
    { accountId: '', label: '', debit: 0, credit: 0 }
  ]);
  const [header, setHeader] = useState({ libelle: '', date: new Date().toISOString().split('T')[0], piece: '' });

  const handleSave = async () => {
    if (addAccountingEntry) {
      const success = await addAccountingEntry(header, saisieLines.filter(l => l.accountId && (l.debit > 0 || l.credit > 0)));
      if (success) {
        setView('ledger');
      }
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

  // Bilan (Balance Sheet) Logic
  const getBilan = () => {
    // Actif = Classes 2, 3 + Classes 4,5 (Solde Débiteur)
    const actifs = currentBalance.lines.filter(b => /^[23]/.test(b.code) || (/^[45]/.test(b.code) && b.soldeDebit > 0));
    const totalActif = actifs.reduce((s, a) => s + a.soldeDebit, 0);

    // Passif = Classe 1 + Classes 4,5 (Solde Créditeur)
    const passifs = currentBalance.lines.filter(b => /^[1]/.test(b.code) || (/^[45]/.test(b.code) && b.soldeCredit > 0));
    const totalPassifBrut = passifs.reduce((s, p) => s + p.soldeCredit, 0);

    // Résultat net (Compte de Résultat impact) pour équilibrer le Bilan
    const revenus = currentBalance.lines.filter(b => /^7/.test(b.code)).reduce((s, r) => s + r.soldeCredit, 0);
    const charges = currentBalance.lines.filter(b => /^6/.test(b.code)).reduce((s, c) => s + c.soldeDebit, 0);
    const resultatNet = revenus - charges;
    
    const totalPassif = totalPassifBrut + resultatNet;

    return { actifs, passifs, totalActif, totalPassif, resultatNet };
  };

  // Compte de Résultat (P&L) Logic
  const getPnL = () => {
    const revenus = currentBalance.lines.filter(b => /^7/.test(b.code));
    const totalRevenus = revenus.reduce((s, r) => s + r.soldeCredit, 0);
    const charges = currentBalance.lines.filter(b => /^6/.test(b.code));
    const totalCharges = charges.reduce((s, c) => s + c.soldeDebit, 0);
    const resultatNet = totalRevenus - totalCharges;
    return { revenus, totalRevenus, charges, totalCharges, resultatNet };
  };

  const bilan = getBilan();
  const pnl = getPnL();

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Sub-Navigation Accounting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="glass" style={{ display: 'flex', padding: '0.4rem', borderRadius: '1rem', background: 'var(--bg-subtle)' }}>
           {[
             { id: 'ledger', label: 'Grand Livre', icon: <BookOpen size={14} /> },
             { id: 'saisie', label: 'Saisie Journal', icon: <BookCopy size={14} /> },
             { id: 'coe', label: 'Plan de Comptes', icon: <BookMarked size={14} /> },
             { id: 'balance', label: 'Balance Globale', icon: <Scale size={14} /> },
             { id: 'bilan_sheet', label: 'Bilan (Actif/Passif)', icon: <PieChart size={14} /> },
             { id: 'pnl', label: 'Compte de Résultat', icon: <TrendingUp size={14} /> },
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
                    <SmartButton 
                      disabled={!totals.balanced}
                      variant="primary"
                      onClick={handleSave} 
                      style={{ padding: '0.8rem 2.5rem', borderRadius: '1.25rem', background: '#6366F1' }}
                    >
                      Valider l'Écriture
                    </SmartButton>
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
        ) : view === 'bilan_sheet' ? (
           <motion.div
             key="bilan_sheet"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}
           >
             {/* ACTIF */}
             <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1.4rem', color: '#10B981', borderBottom: '2px solid #10B981', paddingBottom: '1rem' }}>ACTIF (Emplois)</h3>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {bilan.actifs.map((a, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg)', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                       <div>
                         <span style={{ fontWeight: 800, marginRight: '8px' }}>{a.code}</span>
                         <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{a.label}</span>
                       </div>
                       <div style={{ fontWeight: 800 }}>{a.soldeDebit.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '2rem', padding: '1rem', background: '#10B98115', color: '#10B981', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.2rem' }}>
                   <span>TOTAL ACTIF</span>
                   <span>{bilan.totalActif.toLocaleString()} FCFA</span>
                </div>
             </div>
             {/* PASSIF */}
             <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1.4rem', color: '#F59E0B', borderBottom: '2px solid #F59E0B', paddingBottom: '1rem' }}>PASSIF (Ressources)</h3>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {bilan.passifs.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg)', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                       <div>
                         <span style={{ fontWeight: 800, marginRight: '8px' }}>{p.code}</span>
                         <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{p.label}</span>
                       </div>
                       <div style={{ fontWeight: 800 }}>{p.soldeCredit.toLocaleString()}</div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: bilan.resultatNet >= 0 ? '#10B98110' : '#EF444410', borderRadius: '0.75rem', border: `1px solid ${bilan.resultatNet >= 0 ? '#10B981' : '#EF4444'}30` }}>
                      <div style={{ fontWeight: 800, color: bilan.resultatNet >= 0 ? '#10B981' : '#EF4444' }}>
                        RÉSULTAT NET (Bénéfice/Perte)
                      </div>
                      <div style={{ fontWeight: 900, color: bilan.resultatNet >= 0 ? '#10B981' : '#EF4444' }}>
                        {bilan.resultatNet.toLocaleString()}
                      </div>
                  </div>
                </div>
                <div style={{ marginTop: '2rem', padding: '1rem', background: '#F59E0B15', color: '#F59E0B', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.2rem' }}>
                   <span>TOTAL PASSIF</span>
                   <span>{bilan.totalPassif.toLocaleString()} FCFA</span>
                </div>
             </div>
           </motion.div>
        ) : view === 'pnl' ? (
           <motion.div
             key="pnl"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             className="glass"
             style={{ padding: '3rem', borderRadius: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}
           >
              <h3 style={{ margin: '0 0 2rem 0', fontWeight: 900, fontSize: '1.8rem', textAlign: 'center' }}>Compte de Résultat</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                 {/* PRODUITS */}
                 <div>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#6366F1', fontWeight: 800, fontSize: '1.2rem' }}>PRODUITS (Revenus)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       {pnl.revenus.map((r, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem' }}>
                             <span style={{ fontWeight: 600 }}>{r.code} - {r.label}</span>
                             <span style={{ fontWeight: 800 }}>{r.soldeCredit.toLocaleString()}</span>
                          </div>
                       ))}
                       {pnl.revenus.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aucun produit comptabilisé.</div>}
                       <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderTop: '2px solid #6366F1', marginTop: '0.5rem', fontWeight: 900, fontSize: '1.1rem' }}>
                          <span>Total Produits d'Exploitation</span>
                          <span style={{ color: '#6366F1' }}>{pnl.totalRevenus.toLocaleString()} FCFA</span>
                       </div>
                    </div>
                 </div>
                 
                 {/* CHARGES */}
                 <div>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#EF4444', fontWeight: 800, fontSize: '1.2rem' }}>CHARGES (Dépenses)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                       {pnl.charges.map((c, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: '0.5rem' }}>
                             <span style={{ fontWeight: 600 }}>{c.code} - {c.label}</span>
                             <span style={{ fontWeight: 800 }}>{c.soldeDebit.toLocaleString()}</span>
                          </div>
                       ))}
                       {pnl.charges.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aucune charge comptabilisée.</div>}
                       <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderTop: '2px solid #EF4444', marginTop: '0.5rem', fontWeight: 900, fontSize: '1.1rem' }}>
                          <span>Total Charges d'Exploitation</span>
                          <span style={{ color: '#EF4444' }}>{pnl.totalCharges.toLocaleString()} FCFA</span>
                       </div>
                    </div>
                 </div>

                 {/* RESULTAT NET */}
                 <div style={{ 
                    marginTop: '1rem', padding: '1.5rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: pnl.resultatNet >= 0 ? '#10B98120' : '#EF444420',
                    color: pnl.resultatNet >= 0 ? '#10B981' : '#EF4444'
                 }}>
                    <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>RÉSULTAT NET</div>
                    <div style={{ fontWeight: 900, fontSize: '1.8rem' }}>{pnl.resultatNet.toLocaleString()} FCFA</div>
                 </div>
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
