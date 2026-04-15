import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '../../../BusinessContext';
import { Upload, CheckCircle2, ChevronRight, AlertCircle, Link } from 'lucide-react';

const BankReconTab = () => {
  const { data, formatCurrency } = useBusiness();
  const [bankLines, setBankLines] = useState([]);
  const [reconciledIds, setReconciledIds] = useState([]);
  const [selectedBankLine, setSelectedBankLine] = useState(null);

  // Get unreconciled ERP financial elements (Payé expenses + Paid invoices)
  const allExpenses = (data.hr?.expenses || []).filter(e => e.statut === 'Payé' || e.status === 'Payé');
  const allInvoices = (data.finance?.invoices || []).filter(i => i.statut === 'Payée' || i.status === 'Payée');
  
  const systemElements = [
    ...allExpenses.map(e => ({ id: e.id, date: e.date, type: 'Expense', label: e.objet || e.title, amount: -Math.abs(e.montant || e.amount || 0) })),
    ...allInvoices.map(i => ({ id: i.id, date: i.date, type: 'Revenue', label: `Facture ${i.num}`, amount: Math.abs(i.totalTTC || i.montant || 0) }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const availableSystemElements = systemElements.filter(el => !reconciledIds.includes(el.id));

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const imported = [];
      // Simple CSV parsing: assuming Date, Libellé, Montant
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const [date, label, amountStr] = lines[i].split(',');
        imported.push({
          id: `BNK-${Math.random().toString(36).substring(7)}`,
          date: date?.trim(),
          label: label?.trim(),
          amount: parseFloat(amountStr?.trim() || 0),
          reconciledWith: null
        });
      }
      setBankLines(imported);
    };
    reader.readAsText(file);
  };

  const simulateImport = () => {
    const mock = [
      { id: 'B-1', date: new Date().toISOString().split('T')[0], label: 'Virement Reçu - Client Alpha', amount: 4500000, reconciledWith: null },
      { id: 'B-2', date: new Date().toISOString().split('T')[0], label: 'Paiement Fournisseur', amount: -600000, reconciledWith: null },
      { id: 'B-3', date: new Date().toISOString().split('T')[0], label: 'Frais Bancaires', amount: -15000, reconciledWith: null }
    ];
    setBankLines(mock);
  };

  const handleMatch = (systemEl) => {
    if (!selectedBankLine) return;
    
    // Check if amounts roughly match (within 1 FCFA precision)
    if (Math.abs(selectedBankLine.amount - systemEl.amount) > 1) {
       alert("Attention: Le montant bancaire ne correspond pas exactement au montant système. Êtes-vous sûr de vouloir forcer le rapprochement ?");
    }

    setBankLines(prev => prev.map(line => line.id === selectedBankLine.id ? { ...line, reconciledWith: systemEl } : line));
    setReconciledIds(prev => [...prev, systemEl.id]);
    setSelectedBankLine(null);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      
      {/* Left Pane: Bank Statement */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', height: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 800 }}>Relevé Bancaire</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <button onClick={simulateImport} className="btn" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: '0.8rem' }}>Simuler</button>
             <label className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '0.8rem' }}>
                <Upload size={14} /> Import CSV
                <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
             </label>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {bankLines.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
               Importez un fichier CSV (Date, Libellé, Montant) pour commencer le lettrage.
            </div>
          ) : bankLines.map(line => {
             const isReconciled = line.reconciledWith !== null;
             const isSelected = selectedBankLine?.id === line.id;
             return (
               <motion.div 
                 key={line.id}
                 onClick={() => !isReconciled && setSelectedBankLine(line)}
                 style={{ 
                   padding: '1rem', 
                   borderRadius: '0.75rem', 
                   border: `1px solid ${isReconciled ? '#10B98150' : isSelected ? '#6366F1' : 'var(--border)'}`, 
                   background: isReconciled ? '#10B98110' : isSelected ? '#6366F110' : 'var(--bg-subtle)',
                   cursor: isReconciled ? 'default' : 'pointer',
                   opacity: isReconciled ? 0.7 : 1
                 }}
               >
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                   <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{line.date}</span>
                   <span style={{ fontWeight: 800, color: line.amount > 0 ? '#10B981' : '#EF4444' }}>{formatCurrency?.(line.amount)}</span>
                 </div>
                 <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{line.label}</div>
                 
                 {isReconciled && (
                   <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#10B981' }}>
                      <CheckCircle2 size={14} /> Lettré avec: {line.reconciledWith.label}
                   </div>
                 )}
               </motion.div>
             );
          })}
        </div>
      </div>

      {/* Right Pane: System Ledger Status */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', height: '600px', opacity: selectedBankLine ? 1 : 0.6, pointerEvents: selectedBankLine ? 'auto' : 'none', transition: 'all 0.3s' }}>
         <h3 style={{ margin: 0, fontWeight: 800, marginBottom: '1.5rem' }}>Correspondance Système</h3>
         
         {selectedBankLine && (
           <div style={{ padding: '1rem', background: '#6366F115', border: '1px dashed #6366F1', borderRadius: '0.75rem', marginBottom: '1rem' }}>
             <div style={{ fontSize: '0.8rem', color: '#6366F1', fontWeight: 700, marginBottom: '0.25rem' }}>Montant recherché</div>
             <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{formatCurrency?.(selectedBankLine.amount)}</div>
           </div>
         )}
         
         <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {availableSystemElements.map(el => (
              <div 
                key={el.id}
                style={{ 
                  padding: '1rem', 
                  borderRadius: '0.75rem', 
                  border: '1px solid var(--border)', 
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{el.date} • {el.type}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{el.label}</div>
                  <div style={{ fontWeight: 800, color: el.amount > 0 ? '#10B981' : '#EF4444' }}>{formatCurrency?.(el.amount)}</div>
                </div>
                <button 
                  onClick={() => handleMatch(el)}
                  className="btn"
                  style={{ background: '#6366F1', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Link size={14} /> Lettrer
                </button>
              </div>
            ))}
            {availableSystemElements.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                 Aucune écriture comptable en attente de lettrage.
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default BankReconTab;
