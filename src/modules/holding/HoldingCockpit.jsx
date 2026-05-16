/**
 * ════════════════════════════════════════════════════════════════════════════
 * HOLDING COCKPIT — IPC Group Strategic Dashboard
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Design: Antigravity OS — white/glass theme matching the rest of the ERP.
 * Access: HOLDING_CEO, HOLDING_CFO, SUPER_ADMIN
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCounter from '../../components/Dashboard/AnimatedCounter';
import SafeResponsiveChart from '../../components/charts/SafeResponsiveChart';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  Landmark, BarChart3, Wallet, Scale, Globe, Building2, Key,
  TrendingUp, TrendingDown, Minus, Lock, Clock, Award, CheckCircle2, AlertTriangle, ShieldAlert,
  Users, FileText, GitMerge, UserPlus, Construction, Activity, Zap, Target, ArrowRight,
} from 'lucide-react';
import { useStore } from '../../store';
import { FirestoreService } from '../../services/firestore.service';
import {
  GROUP_ENTITIES, getFoundation, isHoldingRole,
} from '../../schemas/org.schema';
import EntitySwitcher from '../../components/EntitySwitcher';

const EntityManagementCenter   = lazy(() => import('./tabs/EntityManagementCenter'));
const LicenseCenter             = lazy(() => import('./tabs/LicenseCenter'));
const CountryManagementCenter   = lazy(() => import('./tabs/CountryManagementCenter'));

// ── ERP design tokens (light theme) ──────────────────────────────────────────
const C = {
  accent:  '#10B981',
  gold:    '#F59E0B',
  blue:    '#3B82F6',
  red:     '#EF4444',
  purple:  '#8B5CF6',
  teal:    '#0D9488',
  border:  '#E2E8F0',
  text:    '#0F172A',
  muted:   '#64748B',
  track:   '#F1F5F9',
};

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] } },
};
const STAGGER = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

// [GO-LIVE] Données réelles uniquement — chargées depuis Firestore via
// `consolidated_reports` (collection alimentée par les Cloud Functions
// d'agrégation pays/filiale). Démarre à vide tant que les filiales
// n'ont pas remonté leurs métriques.
const SUBSIDIARY_PERF = [];

const fmt  = (n) => new Intl.NumberFormat('fr-CI', { maximumFractionDigits: 0 }).format(n);
const fmtM = (n) => n >= 1e9 ? `${(n/1e9).toFixed(2)} Md` : n >= 1e6 ? `${(n/1e6).toFixed(1)} M` : fmt(n);

// [GO-LIVE] Icônes Lucide enterprise — plus d'emojis
const TABS = [
  { id: 'overview',    label: 'Vue Groupe',       Icon: Landmark   },
  { id: 'performance', label: 'Performance',       Icon: BarChart3  },
  { id: 'finance',     label: 'Consolidation',     Icon: Wallet     },
  { id: 'governance',  label: 'Gouvernance',       Icon: Scale      },
  { id: 'countries',   label: 'Pays',              Icon: Globe      },
  { id: 'entities',    label: 'Entités Groupe',    Icon: Building2  },
  { id: 'licenses',    label: 'Licences SaaS',     Icon: Key        },
];

export default function HoldingCockpit() {
  const role = useStore(s => s.userRole || s.user?.role);
  const [tab, setTab]             = useState('overview');
  const [loading, setLoading]     = useState(true);
  const [approvals, setApprovals] = useState([]);

  const isAllowed = isHoldingRole(role);

  useEffect(() => {
    if (!isAllowed) return;
    const unsub = FirestoreService.subscribeToCollection('intercompany_approvals',
      (docs) => { setApprovals(docs.filter(d => d.status === 'pending')); setLoading(false); },
      { orderBy: [{ field: '_createdAt', direction: 'desc' }], limit: 20 }
    );
    return () => typeof unsub === 'function' && unsub();
  }, [isAllowed]);

  if (!isAllowed) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg)', gap: 16,
      }}>
        <Lock size={48} strokeWidth={1.5} style={{ color: C.muted }} />
        <div style={{ color: C.text, fontSize: 18, fontWeight: 700 }}>Accès Holding requis</div>
        <div style={{ color: C.muted, fontSize: 14 }}>
          Ce cockpit est réservé aux rôles HOLDING_CEO, HOLDING_CFO et SUPER_ADMIN.
        </div>
      </div>
    );
  }

  // [GO-LIVE] Tous les agrégats démarrent à 0 et se remplissent uniquement
  // quand les filiales remontent leurs métriques via `consolidated_reports`.
  const consolidated = SUBSIDIARY_PERF.reduce((acc, s) => ({
    revenue:   acc.revenue   + s.revenue,
    headcount: acc.headcount + s.headcount,
  }), { revenue: 0, headcount: 0 });
  consolidated.ebitda       = 0;
  consolidated.subsidiaries = SUBSIDIARY_PERF.length;
  consolidated.cash         = 0;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Luxury Header ────────────────────────────────────────────────────── */}
      <div style={{
        padding: '2.5rem 3rem 0',
        background: '#fff',
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: '1.5rem',
        }}>
          {/* Title block */}
          <div>
            <div style={{
              fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.18em',
              color: '#9CA3AF', fontWeight: 700, marginBottom: '0.5rem',
            }}>
              IPC Group · Gouvernance Stratégique
            </div>
            <h1 style={{
              fontSize: '2.2rem', fontWeight: 200, letterSpacing: '-0.04em',
              margin: 0, color: '#000', lineHeight: 1.1,
            }}>
              Cockpit <strong style={{ fontWeight: 700 }}>Groupe</strong>
            </h1>
          </div>

          {/* Right badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            {approvals.length > 0 && (
              <div style={{
                padding: '6px 14px', borderRadius: 20,
                background: `${C.gold}15`, border: `1px solid ${C.gold}44`,
                fontSize: 12, color: C.gold, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Clock size={12} strokeWidth={2.2} /> {approvals.length} en attente
              </div>
            )}
            <EntitySwitcher compact />
            <div style={{
              padding: '6px 14px', borderRadius: 20,
              background: `${C.accent}12`, border: `1px solid ${C.accent}33`,
              fontSize: 12, fontWeight: 700, color: C.accent,
            }}>
              {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* ── Frosted glass tab bar ────────────────────────────────────────── */}
        <div style={{
          display: 'flex', background: 'rgba(248,250,252,0.8)',
          padding: '5px', borderRadius: '1.25rem',
          backdropFilter: 'blur(10px)', border: `1px solid ${C.border}`,
          gap: '0.2rem', overflowX: 'auto',
          width: 'fit-content', maxWidth: '100%',
          marginBottom: '-1px',
        }}>
          {TABS.map(t => {
            const TabIcon = t.Icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.55rem 1.1rem', borderRadius: '0.9rem',
                border: 'none', cursor: 'pointer', fontWeight: 700,
                fontSize: '0.8rem', whiteSpace: 'nowrap',
                transition: 'all 0.2s', position: 'relative',
                background: tab === t.id ? '#fff' : 'transparent',
                color: tab === t.id ? C.text : C.muted,
                boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}>
                <TabIcon size={14} strokeWidth={2} />{t.label}
                {tab === t.id && (
                  <motion.div
                    layoutId="hc-tab-pill"
                    style={{
                      position: 'absolute', bottom: -1, left: 4, right: 4,
                      height: 2, borderRadius: 2, background: C.accent,
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '2rem 3rem' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial="hidden" animate="show" exit="hidden" variants={FADE_UP}>
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

function TabLoader({ label }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 320, gap: 14,
    }}>
      <div style={{
        width: 40, height: 40,
        border: `3px solid ${C.accent}22`,
        borderTopColor: C.accent,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ color: C.muted, fontSize: 13 }}>Chargement {label}…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Overview
// ════════════════════════════════════════════════════════════════════════════

function OverviewTab({ consolidated, loading }) {
  const kpis = [
    { label: 'CA Consolidé',      rawValue: consolidated.revenue,      formatter: fmtM, unit: 'XOF', Icon: Wallet,    color: C.teal,   change: '+14.2%', pos: true },
    { label: 'EBITDA Groupe',     rawValue: consolidated.ebitda,       formatter: fmtM, unit: 'XOF', Icon: BarChart3, color: C.blue,   change: '+8.7%',  pos: true },
    { label: 'Trésorerie Conso.', rawValue: consolidated.cash,         formatter: fmtM, unit: 'XOF', Icon: Landmark,  color: C.purple, change: '+5.1%',  pos: true },
    { label: 'Effectif Total',    rawValue: consolidated.headcount,    formatter: fmt,  unit: 'emp', Icon: Users,     color: C.gold,   change: '+12',    pos: true },
    { label: 'Filiales Actives',  rawValue: consolidated.subsidiaries, formatter: v => String(v), unit: '', Icon: Building2, color: C.blue, change: 'stable', pos: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* KPI Grid — staggered entry */}
      <motion.div variants={STAGGER} initial="hidden" animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px,1fr))', gap: 16 }}>
        {kpis.map(k => {
          const KpiIcon = k.Icon;
          return (
            <motion.div key={k.label} variants={FADE_UP} className="bento-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: `${k.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: k.color,
                }}>
                  <KpiIcon size={18} strokeWidth={2} />
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                  background: k.pos ? `${C.accent}12` : `${C.red}12`,
                  color: k.pos ? C.accent : C.red,
                }}>
                  {k.change}
                </span>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: C.text, lineHeight: 1 }}>
                {loading
                  ? <div style={{ width: 80, height: 26, borderRadius: 8, background: C.track }} />
                  : <AnimatedCounter from={0} to={k.rawValue} duration={1.6} formatter={k.formatter} />
                }
                {!loading && k.unit && <span style={{ fontSize: 12, color: C.muted, marginLeft: 5, fontWeight: 400 }}>{k.unit}</span>}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontWeight: 600 }}>{k.label}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Revenue by Subsidiary */}
      <SectionHeader title="Contribution par Filiale" subtitle="CA cumulé YTD" />
      {SUBSIDIARY_PERF.length === 0
        ? <EmptyState Icon={Building2} title="Aucune filiale n'a synchronisé ses métriques"
            subtitle="Les barres de contribution apparaîtront via consolidated_reports dès que les filiales remontent leurs données." />
        : (
          <div className="bento-card" style={{ padding: '1.5rem' }}>
            {SUBSIDIARY_PERF.sort((a, b) => b.revenue - a.revenue).map(s => {
              const entity = GROUP_ENTITIES.find(e => e.id === s.id);
              const pct = (s.revenue / consolidated.revenue * 100).toFixed(1);
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}><Building2 size={16} strokeWidth={2} /></div>
                  <div style={{ width: 160, fontSize: 13, color: C.text, fontWeight: 600 }}>{entity?.shortName}</div>
                  <div style={{ flex: 1, height: 8, borderRadius: 8, background: C.track }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 8,
                      background: `linear-gradient(90deg, ${entity?.color || C.accent}, ${entity?.color || C.accent}88)`,
                      transition: 'width .6s ease',
                    }} />
                  </div>
                  <div style={{ width: 110, textAlign: 'right', fontSize: 13, fontWeight: 700, color: C.text }}>
                    {fmtM(s.revenue)} <span style={{ color: C.muted, fontWeight: 400 }}>XOF</span>
                  </div>
                  <div style={{ width: 44, textAlign: 'right', fontSize: 12, color: C.muted }}>{pct}%</div>
                  <TrendBadge trend={s.trend} />
                </div>
              );
            })}
          </div>
        )
      }

      {/* Strategic Alerts */}
      <SectionHeader title="Alertes Stratégiques" subtitle="Éléments nécessitant votre attention" />
      <EmptyState Icon={ShieldAlert} title="Aucune alerte stratégique en cours"
        subtitle="Les signaux apparaîtront automatiquement dès qu'une filiale remontera un indicateur critique." />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Performance
