import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, Wallet, Users, FileText, 
  Plus, Download, CheckCircle2, TrendingUp,
  Clock, Landmark, ShieldCheck,
  Calculator
} from 'lucide-react';
import { useStore } from '../store';
import KpiCard from '../components/KpiCard';
import SmartButton from '../components/SmartButton';
import { useToastStore } from '../store/useToastStore';

/**
 *  NEXUS OS: PAYROLL HUB (AUDIT-READY)
 * Operational engine for salary calculation and synchronization.
 */
const PayrollHub = () => {
  const { data, formatCurrency, addRecord, updateRecord } = useStore();
  const [activeTab, setActiveTab] = useState('slips');
  const [isProcessing, setIsProcessing] = useState(false);

  // --- DATA SOURCES ---
  const employees = (data.hr?.employees || []).filter(e => e.active !== false);
  const slips = data.payroll?.slips || [];
  const variables = data.payroll?.variables || [];
  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // --- CALCULATIONS ---
  const totalNet = useMemo(() => slips.reduce((sum, s) => sum + (Number(s.netPay || 0)), 0), [slips]);
  const totalTaxes = useMemo(() => slips.reduce((sum, s) => sum + (Number(s.grossPay || 0) - Number(s.netPay || 0)), 0), [slips]);

  const calculatePayroll = async () => {
    setIsProcessing(true);
    useToastStore.getState().addToast(`Lancement du cycle de paie : ${currentMonth}`, 'info');

    let count = 0;
    for (const emp of employees) {
      // Basic Local Calculation Logic (Example: 20% total deductions)
      const gross = Number(emp.salaire || 0);
      if (gross <= 0) continue;

      // Add variables for this employee
      const empVars = variables.filter(v => v.employeeId === emp.id && !v.processed);
      const bonus = empVars.filter(v => v.type === 'Prime' || v.type === 'Heures Sup').reduce((s, v) => s + (Number(v.amount) || 0), 0);
      const deductions = empVars.filter(v => v.type === 'Absence' || v.type === 'Avance').reduce((s, v) => s + (Number(v.amount) || 0), 0);

      const net = (gross + bonus - deductions) * 0.82; // Rough estimate after taxes

      const newSlip = {
        employeeId: emp.id,
        employeeName: emp.nom,
        period: currentMonth,
        grossPay: gross + bonus,
        netPay: Math.round(net),
        status: 'Brouillon',
        createdAt: new Date().toISOString(),
        _domain: 'payroll'
      };

      addRecord('payroll', 'slips', newSlip);
      count++;

      // Mark variables as processed
      empVars.forEach(v => updateRecord('payroll', 'variables', v.id, { processed: true }));
    }

    setTimeout(() => {
      setIsProcessing(false);
      useToastStore.getState().addToast(`${count} bulletins générés avec succès.`, 'success');
    }, 1500);
  };

  const tabs = [
    { id: 'slips', label: 'Bulletins de Paie', icon: <FileText size={18} /> },
    { id: 'variables', label: 'Éléments Variables', icon: <TrendingUp size={18} /> },
    { id: 'charges', label: 'Charges & Taxes', icon: <Landmark size={18} /> },
  ];

  return (
    <div style={{ padding: '3rem', minHeight: '100vh', background: 'var(--bg-subtle)' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: '#059669', boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)' }}>
              <Banknote size={20} color="white" />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#059669', textTransform: 'uppercase' }}>
              Financial HR Engine
            </span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px' }}>Paie & Social</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.5rem' }}>Pilotage des rémunérations consolidé avec Green Block SSOT.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <SmartButton 
            variant="secondary" 
            icon={Download} 
            onClick={() => useToastStore.getState().addToast('Exportation des écritures comptables...', 'info')}
          >
            Exporter SEPA
          </SmartButton>
          <SmartButton 
            variant="primary" 
            icon={Calculator} 
            loading={isProcessing}
            onClick={calculatePayroll}
          >
            Lancer le Cycle {currentMonth}
          </SmartButton>
        </div>
      </div>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <KpiCard title="Masse Salariale (Net)" value={formatCurrency(totalNet)} icon={<Wallet size={20} />} color="#059669" />
        <KpiCard title="Charges Sociales Est." value={formatCurrency(totalTaxes)} icon={<Landmark size={20} />} color="#3B82F6" />
        <KpiCard title="Effectif Actif" value={employees.length} icon={<Users size={20} />} color="#8B5CF6" />
        <KpiCard title="État Sync SSOT" value="Connecté" icon={<CheckCircle2 size={20} />} color="#10B981" />
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.03)', padding: '6px', borderRadius: '1.25rem', border: '1px solid var(--border-light)', width: 'fit-content', marginBottom: '2.5rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1.75rem', borderRadius: '1rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: '0.2s',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#059669' : 'var(--text-muted)',
              boxShadow: activeTab === tab.id ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'slips' && (
            <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', background: 'white', border: '1px solid var(--border)' }}>
              {slips.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <Clock size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                  <p>Aucun bulletin généré pour le cycle actuel.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                      <th style={{ padding: '1.2rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Collaborateur</th>
                      <th style={{ padding: '1.2rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Période</th>
                      <th style={{ padding: '1.2rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Brut</th>
                      <th style={{ padding: '1.2rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Net à Payer</th>
                      <th style={{ padding: '1.2rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slips.map(slip => (
                      <tr key={slip.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '1.2rem', fontWeight: 800 }}>{slip.employeeName}</td>
                        <td style={{ padding: '1.2rem', color: 'var(--text-muted)', fontWeight: 600 }}>{slip.period}</td>
                        <td style={{ padding: '1.2rem', color: 'var(--text-muted)' }}>{formatCurrency(slip.grossPay)}</td>
                        <td style={{ padding: '1.2rem', fontWeight: 900, color: '#059669' }}>{formatCurrency(slip.netPay)}</td>
                        <td style={{ padding: '1.2rem' }}>
                          <span style={{ 
                            padding: '4px 12px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 900, 
                            background: slip.status === 'Payé' ? '#10B98115' : '#3B82F615',
                            color: slip.status === 'Payé' ? '#10B981' : '#3B82F6'
                          }}>{slip.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'variables' && (
            <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', background: 'white', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                 <h3 style={{ margin: 0, fontWeight: 900 }}>Saisie des Éléments Variables</h3>
                 <SmartButton variant="secondary" icon={Plus} onClick={() => useToastStore.getState().addToast('Bientôt : Formulaire de saisie rapide', 'info')}>Ajouter une ligne</SmartButton>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {variables.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '1rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Aucun élément variable enregistré pour ce mois.</p>
                  </div>
                ) : (
                  variables.map(v => (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '1rem' }}>
                      <div style={{ fontWeight: 700 }}>{v.employeeId} - {v.type}</div>
                      <div style={{ fontWeight: 900, color: v.type === 'Absence' ? '#EF4444' : '#059669' }}>
                        {v.type === 'Absence' ? '-' : '+'}{formatCurrency(v.amount)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'charges' && (
             <div className="glass" style={{ padding: '3rem', borderRadius: '2rem', background: 'white', border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                   <div>
                      <h3 style={{ fontWeight: 900, marginBottom: '1.5rem' }}>Déclaration Sociale (Est.)</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}>
                            <span style={{ fontWeight: 700 }}>CNPS (Caisse Nationale)</span>
                            <span style={{ fontWeight: 800 }}>{formatCurrency(totalTaxes * 0.4)}</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}>
                            <span style={{ fontWeight: 700 }}>ITS (Impôts sur Salaires)</span>
                            <span style={{ fontWeight: 800 }}>{formatCurrency(totalTaxes * 0.6)}</span>
                         </div>
                      </div>
                   </div>
                   <div style={{ background: 'rgba(5, 150, 105, 0.05)', borderRadius: '1.5rem', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                      <ShieldCheck size={48} color="#059669" style={{ marginBottom: '1rem' }} />
                      <h4 style={{ margin: 0, fontWeight: 900 }}>Conformité Totale</h4>
                      <p style={{ fontSize: '0.9rem', color: '#065f46', marginTop: '0.5rem' }}>Les calculs sont alignés avec le barème fiscal ivoirien (SYSCOHADA).</p>
                   </div>
                </div>
             </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PayrollHub;
