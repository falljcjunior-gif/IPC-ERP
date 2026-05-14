/**
 * ════════════════════════════════════════════════════════════════════════════
 * IPC FOUNDATION COCKPIT — Social Impact & ESG/CSR Management
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Manages IPC Foundation — a separate non-profit entity supervised by
 * IPC Holding. NOT an operational ERP module. Handles:
 *
 *   • Donation tracking & management
 *   • Beneficiary programs
 *   • Social campaigns
 *   • ESG/CSR reporting
 *   • Impact KPIs (SDG alignment)
 *   • Partners & grants management
 *   • Community project workflow
 *   • Philanthropic governance
 *
 * Access: FOUNDATION_DG, FOUNDATION_MANAGER, FOUNDATION_STAFF,
 *         HOLDING_CEO, SUPER_ADMIN
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { FirestoreService } from '../../services/firestore.service';
import { isHoldingRole, isFoundationRole, ORG_ROLES } from '../../schemas/org.schema';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:      '#070c0a',
  surface: '#0a100e',
  card:    '#0e1612',
  border:  '#1a2e24',
  accent:  '#27ae60',
  gold:    '#f39c12',
  teal:    '#1abc9c',
  blue:    '#2980b9',
  red:     '#e74c3c',
  text:    '#e5f0ea',
  muted:   '#5a8070',
  dim:     '#1f3028',
};

const TABS = [
  { id: 'dashboard',    label: 'Impact Dashboard',   icon: '🌍' },
  { id: 'donations',    label: 'Dons & Financement', icon: '🎁' },
  { id: 'programs',     label: 'Programmes',          icon: '📋' },
  { id: 'beneficiaries',label: 'Bénéficiaires',       icon: '👥' },
  { id: 'campaigns',    label: 'Campagnes',            icon: '📣' },
  { id: 'esg',          label: 'Reporting ESG',        icon: '📊' },
  { id: 'governance',   label: 'Gouvernance',          icon: '⚖️' },
];

const SDG_GOALS = [
  { num: 1,  label: 'Fin de la pauvreté',           icon: '🏠', active: true  },
  { num: 2,  label: 'Faim zéro',                    icon: '🌾', active: true  },
  { num: 4,  label: 'Éducation de qualité',          icon: '📚', active: true  },
  { num: 8,  label: 'Travail décent & croissance',   icon: '💼', active: true  },
  { num: 10, label: 'Inégalités réduites',           icon: '⚖️', active: true  },
  { num: 13, label: 'Action climatique',             icon: '🌱', active: true  },
  { num: 15, label: 'Vie terrestre',                 icon: '🌳', active: false },
  { num: 17, label: 'Partenariats',                  icon: '🤝', active: true  },
];

const fmt = (n) => new Intl.NumberFormat('fr-CI').format(n);
const fmtM = (n) => n >= 1e6 ? `${(n/1e6).toFixed(1)} M` : fmt(n);

export default function FoundationCockpit() {
  const role = useStore(s => s.userRole || s.user?.role);
  const [tab, setTab]   = useState('dashboard');
  const [data, setData] = useState({ donations: [], programs: [], beneficiaries: [], campaigns: [] });
  const [loading, setLoading] = useState(true);

  // ── All hooks MUST be above any early return (Rules of Hooks) ─────────────
  const hasAccess = isFoundationRole(role) || isHoldingRole(role) || role === ORG_ROLES.SUPER_ADMIN;

  useEffect(() => {
    if (!hasAccess) return; // skip subscriptions for unauthorized users
    // Subscribe to Foundation collections
    const unsubs = [
      FirestoreService.subscribeToCollection('foundation_donations',
        docs => setData(d => ({ ...d, donations: docs })),
        { limit: 100 }
      ),
      FirestoreService.subscribeToCollection('foundation_programs',
        docs => setData(d => ({ ...d, programs: docs })),
        { limit: 50 }
      ),
      FirestoreService.subscribeToCollection('foundation_beneficiaries',
        docs => setData(d => ({ ...d, beneficiaries: docs })),
        { limit: 200 }
      ),
      FirestoreService.subscribeToCollection('foundation_campaigns',
        docs => setData(d => ({ ...d, campaigns: docs })),
        { limit: 50 }
      ),
    ];
    // Mark loaded after first tick
    const timer = setTimeout(() => setLoading(false), 600);
    return () => {
      unsubs.forEach(u => typeof u === 'function' && u());
      clearTimeout(timer);
    };
  }, [hasAccess]);

  // Guard: Foundation roles + Holding oversight
  if (!hasAccess) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: T.bg, gap: 16,
      }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ color: T.text, fontSize: 18, fontWeight: 700 }}>Accès Foundation requis</div>
        <div style={{ color: T.muted, fontSize: 14, textAlign: 'center', maxWidth: 400 }}>
          Ce module est réservé aux équipes IPC Foundation et à la supervision Holding.
        </div>
      </div>
    );
  }

  // Computed KPIs from real or mock data
  const kpis = {
    donationsTotal:    data.donations.reduce((s, d) => s + (d.montant || 0), 0) || 142_000_000,
    donorsCount:       data.donations.filter(d => d.donorId).length || 287,
    beneficiaries:     data.beneficiaries.length || 4820,
    programsActive:    data.programs.filter(p => p.statut === 'actif').length || 12,
    campaignsActive:   data.campaigns.filter(c => c.statut === 'actif').length || 7,
    impactScore:       83,
    co2Offset:         320,
    volunteersTotal:   148,
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 28px',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: T.surface, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.accent}, ${T.teal})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>🌱</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: T.text }}>
              IPC Foundation
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>
              Impact Social · ESG · Philanthropie · Gouvernance
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IsReadOnlyBadge role={role} />
          <div style={{
            padding: '4px 12px', borderRadius: 20,
            background: `${T.accent}18`, border: `1px solid ${T.accent}33`,
            fontSize: 11, fontWeight: 700, color: T.accent,
          }}>
            🌱 Entité non-lucrative
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 2, padding: '10px 28px',
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        overflowX: 'auto',
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tab === t.id ? `${T.accent}20` : 'transparent',
            color: tab === t.id ? T.accent : T.muted,
            fontWeight: tab === t.id ? 700 : 500, fontSize: 13,
            borderBottom: tab === t.id ? `2px solid ${T.accent}` : '2px solid transparent',
            whiteSpace: 'nowrap',
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '24px 28px' }}>
        {tab === 'dashboard'     && <ImpactDashboard kpis={kpis} loading={loading} />}
        {tab === 'donations'     && <DonationsTab data={data.donations} kpis={kpis} />}
        {tab === 'programs'      && <ProgramsTab data={data.programs} />}
        {tab === 'beneficiaries' && <BeneficiariesTab data={data.beneficiaries} kpis={kpis} />}
        {tab === 'campaigns'     && <CampaignsTab data={data.campaigns} />}
        {tab === 'esg'           && <ESGReportTab kpis={kpis} />}
        {tab === 'governance'    && <GovernanceTab role={role} />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Impact Dashboard
// ════════════════════════════════════════════════════════════════════════════

function ImpactDashboard({ kpis, loading }) {
  const mainKpis = [
    { icon: '🎁', label: 'Dons Collectés',    value: fmtM(kpis.donationsTotal), unit: 'XOF', color: T.gold  },
    { icon: '👥', label: 'Bénéficiaires',      value: fmt(kpis.beneficiaries),   unit: 'pers', color: T.teal  },
    { icon: '📋', label: 'Programmes Actifs',  value: kpis.programsActive,        unit: '',    color: T.accent},
    { icon: '📣', label: 'Campagnes Actives',  value: kpis.campaignsActive,       unit: '',    color: T.blue  },
    { icon: '🌍', label: 'Score Impact',       value: `${kpis.impactScore}/100`,  unit: '',    color: T.accent},
    { icon: '🌿', label: 'CO₂ Compensé',       value: `${kpis.co2Offset} T`,      unit: '',    color: T.teal  },
    { icon: '🤝', label: 'Bénévoles',          value: kpis.volunteersTotal,       unit: '',    color: T.muted },
    { icon: '💛', label: 'Donateurs',          value: kpis.donorsCount,           unit: '',    color: T.gold  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 14 }}>
        {mainKpis.map(k => (
          <div key={k.label} style={{
            background: T.card, borderRadius: 14,
            border: `1px solid ${T.border}`,
            padding: '18px 20px',
          }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{k.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color, lineHeight: 1 }}>
              {loading ? '—' : k.value}
              {k.unit && <span style={{ fontSize: 12, color: T.muted, marginLeft: 4 }}>{k.unit}</span>}
            </div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* SDG Alignment */}
      <SectionHeader title="Alignement ODD / SDG" subtitle="Objectifs de Développement Durable des Nations Unies" />
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 10,
      }}>
        {SDG_GOALS.map(g => (
          <div key={g.num} style={{
            background: g.active ? `${T.accent}10` : T.card,
            border: `1px solid ${g.active ? T.accent : T.border}44`,
            borderRadius: 10, padding: '12px 14px',
            opacity: g.active ? 1 : 0.45,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 18 }}>{g.icon}</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: g.active ? T.accent : T.muted }}>
                ODD {g.num}
              </div>
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.3 }}>
                {g.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline of recent actions */}
      <SectionHeader title="Activités Récentes" subtitle="Derniers événements Foundation" />
      <div style={{
        background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24,
        display: 'flex', flexDirection: 'column', gap: 0,
      }}>
        {[
          { icon: '🎁', text: 'Don reçu : 5 000 000 XOF — Fondation Orange CI', date: '14/05/2026', type: 'donation' },
          { icon: '📋', text: 'Programme "Jeunes Entrepreneurs" clôturé — 48 bénéficiaires', date: '12/05/2026', type: 'program' },
          { icon: '📣', text: 'Campagne "Eau Propre Abidjan" lancée', date: '10/05/2026', type: 'campaign' },
          { icon: '🤝', text: 'Partenariat signé : Mairie d\'Adjamé', date: '08/05/2026', type: 'partner' },
          { icon: '🌿', text: 'Rapport ESG Q1 2026 soumis à la Holding', date: '05/05/2026', type: 'esg' },
        ].map((item, i, arr) => (
          <div key={i} style={{
            display: 'flex', gap: 14, paddingBottom: i < arr.length - 1 ? 16 : 0,
            marginBottom: i < arr.length - 1 ? 16 : 0,
            borderBottom: i < arr.length - 1 ? `1px solid ${T.border}33` : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: T.dim, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 16,
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: T.text }}>{item.text}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{item.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Donations Tab
// ════════════════════════════════════════════════════════════════════════════

function DonationsTab({ data: donations, kpis }) {
  const [form, setForm] = useState({ donor: '', montant: '', type: 'Espèces', objet: '', date: '' });
  const [submitting, setSubmitting] = useState(false);

  const mockDonations = [
    { id: 1, donor: 'Fondation Orange CI', montant: 5_000_000, type: 'Don corporate', date: '14/05/2026', statut: 'Reçu' },
    { id: 2, donor: 'M. Kouassi Jean',     montant: 250_000,   type: 'Don individuel', date: '12/05/2026', statut: 'Reçu' },
    { id: 3, donor: 'Programme PNUD',      montant: 18_000_000, type: 'Subvention',   date: '10/05/2026', statut: 'Reçu' },
    { id: 4, donor: 'Banque Mondiale',     montant: 45_000_000, type: 'Financement',  date: '01/05/2026', statut: 'Reçu' },
    { id: 5, donor: 'Entreprise Solvay',   montant: 8_000_000,  type: 'Don corporate', date: '28/04/2026', statut: 'En attente' },
  ];

  const typeColors = { 'Don corporate': T.blue, 'Don individuel': T.teal, 'Subvention': T.gold, 'Financement': T.accent };

  const submit = async () => {
    if (!form.donor || !form.montant) return;
    setSubmitting(true);
    await FirestoreService.createDocument('foundation_donations', {
      ...form, montant: Number(form.montant),
      statut: 'Reçu', _subModule: 'donations',
    });
    setForm({ donor: '', montant: '', type: 'Espèces', objet: '', date: '' });
    setSubmitting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Gestion des Dons & Financements" subtitle={`Total collecté : ${fmtM(kpis.donationsTotal)} XOF`} />

      {/* Répartition */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Dons Corporates', value: '71 M XOF', pct: 50, color: T.blue },
          { label: 'Subventions',     value: '45 M XOF', pct: 31.7, color: T.gold },
          { label: 'Financements',    value: '18 M XOF', pct: 12.7, color: T.accent },
          { label: 'Dons Individus',  value: '8 M XOF',  pct: 5.6, color: T.teal },
        ].map(c => (
          <div key={c.label} style={{
            background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, padding: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ height: 4, borderRadius: 4, background: T.dim, margin: '8px 0' }}>
              <div style={{ width: `${c.pct}%`, height: '100%', borderRadius: 4, background: c.color }} />
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>{c.label} — {c.pct}%</div>
          </div>
        ))}
      </div>

      {/* Donation List */}
      <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.text }}>
          Historique des dons
        </div>
        {mockDonations.map((d, i) => (
          <div key={d.id} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
            borderBottom: i < mockDonations.length - 1 ? `1px solid ${T.border}22` : 'none',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{d.donor}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{d.date}</div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
              background: `${typeColors[d.type] || T.muted}20`,
              color: typeColors[d.type] || T.muted,
            }}>{d.type}</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.gold }}>
              {fmt(d.montant)} XOF
            </div>
            <span style={{
              fontSize: 11, padding: '2px 10px', borderRadius: 20,
              background: d.statut === 'Reçu' ? `${T.accent}20` : `${T.gold}20`,
              color: d.statut === 'Reçu' ? T.accent : T.gold,
            }}>
              {d.statut}
            </span>
          </div>
        ))}
      </div>

      {/* New donation form */}
      <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Enregistrer un don</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { key: 'donor',  label: 'Donateur / Organisation', ph: 'Nom du donateur' },
            { key: 'montant',label: 'Montant (XOF)',            ph: '5 000 000', type: 'number' },
            { key: 'objet',  label: 'Objet du don',             ph: 'Eau potable, Éducation...' },
            { key: 'date',   label: 'Date de réception',        ph: '', type: 'date' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: T.muted, display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input
                type={f.type || 'text'}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.ph}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  background: T.bg, border: `1px solid ${T.border}`,
                  color: T.text, fontSize: 13, boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>
          ))}
        </div>
        <button onClick={submit} disabled={submitting || !form.donor || !form.montant} style={{
          marginTop: 16, padding: '10px 28px', borderRadius: 10,
          background: T.accent, border: 'none', color: '#000',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          opacity: submitting || !form.donor || !form.montant ? 0.5 : 1,
        }}>
          {submitting ? 'Enregistrement...' : '+ Enregistrer le don'}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Programs Tab
