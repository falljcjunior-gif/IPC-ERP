/**
 * ════════════════════════════════════════════════════════════════════════════
 * SUBSIDIARY COCKPIT — AuraVision Edition
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Design  : AuraVision Dark Premium — Stripe × Linear × Apple × AuraHealth
 * Palette : Deep Navy (#060E1B) · Emerald (#10B981) · Cyan (#22D3EE)
 *
 * Accès  : SUBSIDIARY_DG, SUBSIDIARY_CFO, SUBSIDIARY_RH,
 *          COUNTRY_DIRECTOR_SUBSIDIARY, SUPER_ADMIN, ADMIN
 *
 * Architecture :
 *   1. Hero Banner       — accueil gradient + KPI score
 *   2. KPI Cards Grid    — 6 métriques animées (stagger)
 *   3. Revenue Chart     — Area chart mensuel (Recharts dark)
 *   4. Activity Table    — Dernières commandes/factures premium
 *   5. Quick Actions     — Prochaines étapes / onboarding
 * ════════════════════════════════════════════════════════════════════════════
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Building2, TrendingUp, TrendingDown, Users, Package,
  ShoppingCart, Wallet, Factory, Briefcase, AlertTriangle,
  CheckCircle2, ArrowUpRight, ArrowRight, BarChart3,
  Activity, Clock, RefreshCw, Star, Zap,
} from 'lucide-react';
import { useStore } from '../../store';
import { getCurrentEntityId, getTenantContext } from '../../services/TenantContext';
import '../../components/AuraVision.css';

/* ── Formatters ─────────────────────────────────────────────────────────────── */
const fmt  = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
const fmtM = (n) => {
  if (n >= 1e9) return `${(n/1e9).toFixed(2)} Md`;
  if (n >= 1e6) return `${(n/1e6).toFixed(1)} M`;
  if (n >= 1e3) return `${(n/1e3).toFixed(0)} k`;
  return fmt(n);
};

/* ── Greeting helper ─────────────────────────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bonne après-midi';
  return 'Bonsoir';
};

/* ── Framer Motion variants ─────────────────────────────────────────────────── */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Custom Recharts Tooltip ────────────────────────────────────────────────── */
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:   '#0F1E34',
      border:       '1px solid rgba(16,185,129,0.20)',
      borderRadius: '0.75rem',
      padding:      '0.625rem 1rem',
      boxShadow:    '0 8px 24px rgba(0,0,0,0.5)',
      fontSize:     '0.8rem',
    }}>
      <div style={{ color: '#94A3B8', fontWeight: 700, marginBottom: '0.25rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#34D399', fontWeight: 800 }}>
          {fmtM(p.value)} <span style={{ color: '#94A3B8', fontWeight: 500 }}>XOF</span>
        </div>
      ))}
    </div>
  );
};

/* ── KPI color themes ────────────────────────────────────────────────────────── */
const KPI_THEMES = {
  emerald: { accent: '#10B981', iconBg: 'rgba(16,185,129,0.10)', iconBorder: 'rgba(16,185,129,0.18)' },
  cyan:    { accent: '#22D3EE', iconBg: 'rgba(34,211,238,0.10)', iconBorder: 'rgba(34,211,238,0.18)' },
  blue:    { accent: '#60A5FA', iconBg: 'rgba(96,165,250,0.10)', iconBorder: 'rgba(96,165,250,0.18)' },
  gold:    { accent: '#FBBF24', iconBg: 'rgba(251,191,36,0.10)', iconBorder: 'rgba(251,191,36,0.18)' },
  purple:  { accent: '#A78BFA', iconBg: 'rgba(167,139,250,0.10)', iconBorder: 'rgba(167,139,250,0.18)' },
  red:     { accent: '#F87171', iconBg: 'rgba(248,113,113,0.10)', iconBorder: 'rgba(248,113,113,0.18)' },
};

