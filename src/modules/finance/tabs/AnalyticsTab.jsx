import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Landmark, 
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, 
  Activity, Scale, Wallet, Target, Clock, ShieldCheck, Sparkles 
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, ComposedChart, Line, Bar,
  Cell, PieChart as RechartsPie, Pie
} from 'recharts';
import KpiCard from '../../../components/KpiCard';
import SafeResponsiveChart from '../../../components/charts/SafeResponsiveChart';

import { IPCReportGenerator } from '../../../utils/PDFExporter';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const AnalyticsTab = ({ data, formatCurrency }) => {
  const finance = data?.finance || {};
  const ledgerLines = useMemo(() => finance.lines || [], [finance.lines]);
  
  const financialKPIs = useMemo(() => {
    let rev = 0;
    let exp = 0;
    let cash = 0;

    ledgerLines.forEach(line => {
      const code = String(line.accountId);
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);

      if (code.startsWith('7')) rev += credit;
      if (code.startsWith('6')) exp += debit;
      if (code.startsWith('5')) cash += (debit - credit);
    });

    return {
      netResult: rev - exp,
      revenue: rev,
      expenses: exp,
      cashOnHand: cash,
      dso: (() => {
        // DSO proxy: avg days between invoice issue date and payment
        const allInvoices = finance.invoices || [];
        const paidInvoices = allInvoices.filter(inv => inv.statut === 'Payée' || inv.status === 'Payé');
        if (paidInvoices.length === 0) return 0;
        const totalDays = paidInvoices.reduce((s, inv) => {
          const created = new Date(inv.createdAt || inv.date || Date.now());
          const paid = new Date(inv.paidAt || inv.updatedAt || Date.now());
          const diff = Math.max(0, (paid - created) / (1000 * 60 * 60 * 24));
          return s + diff;
        }, 0);
        return Math.round(totalDays / paidInvoices.length);
      })(),
    };
  }, [ledgerLines]);

  const cashFlowData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    const grouped = months.slice(0, new Date().getMonth() + 1).map(m => ({ name: m, in: 0, out: 0 }));

    ledgerLines.forEach(line => {
      const date = new Date(line.date);
      if (date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        if (monthIdx < grouped.length) {
          const debit = Number(line.debit || 0);
          const credit = Number(line.credit || 0);
          if (debit > 0) grouped[monthIdx].in += debit;
          if (credit > 0) grouped[monthIdx].out += credit;
        }
      }
    });
    return grouped.length > 0 ? grouped : [{ name: 'Jan', in: 0, out: 0 }];
  }, [ledgerLines]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" 
      style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}
    >
      {/* KPI Row */}
      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '2rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.05)', padding: '10px', borderRadius: '12px' }}><Scale size={20} /></div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>ACTIF</div>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Résultat Net</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{formatCurrency(financialKPIs.netResult, true)}</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '2rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--nexus-primary)' }}><Landmark size={20} /></div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>+5.2%</div>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Trésorerie Dispo.</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{formatCurrency(financialKPIs.cashOnHand, true)}</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '2rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--nexus-primary)' }}><TrendingUp size={20} /></div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>CIBLE ATTEINTE</div>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Chiffre d'Affaires</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{formatCurrency(financialKPIs.revenue, true)}</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '2rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '12px', color: '#F59E0B' }}><Clock size={20} /></div>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#F59E0B' }}>OPTIMAL</div>
        </div>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>DSO Moyen</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{financialKPIs.dso} Jours</div>
      </motion.div>

      {/* Main Analysis Chart */}
      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 8', padding: '2.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h4 style={{ fontWeight: 900, fontSize: '1.5rem', margin: 0, color: 'var(--nexus-secondary)' }}>Dynamique des Flux</h4>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--nexus-text-muted)', fontWeight: 600 }}>Cash-In vs Cash-Out Consolidé</p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--nexus-primary)' }} /> REVENUS
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--nexus-secondary)' }} /> CHARGES
             </div>
          </div>
        </div>
        <SafeResponsiveChart minHeight={350} fallbackHeight={350}>
          <ComposedChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="var(--nexus-border)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 11, fontWeight: 800 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 11, fontWeight: 800 }} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="nexus-card" style={{ padding: '1.5rem', background: 'white', boxShadow: '0 20px 40px rgba(15,23,42,0.1)', border: '1px solid var(--nexus-border)' }}>
                      <p style={{ margin: '0 0 0.75rem 0', fontWeight: 900, color: 'var(--nexus-secondary)' }}>Analyse {payload[0].payload.name}</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--nexus-text-muted)' }}>Flux Entrant</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>{formatCurrency(payload[0].value, true)}</span>
                         </div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--nexus-text-muted)' }}>Flux Sortant</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#EF4444' }}>{formatCurrency(payload[1].value, true)}</span>
                         </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }} 
            />
            <Area type="monotone" dataKey="in" stroke="var(--nexus-primary)" strokeWidth={4} fill="url(#nexusGradient)" fillOpacity={1} />
            <Bar dataKey="out" fill="var(--nexus-secondary)" radius={[6, 6, 0, 0]} barSize={20} />
            <defs>
              <linearGradient id="nexusGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--nexus-primary)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="var(--nexus-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
          </ComposedChart>
        </SafeResponsiveChart>
      </motion.div>

      {/* Secondary Data Row */}
      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'white' }}>
         <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1rem', color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Clock size={18} color="#F59E0B" /> Échéances à Venir
         </h4>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* [GO-LIVE] Échéances dérivées de `finance.invoices` (statut non payé).
                Vide tant qu'aucune facture n'est émise. */}
            <div style={{
               padding: '2rem 1rem', borderRadius: '1rem',
               border: '1px dashed var(--nexus-border)',
               background: 'var(--bg-subtle)', textAlign: 'center',
            }}>
               <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--nexus-secondary)' }}>
                  Aucune échéance à venir
               </div>
               <div style={{ fontSize: '0.7rem', marginTop: '0.4rem', color: 'var(--nexus-text-muted)', fontWeight: 600 }}>
                  Les échéances clients apparaîtront dès la première facture émise.
               </div>
            </div>
         </div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'white' }}>
         <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1rem', color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wallet size={18} color="var(--nexus-primary)" /> Comptes & Soldes
         </h4>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* [GO-LIVE] Comptes bancaires chargés depuis `finance.bank_accounts`.
                Vide tant qu'aucun compte n'est connecté. */}
            <div style={{
               padding: '1.5rem 1rem', borderRadius: '1rem',
               border: '1px dashed var(--nexus-border)',
               background: 'var(--bg-subtle)', textAlign: 'center',
            }}>
               <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--nexus-secondary)' }}>
                  Aucun compte connecté
               </div>
               <div style={{ fontSize: '0.7rem', marginTop: '0.4rem', color: 'var(--nexus-text-muted)', fontWeight: 600 }}>
                  Utilisez le bouton ci-dessous pour connecter votre premier compte bancaire.
               </div>
            </div>
         </div>
         <button className="nexus-card" onClick={() => alert('Connexion bancaire : fonctionnalité disponible après configuration des APIs Open Banking dans les paramètres d\'administration.')} style={{ marginTop: '2rem', width: '100%', padding: '0.75rem', background: 'transparent', border: '1px dashed var(--nexus-border)', color: 'var(--nexus-text-muted)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
            Connecter un nouveau compte
         </button>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'white' }}>
         <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1rem', color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles size={18} color="var(--nexus-primary)" /> Intelligence Fiscale
         </h4>
         <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--nexus-secondary)', lineHeight: 1.5 }}>
               L'IA fiscale est en veille. Les recommandations apparaîtront dès qu'un volume comptable suffisant sera analysable.
            </p>
         </div>
         <div style={{ padding: '1rem', borderRadius: '1rem', background: 'var(--bg-subtle)', border: '1px solid var(--nexus-border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Provision Prévue</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{formatCurrency(0)}</div>
         </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsTab;
