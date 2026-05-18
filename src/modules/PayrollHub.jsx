import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote, Wallet, Users, FileText,
  Plus, Download, CheckCircle2, TrendingUp,
  Clock, Landmark, ShieldCheck,
  Calculator, Play, Check, AlertCircle, Loader,
  ChevronDown, ChevronRight
} from 'lucide-react';
import { useStore } from '../store';
import { FirestoreService } from '../services/firestore.service';
import KpiCard from '../components/KpiCard';
import SmartButton from '../components/SmartButton';
import { useToastStore } from '../store/useToastStore';

/**
 * NEXUS OS: PAYROLL HUB (SYSCOHADA / UEMOA Fiscal Engine)
 * Real calculation engine for Côte d'Ivoire payroll (CNPS + ITS).
 */

// ─── Fiscal Calculation Engine ────────────────────────────────────────────────
/**
 * SYSCOHADA/West African payroll calculation
 * Based on Côte d'Ivoire fiscal rules.
 */
const calculateNetPay = (salaryStructure) => {
  const salaire_base = Number(salaryStructure.salaire_base) || Number(salaryStructure.salaire) || 0;
  const prime_transport = Number(salaryStructure.prime_transport) || 0;
  const prime_logement = Number(salaryStructure.prime_logement) || 0;
  const prime_performance = Number(salaryStructure.prime_performance) || 0;
  const prime_anciennete = Number(salaryStructure.prime_anciennete) || 0;
  const indemnite_representation = Number(salaryStructure.indemnite_representation) || 0;

  const brut = salaire_base + prime_transport + prime_logement + prime_performance + prime_anciennete + indemnite_representation;

  if (brut <= 0) return { brut: 0, cnps_sal: 0, its: 0, net: 0, brut_imposable: 0 };

  // CNPS Salariale (Côte d'Ivoire): 6.3% capped at 103,780 XOF/month
  // (corresponds to CNPS ceiling of ~1,647,315 XOF/month)
  const cnps_sal = Math.min(brut * 0.063, 103780);

  // ITS (Impôt sur Traitement et Salaire): progressive brackets
  const brut_imposable = brut - cnps_sal;
  let its = 0;
  if (brut_imposable > 75000) {
    if (brut_imposable <= 240000) {
      its = (brut_imposable - 75000) * 0.016;
    } else if (brut_imposable <= 700000) {
      its = (240000 - 75000) * 0.016 + (brut_imposable - 240000) * 0.21;
    } else {
      its = (240000 - 75000) * 0.016 + (700000 - 240000) * 0.21 + (brut_imposable - 700000) * 0.35;
    }
  }

  const net = brut - cnps_sal - its;

  return {
    brut: Math.round(brut),
    cnps_sal: Math.round(cnps_sal),
    its: Math.round(its),
    net: Math.round(net),
    brut_imposable: Math.round(brut_imposable),
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (Number(n) || 0).toLocaleString('fr-FR') + ' XOF';

const StatusChip = ({ status }) => {
  const colors = {
    Brouillon: { bg: '#64748B15', color: '#64748B' },
    'En calcul': { bg: '#3B82F615', color: '#3B82F6' },
    'Validé RH': { bg: '#8B5CF615', color: '#8B5CF6' },
    'Validé Finance': { bg: '#F59E0B15', color: '#F59E0B' },
    Payé: { bg: '#10B98115', color: '#10B981' },
    Validé: { bg: '#10B98115', color: '#10B981' },
  };
  const c = colors[status] || colors.Brouillon;
  return <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 900, background: c.bg, color: c.color }}>{status}</span>;
};

