/**
 * ════════════════════════════════════════════════════════════════════════════
 * HOLDING COCKPIT — IPC Group Strategic Dashboard
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Exclusive to Holding-level roles (HOLDING_CEO, HOLDING_CFO, SUPER_ADMIN).
 * Provides:
 *   • Consolidated group KPIs (revenue, EBITDA, headcount)
 *   • Per-subsidiary performance matrix with benchmark scoring
 *   • Intercompany transaction monitoring
 *   • ESG consolidated score + Foundation impact
 *   • Strategic analytics & AI executive briefing
 *   • Budget consolidation & variance tracking
 *   • Group-wide approval queue
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useStore } from '../../store';
import { FirestoreService } from '../../services/firestore.service';
import {
  GROUP_ENTITIES, ENTITY_TYPES, getSubsidiaries, getFoundation,
  HOLDING_KPIS, isHoldingRole,
} from '../../schemas/org.schema';
import EntitySwitcher from '../../components/EntitySwitcher';

const EntityManagementCenter = lazy(() => import('./tabs/EntityManagementCenter'));
const LicenseCenter           = lazy(() => import('./tabs/LicenseCenter'));

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:       '#0a0c10',
  surface:  '#0d1117',
  card:     '#111318',
  cardHi:   '#141920',
  border:   '#1f2937',
  accent:   '#2ecc71',
  gold:     '#f39c12',
  blue:     '#3498db',
  red:      '#e74c3c',
  purple:   '#8e44ad',
  text:     '#e5e7eb',
  muted:    '#6b7280',
  dim:      '#374151',
};

// ── Subsidiary mock performance data (replaced by real Firestore in prod) ──────
const MOCK_SUBSIDIARY_PERF = [
  { id: 'ipc_green_blocks', revenue: 485000000, growth: 12.4, margin: 28.3, headcount: 134, score: 87, trend: 'up' },
  { id: 'nexus_academy',    revenue: 92000000,  growth: 34.1, margin: 61.2, headcount: 28,  score: 92, trend: 'up' },
  { id: 'connect_plus',     revenue: 148000000, growth: 8.7,  margin: 44.8, headcount: 45,  score: 79, trend: 'stable' },
  { id: 'ysee',             revenue: 67000000,  growth: -3.2, margin: 18.4, headcount: 19,  score: 58, trend: 'down' },
  { id: 'hotel_sana',       revenue: 215000000, growth: 6.1,  margin: 22.7, headcount: 87,  score: 74, trend: 'stable' },
  { id: 'select',           revenue: 328000000, growth: 19.8, margin: 15.1, headcount: 62,  score: 81, trend: 'up' },
  { id: 'prod_logistique',  revenue: 196000000, growth: 4.3,  margin: 31.9, headcount: 73,  score: 76, trend: 'stable' },
];

const fmt = (n) => new Intl.NumberFormat('fr-CI', { style: 'decimal', maximumFractionDigits: 0 }).format(n);
const fmtM = (n) => n >= 1e9 ? `${(n/1e9).toFixed(2)} Md` : n >= 1e6 ? `${(n/1e6).toFixed(1)} M` : fmt(n);

const TABS = [
  { id: 'overview',    label: 'Vue Groupe',       icon: '🏛️' },
  { id: 'performance', label: 'Performance',       icon: '📊' },
  { id: 'finance',     label: 'Consolidation',     icon: '💰' },
  { id: 'esg',         label: 'ESG & Foundation',  icon: '🌱' },
  { id: 'governance',  label: 'Gouvernance',        icon: '⚖️' },
  { id: 'intelligence',label: 'IA Stratégique',    icon: '🤖' },
  { id: 'entities',    label: 'Entités Groupe',    icon: '🏢' },
  { id: 'licenses',    label: 'Licences SaaS',     icon: '🔑' },
];

export default function HoldingCockpit() {
  const role = useStore(s => s.userRole || s.user?.role);
  const [tab, setTab]             = useState('overview');
  const [loading, setLoading]     = useState(true);
  const [approvals, setApprovals] = useState([]);

  // ── All hooks MUST be above any early return (Rules of Hooks) ─────────────
  const isAllowed = isHoldingRole(role);

  useEffect(() => {
    if (!isAllowed) return; // skip subscription for non-Holding users
    // Load pending approvals (cross-entity validations)
    const unsub = FirestoreService.subscribeToCollection('intercompany_approvals',
      (docs) => {
        setApprovals(docs.filter(d => d.status === 'pending'));
        setLoading(false);
      },
      { orderBy: [{ field: '_createdAt', direction: 'desc' }], limit: 20 }
    );
    return () => typeof unsub === 'function' && unsub();
  }, [isAllowed]);

  // Guard — Holding roles only
  if (!isAllowed) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: T.bg, gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ color: T.text, fontSize: 18, fontWeight: 700 }}>Accès Holding requis</div>
        <div style={{ color: T.muted, fontSize: 14 }}>
          Ce cockpit est réservé aux rôles HOLDING_CEO, HOLDING_CFO et SUPER_ADMIN.
        </div>
      </div>
    );
  }

  // Consolidated metrics
  const consolidated = MOCK_SUBSIDIARY_PERF.reduce((acc, s) => ({
    revenue:    acc.revenue    + s.revenue,
    headcount:  acc.headcount  + s.headcount,
  }), { revenue: 0, headcount: 0 });
  consolidated.ebitda       = consolidated.revenue * 0.247;
  consolidated.esgScore     = 78;
  consolidated.subsidiaries = MOCK_SUBSIDIARY_PERF.length;
  consolidated.cash         = 1_420_000_000;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 28px',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: T.surface,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.accent}, #1a8a4a)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>🏛️</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.text }}>
              IPC Holding — Cockpit Groupe
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>
              Gouvernance · Consolidation · Pilotage Stratégique
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {approvals.length > 0 && (
            <div style={{
              padding: '4px 12px', borderRadius: 20,
              background: 'rgba(243,156,18,.15)', border: `1px solid ${T.gold}44`,
              fontSize: 12, color: T.gold, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 16 }}>⏳</span>
              {approvals.length} approbation{approvals.length > 1 ? 's' : ''} en attente
            </div>
          )}
          <EntitySwitcher compact />
          <div style={{
            padding: '5px 14px', borderRadius: 8,
            background: `${T.accent}22`, border: `1px solid ${T.accent}44`,
            fontSize: 12, fontWeight: 700, color: T.accent,
          }}>
            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 4, padding: '12px 28px',
        borderBottom: `1px solid ${T.border}`,
        background: T.surface, overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tab === t.id ? `${T.accent}20` : 'transparent',
            color: tab === t.id ? T.accent : T.muted,
            fontWeight: tab === t.id ? 700 : 500,
            fontSize: 13,
            borderBottom: tab === t.id ? `2px solid ${T.accent}` : '2px solid transparent',
            whiteSpace: 'nowrap',
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 28px' }}>
        {tab === 'overview'     && <OverviewTab consolidated={consolidated} loading={loading} />}
        {tab === 'performance'  && <PerformanceTab />}
        {tab === 'finance'      && <FinanceTab consolidated={consolidated} />}
        {tab === 'esg'          && <ESGTab />}
        {tab === 'governance'   && <GovernanceTab approvals={approvals} />}
        {tab === 'intelligence' && <IntelligenceTab consolidated={consolidated} />}
        {tab === 'entities'     && (
          <Suspense fallback={<TabLoader label="Entités Groupe" />}>
            <EntityManagementCenter />
          </Suspense>
        )}
        {tab === 'licenses'     && (
          <Suspense fallback={<TabLoader label="Licences SaaS" />}>
            <LicenseCenter />
          </Suspense>
        )}
      </div>
    </div>
  );
}

// ── Suspense skeleton for lazy-loaded tabs ────────────────────────────────
function TabLoader({ label }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 320, gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, border: `3px solid ${T.accent}33`,
        borderTopColor: T.accent, borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ color: T.muted, fontSize: 13 }}>Chargement {label}…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Overview
// ════════════════════════════════════════════════════════════════════════════

function OverviewTab({ consolidated, loading }) {
  const kpis = [
    { label: 'CA Consolidé',      value: fmtM(consolidated.revenue),    unit: 'XOF', icon: '💰', color: T.accent,  change: '+14.2%' },
    { label: 'EBITDA Groupe',     value: fmtM(consolidated.ebitda),     unit: 'XOF', icon: '📊', color: T.blue,    change: '+8.7%' },
    { label: 'Trésorerie Conso.', value: fmtM(consolidated.cash),       unit: 'XOF', icon: '🏦', color: T.purple,  change: '+5.1%' },
    { label: 'Effectif Total',    value: fmt(consolidated.headcount),   unit: 'emp', icon: '👥', color: T.gold,    change: '+12' },
    { label: 'Filiales Actives',  value: consolidated.subsidiaries,      unit: '',    icon: '🏢', color: T.blue,    change: 'stable' },
    { label: 'Score ESG Groupe',  value: consolidated.esgScore,          unit: '/100',icon: '🌱', color: '#27ae60', change: '+3pts' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 16 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: T.card, borderRadius: 14,
            border: `1px solid ${T.border}`,
            padding: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 24 }}>{k.icon}</div>
              <div style={{
                fontSize: 11, fontWeight: 700,
                padding: '2px 8px', borderRadius: 20,
                background: k.change.startsWith('+') || k.change === 'stable'
                  ? 'rgba(46,204,113,.15)' : 'rgba(231,76,60,.15)',
                color: k.change.startsWith('+') || k.change === 'stable'
                  ? T.accent : T.red,
              }}>
                {k.change}
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color, lineHeight: 1 }}>
              {loading ? '—' : k.value}
              {k.unit && <span style={{ fontSize: 13, color: T.muted, marginLeft: 4 }}>{k.unit}</span>}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue by Subsidiary */}
      <SectionHeader title="Contribution par Filiale" subtitle="CA cumulé YTD" />
      <div style={{
        background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {MOCK_SUBSIDIARY_PERF.sort((a, b) => b.revenue - a.revenue).map(s => {
          const entity = GROUP_ENTITIES.find(e => e.id === s.id);
          const pct = (s.revenue / consolidated.revenue * 100).toFixed(1);
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, fontSize: 18 }}>{entity?.icon}</div>
              <div style={{ width: 160, fontSize: 13, color: T.text, fontWeight: 600 }}>
                {entity?.shortName}
              </div>
              <div style={{ flex: 1, height: 8, borderRadius: 8, background: T.dim }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 8,
                  background: `linear-gradient(90deg, ${entity?.color || T.accent}, ${entity?.color || T.accent}88)`,
                  transition: 'width .6s ease',
                }} />
              </div>
              <div style={{ width: 100, textAlign: 'right', fontSize: 13, fontWeight: 700, color: T.text }}>
                {fmtM(s.revenue)} <span style={{ color: T.muted, fontWeight: 400 }}>XOF</span>
              </div>
              <div style={{ width: 48, textAlign: 'right', fontSize: 12, color: T.muted }}>{pct}%</div>
              <TrendBadge trend={s.trend} />
            </div>
          );
        })}
      </div>

      {/* Strategic Alerts */}
      <SectionHeader title="Alertes Stratégiques" subtitle="Éléments nécessitant votre attention" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { icon: '⚠️', type: 'warning', label: 'YSEE : Croissance négative (-3.2%)', detail: 'Plan de redressement requis' },
          { icon: '✅', type: 'success', label: 'Nexus Academy : Record CA trimestrel', detail: 'Croissance +34.1% — Felicitations' },
          { icon: '🔔', type: 'info',    label: '3 budgets filiales en attente', detail: 'Validation Holding requise avant 30/05' },
          { icon: '📊', type: 'info',    label: 'Score ESG en hausse (+3pts)', detail: 'Objectif 80/100 d\'ici Q4 2026 atteignable' },
        ].map((alert, i) => (
          <div key={i} style={{
            background: alert.type === 'warning' ? 'rgba(231,76,60,.08)'
                      : alert.type === 'success' ? 'rgba(46,204,113,.08)'
                      : 'rgba(52,152,219,.08)',
            border: `1px solid ${
              alert.type === 'warning' ? T.red
            : alert.type === 'success' ? T.accent
            : T.blue}33`,
            borderRadius: 12, padding: 16,
            display: 'flex', gap: 12,
          }}>
            <div style={{ fontSize: 20 }}>{alert.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{alert.label}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{alert.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Performance (Benchmark entre filiales)
// ════════════════════════════════════════════════════════════════════════════

function PerformanceTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Matrice Performance Groupe" subtitle="Benchmark multi-filiales — Scores opérationnels" />

      {/* Performance grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: T.surface }}>
              {['Filiale','Secteur','CA (M XOF)','Croissance','Marge','Effectif','Score Ops.','Tendance'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: h === 'Filiale' ? 'left' : 'right',
                  color: T.muted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                  borderBottom: `1px solid ${T.border}`,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_SUBSIDIARY_PERF.sort((a, b) => b.score - a.score).map((s, i) => {
              const entity = GROUP_ENTITIES.find(e => e.id === s.id);
              return (
                <tr key={s.id} style={{
                  borderBottom: `1px solid ${T.border}22`,
                  background: i % 2 === 0 ? T.card : T.surface,
                }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{entity?.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: T.text }}>{entity?.name}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{entity?.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: T.muted, fontSize: 12 }}>
                    {entity?.industry}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: T.text }}>
                    {fmtM(s.revenue)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <span style={{
                      color: s.growth > 0 ? T.accent : T.red,
                      fontWeight: 700,
                    }}>
                      {s.growth > 0 ? '+' : ''}{s.growth}%
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: T.text }}>
                    {s.margin}%
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: T.text }}>
                    {s.headcount}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <ScoreBadge score={s.score} />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <TrendBadge trend={s.trend} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Score radar legend */}
      <div style={{
        background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
        padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16,
      }}>
        {[
          { range: '90-100', label: 'Excellence',  color: T.accent  },
          { range: '75-89',  label: 'Bon',         color: T.blue    },
          { range: '60-74',  label: 'Acceptable',  color: T.gold    },
          { range: '40-59',  label: 'Insuffisant', color: '#e67e22' },
          { range: '0-39',   label: 'Critique',    color: T.red     },
        ].map(l => (
          <div key={l.range} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
            <span style={{ fontSize: 12, color: T.muted }}>
              <strong style={{ color: l.color }}>{l.range}</strong> — {l.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Financial Consolidation
// ════════════════════════════════════════════════════════════════════════════

function FinanceTab({ consolidated }) {
  const consolidation = [
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

      <div style={{
        background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 0,
        overflow: 'hidden',
      }}>
        {consolidation.map((row, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px',
            background: row.accent ? `${T.accent}12` : row.bold ? `${T.surface}` : 'transparent',
            borderBottom: i < consolidation.length - 1 ? `1px solid ${T.border}22` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {row.bold && <div style={{ width: 3, height: 18, borderRadius: 2, background: row.accent ? T.accent : T.blue }} />}
              <span style={{
                fontSize: row.bold ? 14 : 13,
                fontWeight: row.bold ? 700 : 400,
                color: row.accent ? T.accent : row.bold ? T.text : T.muted,
                paddingLeft: row.bold ? 0 : 11,
              }}>
                {row.label}
              </span>
              {row.note && <span style={{ fontSize: 11, color: T.muted, marginLeft: 6 }}>({row.note})</span>}
            </div>
            <span style={{
              fontSize: row.bold ? 16 : 14, fontWeight: row.bold ? 800 : 500,
              color: row.accent ? T.accent
                   : row.value < 0 ? T.red
                   : row.bold ? T.text : T.muted,
            }}>
              {row.value < 0 ? '(' : ''}
              {fmtM(Math.abs(row.value))} XOF
              {row.value < 0 ? ')' : ''}
            </span>
          </div>
        ))}
      </div>

      {/* Intercompany Transactions */}
      <SectionHeader title="Flux Intercompany" subtitle="Transactions entre entités du groupe (en attente d'élimination)" />
      <div style={{
        background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 0,
        overflow: 'hidden',
      }}>
        {[
          { from: '🧱 Green Blocks', to: '🏭 Prod & Log', amount: 28_000_000, type: 'Prestation', status: 'À éliminer' },
          { from: '📡 Connect+',     to: '🏛️ Holding',    amount: 15_000_000, type: 'Redevance',  status: 'À éliminer' },
          { from: '🏛️ Holding',      to: '🎓 Academy',    amount: 12_000_000, type: 'Subvention', status: 'Éliminé' },
          { from: '🛒 Select',       to: '🧱 Green Blocks',amount: 27_000_000, type: 'Achat stock', status: 'À éliminer' },
        ].map((tx, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px',
            borderBottom: i < 3 ? `1px solid ${T.border}22` : 'none',
          }}>
            <div style={{ flex: 1, fontSize: 13, color: T.text }}>
              <strong>{tx.from}</strong> <span style={{ color: T.muted }}>→</span> <strong>{tx.to}</strong>
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>{tx.type}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{fmtM(tx.amount)} XOF</div>
            <div style={{
              fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
              background: tx.status === 'Éliminé' ? 'rgba(46,204,113,.15)' : 'rgba(243,156,18,.15)',
              color: tx.status === 'Éliminé' ? T.accent : T.gold,
            }}>
              {tx.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: ESG & Foundation
// ════════════════════════════════════════════════════════════════════════════

function ESGTab() {
  const esgDimensions = [
    { dim: 'E — Environnement', score: 72, icon: '🌍', items: ['CO₂ réduit de 18%', 'Déchets recyclés: 84%', 'Énergie renouvelable: 41%'] },
    { dim: 'S — Social',        score: 81, icon: '👥', items: ['Indice parité: 0.87', 'Formation: 96h/emp/an', 'Accidents 0 en Q1 2026'] },
    { dim: 'G — Gouvernance',   score: 88, icon: '⚖️', items: ['Audit indépendant: ✅', 'RGPD: conforme', 'CA diversifié 6 profils'] },
  ];

  const foundation = getFoundation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="ESG Groupe Consolidé" subtitle="Score global: 78/100 — Objectif 2026: 85/100" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {esgDimensions.map(d => (
          <div key={d.dim} style={{
            background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>{d.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{d.dim}</div>
                <div style={{ fontSize: 11, color: T.muted }}>Score: <strong style={{ color: T.accent }}>{d.score}/100</strong></div>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 8, background: T.dim, marginBottom: 16 }}>
              <div style={{
                width: `${d.score}%`, height: '100%', borderRadius: 8,
                background: `linear-gradient(90deg, ${T.accent}, #1a8a4a)`,
              }} />
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {d.items.map((it, i) => (
                <li key={i} style={{ fontSize: 12, color: T.muted }}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Foundation widget */}
      <SectionHeader title="IPC Foundation — Impact Social" subtitle="Entité non-lucrative supervisée par la Holding" />
      <div style={{
        background: `linear-gradient(135deg, rgba(243,156,18,.08), rgba(39,174,96,.08))`,
        borderRadius: 16, border: `1px solid ${T.gold}33`, padding: 24,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20,
      }}>
        {[
          { icon: '🎁', label: 'Dons collectés',    value: '142 M XOF' },
          { icon: '👤', label: 'Bénéficiaires',      value: '4 820' },
          { icon: '📣', label: 'Campagnes actives',  value: '7' },
          { icon: '🌍', label: 'CO₂ compensé',       value: '320 T' },
        ].map(k => (
          <div key={k.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.gold }}>{k.value}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Governance (Approvals & Cross-entity)
// ════════════════════════════════════════════════════════════════════════════

function GovernanceTab({ approvals }) {
  const mockApprovals = [
    { id: 1, type: 'Budget',      entity: '🧱 Green Blocks', title: 'Budget Q3 2026 — 285M XOF', requestedBy: 'Dir. Financier', urgency: 'high', date: '2026-05-14' },
    { id: 2, type: 'Interco',     entity: '📡 Connect+',     title: 'Prestation IT vers Holding — 15M XOF', requestedBy: 'CFO Connect+', urgency: 'normal', date: '2026-05-13' },
    { id: 3, type: 'Recrutement', entity: '🎓 Academy',      title: '3 Formateurs Séniors — Abidjan', requestedBy: 'DRH Academy', urgency: 'normal', date: '2026-05-12' },
    { id: 4, type: 'Investissement', entity: '🏨 Hôtel Sana', title: 'Rénovation Aile Ouest — 48M XOF', requestedBy: 'DG Hôtel Sana', urgency: 'low', date: '2026-05-10' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="File de Gouvernance Holding" subtitle="Décisions stratégiques en attente de validation" />

      {mockApprovals.map(item => (
        <div key={item.id} style={{
          background: T.card, borderRadius: 14, border: `1px solid ${T.border}`,
          padding: 20, display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: item.urgency === 'high' ? 'rgba(231,76,60,.15)'
                       : item.urgency === 'normal' ? 'rgba(52,152,219,.15)'
                       : 'rgba(110,110,110,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            {item.type === 'Budget' ? '💰' : item.type === 'Interco' ? '🔄' : item.type === 'Recrutement' ? '👤' : '🏗️'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.title}</span>
              <UrgencyBadge level={item.urgency} />
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>
              {item.entity} · {item.type} · Demandé par {item.requestedBy} · {item.date}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              padding: '7px 18px', borderRadius: 8,
              background: 'rgba(46,204,113,.15)', border: `1px solid ${T.accent}44`,
              color: T.accent, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              ✓ Valider
            </button>
            <button style={{
              padding: '7px 14px', borderRadius: 8,
              background: 'rgba(231,76,60,.15)', border: `1px solid ${T.red}44`,
              color: T.red, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>
              ✗ Refuser
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: AI Strategic Intelligence
// ════════════════════════════════════════════════════════════════════════════

function IntelligenceTab({ consolidated }) {
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [thinking, setThinking] = useState(false);

  const insights = [
    {
      icon: '📈', type: 'Opportunité', color: T.accent,
      title: 'Nexus Academy — Potentiel d\'expansion géographique',
      body: 'Avec +34.1% de croissance YTD et une marge de 61.2%, Nexus Academy présente un profil rare. L\'IA recommande d\'évaluer une expansion vers Dakar et Bamako sur H2 2026.',
    },
    {
      icon: '⚠️', type: 'Risque', color: T.gold,
      title: 'YSEE — Alerte performance commerciale',
      body: 'Décroissance de -3.2% et marge à 18.4%. Sans plan d\'action correctif dans les 60 jours, la filiale risque de passer sous le seuil de rentabilité.',
    },
    {
      icon: '🔄', type: 'Optimisation', color: T.blue,
      title: 'Cash Pooling groupe — Opportunité trésorerie',
      body: 'Consolidation des trésoreries filiales estimée à 1.42 Mrd XOF. La mise en place d\'un cash pool centralisé générerait 8-12M XOF d\'économies d\'intérêts annuelles.',
    },
  ];

  const askNexus = async () => {
    if (!prompt.trim()) return;
    setThinking(true);
    // Simulated AI response (real: calls nexus Cloud Function)
    await new Promise(r => setTimeout(r, 1800));
    setAnswer(
      `**Analyse Nexus IA — ${new Date().toLocaleDateString('fr-FR')}**\n\n` +
      `Sur la base des données consolidées du groupe (CA ${fmtM(consolidated.revenue)} XOF, ${consolidated.subsidiaries} filiales actives) :\n\n` +
      `${prompt.toLowerCase().includes('esg') ? 'Le score ESG de 78/100 positionne IPC Group dans le Q2 des groupes du secteur en Côte d\'Ivoire. Les axes prioritaires pour atteindre 85 avant fin 2026 sont : (1) augmenter la part d\'énergie renouvelable à 60%, (2) renforcer le programme parité dans les filiales industrielles, (3) accélérer les certifications ISO 14001 pour Green Blocks et Prod & Log.' :
        'Les données agrégées indiquent une trajectoire de croissance saine (+14.2% CA groupe). Le risque principal reste la disparité de performance entre filiales — écart de 36 points de score ops entre Nexus Academy (92) et YSEE (58). Une revue trimestrielle des KPIs par filiale et un plan de soutien ciblé pour YSEE sont recommandés.'}`
    );
    setThinking(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Nexus IA — Intelligence Stratégique Groupe" subtitle="Analyse consolidée · Détection de risques · Recommandations exécutives" />

      {/* AI Insights */}
      {insights.map((ins, i) => (
        <div key={i} style={{
          background: T.card, borderRadius: 14,
          border: `1px solid ${ins.color}33`,
          padding: 20, display: 'flex', gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${ins.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>{ins.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: `${ins.color}20`, color: ins.color,
              }}>{ins.type}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{ins.title}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{ins.body}</p>
          </div>
        </div>
      ))}

      {/* AI Query */}
      <div style={{
        background: `linear-gradient(135deg, #0d1117, #111318)`,
        borderRadius: 16, border: `1px solid ${T.accent}33`, padding: 24,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, marginBottom: 12 }}>
          🤖 Interroger Nexus Intelligence
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askNexus()}
            placeholder="Ex: Analyse le score ESG groupe et donne-moi un plan d'action..."
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 10,
              background: T.bg, border: `1px solid ${T.border}`,
              color: T.text, fontSize: 13,
              outline: 'none',
            }}
          />
          <button onClick={askNexus} disabled={thinking} style={{
            padding: '12px 24px', borderRadius: 10,
            background: thinking ? T.dim : T.accent,
            border: 'none', color: '#000', fontWeight: 700, fontSize: 13,
            cursor: thinking ? 'wait' : 'pointer',
          }}>
            {thinking ? '...' : 'Analyser'}
          </button>
        </div>
        {answer && (
          <div style={{
            marginTop: 16, padding: 16, borderRadius: 10,
            background: 'rgba(46,204,113,.06)', border: `1px solid ${T.accent}22`,
            fontSize: 13, color: T.text, lineHeight: 1.7, whiteSpace: 'pre-wrap',
          }}>
            {answer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>{title}</h3>
      {subtitle && <span style={{ fontSize: 12, color: T.muted }}>{subtitle}</span>}
    </div>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 90 ? T.accent : score >= 75 ? T.blue : score >= 60 ? T.gold : score >= 40 ? '#e67e22' : T.red;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 42, height: 24, borderRadius: 20,
      background: `${color}20`, border: `1px solid ${color}44`,
      fontSize: 12, fontWeight: 800, color,
    }}>
      {score}
    </span>
  );
}

function TrendBadge({ trend }) {
  const cfg = {
    up:     { icon: '▲', color: T.accent  },
    down:   { icon: '▼', color: T.red     },
    stable: { icon: '→', color: T.muted   },
  };
  const { icon, color } = cfg[trend] || cfg.stable;
  return <span style={{ color, fontSize: 14, fontWeight: 700 }}>{icon}</span>;
}

function UrgencyBadge({ level }) {
  const cfg = {
    high:   { label: 'Urgent',  color: T.red  },
    normal: { label: 'Normal',  color: T.blue },
    low:    { label: 'Faible',  color: T.muted},
  };
  const { label, color } = cfg[level] || cfg.normal;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: `${color}20`, color, border: `1px solid ${color}44`,
    }}>
      {label}
    </span>
  );
}
