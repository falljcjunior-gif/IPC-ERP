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
import { GROUP_ENTITIES, isHoldingRole } from '../../schemas/org.schema';
import './HoldingOS.css';

// ── Lazy-loaded sub-modules ───────────────────────────────────────────────
const EntityManagementCenter = lazy(() => import('./tabs/EntityManagementCenter'));
const LicenseCenter          = lazy(() => import('./tabs/LicenseCenter'));
const CountryManagementCenter = lazy(() => import('./tabs/CountryManagementCenter'));

// ── Design tokens (white premium) ────────────────────────────────────────
const OS = {
  bg:       '#FFFFFF',
  surface:  '#F9FAFB',
  card:     '#FFFFFF',
  cardHi:   '#F5F5F5',
  modal:    '#FFFFFF',
  border:   'rgba(0,0,0,0.07)',
  borderMd: 'rgba(0,0,0,0.12)',
  borderHi: 'rgba(0,0,0,0.20)',
  track:    'rgba(0,0,0,0.04)',
  text:     '#0F0F10',
  sub:      '#6B7280',
  muted:    '#9CA3AF',
  dim:      '#D1D5DB',
  black:    '#000000',
  overlay:  'rgba(0,0,0,0.40)',
};

// Chart palette — dark on white
const OS_CHART = {
  stroke:  'rgba(0,0,0,0.55)',
  fill:    'rgba(0,0,0,0.04)',
  grid:    'rgba(0,0,0,0.05)',
  tick:    '#9CA3AF',
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

// ── Data ─────────────────────────────────────────────────────────────────
const SUBSIDIARY_PERF = []; // Loaded from consolidated_reports (Cloud Functions)

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
  const role = useStore(s => s.userRole || s.user?.role);
  const [tab, setTab]             = useState('overview');
  const [loading, setLoading]     = useState(true);
  const [approvals, setApprovals] = useState([]);

  const isAllowed = isHoldingRole(role);

  useEffect(() => {
    if (!isAllowed) return;
    let unsub;
    try {
      unsub = FirestoreService.subscribeToCollection(
        'intercompany_approvals',
        docs => { setApprovals(docs.filter(d => d.status === 'pending')); setLoading(false); },
        { orderBy: [{ field: '_createdAt', direction: 'desc' }], limit: 20 }
      );
    } catch (err) {
      console.warn('[HoldingCockpit] Firestore non disponible (mode DEV):', err.message);
      setLoading(false);
    }
    return () => typeof unsub === 'function' && unsub();
  }, [isAllowed]);

  // ── Access gate ─────────────────────────────────────────────────────────
  if (!isAllowed) {
    return (
      <div className="holding-os" style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', gap: 0,
      }}>
        <IPCLogo />
        <div style={{ margin: '52px 0 20px', color: OS.dim }}>
          <Lock size={28} strokeWidth={1} />
        </div>
        <div style={{
          fontSize: 15, fontWeight: 500, color: OS.sub,
          letterSpacing: '-0.01em',
        }}>
          Accès réservé au Groupe
        </div>
        <div style={{
          fontSize: 12, color: OS.muted, textAlign: 'center',
          maxWidth: 340, lineHeight: 1.8, marginTop: 12,
        }}>
          Ce cockpit est accessible aux rôles<br />
          <span style={{ color: OS.dim, letterSpacing: '0.04em' }}>
            HOLDING_CEO · HOLDING_CFO · SUPER_ADMIN
          </span>
        </div>
      </div>
    );
  }

  const consolidated = SUBSIDIARY_PERF.reduce(
    (acc, s) => ({ revenue: acc.revenue + s.revenue, headcount: acc.headcount + s.headcount }),
    { revenue: 0, headcount: 0 }
  );
  Object.assign(consolidated, {
    ebitda: 0, subsidiaries: SUBSIDIARY_PERF.length, cash: 0,
  });

  return (
    <div className="holding-os">

      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <header className="os-topbar">
        <IPCLogo />

        {/* Tab navigation */}
        <nav style={{
          flex: 1, display: 'flex', alignItems: 'stretch',
          height: '100%', overflow: 'hidden',
        }}>
          {TABS.map(t => {
            const active = tab === t.id;
            const TabIcon = t.Icon;
            return (
              <button
                key={t.id}
                className="os-tab-btn"
                onClick={() => setTab(t.id)}
                style={{
                  fontWeight: active ? 600 : 400,
                  color: active ? OS.text : OS.muted,
                }}
              >
                <TabIcon size={12} strokeWidth={active ? 2 : 1.5} />
                {t.label}
                {active && (
                  <motion.div
                    layoutId="os-tab-line"
                    style={{
                      position: 'absolute', bottom: 0, left: 8, right: 8,
                      height: 1.5, background: OS.black, borderRadius: 2,
                    }}
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
            <span className="os-badge os-badge--alert">
              <Clock size={9} />
              {approvals.length} décision{approvals.length > 1 ? 's' : ''}
            </span>
          )}
          <span className="os-badge">
            {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short', year: 'numeric',
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
            {tab === 'overview'    && <OverviewTab consolidated={consolidated} loading={loading} />}
            {tab === 'performance' && <PerformanceTab />}
            {tab === 'finance'     && <FinanceTab consolidated={consolidated} />}
            {tab === 'governance'  && <GovernanceTab approvals={approvals} />}
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

function OverviewTab({ consolidated, loading }) {
  const hasData = consolidated.revenue > 0 || consolidated.headcount > 0;

  const kpis = [
    { label: 'CA Consolidé',     rawValue: consolidated.revenue,      formatter: fmtM, unit: 'XOF', Icon: Wallet    },
    { label: 'EBITDA Groupe',    rawValue: consolidated.ebitda,       formatter: fmtM, unit: 'XOF', Icon: BarChart3 },
    { label: 'Trésorerie',       rawValue: consolidated.cash,         formatter: fmtM, unit: 'XOF', Icon: Landmark  },
    { label: 'Effectif Total',   rawValue: consolidated.headcount,    formatter: fmt,  unit: 'EMP', Icon: Users     },
    { label: 'Filiales Actives', rawValue: consolidated.subsidiaries, formatter: v => String(v), unit: '', Icon: Building2 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ── KPI grid ──────────────────────────────────────────────────────── */}
      <motion.div variants={STAGGER} initial="hidden" animate="show" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12,
      }}>
        {kpis.map(k => {
          const KpiIcon = k.Icon;
          return (
            <motion.div key={k.label} variants={FADE_UP} className="os-card"
              style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 24,
              }}>
                <KpiIcon size={15} strokeWidth={1.5} style={{ color: OS.dim }} />
                {hasData && (
                  <span style={{ fontSize: 10, color: OS.dim, fontWeight: 500,
                    letterSpacing: '0.05em' }}>YTD</span>
                )}
              </div>

              {/* Value */}
              <div style={{
                fontSize: '2rem', fontWeight: 300,
                letterSpacing: '-0.045em', color: OS.text,
                lineHeight: 1, minHeight: 36,
              }}>
                {loading
                  ? <div className="os-skeleton" style={{ width: 72, height: 30 }} />
                  : <AnimatedCounter from={0} to={k.rawValue} duration={1.6} formatter={k.formatter} />
                }
              </div>

              {/* Label + unit row */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.16em',
                  textTransform: 'uppercase', color: OS.muted,
                }}>
                  {k.label}
                </span>
                {k.unit && (
                  <span style={{ fontSize: '0.6rem', color: OS.dim, letterSpacing: '0.08em' }}>
                    {k.unit}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── Section: Contribution par Filiale ─────────────────────────────── */}
      <OSSectionHeader title="Contribution par Filiale" sub="CA cumulé YTD" />

      {SUBSIDIARY_PERF.length === 0
        ? <EmptyState Icon={Building2}
            title="Aucune filiale n'a synchronisé ses métriques"
            subtitle="Les barres de contribution apparaîtront dès que les filiales remontent leurs données via consolidated_reports." />
        : (
          <div className="os-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...SUBSIDIARY_PERF].sort((a, b) => b.revenue - a.revenue).map(s => {
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
                  <div style={{ flex: 1, height: 3, borderRadius: 99, background: OS.track }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: '100%', borderRadius: 99, background: OS.sub }}
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

function PerformanceTab() {
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
          isDataEmpty={SUBSIDIARY_PERF.length === 0}
          placeholderTitle="Scores indisponibles"
          placeholderSubtitle="Activé via consolidated_reports dès la mise en service des filiales."
        >
          <BarChart data={SUBSIDIARY_PERF.map(s => ({
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
              {SUBSIDIARY_PERF.map((s, i) => (
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
      {SUBSIDIARY_PERF.length === 0
        ? <EmptyState Icon={BarChart3}
            title="Matrice de performance vide"
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
                {[...SUBSIDIARY_PERF].sort((a, b) => b.score - a.score).map(s => {
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
                      <td style={{ color: s.growth > 0 ? OS.text : '#DC2626', fontWeight: 600 }}>
                        {s.growth > 0 ? '+' : ''}{s.growth}%
                      </td>
                      <td>{s.margin}%</td>
                      <td>{s.headcount}</td>
                      <td><span className="os-score">{s.score}</span></td>
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
      <div className="os-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          {[
            { range: '90–100', label: 'Excellence',  opacity: 0.80 },
            { range: '75–89',  label: 'Bon',         opacity: 0.55 },
            { range: '60–74',  label: 'Acceptable',  opacity: 0.35 },
            { range: '0–59',   label: 'Insuffisant', color: 'rgba(220,38,38,0.55)' },
          ].map(l => (
            <div key={l.range} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                background: l.color || `rgba(0,0,0,${l.opacity})`,
              }} />
              <span style={{ fontSize: 11, color: OS.muted }}>
                <strong style={{ color: OS.sub }}>{l.range}</strong> — {l.label}
              </span>
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

function FinanceTab({ consolidated }) {
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
            title="Aucune donnée financière consolidée"
            subtitle="Le compte de résultat sera généré automatiquement via consolidated_reports dès que les filiales remontent leurs métriques." />
        : (
          <div className="os-card" style={{ overflow: 'hidden' }}>
            {rows.map((row, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 24px',
                background: row.accent
                  ? 'rgba(0,0,0,0.03)'
                  : row.bold ? 'rgba(0,0,0,0.015)' : 'transparent',
                borderBottom: i < rows.length - 1 ? `1px solid rgba(0,0,0,0.05)` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {row.bold && (
                    <div style={{
                      width: 2, height: 14, borderRadius: 2,
                      background: row.accent ? OS.text : OS.dim,
                    flexShrink: 0,
                    }} />
                  )}
                  <span style={{
                    fontSize: row.bold ? 13 : 12,
                    fontWeight: row.bold ? 600 : 400,
                    color: row.accent ? OS.text : row.bold ? OS.sub : OS.muted,
                    paddingLeft: row.bold ? 0 : 12,
                  }}>
                    {row.label}
                  </span>
                </div>
                <span style={{
                  fontSize: row.bold ? 14 : 12,
                  fontWeight: row.bold ? 700 : 400,
                  color: row.value < 0 ? '#DC2626' : row.bold ? OS.text : OS.muted,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
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

function GovernanceTab({ approvals }) {
  const [processed, setProcessed] = React.useState({});

  const handleApprove = async (item) => {
    setProcessed(p => ({ ...p, [item.id]: 'approved' }));
    try {
      await FirestoreService.updateDocument('intercompany_approvals', item.id, {
        status: 'approved',
        approvedBy: 'HOLDING_CEO',
        approvedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Governance] Approve (dev mode):', err.message);
    }
  };

  const handleReject = async (item) => {
    setProcessed(p => ({ ...p, [item.id]: 'rejected' }));
    try {
      await FirestoreService.updateDocument('intercompany_approvals', item.id, {
        status: 'rejected',
        rejectedBy: 'HOLDING_CEO',
        rejectedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[Governance] Reject (dev mode):', err.message);
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
                <motion.div key={item.id} variants={FADE_UP} className="os-card"
                  style={{
                    padding: '1.125rem 1.5rem',
                    display: 'flex', alignItems: 'center', gap: 16,
                    border: status === 'approved'
                      ? '1px solid rgba(0,0,0,0.10)'
                      : status === 'rejected'
                      ? '1px solid rgba(220,38,38,0.15)'
                      : undefined,
                  }}>
                  {/* Icon */}
                  <div style={{
                    width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                    background: 'rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <TypeIcon size={16} strokeWidth={1.5} style={{ color: OS.muted }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: OS.text }}>
                        {item.title || item.description || `Demande ${item.type}`}
                      </span>
                      {item.urgency === 'high' && (
                        <span className="os-badge os-badge--alert" style={{ fontSize: 10 }}>
                          Urgent
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: OS.muted }}>
                      {item.entityName || item.entity_id}
                      {item.type && ` · ${item.type}`}
                      {item.requestedBy && ` · ${item.requestedBy}`}
                      {item._createdAt && ` · ${new Date(
                        item._createdAt?.seconds ? item._createdAt.seconds * 1000 : item._createdAt
                      ).toLocaleDateString('fr-FR')}`}
                    </div>
                  </div>

                  {/* Actions */}
                  {status === 'pending' ? (
                    <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                      <button className="os-btn os-btn--primary" onClick={() => handleApprove(item)}>
                        <CheckCircle2 size={11} strokeWidth={2.5} />
                        Valider
                      </button>
                      <button className="os-btn os-btn--danger" onClick={() => handleReject(item)}>
                        <AlertTriangle size={11} strokeWidth={2.5} />
                        Refuser
                      </button>
                    </div>
                  ) : (
                    <span className="os-badge" style={{
                      background: status === 'approved'
                        ? 'rgba(0,0,0,0.04)' : 'rgba(220,38,38,0.06)',
                      color: status === 'approved'
                        ? OS.sub : 'rgba(220,38,38,0.8)',
                      borderColor: status === 'approved'
                        ? OS.border : 'rgba(220,38,38,0.2)',
                    }}>
                      {status === 'approved' ? 'Validé' : 'Refusé'}
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
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '3.5rem 2rem', textAlign: 'center',
        border: `1px dashed rgba(0,0,0,0.10)`,
        borderRadius: 12, gap: 14,
      }}
    >
      <Icon size={26} strokeWidth={1} style={{ color: 'rgba(0,0,0,0.15)' }} />
      <div style={{ fontSize: 13, fontWeight: 500, color: OS.sub }}>{title}</div>
      <div style={{ fontSize: 12, color: OS.muted, maxWidth: 380, lineHeight: 1.7 }}>{subtitle}</div>
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