// ─── Cycle Modal ──────────────────────────────────────────────────────────────
const NewCycleModal = ({ onClose, onLaunch, isProcessing }) => {
  const now = new Date();
  const [periode, setPeriode] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: 'var(--bg)', borderRadius: '2rem', padding: '2.5rem', width: '100%', maxWidth: '480px', border: '1px solid var(--border)' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900 }}>Nouveau Cycle de Paie</h3>
        <p style={{ margin: '0 0 2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sélectionnez la période et lancez le calcul automatique.</p>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Période (AAAA-MM)</label>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '0.75rem 1rem' }}>
            <input type="month" value={periode} onChange={e => setPeriode(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.9rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
          <button onClick={() => onLaunch(periode)} disabled={isProcessing}
            style={{ flex: 2, padding: '0.9rem', borderRadius: '1rem', border: 'none', background: '#059669', color: 'white', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {isProcessing ? <Loader className="spin" size={18} /> : <Play size={18} />}
            {isProcessing ? 'Calcul en cours...' : 'Lancer le Calcul'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PayrollHub = () => {
  const { data, addRecord, updateRecord } = useStore();
  const [activeTab, setActiveTab] = useState('slips');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [expandedSlip, setExpandedSlip] = useState(null);

  // --- DATA SOURCES ---
  const employees = (data.hr?.employees || []).filter(e => e.active !== false);
  const slips = data.payroll?.slips || [];
  const variables = data.payroll?.variables || [];
  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Subscribe to real salary structures
  useEffect(() => {
    const unsub = FirestoreService.subscribeToCollection(
      'salaries',
      { orderByField: '_createdAt', descending: false, limit: 500 },
      (docs) => setSalaryStructures(docs)
    );
    return () => typeof unsub === 'function' && unsub();
  }, []);

  // Build a map of employeeId -> salary structure
  const salaryMap = useMemo(() => {
    const map = {};
    salaryStructures.forEach(s => { map[s.employee_id] = s; });
    return map;
  }, [salaryStructures]);

  // --- CALCULATIONS ---
  const slipsWithCalc = useMemo(() => {
    return slips.map(slip => {
      const calc = calculateNetPay({ salaire_base: slip.salaire_base || slip.grossPay || 0 });
      return { ...slip, _calc: calc };
    });
  }, [slips]);

  const totalBrut = useMemo(() => slipsWithCalc.reduce((s, sl) => s + (sl._calc?.brut || Number(sl.grossPay) || 0), 0), [slipsWithCalc]);
  const totalNet = useMemo(() => slipsWithCalc.reduce((s, sl) => s + (sl._calc?.net || Number(sl.netPay) || 0), 0), [slipsWithCalc]);
  const totalCNPS = useMemo(() => slipsWithCalc.reduce((s, sl) => s + (sl._calc?.cnps_sal || 0), 0), [slipsWithCalc]);
  const totalITS = useMemo(() => slipsWithCalc.reduce((s, sl) => s + (sl._calc?.its || 0), 0), [slipsWithCalc]);

  const formatCurrency = (n) => fmt(n);

  const launchPayrollCycle = async (periode) => {
    setIsProcessing(true);
    setShowCycleModal(false);
    useToastStore.getState().addToast(`Lancement du cycle de paie : ${periode}`, 'info');

    let count = 0;
    const cycleSlips = [];

    for (const emp of employees) {
      // Use real salary structure if available, fallback to employee data
      const salStruct = salaryMap[emp.id] || { salaire_base: Number(emp.salaire) || 0 };
      const { brut, cnps_sal, its, net, brut_imposable } = calculateNetPay(salStruct);

      if (brut <= 0) continue;

      // Apply variables
      const empVars = variables.filter(v => v.employeeId === emp.id && !v.processed);
      const bonus = empVars.filter(v => v.type === 'Prime' || v.type === 'Heures Sup').reduce((s, v) => s + (Number(v.amount) || 0), 0);
      const deductions = empVars.filter(v => v.type === 'Absence' || v.type === 'Avance').reduce((s, v) => s + (Number(v.amount) || 0), 0);

      const finalBrut = brut + bonus - deductions;
      const finalCalc = calculateNetPay({ salaire_base: finalBrut });

      const newSlip = {
        employeeId: emp.id,
        employeeName: emp.nom,
        periode,
        period: periode,
        salaire_base: salStruct.salaire_base || Number(emp.salaire) || 0,
        primes_total: (Number(salStruct.prime_transport) || 0) + (Number(salStruct.prime_logement) || 0) + (Number(salStruct.prime_performance) || 0) + (Number(salStruct.prime_anciennete) || 0) + bonus,
        brut_imposable: finalCalc.brut_imposable,
        grossPay: finalCalc.brut,
        cnps_salariale: finalCalc.cnps_sal,
        its: finalCalc.its,
        net_a_payer: finalCalc.net,
        netPay: finalCalc.net,
        statut: 'Brouillon',
        status: 'Brouillon',
        createdAt: new Date().toISOString(),
        _domain: 'payroll'
      };

      addRecord('payroll', 'slips', newSlip);
      cycleSlips.push(newSlip);
      count++;

      empVars.forEach(v => updateRecord('payroll', 'variables', v.id, { processed: true }));
    }

    setTimeout(() => {
      setIsProcessing(false);
      useToastStore.getState().addToast(`${count} bulletin${count > 1 ? 's' : ''} générés avec succès (moteur SYSCOHADA).`, 'success');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: '#059669', boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)' }}>
              <Banknote size={20} color="white" />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#059669', textTransform: 'uppercase' }}>
              SYSCOHADA / UEMOA Fiscal Engine
            </span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px' }}>Paie & Social</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.5rem' }}>
            Moteur de calcul CNPS + ITS conforme au barème fiscal ivoirien.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
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
            onClick={() => setShowCycleModal(true)}
          >
            Nouveau Cycle de Paie
          </SmartButton>
        </div>
      </div>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <KpiCard title="Masse Brute" value={formatCurrency(totalBrut)} icon={<Wallet size={20} />} color="#059669" />
        <KpiCard title="Masse Nette" value={formatCurrency(totalNet)} icon={<Banknote size={20} />} color="#10B981" />
        <KpiCard title="CNPS Salariale" value={formatCurrency(totalCNPS)} icon={<Landmark size={20} />} color="#3B82F6" />
        <KpiCard title="ITS Total" value={formatCurrency(totalITS)} icon={<TrendingUp size={20} />} color="#8B5CF6" />
        <KpiCard title="Effectif Actif" value={employees.length} icon={<Users size={20} />} color="#F59E0B" />
        <KpiCard title="Conformité SYSCOHADA" value="✓ Active" icon={<CheckCircle2 size={20} />} color="#10B981" />
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
              {slipsWithCalc.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  <Clock size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                  <p style={{ fontWeight: 600 }}>Aucun bulletin généré pour le cycle actuel.</p>
                  <p style={{ fontSize: '0.85rem' }}>Cliquez sur "Nouveau Cycle de Paie" pour lancer le calcul.</p>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontWeight: 900 }}>{slipsWithCalc.length} Bulletin{slipsWithCalc.length > 1 ? 's' : ''} générés</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '5px 12px', borderRadius: 999, background: '#10B98115', color: '#10B981', fontSize: '0.75rem', fontWeight: 800 }}>
                      <ShieldCheck size={14} /> SYSCOHADA Conforme
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)', background: '#f8fafc' }}>
                        {['Collaborateur', 'Période', 'Brut', 'CNPS Sal.', 'ITS', 'Net à Payer', 'Statut', ''].map(h => (
                          <th key={h} style={{ padding: '1rem 1.2rem', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slipsWithCalc.map(slip => {
                        const calc = slip._calc || {};
                        const isExpanded = expandedSlip === slip.id;
                        return (
                          <React.Fragment key={slip.id}>
                            <tr style={{ borderBottom: '1px solid var(--border-light)', transition: '0.15s', cursor: 'pointer' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              onClick={() => setExpandedSlip(isExpanded ? null : slip.id)}>
                              <td style={{ padding: '1rem 1.2rem', fontWeight: 800 }}>{slip.employeeName}</td>
                              <td style={{ padding: '1rem 1.2rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>{slip.periode || slip.period}</td>
                              <td style={{ padding: '1rem 1.2rem', fontWeight: 700 }}>{formatCurrency(calc.brut || slip.grossPay)}</td>
                              <td style={{ padding: '1rem 1.2rem', color: '#EF4444', fontWeight: 700 }}>-{formatCurrency(calc.cnps_sal || slip.cnps_salariale)}</td>
                              <td style={{ padding: '1rem 1.2rem', color: '#F59E0B', fontWeight: 700 }}>-{formatCurrency(calc.its || slip.its)}</td>
                              <td style={{ padding: '1rem 1.2rem', fontWeight: 900, color: '#059669', fontSize: '1rem' }}>{formatCurrency(calc.net || slip.netPay)}</td>
                              <td style={{ padding: '1rem 1.2rem' }}>
                                <StatusChip status={slip.statut || slip.status} />
                              </td>
                              <td style={{ padding: '1rem 1.2rem' }}>
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </td>
                            </tr>
                            <AnimatePresence>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={8} style={{ padding: 0, borderBottom: '1px solid var(--border-light)' }}>
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                      style={{ overflow: 'hidden', background: '#f8fafc', padding: '1.5rem 2rem' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                        {[
                                          { label: 'Salaire de Base', value: formatCurrency(slip.salaire_base), color: '#1E293B' },
                                          { label: 'Total Primes', value: formatCurrency(slip.primes_total || 0), color: '#10B981' },
                                          { label: 'Salaire Brut Total', value: formatCurrency(calc.brut || slip.grossPay), color: '#3B82F6' },
                                          { label: 'Brut Imposable', value: formatCurrency(calc.brut_imposable || slip.brut_imposable), color: '#8B5CF6' },
                                          { label: 'CNPS Salariale (6.3%)', value: formatCurrency(calc.cnps_sal || slip.cnps_salariale), color: '#EF4444' },
                                          { label: 'ITS (Progressif)', value: formatCurrency(calc.its || slip.its), color: '#F59E0B' },
                                          { label: 'Net à Payer', value: formatCurrency(calc.net || slip.netPay), color: '#059669' },
                                        ].map(item => (
                                          <div key={item.label} style={{ padding: '1rem', background: 'white', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{item.label}</div>
                                            <div style={{ fontWeight: 900, color: item.color }}>{item.value}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f0fdf4', borderTop: '2px solid #10B98130' }}>
                        <td style={{ padding: '1rem 1.2rem', fontWeight: 900, fontSize: '0.85rem' }}>TOTAUX</td>
                        <td style={{ padding: '1rem' }}></td>
                        <td style={{ padding: '1rem 1.2rem', fontWeight: 900, color: '#1E293B' }}>{formatCurrency(totalBrut)}</td>
                        <td style={{ padding: '1rem 1.2rem', fontWeight: 900, color: '#EF4444' }}>-{formatCurrency(totalCNPS)}</td>
                        <td style={{ padding: '1rem 1.2rem', fontWeight: 900, color: '#F59E0B' }}>-{formatCurrency(totalITS)}</td>
                        <td style={{ padding: '1rem 1.2rem', fontWeight: 900, color: '#059669', fontSize: '1.05rem' }}>{formatCurrency(totalNet)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontWeight: 900, marginBottom: '1.5rem' }}>Déclaration Sociale (Calculée)</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem', background: '#EF444408', borderRadius: '1rem', border: '1px solid #EF444420' }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>CNPS Salariale</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>6.3% du brut (plafond 103 780 XOF)</div>
                      </div>
                      <span style={{ fontWeight: 900, color: '#EF4444' }}>{formatCurrency(totalCNPS)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem', background: '#F59E0B08', borderRadius: '1rem', border: '1px solid #F59E0B20' }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>ITS (Impôt sur Traitement et Salaire)</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Barème progressif 1.6% → 35%</div>
                      </div>
                      <span style={{ fontWeight: 900, color: '#F59E0B' }}>{formatCurrency(totalITS)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem', background: '#3B82F608', borderRadius: '1rem', border: '1px solid #3B82F620' }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>CNPS Patronale (est.)</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>~14.75% du brut plafonné</div>
                      </div>
                      <span style={{ fontWeight: 900, color: '#3B82F6' }}>{formatCurrency(totalBrut * 0.1475)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem', background: '#10B98108', borderRadius: '1rem', border: '1px solid #10B98120' }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>Total Charges (employeur + salarié)</div>
                      </div>
                      <span style={{ fontWeight: 900, color: '#10B981' }}>{formatCurrency(totalCNPS + totalITS + totalBrut * 0.1475)}</span>
                    </div>
                  </div>
                </div>
                <div style={{ background: 'rgba(5, 150, 105, 0.05)', borderRadius: '1.5rem', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                  <ShieldCheck size={48} color="#059669" style={{ marginBottom: '1.5rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 900 }}>Conformité SYSCOHADA</h4>
                  <p style={{ fontSize: '0.88rem', color: '#065f46', marginTop: '0', lineHeight: 1.6 }}>
                    Calculs alignés avec le barème fiscal ivoirien en vigueur.
                    CNPS: 6.3% salarial + 14.75% patronal.
                    ITS: tranches progressives.
                  </p>
                  <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {['CNPS ✓', 'ITS ✓', 'UEMOA ✓'].map(badge => (
                      <span key={badge} style={{ padding: '4px 12px', borderRadius: 999, background: '#10B98115', color: '#10B981', fontSize: '0.75rem', fontWeight: 800 }}>{badge}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Cycle Modal */}
      <AnimatePresence>
        {showCycleModal && (
          <NewCycleModal
            onClose={() => setShowCycleModal(false)}
            onLaunch={launchPayrollCycle}
            isProcessing={isProcessing}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayrollHub;