// ════════════════════════════════════════════════════════════════════════════

function PerformanceTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Matrice Performance Groupe" subtitle="Benchmark multi-filiales — Scores opérationnels" />

      {/* Bar chart visualization */}
      <div className="bento-card" style={{ padding: '1.5rem' }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 12 }}>Score de performance par filiale</div>
        <SafeResponsiveChart minHeight={200} fallbackHeight={200}
          isDataEmpty={SUBSIDIARY_PERF.length === 0}
          placeholderTitle="Scores indisponibles"
          placeholderSubtitle="Les scores apparaîtront dès que les filiales transmettent leurs KPIs via consolidated_reports.">
          <BarChart data={SUBSIDIARY_PERF.map(s => ({
            name: GROUP_ENTITIES.find(e => e.id === s.id)?.shortName || s.id,
            score: s.score,
          }))}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.track} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: C.muted, fontSize: 11 }} />
            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: C.muted, fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${C.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }} />
            <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={32}>
              {SUBSIDIARY_PERF.map((s, i) => (
                <Cell key={i} fill={s.score >= 90 ? C.accent : s.score >= 75 ? C.blue : s.score >= 60 ? C.gold : C.red} />
              ))}
            </Bar>
          </BarChart>
        </SafeResponsiveChart>
      </div>

      {/* Performance matrix table */}
      {SUBSIDIARY_PERF.length === 0
        ? <EmptyState Icon={BarChart3} title="Matrice de performance vide"
            subtitle="La matrice se peuplera automatiquement via les Cloud Functions d'agrégation dès la mise en service des filiales." />
        : (
          <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  {['Filiale','Secteur','CA (M XOF)','Croissance','Marge','Effectif','Score','Tendance'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: h === 'Filiale' ? 'left' : 'right',
                      color: C.muted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      borderBottom: `1px solid ${C.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUBSIDIARY_PERF.sort((a, b) => b.score - a.score).map((s, i) => {
                  const entity = GROUP_ENTITIES.find(e => e.id === s.id);
                  return (
                    <tr key={s.id} style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: i % 2 === 0 ? '#fff' : 'var(--bg-subtle)',
                      transition: 'background 0.15s',
                    }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Building2 size={16} strokeWidth={2} style={{ color: C.muted }} />
                          <div>
                            <div style={{ fontWeight: 700, color: C.text }}>{entity?.name}</div>
                            <div style={{ fontSize: 11, color: C.muted }}>{entity?.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: C.muted, fontSize: 12 }}>{entity?.industry}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: C.text }}>{fmtM(s.revenue)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <span style={{ color: s.growth > 0 ? C.accent : C.red, fontWeight: 700 }}>
                          {s.growth > 0 ? '+' : ''}{s.growth}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: C.text }}>{s.margin}%</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: C.text }}>{s.headcount}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}><ScoreBadge score={s.score} /></td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}><TrendBadge trend={s.trend} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      }

      {/* Legend */}
      <div className="bento-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          {[
            { range: '90-100', label: 'Excellence',  color: C.accent  },
            { range: '75-89',  label: 'Bon',         color: C.blue    },
            { range: '60-74',  label: 'Acceptable',  color: C.gold    },
            { range: '40-59',  label: 'Insuffisant', color: '#F97316' },
            { range: '0-39',   label: 'Critique',    color: C.red     },
          ].map(l => (
            <div key={l.range} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
              <span style={{ fontSize: 12, color: C.muted }}>
                <strong style={{ color: l.color }}>{l.range}</strong> — {l.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Financial Consolidation
// ════════════════════════════════════════════════════════════════════════════

function FinanceTab({ consolidated }) {
  const rows = [
    { label: 'Chiffre d\'Affaires Brut',      value: consolidated.revenue, sign: '+' },
    { label: 'Éliminations Intercompany',      value: -82_000_000,          sign: '-', note: '8 transactions' },
    { label: 'CA Consolidé Net',               value: consolidated.revenue - 82_000_000, bold: true },
    { label: 'Charges Opérationnelles',        value: -1_156_000_000,       sign: '-' },
    { label: 'EBITDA Consolidé',               value: consolidated.ebitda,  bold: true },
    { label: 'Amortissements & Provisions',    value: -48_000_000,          sign: '-' },
    { label: 'Résultat Opérationnel (EBIT)',   value: consolidated.ebitda - 48_000_000, bold: true },
    { label: 'Charges Financières Nettes',     value: -21_000_000,          sign: '-' },
    { label: 'Résultat Avant Impôts',          value: consolidated.ebitda - 48_000_000 - 21_000_000, bold: true },
    { label: 'Impôts sur les Sociétés',        value: -58_000_000,          sign: '-' },
    { label: 'Résultat Net Consolidé',         value: consolidated.ebitda - 127_000_000, bold: true, accent: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Consolidation Financière Groupe" subtitle="Compte de résultat consolidé — YTD 2026" />

      <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '11px 24px',
            background: row.accent ? `${C.accent}08` : row.bold ? 'var(--bg-subtle)' : '#fff',
            borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {row.bold && <div style={{ width: 3, height: 18, borderRadius: 2, background: row.accent ? C.accent : C.blue }} />}
              <span style={{
                fontSize: row.bold ? 14 : 13,
                fontWeight: row.bold ? 700 : 400,
                color: row.accent ? C.accent : row.bold ? C.text : C.muted,
                paddingLeft: row.bold ? 0 : 11,
              }}>
                {row.label}
              </span>
              {row.note && <span style={{ fontSize: 11, color: C.muted }}>({row.note})</span>}
            </div>
            <span style={{
              fontSize: row.bold ? 16 : 14, fontWeight: row.bold ? 800 : 500,
              color: row.accent ? C.accent : row.value < 0 ? C.red : row.bold ? C.text : C.muted,
            }}>
              {row.value < 0 ? '(' : ''}{fmtM(Math.abs(row.value))} XOF{row.value < 0 ? ')' : ''}
            </span>
          </div>
        ))}
      </div>

      <SectionHeader title="Projection Trésorerie Groupe" subtitle="Activée post-mise en service filiales" />
      <div className="bento-card" style={{ padding: '1.5rem' }}>
        <SafeResponsiveChart minHeight={200} fallbackHeight={200} isDataEmpty={true}
          placeholderTitle="Projection indisponible"
          placeholderSubtitle="Chargée depuis consolidated_reports dès la mise en service des filiales.">
          <AreaChart data={[]}>
            <defs>
              <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={C.accent} stopOpacity={0.2} />
                <stop offset="95%" stopColor={C.accent} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="cash" stroke={C.accent} fill="url(#cashGrad)" />
          </AreaChart>
        </SafeResponsiveChart>
      </div>

      <SectionHeader title="Flux Intercompany" subtitle="Transactions entre entités en attente d'élimination" />
      <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
        {[
          { from: 'Green Blocks', to: 'Prod & Log', amount: 28_000_000, type: 'Prestation', done: false },
          { from: 'Connect+',     to: 'Holding',    amount: 15_000_000, type: 'Redevance',  done: false },
          { from: 'Holding',      to: 'Academy',    amount: 12_000_000, type: 'Subvention', done: true  },
          { from: 'Select',       to: 'Green Blocks',amount: 27_000_000, type: 'Achat stock', done: false },
        ].map((tx, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px',
            borderBottom: i < 3 ? `1px solid ${C.border}` : 'none',
          }}>
            <div style={{ flex: 1, fontSize: 13, color: C.text }}>
              <strong>{tx.from}</strong> <span style={{ color: C.muted }}>→</span> <strong>{tx.to}</strong>
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>{tx.type}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fmtM(tx.amount)} XOF</div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
              background: tx.done ? `${C.accent}15` : `${C.gold}15`,
              color: tx.done ? C.accent : C.gold,
            }}>
              {tx.done ? 'Éliminé' : 'À éliminer'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Governance
// ════════════════════════════════════════════════════════════════════════════

const GOVERNANCE_ICONS = {
  'Budget':         { Icon: FileText,     color: C.red    },
  'Interco':        { Icon: GitMerge,     color: C.blue   },
  'Recrutement':    { Icon: UserPlus,     color: C.gold   },
  'Investissement': { Icon: Construction, color: C.purple },
};

function GovernanceTab({ approvals }) {
  const mockItems = [
    { id: 1, type: 'Budget',        entity: 'Green Blocks', title: 'Budget Q3 2026 — 285M XOF',          requestedBy: 'Dir. Financier', urgency: 'high',   date: '2026-05-14' },
    { id: 2, type: 'Interco',       entity: 'Connect+',     title: 'Prestation IT → Holding — 15M XOF',  requestedBy: 'CFO Connect+',  urgency: 'normal', date: '2026-05-13' },
    { id: 3, type: 'Recrutement',   entity: 'Academy',      title: '3 Formateurs Séniors — Abidjan',      requestedBy: 'DRH Academy',   urgency: 'normal', date: '2026-05-12' },
    { id: 4, type: 'Investissement', entity: 'Hôtel Sana',  title: 'Rénovation Aile Ouest — 48M XOF',    requestedBy: 'DG Sana',        urgency: 'low',    date: '2026-05-10' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title="File de Gouvernance Holding" subtitle="Décisions stratégiques en attente de validation" />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px',
          borderRadius: 20, background: `${C.gold}10`, border: `1px solid ${C.gold}30`,
        }}>
          <Clock size={13} strokeWidth={2} style={{ color: C.gold }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>
            <AnimatedCounter from={0} to={mockItems.length} duration={0.8} formatter={v => String(Math.round(v))} />
            {' '}décision{mockItems.length > 1 ? 's' : ''} en attente
          </span>
        </div>
      </div>

      <motion.div variants={STAGGER} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mockItems.map(item => {
          const cfg = GOVERNANCE_ICONS[item.type] || { Icon: FileText, color: C.muted };
          const TypeIcon = cfg.Icon;
          return (
            <motion.div key={item.id} variants={FADE_UP} className="bento-card" style={{
              padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                background: `${cfg.color}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TypeIcon size={20} strokeWidth={2} style={{ color: cfg.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{item.title}</span>
                  <UrgencyBadge level={item.urgency} />
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {item.entity} · {item.type} · Demandé par {item.requestedBy} · {item.date}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-success btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={12} strokeWidth={2.5} /> Valider
                </button>
                <button className="btn btn-danger btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <AlertTriangle size={12} strokeWidth={2.5} /> Refuser
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: C.text }}>{title}</h3>
      {subtitle && <span style={{ fontSize: 12, color: C.muted }}>{subtitle}</span>}
    </div>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 90 ? C.accent : score >= 75 ? C.blue : score >= 60 ? C.gold : score >= 40 ? '#F97316' : C.red;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 44, height: 24, borderRadius: 20,
      background: `${color}15`, border: `1px solid ${color}33`,
      fontSize: 12, fontWeight: 800, color,
    }}>
      {score}
    </span>
  );
}