/* ── Status map ─────────────────────────────────────────────────────────────── */
const STATUS_BADGE = {
  paid:       { cls: 'av-badge-success',  label: 'Payé'       },
  Payé:       { cls: 'av-badge-success',  label: 'Payé'       },
  pending:    { cls: 'av-badge-warning',  label: 'En attente' },
  'En attente':{ cls: 'av-badge-warning', label: 'En attente' },
  overdue:    { cls: 'av-badge-danger',   label: 'En retard'  },
  'En retard':{ cls: 'av-badge-danger',   label: 'En retard'  },
  active:     { cls: 'av-badge-info',     label: 'Actif'      },
  default:    { cls: 'av-badge-neutral',  label: 'Inconnu'    },
};

const getBadge = (status) => STATUS_BADGE[status] || STATUS_BADGE.default;

/* ════════════════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════════════════ */
export default function SubsidiaryCockpit() {
  const data      = useStore(s => s.data);
  const user      = useStore(s => s.user);
  const ctx       = getTenantContext();
  const entityId  = getCurrentEntityId();
  const greeting  = getGreeting();

  const [chartPeriod, setChartPeriod] = useState('6m');
  const [tablePage,   setTablePage]   = useState(0);
  const TABLE_PAGE_SIZE = 5;

  /* ── KPI calculations ─────────────────────────────────────────────────── */
  const { kpis, recentItems, monthlyData, hasData } = useMemo(() => {
    const sales      = data?.sales?.orders    || [];
    const invoices   = data?.finance?.invoices || [];
    const employees  = data?.hr?.employees    || data?.employees || [];
    const inventory  = data?.inventory?.products || [];
    const workOrders = data?.production?.workOrders || [];
    const projects   = data?.projects?.items  || [];

    const paidInvoices = invoices.filter(i => i.statut === 'Payé' || i.status === 'paid');
    const revenue = paidInvoices.reduce((s, i) => s + (Number(i.montant) || Number(i.amount) || 0), 0);

    const pendingOrders = sales.filter(o => o.status === 'pending' || o.statut === 'En attente').length;
    const lowStock      = inventory.filter(p => Number(p.stock_reel || 0) < Number(p.stock_min || 0)).length;
    const activeWO      = workOrders.filter(w => w.status === 'in_progress' || w.statut === 'En cours').length;
    const activeProjs   = projects.filter(p => p.status === 'active' || p.statut === 'En cours').length;

    const kpis = [
      {
        label: 'CA Filiale',
        value: fmtM(revenue),
        unit:  'XOF',
        raw:   revenue,
        Icon:  Wallet,
        theme: 'emerald',
        trend: revenue > 0 ? '+0%' : null,
        trendDir: 'up',
      },
      {
        label: 'Commandes',
        value: pendingOrders,
        unit:  '',
        raw:   pendingOrders,
        Icon:  ShoppingCart,
        theme: 'cyan',
        trend: null,
        trendDir: 'flat',
      },
      {
        label: 'Effectif',
        value: employees.length,
        unit:  'emp',
        raw:   employees.length,
        Icon:  Users,
        theme: 'blue',
        trend: null,
        trendDir: 'flat',
      },
      {
        label: 'Production',
        value: activeWO,
        unit:  'OF',
        raw:   activeWO,
        Icon:  Factory,
        theme: 'purple',
        trend: null,
        trendDir: 'flat',
      },
      {
        label: 'Stocks Critiques',
        value: lowStock,
        unit:  '',
        raw:   lowStock,
        Icon:  Package,
        theme: lowStock > 0 ? 'red' : 'emerald',
        trend: lowStock > 0 ? `${lowStock} alerte${lowStock > 1 ? 's' : ''}` : null,
        trendDir: lowStock > 0 ? 'down' : 'flat',
      },
      {
        label: 'Projets',
        value: activeProjs,
        unit:  '',
        raw:   activeProjs,
        Icon:  Briefcase,
        theme: 'gold',
        trend: null,
        trendDir: 'flat',
      },
    ];

    /* Recent items — merge invoices + orders, sort by date, take 10 */
    const recentItems = [
      ...paidInvoices.slice(0, 6).map(i => ({
        id:     i.id || i.numero || 'FAC',
        label:  i.numero || i.reference || `Facture #${i.id?.slice(-4) || '—'}`,
        client: i.client_nom || i.client || i.clientNom || '—',
        amount: Number(i.montant) || Number(i.amount) || 0,
        status: i.statut || i.status || 'paid',
        date:   i.date_emission || i.createdAt || null,
        type:   'invoice',
      })),
      ...sales.slice(0, 4).map(o => ({
        id:     o.id || o.numero || 'CMD',
        label:  o.numero || o.reference || `Commande #${o.id?.slice(-4) || '—'}`,
        client: o.client_nom || o.client || '—',
        amount: Number(o.montant_total) || Number(o.amount) || 0,
        status: o.statut || o.status || 'pending',
        date:   o.date_commande || o.createdAt || null,
        type:   'order',
      })),
    ].sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date) - new Date(a.date);
    }).slice(0, 8);

    /* Monthly chart data — build from invoices or use demo */
    const monthMap = {};
    paidInvoices.forEach(i => {
      const d = new Date(i.date_emission || i.createdAt);
      if (!isNaN(d)) {
        const key = d.toLocaleDateString('fr-FR', { month: 'short' });
        monthMap[key] = (monthMap[key] || 0) + (Number(i.montant) || 0);
      }
    });

    const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = MONTHS_FR[d.getMonth()];
      return { month: key, ca: monthMap[key] || 0 };
    });

    const hasData = revenue > 0 || employees.length > 0 || pendingOrders > 0;

    return { kpis, recentItems, monthlyData, hasData };
  }, [data]);

  /* ── Pagination ───────────────────────────────────────────────────────── */
  const totalPages   = Math.ceil(recentItems.length / TABLE_PAGE_SIZE);
  const pagedItems   = recentItems.slice(tablePage * TABLE_PAGE_SIZE, (tablePage + 1) * TABLE_PAGE_SIZE);
  const entityName   = ctx?.entity_name || entityId || 'Filiale';

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="av-page av-module" style={{ padding: 0 }}>

      {/* ── 1. HERO BANNER ─────────────────────────────────────────────── */}
      <motion.div variants={scaleIn} initial="hidden" animate="show">
        <div className="av-hero-card">
          <div className="av-hero-content">
            <div className="av-hero-eyebrow">
              <Building2 size={10} />
              {entityName}
            </div>
            <p className="av-hero-greeting">{greeting}, {user?.nom?.split(' ')[0] || 'Directeur'} 👋</p>
            <h1 className="av-hero-title">
              Cockpit <span>Opérationnel</span>
            </h1>
            <p className="av-hero-sub">
              Performance locale, KPI métier et alertes opérationnelles en temps réel.
            </p>
            <div className="av-hero-actions">
              <button className="av-btn av-btn-primary av-btn-sm">
                <BarChart3 size={13} /> Voir Analytiques
              </button>
              <button className="av-btn av-btn-secondary av-btn-sm">
                <RefreshCw size={13} /> Actualiser
              </button>
              <div style={{
                display:       'flex', alignItems: 'center', gap: '0.375rem',
                fontSize:      '0.72rem', color: 'rgba(52,211,153,0.7)',
                fontWeight:    700,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#10B981', boxShadow: '0 0 6px #10B981',
                  animation: 'av-glow-pulse 2s ease-in-out infinite',
                }} />
                Données en direct
              </div>
            </div>
          </div>

          {/* Hero visual — animated orb */}
          <div className="av-hero-visual" aria-hidden="true">
            <div className="av-hero-orb av-float">
              <Activity size={40} color="rgba(52,211,153,0.7)" strokeWidth={1.5} />
            </div>
            {/* Orbiting ring */}
            <div style={{
              position:     'absolute',
              width:        148, height: 148,
              borderRadius: '50%',
              border:       '1px solid rgba(16,185,129,0.14)',
              animation:    'av-orb-pulse 6s ease-in-out infinite',
            }} />
          </div>
        </div>
      </motion.div>

      {/* ── 2. KPI CARDS GRID ──────────────────────────────────────────── */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        style={{
          display:               'grid',
          gridTemplateColumns:   'repeat(auto-fill, minmax(200px, 1fr))',
          gap:                   '1rem',
        }}
      >
        {kpis.map((k) => {
          const t = KPI_THEMES[k.theme] || KPI_THEMES.emerald;
          const Icon = k.Icon;
          return (
            <motion.div
              key={k.label}
              variants={fadeUp}
              className="av-kpi-card"
              style={{ '--av-kpi-accent': t.accent }}
            >
              <div className="av-kpi-header">
                <div
                  className="av-kpi-icon"
                  style={{ background: t.iconBg, borderColor: t.iconBorder, color: t.accent }}
                >
                  <Icon size={17} strokeWidth={2} />
                </div>
                {k.trend && (
                  <span className={`av-kpi-trend ${k.trendDir}`}>
                    {k.trendDir === 'up'   && <TrendingUp   size={10} />}
                    {k.trendDir === 'down' && <TrendingDown  size={10} />}
                    {k.trend}
                  </span>
                )}
              </div>
              <div className={`av-kpi-value ${k.raw === 0 ? 'av-kpi-value-empty' : ''}`}>
                {k.raw === 0 ? '—' : k.value}
                {k.raw > 0 && k.unit && (
                  <span className="av-kpi-unit">{k.unit}</span>
                )}
              </div>
              <div className="av-kpi-label">{k.label}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── 3. REVENUE CHART + QUICK STATS ────────────────────────────── */}
      <motion.div
        variants={fadeUp} initial="hidden" animate="show"
        style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem' }}
      >
        {/* Chart */}
        <div className="av-chart-card">
          <div className="av-chart-header">
            <div>
              <h3 className="av-chart-title">Chiffre d'Affaires Mensuel</h3>
              <p className="av-chart-subtitle">Factures encaissées · 6 derniers mois</p>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {['3m', '6m', '1a'].map(p => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`av-tab ${chartPeriod === p ? 'active' : ''}`}
                  style={{ padding: '0.3rem 0.7rem', fontSize: '0.72rem' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 600 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tickFormatter={v => v === 0 ? '0' : `${(v/1e6).toFixed(0)}M`}
                  tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 600 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<DarkTooltip />} cursor={{ stroke: 'rgba(16,185,129,0.15)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="ca"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#34D399', stroke: '#060E1B', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="av-chart-legend" style={{ marginTop: '0.75rem' }}>
            <div className="av-chart-legend-item">
              <div className="av-chart-legend-dot" style={{ background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
              CA encaissé
            </div>
          </div>
        </div>

        {/* Side stat cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Health Score */}
          <div className="av-chart-card" style={{ flex: 1 }}>
            <p className="av-chart-subtitle" style={{ marginBottom: '0.5rem' }}>Score Opérationnel</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Radial progress visual */}
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                <circle
                  cx="36" cy="36" r="28" fill="none"
                  stroke="url(#scoreGrad)" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${hasData ? 120 : 20} 176`}
                  transform="rotate(-90 36 36)"
                  style={{ transition: 'stroke-dasharray 1s ease' }}
                />
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#10B981" />
                    <stop offset="100%" stopColor="#22D3EE" />
                  </linearGradient>
                </defs>
                <text x="36" y="39" textAnchor="middle" fill="#F0F6FF" fontSize="14" fontWeight="900" fontFamily="Outfit,sans-serif">
                  {hasData ? '68' : '—'}
                </text>
              </svg>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#F0F6FF', marginBottom: '0.2rem' }}>
                  {hasData ? 'Bon niveau' : 'À compléter'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', lineHeight: 1.5 }}>
                  {hasData
                    ? 'KPI principaux renseignés'
                    : 'Ajoutez vos premières données'}
                </div>
                {hasData && (
                  <div className="av-progress" style={{ marginTop: '0.5rem', width: 100 }}>
                    <div className="av-progress-fill" style={{ '--av-fill-color': '#10B981', width: '68%' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status snapshot */}
          <div className="av-chart-card" style={{ flex: 1 }}>
            <p className="av-chart-subtitle" style={{ marginBottom: '0.75rem' }}>Snapshot Opérations</p>
            {[
              { label: 'Commandes traitées', val: kpis[1]?.raw || 0, color: '#22D3EE' },
              { label: 'Employés actifs',    val: kpis[2]?.raw || 0, color: '#60A5FA' },
              { label: 'OF en cours',        val: kpis[3]?.raw || 0, color: '#A78BFA' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: s.color }}>{s.val || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── 4. ACTIVITY TABLE ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="av-table-wrap">
          <div className="av-table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="av-table-title">Activité Récente</span>
              <span className="av-table-count-pill">{recentItems.length}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div className="av-table-search">
                <Activity size={13} color="#94A3B8" />
                <input placeholder="Rechercher..." readOnly />
              </div>
              <button className="av-btn av-btn-secondary av-btn-sm">
                <Clock size={12} /> Filtrer
              </button>
            </div>
          </div>

          {recentItems.length === 0 ? (
            <div className="av-empty">
              <div className="av-empty-icon"><Activity size={22} /></div>
              <div className="av-empty-title">Aucune activité récente</div>
              <div className="av-empty-sub">
                Vos premières commandes et factures apparaîtront ici.
              </div>
            </div>
          ) : (
            <>
              <table className="av-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Client</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="wait">
                    {pagedItems.map((item, i) => {
                      const badge = getBadge(item.status);
                      const initials = item.client?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
                      const avatarColors = ['#10B981','#22D3EE','#A78BFA','#FBBF24','#F87171','#60A5FA'];
                      const avatarBg = avatarColors[i % avatarColors.length];
                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.2 }}
                        >
                          <td>
                            <span style={{ fontWeight: 700, color: '#F0F6FF', fontSize: '0.82rem' }}>
                              {item.label}
                            </span>
                          </td>
                          <td>
                            <div className="av-table-avatar-wrap">
                              <div className="av-table-avatar" style={{ background: avatarBg, width: 28, height: 28, fontSize: '0.65rem' }}>
                                {initials}
                              </div>
                              <div className="av-table-avatar-name" style={{ fontSize: '0.8rem' }}>{item.client}</div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 800, color: '#34D399', fontSize: '0.82rem' }}>
                            {item.amount > 0 ? `${fmtM(item.amount)} XOF` : '—'}
                          </td>
                          <td>
                            <span className={`av-badge ${badge.cls}`}>{badge.label}</span>
                          </td>
                          <td style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                            {item.date
                              ? new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                              : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={`av-badge ${item.type === 'invoice' ? 'av-badge-success' : 'av-badge-info'}`}
                              style={{ fontSize: '0.65rem' }}>
                              {item.type === 'invoice' ? 'Facture' : 'Commande'}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="av-table-footer">
                  <span className="av-table-footer-info">
                    {tablePage * TABLE_PAGE_SIZE + 1}–{Math.min((tablePage + 1) * TABLE_PAGE_SIZE, recentItems.length)} sur {recentItems.length}
                  </span>
                  <div className="av-pagination">
                    <button
                      className="av-page-btn"
                      onClick={() => setTablePage(p => Math.max(0, p - 1))}
                      disabled={tablePage === 0}
                    >‹</button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        className={`av-page-btn ${i === tablePage ? 'active' : ''}`}
                        onClick={() => setTablePage(i)}
                      >{i + 1}</button>
                    ))}
                    <button
                      className="av-page-btn"
                      onClick={() => setTablePage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={tablePage >= totalPages - 1}
                    >›</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* ── 5. QUICK ACTIONS ───────────────────────────────────────────── */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="av-action-card">
          <div className="av-section-label">
            <Star size={11} />
            Prochaines étapes
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem' }}>
            {[
              { Icon: Users,        label: 'Onboarder les employés',      hint: 'Module RH → Onboarding'         },
              { Icon: ShoppingCart, label: 'Créer le premier client',      hint: 'Module CRM → Nouveau prospect'  },
              { Icon: Package,      label: 'Référencer les produits',      hint: 'Module Stocks → Catalogue'      },
              { Icon: Wallet,       label: 'Configurer la trésorerie',     hint: 'Module Finance → Comptes'       },
              { Icon: Factory,      label: 'Lancer une production',        hint: 'Module Production → Ordre'      },
              { Icon: BarChart3,    label: 'Analyser les performances',    hint: 'Module BI → Tableau de bord'    },
            ].map((s, i) => {
              const Icon = s.Icon;
              return (
                <motion.div
                  key={i}
                  className="av-action-item"
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="av-action-icon">
                    <Icon size={15} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="av-action-title">{s.label}</div>
                    <div className="av-action-hint">{s.hint}</div>
                  </div>
                  <ArrowRight size={14} className="av-action-arrow" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

    </div>
  );
}
