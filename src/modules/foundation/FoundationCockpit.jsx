/**
 * ════════════════════════════════════════════════════════════════════════════
 * IPC FOUNDATION COCKPIT — Social Impact & CSR Management
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Design: Antigravity OS — white/glass theme matching the rest of the ERP.
 * Access: FOUNDATION_DG, FOUNDATION_MANAGER, FOUNDATION_STAFF,
 *         HOLDING_CEO, SUPER_ADMIN
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { FirestoreService } from '../../services/firestore.service';
import { isHoldingRole, isFoundationRole, ORG_ROLES } from '../../schemas/org.schema';

// ── ERP design tokens (light theme) ──────────────────────────────────────────
const C = {
  accent:  '#10B981',
  gold:    '#F59E0B',
  blue:    '#3B82F6',
  red:     '#EF4444',
  teal:    '#0D9488',
  purple:  '#8B5CF6',
  border:  '#E2E8F0',
  text:    '#0F172A',
  muted:   '#64748B',
  track:   '#F1F5F9',
};

const TABS = [
  { id: 'dashboard',    label: 'Impact Dashboard',   icon: '' },
  { id: 'donations',    label: 'Dons & Financement', icon: '' },
  { id: 'programs',     label: 'Programmes',          icon: '' },
  { id: 'beneficiaries',label: 'Bénéficiaires',       icon: '' },
  { id: 'campaigns',    label: 'Campagnes',            icon: '' },
  { id: 'governance',   label: 'Gouvernance',          icon: '' },
];

const SDG_GOALS = [
  { num: 1,  label: 'Fin de la pauvreté',          icon: '', active: true  },
  { num: 2,  label: 'Faim zéro',                   icon: '', active: true  },
  { num: 4,  label: 'Éducation de qualité',         icon: '', active: true  },
  { num: 8,  label: 'Travail décent & croissance',  icon: '', active: true  },
  { num: 10, label: 'Inégalités réduites',          icon: '', active: true  },
  { num: 13, label: 'Action climatique',            icon: '', active: true  },
  { num: 15, label: 'Vie terrestre',                icon: '', active: false },
  { num: 17, label: 'Partenariats',                 icon: '', active: true  },
];

const fmt  = (n) => new Intl.NumberFormat('fr-CI').format(n);
const fmtM = (n) => n >= 1e6 ? `${(n/1e6).toFixed(1)} M` : fmt(n);

const inputStyle = {
  width: '100%', padding: '0.65rem 1rem', borderRadius: '0.8rem',
  background: 'var(--bg-subtle)', border: `1px solid ${C.border}`,
  color: C.text, fontSize: 13, boxSizing: 'border-box', outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

export default function FoundationCockpit() {
  const role = useStore(s => s.userRole || s.user?.role);
  const [tab, setTab]         = useState('dashboard');
  const [data, setData]       = useState({ donations: [], programs: [], beneficiaries: [], campaigns: [] });
  const [loading, setLoading] = useState(true);

  const hasAccess = isFoundationRole(role) || isHoldingRole(role) || role === ORG_ROLES.SUPER_ADMIN;

  useEffect(() => {
    if (!hasAccess) return;
    const unsubs = [];
    try {
      unsubs.push(
        FirestoreService.subscribeToCollection('foundation_donations',
          docs => setData(d => ({ ...d, donations: docs })), { limit: 100 }),
        FirestoreService.subscribeToCollection('foundation_programs',
          docs => setData(d => ({ ...d, programs: docs })), { limit: 50 }),
        FirestoreService.subscribeToCollection('foundation_beneficiaries',
          docs => setData(d => ({ ...d, beneficiaries: docs })), { limit: 200 }),
        FirestoreService.subscribeToCollection('foundation_campaigns',
          docs => setData(d => ({ ...d, campaigns: docs })), { limit: 50 }),
      );
    } catch (err) {
      console.warn('[FoundationCockpit] Firestore non disponible (mode DEV sans auth):', err.message);
    }
    const timer = setTimeout(() => setLoading(false), 600);
    return () => { unsubs.forEach(u => typeof u === 'function' && u()); clearTimeout(timer); };
  }, [hasAccess]);

  if (!hasAccess) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg)', gap: 16,
      }}>
        <div style={{ fontSize: 48 }}></div>
        <div style={{ color: C.text, fontSize: 18, fontWeight: 700 }}>Accès Foundation requis</div>
        <div style={{ color: C.muted, fontSize: 14, textAlign: 'center', maxWidth: 400 }}>
          Ce module est réservé aux équipes IPC Foundation et à la supervision Holding.
        </div>
      </div>
    );
  }

  const kpis = {
    donationsTotal:  data.donations.reduce((s, d) => s + (d.montant || 0), 0) || 142_000_000,
    donorsCount:     data.donations.filter(d => d.donorId).length || 287,
    beneficiaries:   data.beneficiaries.length || 4820,
    programsActive:  data.programs.filter(p => p.statut === 'actif').length || 12,
    campaignsActive: data.campaigns.filter(c => c.statut === 'actif').length || 7,
    impactScore:     83,
    co2Offset:       320,
    volunteersTotal: 148,
  };

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
              IPC Foundation · Non-Profit · Impact Social
            </div>
            <h1 style={{
              fontSize: '2.2rem', fontWeight: 200, letterSpacing: '-0.04em',
              margin: 0, color: '#000', lineHeight: 1.1,
            }}>
              Foundation <strong style={{ fontWeight: 700 }}>Cockpit</strong>
            </h1>
          </div>

          {/* Right badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            {isHoldingRole(role) && (
              <span style={{
                padding: '5px 12px', borderRadius: 20,
                background: `${C.blue}10`, border: `1px solid ${C.blue}30`,
                fontSize: 11, fontWeight: 700, color: C.blue,
              }}>
 Vue Holding
 </span>
            )}
            <span style={{
              padding: '5px 12px', borderRadius: 20,
              background: `${C.accent}12`, border: `1px solid ${C.accent}30`,
              fontSize: 11, fontWeight: 700, color: C.accent,
            }}>
 Entité non-lucrative
 </span>
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
        {tab === 'dashboard'     && <ImpactDashboard kpis={kpis} loading={loading} />}
        {tab === 'donations'     && <DonationsTab kpis={kpis} donations={data.donations || []} />}
        {tab === 'programs'      && <ProgramsTab />}
        {tab === 'beneficiaries' && <BeneficiariesTab kpis={kpis} />}
        {tab === 'campaigns'     && <CampaignsTab />}
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
    { icon: '', label: 'Dons Collectés',   value: fmtM(kpis.donationsTotal), unit: 'XOF', color: C.gold   },
    { icon: '', label: 'Bénéficiaires',    value: fmt(kpis.beneficiaries),   unit: 'pers', color: C.teal  },
    { icon: '', label: 'Programmes Actifs',value: kpis.programsActive,       unit: '',     color: C.accent },
    { icon: '', label: 'Campagnes',        value: kpis.campaignsActive,      unit: '',     color: C.blue   },
    { icon: '', label: 'Score Impact',     value: `${kpis.impactScore}/100`, unit: '',     color: C.accent },
    { icon: '', label: 'CO₂ Compensé',    value: `${kpis.co2Offset} T`,     unit: '',     color: C.teal   },
    { icon: '', label: 'Bénévoles',       value: kpis.volunteersTotal,      unit: '',     color: C.muted  },
    { icon: '', label: 'Donateurs',       value: kpis.donorsCount,          unit: '',     color: C.gold   },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))', gap: 14 }}>
        {mainKpis.map(k => (
          <div key={k.label} className="bento-card" style={{ padding: '1.25rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, marginBottom: 12,
              background: `${k.color}12`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>{k.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: C.text, lineHeight: 1 }}>
              {loading ? '—' : k.value}
              {k.unit && <span style={{ fontSize: 11, color: C.muted, marginLeft: 4, fontWeight: 400 }}>{k.unit}</span>}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontWeight: 600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* SDG Alignment */}
      <SectionHeader title="Alignement ODD / SDG" subtitle="Objectifs de Développement Durable des Nations Unies" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px,1fr))', gap: 10 }}>
        {SDG_GOALS.map(g => (
          <div key={g.num} className={g.active ? 'bento-card' : ''} style={{
            background: g.active ? `${C.accent}06` : C.track,
            border: `1px solid ${g.active ? C.accent : C.border}33`,
            borderRadius: '0.9rem', padding: '0.75rem 1rem',
            opacity: g.active ? 1 : 0.45,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>{g.icon}</span>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: g.active ? C.accent : C.muted }}>
                ODD {g.num}
              </div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.3 }}>{g.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <SectionHeader title="Activités Récentes" subtitle="Derniers événements Foundation" />
      <div className="bento-card" style={{ padding: '1.5rem' }}>
        {[
          { icon: '', text: 'Don reçu : 5 000 000 XOF — Fondation Orange CI', date: '14/05/2026' },
          { icon: '', text: 'Programme "Jeunes Entrepreneurs" clôturé — 48 bénéficiaires', date: '12/05/2026' },
          { icon: '', text: 'Campagne "Eau Propre Abidjan" lancée', date: '10/05/2026' },
          { icon: '', text: 'Partenariat signé : Mairie d\'Adjamé', date: '08/05/2026' },
          { icon: '', text: 'Rapport Q1 2026 soumis à la Holding', date: '05/05/2026' },
        ].map((item, i, arr) => (
          <div key={i} style={{
            display: 'flex', gap: 14,
            paddingBottom: i < arr.length - 1 ? 16 : 0,
            marginBottom: i < arr.length - 1 ? 16 : 0,
            borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: C.track,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 13, color: C.text }}>{item.text}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{item.date}</div>
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

function DonationsTab({ kpis, donations }) {
  const [form, setForm]           = useState({ donor: '', montant: '', type: 'Espèces', objet: '', date: '' });
  const [submitting, setSubmitting] = useState(false);

  const typeColor = { 'Don corporate': C.blue, 'Don individuel': C.teal, 'Subvention': C.gold, 'Financement': C.accent };

  const byType = (donations || []).reduce((acc, d) => {
    const t = d.type || 'Autre';
    acc[t] = (acc[t] || 0) + (d.montant || 0);
    return acc;
  }, {});
  const totalByType = Object.values(byType).reduce((s, v) => s + v, 0) || 1;
  const breakdown = Object.entries(byType).map(([label, value]) => ({
    label,
    value: `${(value / 1e6).toFixed(1)} M XOF`,
    pct: Math.round((value / totalByType) * 1000) / 10,
    color: { 'Don corporate': C.blue, 'Don individuel': C.teal, 'Subvention': C.gold, 'Financement': C.accent }[label] || C.muted,
  }));

  const submit = async () => {
    if (!form.donor || !form.montant) return;
    setSubmitting(true);
    await FirestoreService.createDocument('foundation_donations', {
      ...form, montant: Number(form.montant), statut: 'Reçu', _subModule: 'donations',
    });
    setForm({ donor: '', montant: '', type: 'Espèces', objet: '', date: '' });
    setSubmitting(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Gestion des Dons & Financements" subtitle={`Total collecté : ${fmtM(kpis.donationsTotal)} XOF`} />

      {/* Category breakdown */}
      {breakdown.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px,1fr))', gap: 14 }}>
          {breakdown.map(c => (
            <div key={c.label} className="bento-card" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: c.color }}>{c.value}</div>
              <div style={{ height: 4, borderRadius: 4, background: C.track, margin: '8px 0' }}>
                <div style={{ width: `${c.pct}%`, height: '100%', borderRadius: 4, background: c.color }} />
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{c.label} — {c.pct}%</div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      <div className="bento-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '0.85rem 1.25rem', borderBottom: `1px solid ${C.border}`,
          fontSize: 13, fontWeight: 700, color: C.text,
        }}>Historique des dons</div>
        {donations.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
            Aucun don enregistré. Utilisez le formulaire ci-dessous pour saisir les premiers dons.
          </div>
        ) : donations.map((d, i) => (
          <div key={d.id || i} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '0.875rem 1.25rem',
            borderBottom: i < donations.length - 1 ? `1px solid ${C.border}` : 'none',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{d.donor}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{d.date}</div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
              background: `${typeColor[d.type] || C.muted}15`,
              color: typeColor[d.type] || C.muted,
            }}>{d.type}</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>{fmt(d.montant)} XOF</div>
            <span style={{
              fontSize: 11, padding: '2px 10px', borderRadius: 20,
              background: d.statut === 'Reçu' ? `${C.accent}15` : `${C.gold}15`,
              color: d.statut === 'Reçu' ? C.accent : C.gold,
            }}>{d.statut}</span>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bento-card" style={{ padding: '1.5rem' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Enregistrer un don</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { key: 'donor',  label: 'Donateur / Organisation', ph: 'Nom du donateur' },
            { key: 'montant',label: 'Montant (XOF)',            ph: '5 000 000', type: 'number' },
            { key: 'objet',  label: 'Objet du don',             ph: 'Eau potable, Éducation...' },
            { key: 'date',   label: 'Date de réception',        ph: '', type: 'date' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 12, color: C.muted, display: 'block', marginBottom: 6, fontWeight: 600 }}>{f.label}</label>
              <input
                type={f.type || 'text'}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.ph}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
        <button
          onClick={submit}
          disabled={submitting || !form.donor || !form.montant}
          className="btn btn-primary"
          style={{ marginTop: 16 }}
        >
          {submitting ? 'Enregistrement...' : '+ Enregistrer le don'}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Programs Tab
// ════════════════════════════════════════════════════════════════════════════

function ProgramsTab() {
  const programs = [
    { name: 'Jeunes Entrepreneurs 2026',  statut: 'actif',    bens: 48,   budget: 12_000_000, sdg: [8, 10], progress: 65 },
    { name: 'Eau Propre Abidjan',         statut: 'actif',    bens: 1200, budget: 35_000_000, sdg: [6, 3],  progress: 40 },
    { name: 'École Numérique Rurale',     statut: 'actif',    bens: 320,  budget: 18_000_000, sdg: [4],     progress: 82 },
    { name: 'Formation Femmes Rurales',   statut: 'actif',    bens: 156,  budget: 8_000_000,  sdg: [5, 8],  progress: 55 },
    { name: 'Reboisement Côte d\'Ivoire', statut: 'clôturé',  bens: 0,    budget: 22_000_000, sdg: [13, 15],progress: 100 },
    { name: 'Santé Maternelle Bassam',    statut: 'planifié', bens: 0,    budget: 15_000_000, sdg: [3],     progress: 0 },
  ];

  const statusColor = { actif: C.accent, clôturé: C.muted, planifié: C.blue };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Programmes d'Impact" subtitle={`${programs.filter(p => p.statut === 'actif').length} programmes actifs`} />
      {programs.map((p, i) => (
        <div key={i} className="bento-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{p.name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: `${statusColor[p.statut]}15`, color: statusColor[p.statut],
                }}>{p.statut}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {p.sdg.map(g => (
                  <span key={g} style={{
                    fontSize: 10, padding: '1px 7px', borderRadius: 10,
                    background: `${C.teal}12`, color: C.teal, fontWeight: 700,
                  }}>ODD {g}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.gold }}>{fmtM(p.budget)} XOF</div>
              {p.bens > 0 && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{p.bens} bénéficiaires</div>}
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: C.track }}>
            <div style={{
              width: `${p.progress}%`, height: '100%', borderRadius: 6,
              background: `linear-gradient(90deg, ${C.accent}, ${C.teal})`,
              transition: 'width .6s ease',
            }} />
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6, textAlign: 'right' }}>{p.progress}% accompli</div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Beneficiaries Tab
// ════════════════════════════════════════════════════════════════════════════

function BeneficiariesTab({ kpis }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Gestion des Bénéficiaires" subtitle={`${fmt(kpis.beneficiaries)} personnes accompagnées`} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {[
          { label: 'Femmes',      value: '58%', icon: '', color: C.teal   },
          { label: 'Hommes',      value: '42%', icon: '', color: C.blue   },
          { label: '< 25 ans',    value: '34%', icon: '', color: C.gold   },
          { label: 'Zone rurale', value: '61%', icon: '', color: C.accent },
        ].map(s => (
          <div key={s.label} className="bento-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bento-card" style={{ padding: '1.5rem' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Répartition géographique</div>
        {[
          { region: 'Abidjan',   count: 1_840, pct: 38 },
          { region: 'Bouaké',    count: 820,   pct: 17 },
          { region: 'Daloa',     count: 630,   pct: 13 },
          { region: 'San-Pédro', count: 480,   pct: 10 },
          { region: 'Korhogo',   count: 410,   pct: 8  },
          { region: 'Autres',    count: 640,   pct: 14 },
        ].map(r => (
          <div key={r.region} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 90, fontSize: 13, color: C.text, fontWeight: 600 }}>{r.region}</div>
            <div style={{ flex: 1, height: 8, borderRadius: 8, background: C.track }}>
              <div style={{
                width: `${r.pct}%`, height: '100%', borderRadius: 8,
                background: `linear-gradient(90deg, ${C.accent}, ${C.teal})`,
              }} />
            </div>
            <div style={{ width: 60, textAlign: 'right', fontSize: 12, color: C.muted }}>{fmt(r.count)}</div>
            <div style={{ width: 36, textAlign: 'right', fontSize: 12, color: C.muted }}>{r.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Campaigns Tab
// ════════════════════════════════════════════════════════════════════════════

function CampaignsTab() {
  const campaigns = [
    { name: 'Eau Propre Abidjan',   objectif: 50_000_000, collecte: 31_500_000, statut: 'actif',   deadline: '30/06/2026', donors: 68  },
    { name: 'École pour Tous 2026', objectif: 20_000_000, collecte: 18_200_000, statut: 'actif',   deadline: '31/05/2026', donors: 124 },
    { name: 'Reboisement CI',       objectif: 22_000_000, collecte: 22_000_000, statut: 'clôturé', deadline: '30/04/2026', donors: 210 },
    { name: 'Santé Maternelle',     objectif: 35_000_000, collecte: 4_800_000,  statut: 'actif',   deadline: '31/08/2026', donors: 31  },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Campagnes de Collecte" subtitle={`${campaigns.filter(c => c.statut === 'actif').length} campagnes actives`} />
      {campaigns.map((c, i) => {
        const pct = Math.min(100, Math.round(c.collecte / c.objectif * 100));
        return (
          <div key={i} className="bento-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{c.name}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: c.statut === 'actif' ? `${C.accent}15` : `${C.muted}15`,
                    color: c.statut === 'actif' ? C.accent : C.muted,
                  }}>{c.statut}</span>
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                  Échéance : {c.deadline} · {c.donors} donateurs
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.gold }}>{fmtM(c.collecte)} XOF</div>
                <div style={{ fontSize: 11, color: C.muted }}>/ {fmtM(c.objectif)} XOF objectif</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 10, borderRadius: 10, background: C.track }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: 10,
                  background: pct >= 100
                    ? `linear-gradient(90deg, ${C.accent}, ${C.teal})`
                    : `linear-gradient(90deg, ${C.gold}, ${C.accent})`,
                  transition: 'width .6s ease',
                }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: pct >= 100 ? C.accent : C.gold, minWidth: 40 }}>
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
// Governance Tab
// ════════════════════════════════════════════════════════════════════════════

function GovernanceTab({ role }) {
  const levels = [
    { level: 'Supervision', role: 'IPC Holding — Conseil d\'Administration', access: 'Lecture globale + validation budgets', color: C.accent },
    { level: 'Direction',   role: 'Directeur Général Foundation', access: 'Contrôle total Foundation', color: C.gold  },
    { level: 'Management',  role: 'Responsables Programmes', access: 'Gestion des programmes et campagnes', color: C.blue   },
    { level: 'Opérations',  role: 'Coordinateurs Terrain', access: 'Saisie des données opérationnelles', color: C.teal   },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader title="Gouvernance Foundation" subtitle="Structure, conformité et supervision Holding" />

      {/* Org hierarchy */}
      <div className="bento-card" style={{ padding: '1.5rem' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 20 }}>Structure de gouvernance</div>
        {levels.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: i < levels.length - 1 ? 16 : 0 }}>
            <div style={{
              width: 88, fontSize: 10, fontWeight: 700, color: l.color,
              paddingTop: 14, textAlign: 'right', flexShrink: 0,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{l.level}</div>
            <div style={{ width: 2, background: C.border, alignSelf: 'stretch', flexShrink: 0 }} />
            <div style={{
              flex: 1, background: `${l.color}06`, borderRadius: '0.9rem',
              border: `1px solid ${l.color}22`, padding: '0.875rem 1rem',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{l.role}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{l.access}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance checklist */}
      <div className="bento-card" style={{ padding: '1.5rem' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Conformité & Audit</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { item: 'Statut Foundation déposé', statut: 'Conforme', date: '12/01/2024' },
            { item: 'Rapport annuel soumis', statut: 'Soumis', date: '15/03/2026' },
            { item: 'Audit externe indépendant', statut: 'Validé', date: '20/02/2026' },
            { item: 'Déclaration fiscale OHADA', statut: 'Déposée', date: '30/04/2026' },
            { item: 'Certification ISO 26000', statut: '⏳ En cours', date: 'Prévu Q3 2026' },
            { item: 'Rapport DPEF', statut: 'Publié', date: '30/04/2026' },
          ].map((c, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderRadius: '0.8rem',
              background: c.statut.startsWith('') ? `${C.accent}06` : `${C.gold}06`,
              border: `1px solid ${c.statut.startsWith('') ? C.accent : C.gold}22`,
            }}>
              <div>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{c.item}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{c.date}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.statut.startsWith('') ? C.accent : C.gold }}>
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
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: C.text }}>{title}</h3>
      {subtitle && <span style={{ fontSize: 12, color: C.muted }}>{subtitle}</span>}
    </div>
  );
}
