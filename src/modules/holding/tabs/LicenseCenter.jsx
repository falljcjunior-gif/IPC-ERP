/**
 * ════════════════════════════════════════════════════════════════════════════
 * LICENSE CENTER — Enterprise SaaS License Management
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Holding-level cockpit to manage all group entity licenses:
 * • Overview — license consumption heatmap, costs, saturation
 * • Plans matrix — feature comparison across all plans
 * • Attribution — assign/change/upgrade licenses per entity
 * • Quotas — real-time usage bars per entity per resource
 * • Billing — internal refacturation per entity, total ERP cost
 * • Upgrade queue — process subsidiary upgrade requests
 * • IA insights — usage anomalies, under-utilization, saturation alerts
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, AlertCircle, AlertTriangle, Info,
  TrendingDown, Zap, ShieldAlert, ArrowUpCircle,
  Building2, Users, HardDrive, Cpu, Banknote, KeyRound,
  Eye, Package, BarChart3, CreditCard, FileText, ArrowUp,
  Activity, Settings,
} from 'lucide-react';
import {
  LICENSE_PLANS, LICENSE_PLAN_IDS, ALL_MODULES,
  ENTITY_STATES, ENTITY_STATE_META,
  calculateMonthlyBill, getQuotaStatus, QUOTA_THRESHOLDS,
  INTERNAL_BILLING,
} from '../../../schemas/license.schema';
import { GROUP_ENTITIES, ENTITY_TYPES } from '../../../schemas/org.schema';

// ── Design ────────────────────────────────────────────────────────────────────
const T = {
  bg: '#FFFFFF', surface: '#F8FAFC', card: '#FFFFFF', cardHi: '#F1F5F9',
  border: '#E2E8F0', accent: '#10B981', gold: '#F59E0B',
  blue: '#3B82F6', red: '#EF4444', purple: '#8B5CF6',
  text: '#0F172A', muted: '#64748B', dim: '#F1F5F9',
};

const fmt = (n) => new Intl.NumberFormat('fr-CI').format(n);
const fmtM = (n) => n >= 1e6 ? `${(n/1e6).toFixed(1)} M` : fmt(n);

const LC_TABS = [
  { id: 'overview',   label: 'Vue d\'ensemble',   Icon: BarChart3  },
  { id: 'plans',      label: 'Plans & Features',  Icon: Package    },
  { id: 'assignment', label: 'Attribution',        Icon: Settings   },
  { id: 'quotas',     label: 'Quotas & Usage',    Icon: Activity   },
  { id: 'billing',    label: 'Facturation interne',Icon: CreditCard },
  { id: 'requests',   label: 'Demandes upgrade',  Icon: ArrowUp    },
  { id: 'insights',   label: 'IA & Insights',     Icon: Zap        },
];

// [GO-LIVE] Mocks supprimés — l'ERP démarre à vide.
// Les licences réelles sont chargées depuis `entity_licenses` + `entity_usage`
// (Firestore). Les upgrade requests proviennent de `upgrade_requests`.
// Tant qu'aucune filiale n'est provisionnée, ces tableaux restent vides.
const ENTITY_LICENSES = [];
const UPGRADE_REQUESTS = [];

export default function LicenseCenter() {
  const [tab, setTab] = useState('overview');
  const [selected, setSelected] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // entity to assign

  const totalMonthlyCost = useMemo(() => {
    return ENTITY_LICENSES.reduce((sum, el) => {
      const plan = LICENSE_PLANS[el.planId];
      return sum + calculateMonthlyBill({
        users: {
          admin: Math.floor(el.usage.userCount * 0.15),
          manager: Math.floor(el.usage.userCount * 0.25),
          standard: Math.floor(el.usage.userCount * 0.5),
          readonly: Math.floor(el.usage.userCount * 0.1),
        },
        storageGB: el.usage.storageGB,
        aiTokens: el.usage.aiTokensUsed,
        apiCalls: el.usage.apiCallsUsed,
        enabledFeatures: plan?.features ? Object.keys(plan.features).filter(f => plan.features[f]) : [],
      });
    }, 0);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
        {LC_TABS.map(t => {
          const TabIcon = t.Icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t.id ? `${T.accent}15` : T.dim,
              color: tab === t.id ? T.accent : T.muted,
              fontWeight: tab === t.id ? 700 : 500, fontSize: 12, whiteSpace: 'nowrap',
            }}>
              <TabIcon size={12} strokeWidth={2} />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && <LicOverview licenses={ENTITY_LICENSES} totalCost={totalMonthlyCost} />}
      {tab === 'plans' && <LicPlans />}
      {tab === 'assignment' && <LicAssignment licenses={ENTITY_LICENSES} onAssign={setAssignModal} />}
      {tab === 'quotas' && <LicQuotas licenses={ENTITY_LICENSES} />}
      {tab === 'billing' && <LicBilling licenses={ENTITY_LICENSES} totalCost={totalMonthlyCost} />}
      {tab === 'requests' && <LicRequests requests={UPGRADE_REQUESTS} />}
      {tab === 'insights' && <LicInsights licenses={ENTITY_LICENSES} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Overview
// ════════════════════════════════════════════════════════════════════════════

function LicOverview({ licenses, totalCost }) {
  const totalUsers = licenses.reduce((s, l) => s + l.usage.userCount, 0);
  const totalStorage = licenses.reduce((s, l) => s + l.usage.storageGB, 0);
  const totalAI = licenses.reduce((s, l) => s + l.usage.aiTokensUsed, 0);
  const suspended = licenses.filter(l => l.state === ENTITY_STATES.SUSPENDED).length;

  const kpis = [
    { Icon: Building2,  label: 'Entités actives',    value: licenses.length - suspended, sub: `${suspended} suspendue(s)`, color: T.accent },
    { Icon: Users,      label: 'Utilisateurs groupe', value: fmt(totalUsers),             sub: 'tous niveaux confondus',    color: T.blue   },
    { Icon: HardDrive,  label: 'Stockage total',      value: `${totalStorage} Go`,        sub: 'consommé groupe',           color: T.purple },
    { Icon: Cpu,        label: 'Tokens IA (mois)',    value: fmtM(totalAI),               sub: 'Nexus Intelligence',        color: T.gold   },
    { Icon: Banknote,   label: 'Coût ERP / mois',    value: `${fmtM(totalCost)} XOF`,    sub: 'refacturation interne',     color: T.red    },
    { Icon: KeyRound,   label: 'Licences actives',   value: licenses.filter(l => l.state === ENTITY_STATES.ACTIVE).length, sub: 'plans assignés', color: T.accent },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
        {kpis.map(k => {
          const KIcon = k.Icon;
          return (
            <div key={k.label} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 18 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, marginBottom: 12,
                background: `${k.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <KIcon size={18} strokeWidth={2} style={{ color: k.color }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 12, color: T.text, fontWeight: 600, marginTop: 2 }}>{k.label}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {licenses.length === 0 && (
        <div style={{
          padding: '2rem', textAlign: 'center', color: T.muted, fontSize: 13,
          border: `1px dashed ${T.border}`, borderRadius: 12, background: T.surface,
        }}>
          Aucune entité provisionnée. Les licences apparaîtront après la création des filiales via l'onglet Entités Groupe.
        </div>
      )}

      {/* License heatmap */}
      <SectionHdr title="Heatmap Licences" sub="Plan attribué par entité + état de consommation" />
      <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        {licenses.map((l, i) => {
          const plan = LICENSE_PLANS[l.planId];
          const stateMeta = ENTITY_STATE_META[l.state] || ENTITY_STATE_META[ENTITY_STATES.ACTIVE];
          const userPct = plan?.maxUsers === -1 ? 0 : l.usage.userCount / (plan?.maxUsers || 1);
          const aiPct = plan?.aiTokensMonthly === -1 ? 0 : l.usage.aiTokensUsed / (plan?.aiTokensMonthly || 1);
          const storPct = plan?.maxStorageMB === -1 ? 0 : (l.usage.storageGB * 1024) / (plan?.maxStorageMB || 1);

          return (
            <div key={l.entity_id} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
              borderBottom: i < licenses.length - 1 ? `1px solid ${T.border}22` : 'none',
            }}>
              <span style={{ fontSize: 20, width: 28 }}>{l.entity.icon}</span>
              <div style={{ width: 160 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{l.entity.shortName}</div>
                <div style={{ fontSize: 10, color: plan?.color || T.muted }}>{plan?.icon} {plan?.name}</div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                background: `${stateMeta.color}20`, color: stateMeta.color,
              }}>{stateMeta.icon} {stateMeta.label}</span>
              {/* Mini usage bars */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Users', pct: userPct },
                  { label: 'IA', pct: aiPct },
                  { label: 'Stock', pct: storPct },
                ].map(bar => (
                  <div key={bar.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: T.muted }}>{bar.label}</span>
                      <span style={{ fontSize: 10, color: bar.pct > QUOTA_THRESHOLDS.CRITICAL ? T.red : T.muted }}>
                        {plan?.maxUsers === -1 ? '∞' : `${Math.round(bar.pct * 100)}%`}
                      </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 5, background: T.dim }}>
                      <div style={{
                        width: `${Math.min(100, bar.pct * 100)}%`, height: '100%', borderRadius: 5,
                        background: bar.pct > QUOTA_THRESHOLDS.CRITICAL ? T.red
                                  : bar.pct > QUOTA_THRESHOLDS.WARNING ? T.gold : T.accent,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Plans Matrix
// ════════════════════════════════════════════════════════════════════════════

function LicPlans() {
  const plans = [
    LICENSE_PLAN_IDS.STARTER, LICENSE_PLAN_IDS.BUSINESS,
    LICENSE_PLAN_IDS.ENTERPRISE, LICENSE_PLAN_IDS.INDUSTRIAL,
    LICENSE_PLAN_IDS.ACADEMY, LICENSE_PLAN_IDS.FOUNDATION,
  ].map(id => LICENSE_PLANS[id]);

  const featureRows = [
    { key: 'maxUsers',       label: 'Utilisateurs max',  format: v => v === -1 ? '∞' : v },
    { key: 'maxProjects',    label: 'Projets max',        format: v => v === -1 ? '∞' : v },
    { key: 'maxStorageMB',   label: 'Stockage',           format: v => v === -1 ? '∞' : v >= 1048576 ? `${v/1048576} To` : v >= 1024 ? `${v/1024} Go` : `${v} Mo` },
    { key: 'aiTokensMonthly',label: 'Tokens IA/mois',    format: v => v === -1 ? '∞' : fmtM(v) },
    { key: 'bi',             label: 'BI & Analytics',     feature: true, format: v => v ? 'CHECK' : 'DASH' },
    { key: 'automations',    label: 'Automatisations',    feature: true, format: v => v ? 'CHECK' : 'DASH' },
    { key: 'sso',            label: 'SSO Entreprise',     feature: true, format: v => v ? 'CHECK' : 'DASH' },
    { key: 'apiAccess',      label: 'Accès API',          feature: true, format: v => v ? 'CHECK' : 'DASH' },
    { key: 'multiCurrency',  label: 'Multi-devises',      feature: true, format: v => v ? 'CHECK' : 'DASH' },
    { key: 'consolidation',  label: 'Consolidation',      feature: true, format: v => v ? 'CHECK' : 'DASH' },
    { key: 'customReports',  label: 'Rapports custom',    feature: true, format: v => v ? 'CHECK' : 'DASH' },
  ];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ padding: '12px 16px', textAlign: 'left', color: T.muted, fontSize: 11,
              fontWeight: 700, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}`, minWidth: 160 }}>
              Fonctionnalité
            </th>
            {plans.map(plan => (
              <th key={plan.id} style={{
                padding: '12px 16px', textAlign: 'center',
                color: plan.color, fontSize: 13, fontWeight: 800,
                borderBottom: `1px solid ${T.border}`,
              }}>
                <div>{plan.icon}</div>
                <div>{plan.name}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {featureRows.map((row, i) => (
            <tr key={row.key} style={{ background: i % 2 === 0 ? T.card : T.surface }}>
              <td style={{ padding: '12px 16px', color: T.muted, fontWeight: 600, borderBottom: `1px solid ${T.border}22` }}>
                {row.label}
              </td>
              {plans.map(plan => {
                const raw = row.feature ? plan.features?.[row.key] : plan[row.key];
                const val = row.format ? row.format(raw) : raw;
                const isPos = val === 'CHECK';
                const isNeg = val === 'DASH';
                return (
                  <td key={plan.id} style={{
                    padding: '12px 16px', textAlign: 'center',
                    color: isPos ? T.accent : isNeg ? T.muted : T.text,
                    fontWeight: isPos ? 700 : 500,
                    borderBottom: `1px solid ${T.border}`,
                    fontSize: 13,
                  }}>
                    {isPos
                      ? <CheckCircle2 size={16} strokeWidth={2.5} style={{ color: T.accent }} />
                      : isNeg
                      ? <span style={{ color: T.muted, fontSize: 16, lineHeight: 1 }}>—</span>
                      : val
                    }
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// License Assignment
// ════════════════════════════════════════════════════════════════════════════

function LicAssignment({ licenses, onAssign }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionHdr title="Attribution des licences" sub="Gérez les plans assignés à chaque entité du groupe" />
      {licenses.map(l => {
        const plan = LICENSE_PLANS[l.planId];
        const stateMeta = ENTITY_STATE_META[l.state] || ENTITY_STATE_META[ENTITY_STATES.ACTIVE];
        return (
          <div key={l.entity_id} style={{
            background: T.card, borderRadius: 14, border: `1px solid ${T.border}`,
            padding: 18, display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <span style={{ fontSize: 22 }}>{l.entity.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{l.entity.name}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{l.entity.industry}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{plan?.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: plan?.color }}>{plan?.name}</div>
              <div style={{ fontSize: 10, color: T.muted }}>depuis {l.assignedAt}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: `${stateMeta.color}20`, color: stateMeta.color,
              }}>{stateMeta.icon} {stateMeta.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onAssign(l.entity_id)} style={{
                padding: '7px 16px', borderRadius: 8,
                background: `${T.accent}18`, border: `1px solid ${T.accent}33`,
                color: T.accent, fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>
 Changer
 </button>
              <button style={{
                padding: '7px 16px', borderRadius: 8,
                background: `${T.blue}18`, border: `1px solid ${T.blue}33`,
                color: T.blue, fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>
 Quotas
 </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Quotas & Usage
// ════════════════════════════════════════════════════════════════════════════

function LicQuotas({ licenses }) {
  const QUOTA_KEYS = [
    { key: 'users', label: 'Utilisateurs', maxKey: 'maxUsers', usedKey: 'userCount' },
    { key: 'storage', label: 'Stockage (Go)', maxKey: 'maxStorageMB', usedKey: 'storageGB', usedScale: 1024 },
    { key: 'projects', label: 'Projets', maxKey: 'maxProjects', usedKey: 'projectCount' },
    { key: 'aiTokens', label: 'Tokens IA', maxKey: 'aiTokensMonthly', usedKey: 'aiTokensUsed' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {QUOTA_KEYS.map(qk => (
        <div key={qk.key}>
          <SectionHdr title={qk.label} sub="Consommation vs quotas par entité" />
          <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
            {licenses.map((l, i) => {
              const plan = LICENSE_PLANS[l.planId];
              const max = plan?.[qk.maxKey] || 0;
              const used = qk.usedScale ? l.usage[qk.usedKey] * qk.usedScale : l.usage[qk.usedKey] || 0;
              const { pct, status } = getQuotaStatus(used, max);
              const barColor = status === 'exceeded' ? T.red : status === 'critical' ? '#e67e22' : status === 'warning' ? T.gold : T.accent;

              return (
                <div key={l.entity_id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
                  borderBottom: i < licenses.length - 1 ? `1px solid ${T.border}22` : 'none',
                }}>
                  <span style={{ fontSize: 18, width: 26 }}>{l.entity.icon}</span>
                  <div style={{ width: 140 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{l.entity.shortName}</div>
                  </div>
                  <div style={{ flex: 1, height: 8, borderRadius: 8, background: T.dim }}>
                    <div style={{
                      width: `${Math.min(100, (pct || 0) * 100)}%`,
                      height: '100%', borderRadius: 8, background: barColor,
                      transition: 'width .6s ease',
                    }} />
                  </div>
                  <div style={{ width: 110, textAlign: 'right', fontSize: 12 }}>
                    <span style={{ color: T.text, fontWeight: 700 }}>
                      {max === -1 ? '∞' : fmt(qk.usedScale ? l.usage[qk.usedKey] : used)}
                    </span>
                    <span style={{ color: T.muted }}>
                      {max === -1 ? '' : ` / ${fmt(qk.usedScale ? max / qk.usedScale : max)}`}
                    </span>
                  </div>
                  {status !== 'unlimited' && (
                    <span style={{
                      width: 42, textAlign: 'center', fontSize: 11, fontWeight: 700,
                      color: barColor,
                    }}>
                      {Math.round((pct || 0) * 100)}%
                    </span>
                  )}
                  {status === 'exceeded' && <AlertCircle  size={16} strokeWidth={2} title="Quota dépassé"   style={{ color: T.red,      flexShrink: 0 }} />}
                  {status === 'critical' && <AlertTriangle size={16} strokeWidth={2} title="Seuil critique" style={{ color: '#e67e22', flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Internal Billing
// ════════════════════════════════════════════════════════════════════════════

function LicBilling({ licenses, totalCost }) {
  const rows = licenses.map(l => {
    const plan = LICENSE_PLANS[l.planId];
    const users = {
      admin: Math.floor(l.usage.userCount * 0.15),
      manager: Math.floor(l.usage.userCount * 0.25),
      standard: Math.floor(l.usage.userCount * 0.5),
      readonly: Math.floor(l.usage.userCount * 0.1),
    };
    const enabledFeatures = plan?.features ? Object.keys(plan.features).filter(f => plan.features[f]) : [];
    const cost = calculateMonthlyBill({
      users, storageGB: l.usage.storageGB,
      aiTokens: l.usage.aiTokensUsed, apiCalls: l.usage.apiCallsUsed,
      enabledFeatures,
    });
    return { ...l, users, cost };
  }).sort((a, b) => b.cost - a.cost);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Total */}
      <div style={{
        background: `linear-gradient(135deg, ${T.card}, ${T.cardHi})`,
        borderRadius: 16, border: `1px solid ${T.border}`,
        padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 4 }}>Coût ERP total groupe / mois</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: T.accent }}>{fmtM(totalCost)} XOF</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
            Hors frais Firebase & hébergement · Refacturation interne groupe
          </div>
        </div>
        <button style={{
          padding: '10px 24px', borderRadius: 10,
          background: `${T.accent}18`, border: `1px solid ${T.accent}33`,
          color: T.accent, fontWeight: 700, fontSize: 13, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <FileText size={14} strokeWidth={2} /> Générer rapport
        </button>
      </div>

      {/* Per-entity breakdown */}
      <SectionHdr title="Détail par entité" sub="Refacturation interne mensuelle estimée (XOF)" />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: T.surface }}>
              {['Entité','Plan','Utilisateurs','Stockage','Tokens IA','Features','Total/mois'].map(h => (
                <th key={h} style={{
                  padding: '11px 14px', textAlign: h === 'Entité' ? 'left' : 'right',
                  color: T.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                  borderBottom: `1px solid ${T.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const plan = LICENSE_PLANS[r.planId];
              const userCost = (r.users.admin * INTERNAL_BILLING.perUserAdmin)
                + (r.users.manager * INTERNAL_BILLING.perUserManager)
                + (r.users.standard * INTERNAL_BILLING.perUserStandard)
                + (r.users.readonly * INTERNAL_BILLING.perUserReadOnly);
              const storCost = r.usage.storageGB * INTERNAL_BILLING.storagePerGB;
              const aiCost = Math.ceil(r.usage.aiTokensUsed / 1000) * INTERNAL_BILLING.aiTokensPer1k;
              const featCost = r.cost - userCost - storCost - aiCost;
              return (
                <tr key={r.entity_id} style={{ background: i % 2 === 0 ? T.card : T.surface }}>
                  <td style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}22` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{r.entity.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: T.text }}>{r.entity.shortName}</div>
                        <div style={{ fontSize: 10, color: T.muted }}>{r.entity.type}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', borderBottom: `1px solid ${T.border}22` }}>
                    <span style={{ fontSize: 11, color: plan?.color }}>{plan?.icon} {plan?.name}</span>
                  </td>
                  <Td val={fmt(userCost)} />
                  <Td val={fmt(storCost)} />
                  <Td val={fmt(aiCost)} />
                  <Td val={fmt(Math.max(0, featCost))} />
                  <td style={{ padding: '12px 14px', textAlign: 'right', borderBottom: `1px solid ${T.border}22` }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: T.gold }}>{fmt(r.cost)}</span>
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: T.surface, borderTop: `2px solid ${T.border}` }}>
              <td colSpan={6} style={{ padding: '12px 14px', fontWeight: 800, color: T.text }}>TOTAL GROUPE</td>
              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: T.accent, fontSize: 15 }}>
                {fmt(totalCost)} XOF
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Upgrade Requests
// ════════════════════════════════════════════════════════════════════════════

function LicRequests({ requests }) {
  const [processed, setProcessed] = useState({});

  const handleApprove = async (req) => {
    setProcessed(p => ({ ...p, [req.id]: 'approved' }));
    // In prod: EntityService.approveUpgrade(req.id, req.requestedPlan || req.entity_id, {})
  };
  const handleReject = (req) => {
    setProcessed(p => ({ ...p, [req.id]: 'rejected' }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHdr title="File de demandes d'upgrade" sub={`${requests.length} demandes en attente`} />
      {requests.map(req => {
        const status = processed[req.id] || req.status;
        const plan = req.requestedPlan ? LICENSE_PLANS[req.requestedPlan] : null;
        return (
          <div key={req.id} style={{
            background: T.card, borderRadius: 14, border: `1px solid ${
              status === 'approved' ? T.accent : status === 'rejected' ? T.red : T.border}`,
            padding: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <span style={{ fontSize: 24 }}>{req.entity?.icon}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{req.entity?.name}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: req.type === 'plan' ? `${T.purple}20` : `${T.blue}20`,
                      color: req.type === 'plan' ? T.purple : T.blue,
                    }}>
                      {req.type === 'plan' ? 'Upgrade Plan' : req.type === 'users' ? '+Users' : '+Storage'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: T.muted, marginBottom: 6 }}>{req.reason}</div>
                  {req.type === 'plan' && (
                    <div style={{ fontSize: 12, color: T.muted }}>
                      {LICENSE_PLANS[req.currentPlan]?.name} → <strong style={{ color: plan?.color }}>{plan?.name}</strong>
                    </div>
                  )}
                  {req.type !== 'plan' && (
                    <div style={{ fontSize: 12, color: T.muted }}>
                      Actuel: <strong>{req.currentValue}</strong> → Demandé: <strong style={{ color: T.accent }}>{req.requestedValue}</strong>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Demandé le {req.createdAt}</div>
                </div>
              </div>
              {status === 'pending' ? (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleApprove(req)} style={{
                    padding: '8px 18px', borderRadius: 8,
                    background: `${T.accent}20`, border: `1px solid ${T.accent}44`,
                    color: T.accent, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    <CheckCircle2 size={12} strokeWidth={2.5} /> Approuver
                  </button>
                  <button onClick={() => handleReject(req)} style={{
                    padding: '8px 18px', borderRadius: 8,
                    background: `${T.red}20`, border: `1px solid ${T.red}44`,
                    color: T.red, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                  }}>
                    <AlertTriangle size={12} strokeWidth={2.5} /> Refuser
                  </button>
                </div>
              ) : (
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20,
                  background: status === 'approved' ? `${T.accent}20` : `${T.red}20`,
                  color: status === 'approved' ? T.accent : T.red,
                }}>
                  {status === 'approved' ? 'Approuvé' : 'Refusé'}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// IA Insights
// ════════════════════════════════════════════════════════════════════════════

function LicInsights({ licenses }) {
  const insights = [
    {
      Icon: TrendingDown, type: 'Sous-utilisation', color: T.blue, priority: 'medium',
      title: 'IPC Green Blocks — modules BI sous-utilisés',
      body: 'Le module BI (Business Intelligence) est activé mais n\'a généré que 12 accès en 30 jours sur 134 utilisateurs. Considérez une formation ou la désactivation pour économiser 20 000 XOF/mois.',
      action: 'Voir le rapport',
    },
    {
      Icon: AlertCircle, type: 'Saturation imminente', color: T.gold, priority: 'high',
      title: 'IPC Green Blocks — quota utilisateurs à 85%',
      body: 'Avec 85 utilisateurs actifs sur un maximum de 100, le seuil d\'alerte est atteint. À ce rythme de recrutement, le quota sera dépassé dans ~18 jours.',
      action: 'Gérer le quota',
    },
    {
      Icon: Zap, type: 'Optimisation IA', color: T.purple, priority: 'low',
      title: 'Nexus Academy — consommation IA optimale',
      body: '68% des tokens IA utilisés ont généré des réponses à valeur ajoutée. Score d\'efficacité IA : 8.4/10. La filiale exploite bien les capacités Nexus Intelligence.',
      action: null,
    },
    {
      Icon: ShieldAlert, type: 'Risque conformité', color: T.red, priority: 'critical',
      title: 'YSEE — licence suspendue depuis 8 jours',
      body: 'L\'entité YSEE est suspendue. Les données restent accessibles en lecture seule, mais aucune opération n\'est possible. Risque de perte de données non sauvegardées si suspension > 30 jours.',
      action: 'Réactiver',
    },
    {
      Icon: ArrowUpCircle, type: 'Recommandation', color: T.accent, priority: 'medium',
      title: 'Select — upgrade vers ENTERPRISE recommandé',
      body: 'Select utilise 94% de son quota projets, 91% du stockage et demande régulièrement des accès API avancés. L\'upgrade vers ENTERPRISE générerait un surcoût de 45 000 XOF/mois mais éviterait 3 blocages opérationnels.',
      action: 'Préparer upgrade',
    },
  ];

  const priorityColors  = { critical: T.red, high: T.gold, medium: T.blue, low: T.muted };
  const priorityIcons   = { critical: AlertCircle, high: AlertTriangle, medium: Info, low: CheckCircle2 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHdr title="Nexus IA — Insights Licences" sub="Détection automatique d'anomalies, sous-utilisation et saturations" />
      {insights.map((ins, i) => {
        const InsIcon = ins.Icon;
        const PrioIcon = priorityIcons[ins.priority] || Info;
        return (
        <div key={i} style={{
          background: T.card, borderRadius: 14,
          border: `1px solid ${ins.color}33`,
          padding: 20, display: 'flex', gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${ins.color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <InsIcon size={20} strokeWidth={2} style={{ color: ins.color }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: `${ins.color}20`, color: ins.color,
              }}>{ins.type}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: `${priorityColors[ins.priority]}20`, color: priorityColors[ins.priority],
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <PrioIcon size={10} strokeWidth={2.5} /> {ins.priority}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{ins.title}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{ins.body}</p>
          </div>
          {ins.action && (
            <button style={{
              flexShrink: 0, padding: '8px 16px', borderRadius: 8, alignSelf: 'flex-start',
              background: `${ins.color}18`, border: `1px solid ${ins.color}33`,
              color: ins.color, fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>
              {ins.action}
            </button>
          )}
        </div>
        );
      })}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionHdr({ title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.text }}>{title}</h4>
      {sub && <span style={{ fontSize: 12, color: T.muted }}>{sub}</span>}
    </div>
  );
}

function Td({ val }) {
  return (
    <td style={{ padding: '12px 14px', textAlign: 'right', color: T.muted, fontSize: 12, borderBottom: `1px solid ${T.border}` }}>
      {val} XOF
    </td>
  );
}
