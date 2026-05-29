/**
 * ════════════════════════════════════════════════════════════════════════════
 * ANTIGRAVITY OS — HOLDING EXECUTIVE COCKPIT
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Design language : Emil Kowalski × Linear × Apple × Bloomberg Terminal
 * Palette         : white premium — pure white / warm pearl / soft grey / near-black
 * Access          : HOLDING_CEO, HOLDING_CFO, SUPER_ADMIN (+ all holding roles)
 * Branding        : IPC Green Blocks Holding
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCounter from '../../components/Dashboard/AnimatedCounter';
import SafeResponsiveChart from '../../components/charts/SafeResponsiveChart';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  Landmark, BarChart3, Wallet, Scale, Globe, Building2, Key,
  TrendingUp, TrendingDown, Minus, Lock, Clock,
  CheckCircle2, AlertTriangle, ShieldAlert,
  Users, FileText, GitMerge, UserPlus, Construction, Activity,
} from 'lucide-react';
import { useStore } from '../../store';
import { FirestoreService } from '../../services/firestore.service';
import { useToastStore } from '../../store/useToastStore';
import { GROUP_ENTITIES, isHoldingRole } from '../../schemas/org.schema';
import { httpsCallable } from 'firebase/functions';
import { functions as fbFunctions } from '../../firebase/config';
import './HoldingOS.css';
import { logger } from '../../utils/logger';

// ── Lazy-loaded sub-modules ───────────────────────────────────────────────
const EntityManagementCenter = lazy(() => import('./tabs/EntityManagementCenter'));
const LicenseCenter          = lazy(() => import('./tabs/LicenseCenter'));
const CountryManagementCenter = lazy(() => import('./tabs/CountryManagementCenter'));

// ── Design tokens — Nexus Executive Dark ────────────────────────────────
// Mirror of HoldingOS.css CSS vars (used for inline styles only).
// Prefer CSS classes (.os-card, .os-btn, etc.) over inline styles.
const OS = {
  bg:       '#060E1B',
  surface:  '#0A1628',
  card:     '#0F1E34',
  cardHi:   '#142540',
  border:   'rgba(255,255,255,0.07)',
  borderMd: 'rgba(255,255,255,0.12)',
  borderHi: 'rgba(255,255,255,0.20)',
  track:    'rgba(255,255,255,0.04)',
  text:     '#F0F6FF',
  sub:      '#94A3B8',
  muted:    '#4A6580',
  dim:      '#2A3D52',
  accent:   '#10B981',
  accentHi: '#34D399',
  danger:   '#EF4444',
  warning:  '#F59E0B',
};

// Chart palette — light on dark
const OS_CHART = {
  stroke:  '#10B981',
  fill:    'rgba(16,185,129,0.08)',
  grid:    'rgba(255,255,255,0.04)',
  tick:    '#4A6580',
};

// ── Motion variants ──────────────────────────────────────────────────────
const FADE_UP = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
};
const STAGGER = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.055 } },
};

// ── Formatters ───────────────────────────────────────────────────────────
const fmt  = n => new Intl.NumberFormat('fr-CI', { maximumFractionDigits: 0 }).format(n);
const fmtM = n => n >= 1e9 ? `${(n/1e9).toFixed(2)} Md` : n >= 1e6 ? `${(n/1e6).toFixed(1)} M` : fmt(n);

// ── Default consolidated shape ────────────────────────────────────────────
// Real data loaded from `consolidated_reports/{latest}` in Firestore
// (populated by the aggregateHoldingMetrics Cloud Function every 15 min)
const EMPTY_CONSOLIDATED = {
  revenue: 0, ebitda: 0, cash: 0, headcount: 0, subsidiaries: 0,
  eliminations: 0, opex: 0, depreciation: 0, financialCosts: 0, taxes: 0, netResult: 0,
  subsidiaryPerf: [],
  _source: null,
};

// ── Tabs ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',    label: 'Vue Groupe',    Icon: Landmark   },
  { id: 'performance', label: 'Performance',   Icon: BarChart3  },
  { id: 'finance',     label: 'Consolidation', Icon: Wallet     },
  { id: 'governance',  label: 'Gouvernance',   Icon: Scale      },
  { id: 'countries',   label: 'Pays',          Icon: Globe      },
  { id: 'entities',    label: 'Entités',       Icon: Building2  },
  { id: 'licenses',    label: 'Licences',      Icon: Key        },
];

// ════════════════════════════════════════════════════════════════════════════
// LOGO COMPONENT
// ════════════════════════════════════════════════════════════════════════════

function IPCLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
      {/* Isometric cube mark — dark on white */}
      <svg width="30" height="26" viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Primary cube — large, center-left */}
        <path d="M2 20 L18 11 L34 20 L18 29 Z" fill="#0F0F10"/>
        <path d="M2 20 L2 36 L18 45 L18 29 Z" fill="rgba(0,0,0,0.28)"/>
        <path d="M34 20 L34 36 L18 45 L18 29 Z" fill="rgba(0,0,0,0.14)"/>
        {/* Secondary cube — elevated, right */}
        <path d="M30 8 L46 0 L62 8 L46 16 Z" fill="rgba(0,0,0,0.75)"/>
        <path d="M30 8 L30 24 L46 32 L46 16 Z" fill="rgba(0,0,0,0.22)"/>
        <path d="M62 8 L62 24 L46 32 L46 16 Z" fill="rgba(0,0,0,0.11)"/>
        {/* Connector block — bridging the two cubes */}
        <path d="M18 29 L34 20 L46 16 L46 32 L34 36 L18 45 Z" fill="rgba(0,0,0,0.07)"/>
      </svg>

      {/* Wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontSize: '8.5px', fontWeight: 700,
          letterSpacing: '0.24em', color: '#9CA3AF',
          textTransform: 'uppercase', lineHeight: 1,
          fontFamily: 'Inter, sans-serif',
        }}>
          I.P.C GREEN BLOCKS
        </span>
        <span style={{
          fontSize: '11px', fontWeight: 800,
          letterSpacing: '0.32em', color: '#0F0F10',
          textTransform: 'uppercase', lineHeight: 1,
          fontFamily: 'Inter, sans-serif',
        }}>
          HOLDING
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function HoldingCockpit() {
  // ⚠️ Use separate selectors — inline object selectors cause infinite re-renders in Zustand
  const userRole    = useStore(s => s.userRole || s.user?.role);
  const user        = useStore(s => s.user);
  const currentUser = useStore(s => s.currentUser);
  const role     = userRole;
  const callerUid = user?.uid || currentUser?.uid || null;

  const [tab, setTab]               = useState('overview');
  const [loading, setLoading]       = useState(true);
  const [metricsLoading, setMLoading] = useState(true);
  const [approvals, setApprovals]   = useState([]);
  const [consolidated, setConsolidated] = useState(EMPTY_CONSOLIDATED);

  const isAllowed = isHoldingRole(role);

  // ── 1. Live approvals — scoped to holding entity ─────────────────────────
  useEffect(() => {
    if (!isAllowed) return;
    let unsub;
    try {
      unsub = FirestoreService.subscribeToCollection(
        'intercompany_approvals',
        {
          where:   [{ field: 'status',     op: '==',   value: 'pending' }],
          orderBy: [{ field: '_createdAt', direction: 'desc' }],
          limit:   50,
        },
        docs => { setApprovals(docs); setLoading(false); }
      );
    } catch (err) {
      logger.warn('[HoldingCockpit] Firestore non disponible (mode DEV):', err.message);
      setLoading(false);
    }
    return () => typeof unsub === 'function' && unsub();
  }, [isAllowed]);

  // ── 2. Consolidated metrics — live from consolidated_reports ──────────────
  // The aggregateHoldingMetrics CF writes to consolidated_reports/latest
  // every 15 min. We subscribe for real-time cockpit updates.
  useEffect(() => {
    if (!isAllowed) return;
    let unsub;
    try {
      unsub = FirestoreService.subscribeToDocument(
        'consolidated_reports',
        'latest',
        (data) => {
          if (data) {
            setConsolidated({
              revenue:       data.revenue       || 0,
              ebitda:        data.ebitda        || 0,
              cash:          data.cash          || 0,
              headcount:     data.headcount     || 0,
              subsidiaries:  data.subsidiaries  || 0,
              eliminations:  data.eliminations  || 0,
              opex:          data.opex          || 0,
              depreciation:  data.depreciation  || 0,
              financialCosts:data.financialCosts || 0,
              taxes:         data.taxes         || 0,
              netResult:     data.netResult     || 0,
              subsidiaryPerf:Array.isArray(data.subsidiaryPerf) ? data.subsidiaryPerf : [],
              _source:       data._computedAt || null,
            });
          }
          setMLoading(false);
        }
      );
    } catch (err) {
      logger.warn('[HoldingCockpit] consolidated_reports indisponible:', err.message);
      setMLoading(false);
    }
    return () => typeof unsub === 'function' && unsub();
  }, [isAllowed]);

  // ── Access gate ─────────────────────────────────────────────────────────
  if (!isAllowed) {
    return (
      <div className="holding-os" style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', gap: 24,
      }} role="alert" aria-live="assertive">
        <IPCLogo />
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: OS.danger,
        }}>
          <Lock size={26} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: OS.text, margin: '0 0 8px', letterSpacing: '-0.01em' }}>
            Accès restreint
          </p>
          <p style={{ fontSize: 12, color: OS.muted, maxWidth: 340, lineHeight: 1.8, margin: 0 }}>
            Ce cockpit est réservé aux rôles<br />
            <span style={{ color: OS.sub, letterSpacing: '0.04em', fontWeight: 600 }}>
              HOLDING_CEO · HOLDING_CFO · SUPER_ADMIN
            </span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="holding-os">

      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <header className="os-topbar">
        <IPCLogo />

        {/* Tab navigation — scrollable on mobile */}
        <nav className="os-tab-nav" role="tablist" aria-label="Navigation Holding">
          {TABS.map(t => {
            const active = tab === t.id;
            const TabIcon = t.Icon;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                aria-controls={`os-panel-${t.id}`}
                id={`os-tab-${t.id}`}
                className={`os-tab-btn${active ? ' os-tab-btn--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <TabIcon size={12} strokeWidth={active ? 2.5 : 1.5} />
                {t.label}
                {active && (
                  <motion.div
                    layoutId="os-tab-line"
                    className="os-tab-line"
                    transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right status area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {approvals.length > 0 && (
            <span className="os-badge os-badge--alert" aria-live="polite">
              <Clock size={9} />
              {approvals.length} décision{approvals.length > 1 ? 's' : ''}
            </span>
          )}
          {/* Data freshness indicator */}
          {!metricsLoading && consolidated._source && (
            <span className="os-freshness" title="Données consolidées en temps réel">
              <span className="os-freshness-dot" aria-hidden="true" />
              Live
            </span>
          )}
          <span className="os-badge" aria-label={`Date : ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}>
            {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short',
            })}
          </span>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="os-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial="hidden"
            animate="show"
            exit="hidden"
            variants={FADE_UP}
          >
            {tab === 'overview'    && <OverviewTab consolidated={consolidated} loading={metricsLoading} onDrillDown={setTab} approvals={approvals} />}
            {tab === 'performance' && <PerformanceTab subsidiaryPerf={consolidated.subsidiaryPerf} loading={metricsLoading} />}
            {tab === 'finance'     && <FinanceTab consolidated={consolidated} loading={metricsLoading} />}
            {tab === 'governance'  && <GovernanceTab approvals={approvals} callerUid={callerUid} callerRole={role} loading={loading} />}
            {tab === 'countries'   && (
              <Suspense fallback={<TabLoader label="Country Management Center" />}>
                <CountryManagementCenter />
              </Suspense>
            )}
            {tab === 'entities'    && (
              <Suspense fallback={<TabLoader label="Entités Groupe" />}>
                <EntityManagementCenter />
              </Suspense>
            )}
            {tab === 'licenses'    && (
              <Suspense fallback={<TabLoader label="Licences SaaS" />}>
                <LicenseCenter />
              </Suspense>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: OVERVIEW
// ════════════════════════════════════════════════════════════════════════════

function OverviewTab({ consolidated, loading, onDrillDown, approvals = [] }) {
  const subsidiaryPerf = consolidated.subsidiaryPerf || [];
  const hasData = consolidated.revenue > 0 || consolidated.headcount > 0;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  const kpis = [
    { label: 'CA Consolidé',     rawValue: consolidated.revenue,      formatter: fmtM, unit: 'XOF', Icon: Wallet,    drillTab: 'finance',     color: OS.accent },
    { label: 'EBITDA Groupe',    rawValue: consolidated.ebitda,       formatter: fmtM, unit: 'XOF', Icon: BarChart3, drillTab: 'performance', color: '#60A5FA' },
    { label: 'Trésorerie',       rawValue: consolidated.cash,         formatter: fmtM, unit: 'XOF', Icon: Landmark,  drillTab: 'finance',     color: '#A78BFA' },
    { label: 'Effectif Total',   rawValue: consolidated.headcount,    formatter: fmt,  unit: '',    Icon: Users,     drillTab: 'entities',    color: OS.warning },
    { label: 'Filiales Actives', rawValue: consolidated.subsidiaries, formatter: v => String(v), unit: '', Icon: Building2, drillTab: 'entities', color: '#F472B6' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <div className="os-welcome-banner" role="banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p className="os-welcome-greeting" aria-hidden="true">
            {greeting} 👋
          </p>
          <h1 className="os-welcome-title">
            Vue d'ensemble du Groupe
          </h1>
          <p className="os-welcome-sub">
            {hasData
              ? `${consolidated.subsidiaries} filiale${consolidated.subsidiaries > 1 ? 's' : ''} actives · CA consolidé ${fmtM(consolidated.revenue)} XOF`
              : 'En attente des données consolidées de vos filiales…'}
          </p>
        </div>
        <div className="os-welcome-actions" style={{ position: 'relative', zIndex: 1 }}>
          <button
            className="os-btn os-btn--primary"
            onClick={() => onDrillDown?.('governance')}
            aria-label="Voir la file de gouvernance"
          >
            <Scale size={13} strokeWidth={2} />
            {approvals.length > 0 ? `${approvals.length} décision${approvals.length > 1 ? 's' : ''}` : 'Gouvernance'}
          </button>
          <button
            className="os-btn"
            onClick={() => onDrillDown?.('performance')}
          >
            <Activity size={13} strokeWidth={1.5} />
            Performance
          </button>
        </div>
      </div>

      {/* ── KPI grid ──────────────────────────────────────────────────────── */}
      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="show"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: 10,
        }}
        role="list"
        aria-label="Indicateurs clés du groupe"
      >
        {kpis.map(k => {
          const KpiIcon = k.Icon;
          return (
            <motion.div
              key={k.label}
              variants={FADE_UP}
              className="os-kpi-card"
              role="listitem button"
              tabIndex={0}
              aria-label={`${k.label}${k.rawValue ? ` : ${k.formatter(k.rawValue)}` : ''} — voir le détail`}
              onClick={() => onDrillDown?.(k.drillTab)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onDrillDown?.(k.drillTab)}
              whileTap={{ scale: 0.98 }}
            >
              {/* Top row: icon + YTD tag */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div
                  className="os-kpi-icon"
                  style={{
                    background: `${k.color}14`,
                    borderColor: `${k.color}25`,
                    color: k.color,
                  }}
                  aria-hidden="true"
                >
                  <KpiIcon size={15} strokeWidth={1.5} />
                </div>
                {hasData && <span className="os-kpi-ytd">YTD</span>}
              </div>

              {/* Value */}
              <div style={{ minHeight: 36 }}>
                {loading
                  ? <div className="os-skeleton" style={{ width: 72, height: 30 }} aria-hidden="true" />
                  : (
                    <span className="os-kpi-value" aria-label={k.formatter(k.rawValue)}>
                      <AnimatedCounter from={0} to={k.rawValue} duration={1.6} formatter={k.formatter} />
                    </span>
                  )
                }
              </div>

              {/* Label + unit */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="os-kpi-label">{k.label}</span>
                {k.unit && <span className="os-kpi-unit">{k.unit}</span>}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Section: Contribution par Filiale ─────────────────────────────── */}
      <OSSectionHeader title="Contribution par Filiale" sub="CA cumulé YTD" />

      {subsidiaryPerf.length === 0
        ? <EmptyState Icon={Building2}
            title="Aucune filiale n'a synchronisé ses métriques"
            subtitle="Les barres de contribution apparaîtront dès que les filiales remontent leurs données via consolidated_reports." />
        : (
          <div className="os-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...subsidiaryPerf].sort((a, b) => b.revenue - a.revenue).map(s => {
              const entity = GROUP_ENTITIES.find(e => e.id === s.id);
              const pct = consolidated.revenue > 0
                ? (s.revenue / consolidated.revenue * 100).toFixed(1)
                : '0.0';
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Building2 size={14} strokeWidth={1.5} style={{ color: OS.dim, flexShrink: 0 }} />
                  <div style={{ width: 150, fontSize: 12, color: OS.sub, fontWeight: 500, flexShrink: 0 }}>
                    {entity?.shortName || s.id}
                  </div>
                  <div className="os-progress-track">
                    <motion.div
                      className="os-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <div style={{ width: 100, textAlign: 'right', fontSize: 12, fontWeight: 600, color: OS.text }}>
                    {fmtM(s.revenue)} XOF
                  </div>
                  <div style={{ width: 38, textAlign: 'right', fontSize: 11, color: OS.dim }}>{pct}%</div>
                  <TrendBadge trend={s.trend} />
                </div>
              );
            })}
          </div>
        )
      }

      {/* ── Section: Alertes Stratégiques ─────────────────────────────────── */}
      <OSSectionHeader title="Alertes Stratégiques" sub="Signaux nécessitant votre attention" />
      <EmptyState Icon={ShieldAlert}
        title="Aucune alerte stratégique en cours"
        subtitle="Les signaux critiques apparaîtront automatiquement dès qu'une filiale remontera un indicateur hors seuil." />

    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: PERFORMANCE
// ════════════════════════════════════════════════════════════════════════════

function PerformanceTab({ subsidiaryPerf = [], loading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <OSSectionHeader
        title="Matrice Performance Groupe"
        sub="Benchmark multi-filiales — Scores opérationnels"
      />

      {/* Bar chart */}
      <div className="os-card" style={{ padding: '1.75rem' }}>
        <p className="os-section-title" style={{ marginBottom: 16 }}>Score de performance par filiale</p>
        <SafeResponsiveChart
          minHeight={200} fallbackHeight={200}
          isDataEmpty={subsidiaryPerf.length === 0}
          placeholderTitle={loading ? 'Chargement…' : 'Scores indisponibles'}
          placeholderSubtitle="Activé via consolidated_reports dès la mise en service des filiales."
        >
          <BarChart data={subsidiaryPerf.map(s => ({
            name: GROUP_ENTITIES.find(e => e.id === s.id)?.shortName || s.id,
            score: s.score,
          }))}>
            <CartesianGrid strokeDasharray="0" vertical={false} stroke={OS_CHART.grid} />
            <XAxis dataKey="name" axisLine={false} tickLine={false}
              tick={{ fill: OS_CHART.tick, fontSize: 11 }} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false}
              tick={{ fill: OS_CHART.tick, fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: '#FFFFFF', border: `1px solid rgba(0,0,0,0.10)`,
                borderRadius: 10, color: OS.text, fontSize: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}
              cursor={{ fill: OS.track }}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={28}>
              {subsidiaryPerf.map((s, i) => (
                <Cell key={i} fill={
                  s.score >= 90 ? 'rgba(0,0,0,0.80)' :
                  s.score >= 75 ? 'rgba(0,0,0,0.55)' :
                  s.score >= 60 ? 'rgba(0,0,0,0.35)' :
                                  'rgba(220,38,38,0.55)'
                } />
              ))}
            </Bar>
          </BarChart>
        </SafeResponsiveChart>
      </div>

      {/* Performance matrix table */}
      {subsidiaryPerf.length === 0
        ? <EmptyState Icon={BarChart3}
            title={loading ? 'Chargement des données…' : 'Matrice de performance vide'}
            subtitle="La matrice se peuplera via les Cloud Functions d'agrégation dès la mise en service des filiales." />
        : (
          <div className="os-card" style={{ overflow: 'hidden' }}>
            <table className="os-table">
              <thead>
                <tr>
                  {['Filiale','Secteur','CA (M XOF)','Croissance','Marge','Effectif','Score','Tendance'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...subsidiaryPerf].sort((a, b) => b.score - a.score).map(s => {
                  const entity = GROUP_ENTITIES.find(e => e.id === s.id);
                  return (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Building2 size={14} strokeWidth={1.5} style={{ color: OS.dim }} />
                          <div>
                            <div style={{ fontWeight: 600, color: OS.text, fontSize: 13 }}>{entity?.name}</div>
                            <div style={{ fontSize: 10, color: OS.dim, letterSpacing: '0.05em' }}>{entity?.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>{entity?.industry}</td>
                      <td style={{ fontWeight: 600, color: OS.text }}>{fmtM(s.revenue)}</td>
                      <td style={{
                        color: s.growth > 0 ? OS.accent : OS.danger,
                        fontWeight: 600,
                      }}>
                        {s.growth > 0 ? '↑ +' : '↓ '}{s.growth}%
                      </td>
                      <td style={{ color: OS.text }}>{s.margin}%</td>
                      <td className="os-col-hide-mobile">{fmt(s.headcount)}</td>
                      <td>
                        <span className={`os-score${
                          s.score >= 90 ? ' os-score--excellent' :
                          s.score >= 75 ? ' os-score--good'      :
                          s.score >= 60 ? ' os-score--warn'      :
                                          ' os-score--bad'
                        }`}>
                          {s.score}
                        </span>
                      </td>
                      <td><TrendBadge trend={s.trend} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      }

      {/* Legend */}
      <div className="os-card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: OS.muted, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: 4 }}>Score</span>
          {[
            { range: '90–100', label: 'Excellence',  cls: 'os-score--excellent' },
            { range: '75–89',  label: 'Bon',         cls: 'os-score--good'      },
            { range: '60–74',  label: 'Acceptable',  cls: 'os-score--warn'      },
            { range: '0–59',   label: 'Insuffisant', cls: 'os-score--bad'       },
          ].map(l => (
            <div key={l.range} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span className={`os-score ${l.cls}`} style={{ fontSize: 10, minWidth: 36, height: 18 }}>{l.range}</span>
              <span style={{ fontSize: 11, color: OS.muted }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: FINANCIAL CONSOLIDATION
// ════════════════════════════════════════════════════════════════════════════

function FinanceTab({ consolidated, loading }) {
  const hasData = consolidated.revenue > 0;

  const rows = hasData ? [
    { label: 'Chiffre d\'Affaires Brut',     value: consolidated.revenue },
    { label: 'Éliminations Intercompany',    value: -(consolidated.eliminations || 0), sign: '-' },
    { label: 'CA Consolidé Net',              value: consolidated.revenue - (consolidated.eliminations || 0), bold: true },
    { label: 'Charges Opérationnelles',      value: -(consolidated.opex || 0), sign: '-' },
    { label: 'EBITDA Consolidé',             value: consolidated.ebitda, bold: true },
    { label: 'Amortissements & Provisions',  value: -(consolidated.depreciation || 0), sign: '-' },
    { label: 'Résultat Opérationnel (EBIT)', value: consolidated.ebitda - (consolidated.depreciation || 0), bold: true },
    { label: 'Charges Financières Nettes',   value: -(consolidated.financialCosts || 0), sign: '-' },
    { label: 'Résultat Avant Impôts',        value: consolidated.ebitda - (consolidated.depreciation || 0) - (consolidated.financialCosts || 0), bold: true },
    { label: 'Impôts sur les Sociétés',      value: -(consolidated.taxes || 0), sign: '-' },
    { label: 'Résultat Net Consolidé',       value: consolidated.netResult || 0, bold: true, accent: true },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <OSSectionHeader
        title="Consolidation Financière Groupe"
        sub="Compte de résultat consolidé — YTD 2026"
      />

      {!hasData
        ? <EmptyState Icon={Wallet}
            title={loading ? 'Chargement de la consolidation…' : 'Aucune donnée financière consolidée'}
            subtitle="Le compte de résultat sera généré automatiquement via consolidated_reports dès que les filiales remontent leurs métriques." />
        : (
          <div className="os-card" style={{ overflow: 'hidden' }}>
            {rows.map((row, i) => (
              <div key={i} style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '10px 24px',
                background:     row.accent
                  ? 'rgba(16,185,129,0.05)'
                  : row.bold ? 'rgba(255,255,255,0.025)' : 'transparent',
                borderBottom: i < rows.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none',
                transition:   'background 0.15s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {row.bold && (
                    <div style={{
                      width:        2,
                      height:       14,
                      borderRadius: 2,
                      background:   row.accent ? OS.accent : OS.muted,
                      flexShrink:   0,
                    }} />
                  )}
                  <span style={{
                    fontSize:    row.bold ? 13 : 12,
                    fontWeight:  row.bold ? 600 : 400,
                    color:       row.accent ? OS.accent : row.bold ? OS.text : OS.sub,
                    paddingLeft: row.bold ? 0 : 12,
                  }}>
                    {row.label}
                  </span>
                </div>
                <span style={{
                  fontSize:           row.bold ? 14 : 12,
                  fontWeight:         row.bold ? 700 : 400,
                  color:              row.value < 0 ? OS.danger : row.bold ? OS.text : OS.sub,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing:      '-0.01em',
                }}>
                  {row.value < 0 ? '(' : ''}{fmtM(Math.abs(row.value))} XOF{row.value < 0 ? ')' : ''}
                </span>
              </div>
            ))}
          </div>
        )
      }

      {/* Projection Trésorerie */}
      <OSSectionHeader title="Projection Trésorerie Groupe" sub="Activée post-mise en service filiales" />
      <div className="os-card" style={{ padding: '1.5rem' }}>
        <SafeResponsiveChart
          minHeight={180} fallbackHeight={180}
          isDataEmpty={true}
          placeholderTitle="Projection indisponible"
          placeholderSubtitle="Chargée depuis consolidated_reports dès la mise en service des filiales."
        >
          <AreaChart data={[]}>
            <defs>
              <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={OS_CHART.stroke} stopOpacity={0.15} />
                <stop offset="95%" stopColor={OS_CHART.stroke} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="cash" stroke={OS_CHART.stroke} fill="url(#cashGrad)" strokeWidth={1.5} />
          </AreaChart>
        </SafeResponsiveChart>
      </div>

      {/* Flux Intercompany */}
      <OSSectionHeader title="Flux Intercompany" sub="Transactions entre entités en attente d'élimination" />
      <EmptyState Icon={GitMerge}
        title="Aucun flux intercompany en cours"
        subtitle="Les transactions entre entités apparaîtront dès leur enregistrement dans le module Finance de chaque filiale." />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: GOVERNANCE
// ════════════════════════════════════════════════════════════════════════════

const GOVERNANCE_ICONS = {
  'Budget':         { Icon: FileText,     },
  'Interco':        { Icon: GitMerge,     },
  'Recrutement':    { Icon: UserPlus,     },
  'Investissement': { Icon: Construction, },
};

function GovernanceTab({ approvals, callerUid, callerRole, loading }) {
  // Optimistic UI state — keyed by item.id
  // Value: 'pending' | 'approved' | 'rejected' | 'processing'
  const [processed, setProcessed] = React.useState({});

  // [FIX-02] Use Cloud Function to validate approvals server-side.
  // Falls back to direct Firestore write in DEV mode only.
  const approveGovernanceItem  = React.useMemo(() => httpsCallable(fbFunctions, 'approveGovernanceItem'), []);
  const rejectGovernanceItem   = React.useMemo(() => httpsCallable(fbFunctions, 'rejectGovernanceItem'), []);

  const handleApprove = async (item) => {
    if (processed[item.id] === 'processing') return; // [SEC-01] prevent double-submit
    setProcessed(p => ({ ...p, [item.id]: 'processing' }));
    try {
      // Server-side: validates caller role, writes audit log, sets approvedBy = auth.uid
      await approveGovernanceItem({ itemId: item.id });
      setProcessed(p => ({ ...p, [item.id]: 'approved' }));
      useToastStore.getState().addToast(`Approuvé : ${item.description || item.id}`, 'success');
    } catch (err) {
      logger.error('[Governance] Approve failed:', err.message);
      useToastStore.getState().addToast(`Erreur lors de l'approbation : ${err.message}`, 'error');
      setProcessed(p => { const n = { ...p }; delete n[item.id]; return n; });
    }
  };

  const handleReject = async (item) => {
    if (processed[item.id] === 'processing') return; // [SEC-01] prevent double-submit
    setProcessed(p => ({ ...p, [item.id]: 'processing' }));
    try {
      await rejectGovernanceItem({ itemId: item.id });
      setProcessed(p => ({ ...p, [item.id]: 'rejected' }));
      useToastStore.getState().addToast(`Rejeté : ${item.description || item.id}`, 'info');
    } catch (err) {
      logger.error('[Governance] Reject failed:', err.message);
      useToastStore.getState().addToast(`Erreur lors du rejet : ${err.message}`, 'error');
      setProcessed(p => { const n = { ...p }; delete n[item.id]; return n; });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <OSSectionHeader
          title="File de Gouvernance Holding"
          sub="Décisions stratégiques en attente de validation"
        />
        {approvals.length > 0 && (
          <span className="os-badge">
            <Clock size={10} strokeWidth={2} />
            <AnimatedCounter
              from={0} to={approvals.length} duration={0.6}
              formatter={v => String(Math.round(v))}
            />
            {' '}décision{approvals.length > 1 ? 's' : ''} en attente
          </span>
        )}
      </div>

      {approvals.length === 0
        ? <EmptyState Icon={Scale}
            title="Aucune décision en attente"
            subtitle="Les demandes de validation (budgets, recrutements, investissements, flux intercompany) apparaîtront ici dès leur soumission par les filiales." />
        : (
          <motion.div variants={STAGGER} initial="hidden" animate="show"
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approvals.map(item => {
              const status = processed[item.id] || item.status || 'pending';
              const cfg = GOVERNANCE_ICONS[item.type] || { Icon: FileText };
              const TypeIcon = cfg.Icon;

              return (
                <motion.div
                  key={item.id}
                  variants={FADE_UP}
                  className={`os-governance-card${
                    status === 'approved'  ? ' os-governance-card--approved'  :
                    status === 'rejected'  ? ' os-governance-card--rejected'  :
                    status === 'processing' ? ' os-governance-card--processing' : ''
                  }`}
                  aria-label={`${item.title || item.description || 'Demande'} — statut: ${status}`}
                >
                  {/* Icon */}
                  <div className={`os-governance-icon${item.urgency === 'high' ? ' os-governance-icon--urgent' : ''}`}>
                    <TypeIcon size={16} strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: OS.text, lineHeight: 1.3 }}>
                        {item.title || item.description || `Demande ${item.type}`}
                      </span>
                      {item.urgency === 'high' && (
                        <span className="os-badge os-badge--warning" style={{ fontSize: 10 }}>
                          Urgent
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: OS.muted, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {item.entityName || item.entity_id ? (
                        <span>{item.entityName || item.entity_id}</span>
                      ) : null}
                      {item.type        && <span>· {item.type}</span>}
                      {item.requestedBy && <span>· {item.requestedBy}</span>}
                      {item._createdAt  && (
                        <span>· {new Date(
                          item._createdAt?.seconds ? item._createdAt.seconds * 1000 : item._createdAt
                        ).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {(status === 'pending' || status === 'processing') ? (
                    <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                      <button
                        className="os-btn os-btn--primary"
                        onClick={() => handleApprove(item)}
                        disabled={status === 'processing'}
                        style={{ opacity: status === 'processing' ? 0.6 : 1 }}
                      >
                        <CheckCircle2 size={11} strokeWidth={2.5} />
                        {status === 'processing' ? '…' : 'Valider'}
                      </button>
                      <button
                        className="os-btn os-btn--danger"
                        onClick={() => handleReject(item)}
                        disabled={status === 'processing'}
                        style={{ opacity: status === 'processing' ? 0.6 : 1 }}
                      >
                        <AlertTriangle size={11} strokeWidth={2.5} />
                        {status === 'processing' ? '…' : 'Refuser'}
                      </button>
                    </div>
                  ) : (
                    <span className={`os-badge ${status === 'approved' ? 'os-badge--active' : 'os-badge--alert'}`}>
                      {status === 'approved' ? '✓ Validé' : '✕ Refusé'}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function OSSectionHeader({ title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
      <p className="os-section-title">{title}</p>
      {sub && (
        <span style={{ fontSize: 11, color: OS.dim, fontWeight: 400 }}>{sub}</span>
      )}
    </div>
  );
}

function TrendBadge({ trend }) {
  if (trend === 'up')
    return <TrendingUp   size={13} strokeWidth={1.5} style={{ color: OS.sub, flexShrink: 0 }} />;
  if (trend === 'down')
    return <TrendingDown size={13} strokeWidth={1.5} style={{ color: '#DC2626', flexShrink: 0 }} />;
  return <Minus size={13} strokeWidth={1.5} style={{ color: OS.dim, flexShrink: 0 }} />;
}

function EmptyState({ Icon, title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="os-empty"
      role="status"
      aria-label={title}
    >
      <Icon size={26} strokeWidth={1} className="os-empty-icon" aria-hidden="true" />
      <div className="os-empty-title">{title}</div>
      <div className="os-empty-sub">{subtitle}</div>
    </motion.div>
  );
}

function TabLoader({ label }) {
  return (
    <div style={{ padding: '3rem 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[260, 200, 240, 170, 210].map((w, i) => (
        <div key={i} className="os-skeleton"
          style={{ height: 14, width: w, borderRadius: 4 }} />
      ))}
      <div style={{
        marginTop: 10, color: OS.muted, fontSize: 11,
        letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        Chargement {label}…
      </div>
    </div>
  );
}