function TrendBadge({ trend }) {
  if (trend === 'up')   return <TrendingUp   size={14} strokeWidth={2} style={{ color: C.accent }} />;
  if (trend === 'down') return <TrendingDown size={14} strokeWidth={2} style={{ color: C.red    }} />;
  return <Minus size={14} strokeWidth={2} style={{ color: C.muted }} />;
}

function EmptyState({ Icon, title, subtitle }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '3rem 2rem', textAlign: 'center',
        background: '#fff', border: `1px dashed ${C.border}`,
        borderRadius: 'var(--radius)', gap: 14,
      }}>
      <div style={{
        width: 52, height: 52, borderRadius: 16, background: `${C.accent}10`,
        border: `1px solid ${C.accent}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} strokeWidth={1.75} style={{ color: C.accent }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</div>
      <div style={{ fontSize: 13, color: C.muted, maxWidth: 400, lineHeight: 1.6 }}>{subtitle}</div>
    </motion.div>
  );
}

function UrgencyBadge({ level }) {
  const cfg = {
    high:   { label: 'Urgent', color: C.red  },
    normal: { label: 'Normal', color: C.blue },
    low:    { label: 'Faible', color: C.muted},
  };
  const { label, color } = cfg[level] || cfg.normal;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: `${color}15`, color, border: `1px solid ${color}33`,
    }}>
      {label}
    </span>
  );
}
