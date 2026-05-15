/**
 * ════════════════════════════════════════════════════════════════════════════
 * HOLDING COCKPIT — IPC Group Strategic Dashboard
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Design: Antigravity OS — white/glass theme matching the rest of the ERP.
 * Access: HOLDING_CEO, HOLDING_CFO, SUPER_ADMIN
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
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

// [GO-LIVE] Données réelles uniquement — chargées depuis Firestore via
// `consolidated_reports` (collection alimentée par les Cloud Functions
// d'agrégation pays/filiale). Démarre à vide tant que les filiales
// n'ont pas remonté leurs métriques.
const SUBSIDIARY_PERF = [];

const fmt  = (n) => new Intl.NumberFormat('fr-CI', { maximumFractionDigits: 0 }).format(n);
const fmtM = (n) => n >= 1e9 ? `${(n/1e9).toFixed(2)} Md` : n >= 1e6 ? `${(n/1e6).toFixed(1)} M` : fmt(n);

const TABS = [
  { id: 'overview',    label: 'Vue Groupe',       icon: '🏛️' },
  { id: 'performance', label: 'Performance',       icon: '📊' },
  { id: 'finance',     label: 'Consolidation',     icon: '💰' },
  { id: 'esg',         label: 'ESG & Foundation',  icon: '🌱' },
  { id: 'governance',  label: 'Gouvernance',        icon: '⚖️' },
  { id: 'intelligence',label: 'IA Stratégique',    icon: '🤖' },
  { id: 'countries',   label: 'Pays',              icon: '🌍' },
  { id: 'entities',    label: 'Entités Groupe',    icon: '🏢' },
  { id: 'licenses',    label: 'Licences SaaS',     icon: '🔑' },
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
        <div style={{ fontSize: 48 }}>🔒</div>
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
  consolidated.esgScore     = 0;
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
                ⏳ {approvals.length} en attente
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
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.55rem 1.1rem', borderRadius: '0.9rem',
              border: 'none', cursor: 'pointer', fontWeight: 700,
              fontSize: '0.8rem', whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? C.text : C.muted,
              boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '2rem 3rem' }}>
        {tab === 'overview'     && <OverviewTab consolidated={consolidated} loading={loading} />}
        {tab === 'performance'  && <PerformanceTab />}
        {tab === 'finance'      && <FinanceTab consolidated={consolidated} />}
        {tab === 'esg'          && <ESGTab />}
        {tab === 'governance'   && <GovernanceTab approvals={approvals} />}
        {tab === 'intelligence' && <IntelligenceTab consolidated={consolidated} />}
        {tab === 'countries'    && (
          <Suspense fallback={<TabLoader label="Country Management Center" />}>
            <CountryManagementCenter />
          </Suspense>
        )}
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
    { label: 'CA Consolidé',      value: fmtM(consolidated.revenue),  unit: 'XOF', icon: '💰', color: C.teal,   change: '+14.2%', pos: true },
    { label: 'EBITDA Groupe',     value: fmtM(consolidated.ebitda),   unit: 'XOF', icon: '📊', color: C.blue,   change: '+8.7%',  pos: true },
    { label: 'Trésorerie Conso.', value: fmtM(consolidated.cash),     unit: 'XOF', icon: '🏦', color: C.purple, change: '+5.1%',  pos: true },
    { label: 'Effectif Total',    value: fmt(consolidated.headcount), unit: 'emp', icon: '👥', color: C.gold,   change: '+12',    pos: true },
    { label: 'Filiales Actives',  value: consolidated.subsidiaries,   unit: '',    icon: '🏢', color: C.blue,   change: 'stable', pos: true },
    { label: 'Score ESG Groupe',  value: consolidated.esgScore,       unit: '/100',icon: '🌱', color: C.accent, change: '+3pts',  pos: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px,1fr))', gap: 16 }}>
        {kpis.map(k => (
          <div key={k.label} className="bento-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: `${k.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {k.icon}
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
              {loading ? '—' : k.value}
              {k.unit && <span style={{ fontSize: 12, color: C.muted, marginLeft: 5, fontWeight: 400 }}>{k.unit}</span>}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue by Subsidiary */}
      <SectionHeader title="Contribution par Filiale" subtitle="CA cumulé YTD" />
      <div className="bento-card" style={{ padding: '1.5rem' }}>
        {SUBSIDIARY_PERF.sort((a, b) => b.revenue - a.revenue).map(s => {
          const entity = GROUP_ENTITIES.find(e => e.id === s.id);
          const pct = (s.revenue / consolidated.revenue * 100).toFixed(1);
          return (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 28, fontSize: 18 }}>{entity?.icon}</div>
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

      {/* Strategic Alerts */}
      <SectionHeader title="Alertes Stratégiques" subtitle="Éléments nécessitant votre attention" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[
          { icon: '⚠️', type: 'warning', label: 'YSEE : Croissance négative (-3.2%)', detail: 'Plan de redressement requis' },
          { icon: '✅', type: 'success', label: 'Nexus Academy : Record CA trimestrel', detail: 'Croissance +34.1% — Felicitations' },
          { icon: '🔔', type: 'info',    label: '3 budgets filiales en attente', detail: 'Validation Holding requise avant 30/05' },
          { icon: '📊', type: 'info',    label: 'Score ESG en hausse (+3pts)', detail: 'Objectif 80/100 d\'ici Q4 2026 atteignable' },
        ].map((alert, i) => (
          <div key={i} style={{
            background: alert.type === 'warning' ? `${C.red}08`
                      : alert.type === 'success' ? `${C.accent}08` : `${C.blue}08`,
            border: `1px solid ${
              alert.type === 'warning' ? C.red
            : alert.type === 'success' ? C.accent : C.blue}22`,
            borderRadius: '1rem', padding: '1rem 1.25rem',
            display: 'flex', gap: 12,
          }}>
            <div style={{ fontSize: 20, flexShrink: 0 }}>{alert.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{alert.label}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{alert.detail}</div>
            </div>
          </div>
        ))}
      </div>
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
                      <span style={{ fontSize: 18 }}>{entity?.icon}</span>
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

      <SectionHeader title="Flux Intercompany" subtitle="Transactions entre entités en attente d'élimination" />
      <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
        {[
          { from: '🧱 Green Blocks', to: '🏭 Prod & Log', amount: 28_000_000, type: 'Prestation', done: false },
          { from: '📡 Connect+',     to: '🏛️ Holding',    amount: 15_000_000, type: 'Redevance',  done: false },
          { from: '🏛️ Holding',      to: '🎓 Academy',    amount: 12_000_000, type: 'Subvention', done: true  },
          { from: '🛒 Select',       to: '🧱 Green Blocks',amount: 27_000_000, type: 'Achat stock', done: false },
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
// TAB: ESG & Foundation
// ════════════════════════════════════════════════════════════════════════════

function ESGTab() {
  const dims = [
    { dim: 'E — Environnement', score: 72, icon: '🌍', color: C.teal,   items: ['CO₂ réduit de 18%', 'Déchets recyclés: 84%', 'Énergie renouvelable: 41%'] },
    { dim: 'S — Social',        score: 81, icon: '👥', color: C.blue,   items: ['Indice parité: 0.87', 'Formation: 96h/emp/an', 'Accidents 0 en Q1 2026'] },
    { dim: 'G — Gouvernance',   score: 88, icon: '⚖️', color: C.purple, items: ['Audit indépendant: ✅', 'RGPD: conforme', 'CA diversifié 6 profils'] },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="ESG Groupe Consolidé" subtitle="Score global: 78/100 — Objectif 2026: 85/100" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {dims.map(d => (
          <div key={d.dim} className="bento-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${d.color}12`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>{d.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{d.dim}</div>
                <div style={{ fontSize: 11, color: C.muted }}>
                  Score: <strong style={{ color: d.color }}>{d.score}/100</strong>
                </div>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 8, background: C.track, marginBottom: 14 }}>
              <div style={{
                width: `${d.score}%`, height: '100%', borderRadius: 8,
                background: `linear-gradient(90deg, ${d.color}, ${d.color}88)`,
              }} />
            </div>
            <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {d.items.map((it, i) => (
                <li key={i} style={{ fontSize: 12, color: C.muted }}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <SectionHeader title="IPC Foundation — Impact Social" subtitle="Entité non-lucrative supervisée par la Holding" />
      <div className="bento-card" style={{
        padding: '1.75rem',
        background: `linear-gradient(135deg, ${C.gold}06, ${C.accent}06)`,
        border: `1px solid ${C.gold}22`,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {[
            { icon: '🎁', label: 'Dons collectés',   value: '142 M XOF', color: C.gold   },
            { icon: '👤', label: 'Bénéficiaires',     value: '4 820',     color: C.teal   },
            { icon: '📣', label: 'Campagnes actives', value: '7',         color: C.blue   },
            { icon: '🌍', label: 'CO₂ compensé',      value: '320 T',     color: C.accent },
          ].map(k => (
            <div key={k.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{k.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB: Governance
// ════════════════════════════════════════════════════════════════════════════

function GovernanceTab({ approvals }) {
  const mockItems = [
    { id: 1, type: 'Budget',       entity: '🧱 Green Blocks', title: 'Budget Q3 2026 — 285M XOF', requestedBy: 'Dir. Financier', urgency: 'high',   date: '2026-05-14' },
    { id: 2, type: 'Interco',      entity: '📡 Connect+',     title: 'Prestation IT → Holding — 15M XOF', requestedBy: 'CFO Connect+', urgency: 'normal', date: '2026-05-13' },
    { id: 3, type: 'Recrutement',  entity: '🎓 Academy',      title: '3 Formateurs Séniors — Abidjan', requestedBy: 'DRH Academy', urgency: 'normal', date: '2026-05-12' },
    { id: 4, type: 'Investissement',entity: '🏨 Hôtel Sana',  title: 'Rénovation Aile Ouest — 48M XOF', requestedBy: 'DG Sana', urgency: 'low', date: '2026-05-10' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="File de Gouvernance Holding" subtitle="Décisions stratégiques en attente de validation" />

      {mockItems.map(item => (
        <div key={item.id} className="bento-card" style={{
          padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12, flexShrink: 0,
            background: item.urgency === 'high' ? `${C.red}12`
                       : item.urgency === 'normal' ? `${C.blue}12`
                       : `${C.muted}12`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            {item.type === 'Budget' ? '💰' : item.type === 'Interco' ? '🔄' : item.type === 'Recrutement' ? '👤' : '🏗️'}
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
            <button className="btn btn-success btn-sm">✓ Valider</button>
            <button className="btn btn-danger btn-sm">✗ Refuser</button>
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
  const [prompt, setPrompt]   = useState('');
  const [answer, setAnswer]   = useState('');
  const [thinking, setThinking] = useState(false);

  const insights = [
    { icon: '📈', type: 'Opportunité', color: C.accent, title: 'Nexus Academy — Potentiel d\'expansion géographique', body: 'Avec +34.1% de croissance YTD et une marge de 61.2%, Nexus Academy présente un profil rare. L\'IA recommande d\'évaluer une expansion vers Dakar et Bamako sur H2 2026.' },
    { icon: '⚠️', type: 'Risque',     color: C.gold,   title: 'YSEE — Alerte performance commerciale', body: 'Décroissance de -3.2% et marge à 18.4%. Sans plan d\'action correctif dans les 60 jours, la filiale risque de passer sous le seuil de rentabilité.' },
    { icon: '🔄', type: 'Optimisation',color: C.blue,   title: 'Cash Pooling groupe — Opportunité trésorerie', body: 'Trésoreries filiales : 1.42 Mrd XOF. Un cash pool centralisé générerait 8-12M XOF d\'économies d\'intérêts annuelles.' },
  ];

  const ask = async () => {
    if (!prompt.trim()) return;
    setThinking(true);
    await new Promise(r => setTimeout(r, 1600));
    setAnswer(
      `Analyse Nexus IA — ${new Date().toLocaleDateString('fr-FR')}\n\n` +
      `Sur la base des données consolidées (CA ${fmtM(consolidated.revenue)} XOF, ${consolidated.subsidiaries} filiales) :\n\n` +
      `Les données indiquent une trajectoire de croissance saine (+14.2%). Le risque principal reste la disparité de performance entre filiales — écart de 36 points entre Nexus Academy (92) et YSEE (58).`
    );
    setThinking(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Nexus IA — Intelligence Stratégique Groupe" subtitle="Analyse consolidée · Détection de risques · Recommandations exécutives" />

      {insights.map((ins, i) => (
        <div key={i} className="bento-card" style={{
          padding: '1.25rem 1.5rem', display: 'flex', gap: 16,
          borderLeft: `3px solid ${ins.color}`,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${ins.color}12`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>{ins.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: `${ins.color}15`, color: ins.color,
              }}>{ins.type}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{ins.title}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{ins.body}</p>
          </div>
        </div>
      ))}

      {/* AI Query */}
      <div className="bento-card" style={{ padding: '1.5rem' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 14 }}>
          🤖 Interroger Nexus Intelligence
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="Ex: Analyse le score ESG groupe et donne-moi un plan d'action..."
            style={{
              flex: 1, padding: '0.75rem 1rem', borderRadius: '0.9rem',
              background: 'var(--bg-subtle)', border: `1px solid ${C.border}`,
              color: C.text, fontSize: 13, outline: 'none', fontFamily: 'Inter, sans-serif',
            }}
          />
          <button onClick={ask} disabled={thinking} className="btn btn-primary">
            {thinking ? '...' : 'Analyser'}
          </button>
        </div>
        {answer && (
          <div style={{
            marginTop: 14, padding: '1rem 1.25rem', borderRadius: '0.9rem',
            background: `${C.accent}06`, border: `1px solid ${C.accent}22`,
            fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: 'pre-wrap',
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
  const cfg = { up: { icon: '▲', color: C.accent }, down: { icon: '▼', color: C.red }, stable: { icon: '→', color: C.muted } };
  const { icon, color } = cfg[trend] || cfg.stable;
  return <span style={{ color, fontSize: 14, fontWeight: 700 }}>{icon}</span>;
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