// ════════════════════════════════════════════════════════════════════════════

function ProgramsTab({ data: programs }) {
  const mockPrograms = [
    { name: 'Jeunes Entrepreneurs 2026',    statut: 'actif',     beneficiaires: 48, budget: 12_000_000, sdg: [8, 10],  progress: 65 },
    { name: 'Eau Propre Abidjan',           statut: 'actif',     beneficiaires: 1200, budget: 35_000_000, sdg: [6, 3], progress: 40 },
    { name: 'École Numérique Rurale',       statut: 'actif',     beneficiaires: 320, budget: 18_000_000, sdg: [4],    progress: 82 },
    { name: 'Formation Femmes Rurales',     statut: 'actif',     beneficiaires: 156, budget: 8_000_000,  sdg: [5, 8], progress: 55 },
    { name: 'Reboisement Côte d\'Ivoire',   statut: 'clôturé',   beneficiaires: 0,   budget: 22_000_000, sdg: [13, 15], progress: 100 },
    { name: 'Santé Maternelle Bassam',      statut: 'planifié',  beneficiaires: 0,   budget: 15_000_000, sdg: [3],    progress: 0 },
  ];

  const statusColors = { actif: T.accent, clôturé: T.muted, planifié: T.blue };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Programmes d'Impact" subtitle={`${mockPrograms.filter(p => p.statut === 'actif').length} programmes actifs`} />
      {mockPrograms.map((p, i) => (
        <div key={i} style={{
          background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{p.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: `${statusColors[p.statut]}20`, color: statusColors[p.statut],
                }}>
                  {p.statut}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {p.sdg.map(g => (
                  <span key={g} style={{
                    fontSize: 10, padding: '1px 7px', borderRadius: 10,
                    background: `${T.teal}18`, color: T.teal, fontWeight: 700,
                  }}>ODD {g}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.gold }}>{fmtM(p.budget)} XOF</div>
              {p.beneficiaires > 0 && (
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                  {p.beneficiaires} bénéficiaires
                </div>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 6, background: T.dim }}>
            <div style={{
              width: `${p.progress}%`, height: '100%', borderRadius: 6,
              background: `linear-gradient(90deg, ${T.accent}, ${T.teal})`,
              transition: 'width .6s ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 6, textAlign: 'right' }}>
            {p.progress}% accompli
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Beneficiaries Tab
// ════════════════════════════════════════════════════════════════════════════

function BeneficiariesTab({ data: bens, kpis }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Gestion des Bénéficiaires" subtitle={`${fmt(kpis.beneficiaries)} personnes accompagnées`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Femmes',       value: '58%', icon: '👩', color: T.teal  },
          { label: 'Hommes',       value: '42%', icon: '👨', color: T.blue  },
          { label: '< 25 ans',     value: '34%', icon: '🎓', color: T.gold  },
          { label: 'Zone rurale',  value: '61%', icon: '🌾', color: T.accent},
        ].map(s => (
          <div key={s.label} style={{
            background: T.card, borderRadius: 12, border: `1px solid ${T.border}`,
            padding: 18, textAlign: 'center',
          }}>
            <div style={{ fontSize: 28 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, margin: '6px 0' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: T.muted }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Répartition géographique</div>
        {[
          { region: 'Abidjan',     count: 1_840, pct: 38 },
          { region: 'Bouaké',      count: 820,   pct: 17 },
          { region: 'Daloa',       count: 630,   pct: 13 },
          { region: 'San-Pédro',   count: 480,   pct: 10 },
          { region: 'Korhogo',     count: 410,   pct: 8  },
          { region: 'Autres',      count: 640,   pct: 14 },
        ].map(r => (
          <div key={r.region} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 100, fontSize: 13, color: T.text }}>{r.region}</div>
            <div style={{ flex: 1, height: 8, borderRadius: 8, background: T.dim }}>
              <div style={{
                width: `${r.pct}%`, height: '100%', borderRadius: 8,
                background: `linear-gradient(90deg, ${T.accent}, ${T.teal})`,
              }} />
            </div>
            <div style={{ width: 70, textAlign: 'right', fontSize: 12, color: T.muted }}>{fmt(r.count)}</div>
            <div style={{ width: 36, textAlign: 'right', fontSize: 12, color: T.muted }}>{r.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Campaigns Tab
// ════════════════════════════════════════════════════════════════════════════

function CampaignsTab({ data: camps }) {
  const mockCampaigns = [
    { name: 'Eau Propre Abidjan', objectif: 50_000_000, collecte: 31_500_000, statut: 'actif', deadline: '30/06/2026', donors: 68 },
    { name: 'École pour Tous 2026', objectif: 20_000_000, collecte: 18_200_000, statut: 'actif', deadline: '31/05/2026', donors: 124 },
    { name: 'Reboisement CI', objectif: 22_000_000, collecte: 22_000_000, statut: 'clôturé', deadline: '30/04/2026', donors: 210 },
    { name: 'Santé Maternelle', objectif: 35_000_000, collecte: 4_800_000, statut: 'actif', deadline: '31/08/2026', donors: 31 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Campagnes de Collecte" subtitle={`${mockCampaigns.filter(c => c.statut === 'actif').length} campagnes actives`} />
      {mockCampaigns.map((c, i) => {
        const pct = Math.min(100, Math.round(c.collecte / c.objectif * 100));
        return (
          <div key={i} style={{
            background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{c.name}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: c.statut === 'actif' ? `${T.accent}20` : `${T.muted}20`,
                    color: c.statut === 'actif' ? T.accent : T.muted,
                  }}>{c.statut}</span>
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                  Échéance : {c.deadline} · {c.donors} donateurs
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.gold }}>
                  {fmtM(c.collecte)} XOF
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>/ {fmtM(c.objectif)} XOF objectif</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 10, borderRadius: 10, background: T.dim }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 10,
                  background: pct >= 100
                    ? `linear-gradient(90deg, ${T.accent}, ${T.teal})`
                    : `linear-gradient(90deg, ${T.gold}, ${T.accent})`,
                  transition: 'width .6s ease',
                }} />
              </div>
              <span style={{
                fontSize: 13, fontWeight: 800,
                color: pct >= 100 ? T.accent : T.gold,
              }}>
                {pct}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ESG Report Tab
// ════════════════════════════════════════════════════════════════════════════

function ESGReportTab({ kpis }) {
  const periods = ['Q1 2026', 'Q4 2025', 'Q3 2025', 'Q2 2025'];
  const [selectedPeriod, setSelectedPeriod] = useState('Q1 2026');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeader title="Reporting ESG / Impact" subtitle="Rapport transmis trimestriellement à IPC Holding" />
        <div style={{ display: 'flex', gap: 6 }}>
          {periods.map(p => (
            <button key={p} onClick={() => setSelectedPeriod(p)} style={{
              padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12,
              background: selectedPeriod === p ? `${T.accent}20` : T.dim,
              color: selectedPeriod === p ? T.accent : T.muted,
              fontWeight: selectedPeriod === p ? 700 : 400,
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { cat: '🌍 Environnemental', items: [
            { label: 'CO₂ compensé', value: '320 T', change: '+15%' },
            { label: 'Arbres plantés', value: '4 820', change: '+22%' },
            { label: 'Eau économisée', value: '18 200 L', change: '+8%' },
          ]},
          { cat: '👥 Social', items: [
            { label: 'Bénéficiaires actifs', value: '4 820', change: '+12%' },
            { label: 'Emplois créés', value: '148', change: '+34%' },
            { label: 'Formations dispensées', value: '620 h', change: '+5%' },
          ]},
          { cat: '⚖️ Gouvernance', items: [
            { label: 'Taux d\'utilisation dons', value: '91.4%', change: '+2%' },
            { label: 'Délai validation subventions', value: '8 jours', change: '-3j' },
            { label: 'Partenaires actifs', value: '23', change: '+4' },
          ]},
          { cat: '📊 Financier', items: [
            { label: 'Dons reçus', value: fmtM(kpis.donationsTotal) + ' XOF', change: '+18%' },
            { label: 'Charges opérationnelles', value: '12.1 M XOF', change: '+3%' },
            { label: 'Ratio impact/charges', value: '7.3×', change: '+0.4×' },
          ]},
        ].map(section => (
          <div key={section.cat} style={{
            background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: 20,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>{section.cat}</div>
            {section.items.map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: `1px solid ${T.border}22`,
              }}>
                <span style={{ fontSize: 12, color: T.muted }}>{item.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.value}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: item.change.startsWith('+') ? T.accent : item.change.startsWith('-') && item.label.includes('Délai') ? T.accent : T.muted,
                  }}>{item.change}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Export CTA */}
      <div style={{
        background: T.card, borderRadius: 14, border: `1px solid ${T.border}`,
        padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Rapport {selectedPeriod} — Prêt pour soumission</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
            Transmis automatiquement à IPC Holding le 5 du mois suivant
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            padding: '8px 20px', borderRadius: 10,
            background: `${T.accent}18`, border: `1px solid ${T.accent}44`,
            color: T.accent, fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            📄 Exporter PDF
          </button>
          <button style={{
            padding: '8px 20px', borderRadius: 10,
            background: T.accent, border: 'none',
            color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            📤 Soumettre à Holding
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Governance Tab
// ════════════════════════════════════════════════════════════════════════════

function GovernanceTab({ role }) {
  const isAdmin = [ORG_ROLES.FOUNDATION_DG, ORG_ROLES.SUPER_ADMIN].includes(role) || isHoldingRole(role);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Gouvernance Foundation" subtitle="Structure, conformité et supervision Holding" />

      {/* Org Chart */}
      <div style={{
        background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Structure de gouvernance</div>
        {[
          { level: 'Supervision', role: 'IPC Holding — Conseil d\'Administration', access: 'Lecture globale + validation budgets', entity: 'HOLDING', color: '#2ecc71' },
          { level: 'Direction', role: 'Directeur Général Foundation', access: 'Contrôle total Foundation', entity: 'FOUNDATION_DG', color: '#f39c12' },
          { level: 'Management', role: 'Responsables Programmes', access: 'Gestion des programmes et campagnes', entity: 'FOUNDATION_MANAGER', color: '#3498db' },
          { level: 'Opérations', role: 'Coordinateurs Terrain', access: 'Saisie des données opérationnelles', entity: 'FOUNDATION_STAFF', color: '#1abc9c' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{
              width: 90, fontSize: 10, fontWeight: 700,
              color: l.color, paddingTop: 4, textAlign: 'right', flexShrink: 0,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {l.level}
            </div>
            <div style={{ width: 2, background: T.border, alignSelf: 'stretch', flexShrink: 0 }} />
            <div style={{
              flex: 1, background: `${l.color}10`, borderRadius: 10,
              border: `1px solid ${l.color}33`, padding: '12px 16px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{l.role}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{l.access}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance */}
      <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.border}`, padding: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 16 }}>Conformité & Audit</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { item: 'Statut Foundation déposé', statut: '✅ Conforme', date: '12/01/2024' },
            { item: 'Rapport annuel soumis', statut: '✅ Soumis', date: '15/03/2026' },
            { item: 'Audit externe indépendant', statut: '✅ Validé', date: '20/02/2026' },
            { item: 'Déclaration fiscale OHADA', statut: '✅ Déposée', date: '30/04/2026' },
            { item: 'Certification ISO 26000', statut: '⏳ En cours', date: 'Prévu Q3 2026' },
            { item: 'Rapport DPEF (ESG)', statut: '✅ Publié', date: '30/04/2026' },
          ].map((c, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderRadius: 10,
              background: c.statut.startsWith('✅') ? `${T.accent}08` : `${T.gold}08`,
              border: `1px solid ${c.statut.startsWith('✅') ? T.accent : T.gold}22`,
            }}>
              <div>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{c.item}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{c.date}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.statut.startsWith('✅') ? T.accent : T.gold }}>
                {c.statut}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>{title}</h3>
      {subtitle && <span style={{ fontSize: 12, color: T.muted }}>{subtitle}</span>}
    </div>
  );
}

function IsReadOnlyBadge({ role }) {
  if (isHoldingRole(role)) {
    return (
      <div style={{
        padding: '3px 10px', borderRadius: 20,
        background: 'rgba(52,152,219,.15)', border: '1px solid rgba(52,152,219,.3)',
        fontSize: 11, fontWeight: 700, color: '#3498db',
      }}>
        👁️ Vue Holding
      </div>
    );
  }
  return null;
}
