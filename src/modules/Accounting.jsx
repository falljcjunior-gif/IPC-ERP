import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, CreditCard, PieChart, Plus, Search, Download, ChevronRight,
  TrendingUp, TrendingDown, Calendar, DollarSign, BarChart3, Zap,
  Clock, AlertTriangle, CheckCircle2, Target, RefreshCcw, Building2,
  Activity, ArrowUpRight, ArrowDownLeft, Scale, Layers
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
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const Chip = ({ label, color = '#64748B' }) => (
  <span style={{ padding: '2px 9px', borderRadius: '999px', background: `${color}18`, color, fontSize: '0.71rem', fontWeight: 700 }}>{label}</span>
);
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.9rem', border: '1px solid var(--border)', gap: '0.2rem', width: 'fit-content', flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: '0.48rem 1.05rem', borderRadius: '0.7rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem', background: active === t.id ? 'var(--bg)' : 'transparent', color: active === t.id ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);
const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.8rem' }}>
      <p style={{ fontWeight: 700, marginBottom: '4px' }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}</p>)}
    </div>
  );
};

/* ════════════════════════════════════
   ACCOUNTING MODULE — Full Enterprise
════════════════════════════════════ */
const Accounting = ({ onOpenDetail }) => {
  const { data, addRecord, formatCurrency } = useBusiness();
  const [tab, setTab] = useState('dashboard');
  const [modal, setModal] = useState(null);

  const { invoices = [], treasury = [] } = data.finance || {};

  /* ─── Enhanced Mock Data ─── */
  const allInvoices = useMemo(() => [
    ...invoices,
    { id: 'I3', num: 'FACT-2026-03', client: 'MegaCorp Inc.',   echeance: '2026-05-20', montant: 8200000,  statut: 'En attente', dateEmission: '2026-04-05', devise: 'FCFA' },
    { id: 'I4', num: 'FACT-2026-04', client: 'AeroSpace Ltd',   echeance: '2026-04-18', montant: 15600000, statut: 'Retard',     dateEmission: '2026-03-18', devise: 'FCFA' },
    { id: 'I5', num: 'FACT-2026-05', client: 'GlobalConnect',   echeance: '2026-04-30', montant: 22000000, statut: 'Brouillon',  dateEmission: '2026-04-10', devise: 'USD'  },
    { id: 'I6', num: 'FACT-2026-06', client: 'EcoLogic',        echeance: '2026-05-05', montant: 1200000,  statut: 'Payé',       dateEmission: '2026-04-01', devise: 'FCFA' },
  ], [invoices]);

  const allTreasury = useMemo(() => [
    ...treasury,
    { id: 'T3', libelle: 'Recouvrement GlobalConnect', montant:  18000000, date: '2026-04-08', type: 'Encaissement', compte: 'BNP 001' },
    { id: 'T4', libelle: 'Salaires Mars 2026',         montant: -32000000, date: '2026-04-05', type: 'Décaissement', compte: 'BNP 001' },
    { id: 'T5', libelle: 'Loyer Bureaux Q2',           montant: -4800000,  date: '2026-04-01', type: 'Décaissement', compte: 'SG 002'  },
    { id: 'T6', libelle: 'Virement Fournisseur Intel', montant: -15600000, date: '2026-04-09', type: 'Virement',     compte: 'BNP 001' },
    { id: 'T7', libelle: 'Encaissement AeroSpace',     montant:  12400000, date: '2026-04-11', type: 'Encaissement', compte: 'SG 002'  },
  ], [treasury]);

  /* ─── KPIs computed ─── */
  const kpis = useMemo(() => {
    const solde = allTreasury.reduce((s, t) => s + t.montant, 0) + 48000000;
    const creancesImpayees = allInvoices.filter(i => i.statut !== 'Payé' && i.statut !== 'Brouillon').reduce((s, i) => s + i.montant, 0);
    const facturesRetard = allInvoices.filter(i => i.statut === 'Retard');
    const totalCA = allInvoices.filter(i => i.statut === 'Payé').reduce((s, i) => s + i.montant, 0) + 42000000;
    const dso = 28; // Days Sales Outstanding
    const margeBrute = 38.4;
    const margeNette = 14.2;
    return { solde, creancesImpayees, facturesRetard, totalCA, dso, margeBrute, margeNette };
  }, [allInvoices, allTreasury]);

  const cashflowData = [
    { mois: 'Oct', entrees: 42000000, sorties: 38000000, solde: 4000000 },
    { mois: 'Nov', entrees: 38000000, sorties: 41000000, solde: -3000000 },
    { mois: 'Déc', entrees: 55000000, sorties: 48000000, solde: 7000000 },
    { mois: 'Jan', entrees: 31000000, sorties: 29000000, solde: 2000000 },
    { mois: 'Fév', entrees: 48000000, sorties: 43000000, solde: 5000000 },
    { mois: 'Mar', entrees: 52000000, sorties: 45000000, solde: 7000000 },
    { mois: 'Avr', entrees: 44000000, sorties: 56000000, solde: -12000000 },
  ];

  const performancePL = [
    { mois: 'Jan', ca: 450000000, couts: 320000000, marge: 130000000 },
    { mois: 'Fév', ca: 520000000, couts: 380000000, marge: 140000000 },
    { mois: 'Mar', ca: 490000000, couts: 350000000, marge: 140000000 },
    { mois: 'Avr', ca: 680000000, couts: 420000000, marge: 260000000 },
    { mois: 'Mai', ca: 580000000, couts: 390000000, marge: 190000000 },
    { mois: 'Juin', ca: 720000000, couts: 450000000, marge: 270000000 },
  ];

  const immos = [
    { item: 'Serveur Calcul Intensif',   date: '2025-10-12', valAcq: 12000000,  valNet: 8500000,  duree: 5, amort: 2400000 },
    { item: 'Mobilier Bureau (Lot 10)',  date: '2026-01-20', valAcq: 4500000,   valNet: 4200000,  duree: 10, amort: 450000  },
    { item: 'Véhicule Direction',        date: '2024-05-15', valAcq: 35000000,  valNet: 22000000, duree: 5, amort: 7000000 },
    { item: 'Logiciels Licence Perpét.', date: '2025-03-01', valAcq: 8000000,   valNet: 5300000,  duree: 3, amort: 2666666 },
  ];

  /* ─── Modal configs ─── */
  const modalConfigs = {
    invoice: {
      title: 'Nouvelle Facture Client',
      fields: [
        { name: 'num',    label: 'N° Facture', required: true, placeholder: 'FACT-2026-XX' },
        { name: 'client', label: 'Client', required: true },
        { name: 'echeance', label: 'Date Échéance', type: 'date', required: true },
        { name: 'montant', label: 'Montant TTC (FCFA)', type: 'number', required: true },
        { name: 'statut', label: 'Statut', type: 'select', options: ['Brouillon', 'En attente', 'Payé', 'Retard', 'Annulé'], required: true },
        { name: 'devise', label: 'Devise', type: 'select', options: ['FCFA', 'EUR', 'USD', 'GBP'] },
      ],
      save: f => addRecord('finance', 'invoices', f),
    },
    treasury: {
      title: 'Enregistrer un Mouvement de Trésorerie',
      fields: [
        { name: 'libelle', label: 'Libellé', required: true },
        { name: 'montant', label: 'Montant (FCFA)', type: 'number', required: true },
        { name: 'date',    label: 'Date', type: 'date', required: true },
        { name: 'type',    label: 'Type', type: 'select', options: ['Encaissement', 'Décaissement', 'Virement'], required: true },
        { name: 'compte',  label: 'Compte Bancaire', type: 'select', options: ['BNP 001', 'SG 002', 'Caisse Siège'] },
      ],
      save: f => addRecord('finance', 'treasury', f),
    },
  };
  const activeMod = modal ? modalConfigs[modal] : null;

  /* ═══════════ DASHBOARD ═══════════ */
  const renderDashboard = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
        <KpiCard title="Solde Trésorerie"    value={formatCurrency(kpis.solde, true)}               trend={2.1}   trendType="up"   icon={<DollarSign size={20}/>}   color="#10B981" sparklineData={cashflowData.map(d=>({val:d.solde/1e6}))} />
        <KpiCard title="CA Réalisé (Année)"  value={formatCurrency(kpis.totalCA, true)}              trend={14.5}  trendType="up"   icon={<TrendingUp size={20}/>}   color="#3B82F6" sparklineData={performancePL.map(d=>({val:d.ca/1e6}))} />
        <KpiCard title="DSO (Jours)"         value={`${kpis.dso} j`}                                trend={3.8}   trendType="down" icon={<Clock size={20}/>}        color="#F59E0B" sparklineData={[{val:32},{val:30},{val:29},{val:28},{val:28}]} />
        <KpiCard title="Marge Brute"         value={`${kpis.margeBrute}%`}                          trend={1.2}   trendType="up"   icon={<BarChart3 size={20}/>}    color="#8B5CF6" sparklineData={[{val:36},{val:37},{val:37.5},{val:38},{val:38.4}]} />
        <KpiCard title="Marge Nette"         value={`${kpis.margeNette}%`}                          trend={0.8}   trendType="up"   icon={<Target size={20}/>}       color="#14B8A6" sparklineData={[{val:13},{val:13.5},{val:14},{val:14},{val:14.2}]} />
        <KpiCard title="Créances Impayées"   value={formatCurrency(kpis.creancesImpayees, true)}    trend={-4.1}  trendType="down" icon={<AlertTriangle size={20}/>} color="#EF4444" sparklineData={[{val:50},{val:48},{val:45},{val:46},{val:44}]} />
      </motion.div>

      {/* Alertes factures en retard */}
      {kpis.facturesRetard.length > 0 && (
        <motion.div variants={fadeIn} className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: '1.25rem', border: '1px solid #EF444430' }}>
          <h4 style={{ fontWeight: 700, color: '#EF4444', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
            <AlertTriangle size={15} /> {kpis.facturesRetard.length} Facture(s) en Retard — Recouvrement Requis
          </h4>
          {kpis.facturesRetard.map((inv, i) => (
            <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.5rem 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: 'var(--accent)', minWidth: '120px' }}>{inv.num}</span>
              <span style={{ flex: 1 }}>{inv.client}</span>
              <span style={{ fontWeight: 800, color: '#EF4444' }}>{formatCurrency(inv.montant, true)}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Échue: {inv.echeance}</span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Cash Flow + P&L */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Cash Flow Opérationnel — 7 Mois</h4>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={cashflowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <ReferenceLine y={0} stroke="#64748B" strokeDasharray="4 2" />
              <Bar dataKey="entrees" name="Entrées"  fill="#10B98130" radius={[4,4,0,0]} barSize={18} />
              <Bar dataKey="sorties" name="Sorties"  fill="#EF444430" radius={[4,4,0,0]} barSize={18} />
              <Line dataKey="solde"   name="Solde Net" stroke={cashflowData[cashflowData.length-1].solde < 0 ? '#EF4444' : '#10B981'} strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Compte de Résultat — 6 Mois</h4>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={performancePL}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1e9).toFixed(1)}Md`} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Bar dataKey="ca"     name="CA"     fill="#3B82F6" radius={[4,4,0,0]} barSize={18} />
              <Bar dataKey="couts"  name="Coûts"  fill="#EF4444" radius={[4,4,0,0]} barSize={18} />
              <Line dataKey="marge" name="Marge → " stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );

  /* ═══════════ FACTURES ═══════════ */
  const renderInvoices = () => {
    const statusColor = { Payé: '#10B981', 'En attente': '#F59E0B', Retard: '#EF4444', Brouillon: '#64748B', Annulé: '#94A3B8' };
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <motion.div variants={fadeIn} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setModal('invoice')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.5rem 1rem', borderRadius: '0.7rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={14} /> Nouvelle Facture
          </button>
        </motion.div>
        <motion.div variants={fadeIn} className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-subtle)' }}>
              <tr>{['N° Facture', 'Client', 'Émission', 'Échéance', 'Montant TTC', 'Devise', 'Statut', ''].map((h, i) => (
                <th key={i} style={{ padding: '0.85rem 1.1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.73rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {allInvoices.map((inv, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  onClick={() => onOpenDetail?.(inv, 'finance', 'invoices')}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: 'var(--accent)' }}>{inv.num}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}>{inv.client}</td>
                  <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{inv.dateEmission || '2026-04-01'}</td>
                  <td style={{ padding: '0.9rem 1.1rem', color: inv.statut === 'Retard' ? '#EF4444' : 'var(--text-muted)', fontWeight: inv.statut === 'Retard' ? 700 : 400 }}>{inv.echeance}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700 }}>{formatCurrency(inv.montant, true)}</td>
                  <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{inv.devise || 'FCFA'}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}><Chip label={inv.statut} color={statusColor[inv.statut] || '#64748B'} /></td>
                  <td style={{ padding: '0.9rem 1.1rem' }}><Download size={14} color="var(--text-muted)" /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </motion.div>
    );
  };

  /* ═══════════ TRÉSORERIE ═══════════ */
  const renderTreasury = () => {
    const solde = allTreasury.reduce((s, t) => s + t.montant, 0) + 48000000;
    const typeColors = { Encaissement: '#10B981', Décaissement: '#EF4444', Virement: '#3B82F6' };
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            { l: 'Solde Global', v: formatCurrency(solde, true),  c: '#10B981' },
            { l: 'BNP 001',      v: formatCurrency(36800000, true), c: '#3B82F6' },
            { l: 'SG 002',       v: formatCurrency(18200000, true), c: '#8B5CF6' },
            { l: 'Caisse Siège', v: formatCurrency(1500000, true),  c: '#F59E0B' },
          ].map((a, i) => (
            <div key={i} className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem', borderLeft: `4px solid ${a.c}` }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{a.l}</div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: a.c }}>{a.v}</div>
            </div>
          ))}
        </motion.div>
        <motion.div variants={fadeIn} style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setModal('treasury')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.5rem 1rem', borderRadius: '0.7rem', border: 'none', background: '#10B981', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={14} /> Mouvement
          </button>
        </motion.div>
        <motion.div variants={fadeIn} className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-subtle)' }}>
              <tr>{['Date', 'Libellé', 'Type', 'Compte', 'Montant', ''].map((h, i) => (
                <th key={i} style={{ padding: '0.85rem 1.1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.73rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {allTreasury.sort((a, b) => b.date?.localeCompare?.(a.date) || 0).map((t, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{t.date}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 600 }}>{t.libelle}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {t.montant >= 0 ? <ArrowDownLeft size={13} color="#10B981" /> : <ArrowUpRight size={13} color="#EF4444" />}
                      <Chip label={t.type} color={typeColors[t.type] || '#64748B'} />
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 1.1rem', color: 'var(--text-muted)' }}>{t.compte || '—'}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 800, color: t.montant >= 0 ? '#10B981' : '#EF4444' }}>
                    {t.montant >= 0 ? '+' : ''}{formatCurrency(t.montant, true)}
                  </td>
                  <td style={{ padding: '0.9rem 1.1rem' }}><ChevronRight size={14} color="var(--text-muted)" /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </motion.div>
    );
  };

  /* ═══════════ IMMOBILISATIONS ═══════════ */
  const renderImmos = () => {
    const totalBrut = immos.reduce((s, i) => s + i.valAcq, 0);
    const totalNet  = immos.reduce((s, i) => s + i.valNet, 0);
    const totalAmort = immos.reduce((s, i) => s + i.amort, 0);
    return (
      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { l: 'Valeur Brute Totale', v: formatCurrency(totalBrut, true), c: '#3B82F6' },
            { l: 'Valeur Nette Comptable', v: formatCurrency(totalNet, true), c: '#10B981' },
            { l: 'Dotations Amort./an', v: formatCurrency(totalAmort, true), c: '#F59E0B' },
          ].map((s, i) => (
            <div key={i} className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{s.l}</div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: s.c }}>{s.v}</div>
            </div>
          ))}
        </motion.div>
        <motion.div variants={fadeIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {immos.map((im, i) => {
            const pct = Math.round((1 - im.valNet / im.valAcq) * 100);
            return (
              <div key={i} className="glass" style={{ padding: '1.4rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 220px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{im.item}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Acquis: {im.date} · Durée: {im.duree} ans</div>
                </div>
                <div style={{ flex: '0 1 140px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Valeur Brute</div>
                  <div style={{ fontWeight: 700 }}>{formatCurrency(im.valAcq, true)}</div>
                </div>
                <div style={{ flex: '0 1 160px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>VNC</div>
                  <div style={{ fontWeight: 800, color: '#10B981' }}>{formatCurrency(im.valNet, true)}</div>
                </div>
                <div style={{ flex: '0 1 180px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Amorti</span>
                    <span style={{ fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                      style={{ height: '100%', background: pct > 70 ? '#EF4444' : pct > 40 ? '#F59E0B' : '#10B981', borderRadius: '999px' }} />
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#14B8A6', marginBottom: '0.4rem' }}>
            <Scale size={16} /><span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Finance — Comptabilité & Reporting</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Comptabilité & Finance</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>Cash Flow · P&L · DSO · Factures · Trésorerie · Immobilisations</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setModal('treasury')} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <ArrowDownLeft size={15} /> Mouvement
          </button>
          <button onClick={() => setModal('invoice')} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={15} /> Nouvelle Facture
          </button>
        </div>
      </div>

      <TabBar tabs={[
        { id: 'dashboard', label: 'Dashboard P&L',    icon: <BarChart3 size={14}/> },
        { id: 'invoices',  label: 'Factures',         icon: <FileText size={14}/> },
        { id: 'treasury',  label: 'Trésorerie',       icon: <DollarSign size={14}/> },
        { id: 'immos',     label: 'Immobilisations',  icon: <Layers size={14}/> },
        { id: 'taxes',     label: 'Taxes',            icon: <Scale size={14}/> },
      ]} active={tab} onChange={setTab} />

      {tab === 'dashboard' && renderDashboard()}
      {tab === 'invoices'  && renderInvoices()}
      {tab === 'treasury'  && renderTreasury()}
      {tab === 'immos'     && renderImmos()}
      {tab === 'taxes'     && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {(data?.base?.taxes || []).map((tax, i) => (
            <div key={i} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 700 }}>{tax.label}</h3>
                {tax.default && <Chip label="Défaut" color="var(--accent)" />}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>{((tax.rate || 0) * 100).toFixed(1)}%</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ID: {tax.id}</div>
            </div>
          ))}
        </div>
      )}

      {activeMod && (
        <RecordModal isOpen={true} onClose={() => setModal(null)} title={activeMod.title} fields={activeMod.fields}
          onSave={f => { activeMod.save(f); setModal(null); }} />
      )}
    </div>
  );
};

export default Accounting;
