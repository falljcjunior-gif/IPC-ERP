/**
 * ════════════════════════════════════════════════════════════════════════════
 * COUNTRY MANAGEMENT CENTER — v3.0 Holding Governance
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  RÔLE
 *  ────
 *  Cockpit central depuis la Holding pour :
 *    1. Visualiser tous les Country Scopes (carte mondiale + liste).
 *    2. Créer un nouveau pays via wizard 6 étapes — provisionne
 *       automatiquement une Filiale et une Foundation jumelles.
 *    3. Suivre l'état de chaque pays (ACTIVE / PROVISIONING / SUSPENDED).
 *    4. Geler ou réactiver un pays (cascade sur les 2 entités jumelles).
 *
 *  DESIGN
 *  ──────
 *  Antigravity emerald-glass — strictement identique à HoldingCockpit
 *  et EntityManagementCenter (frosted glass, blanc/vert, typo Inter, fontWeight 200/700).
 *
 *  SÉCURITÉ
 *  ────────
 *  Réservé aux rôles Holding (enforced côté Cloud Function provisionCountryScope).
 *  L'écran lui-même est déjà gated par HoldingCockpit (isHoldingRole()).
 * ════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../../firebase/config';
import { FirestoreService } from '../../../services/firestore.service';
import {
  SUPPORTED_COUNTRIES, COUNTRY_SCOPE_STATES, getCountryByCode, buildEntityIds, buildEntityNames,
} from '../../../schemas/country.schema';
import { useStore } from '../../../store';

// ── ERP design tokens (light theme, parité HoldingCockpit) ──────────────────
const C = {
  accent: '#10B981',
  gold:   '#F59E0B',
  blue:   '#3B82F6',
  red:    '#EF4444',
  purple: '#8B5CF6',
  teal:   '#0D9488',
  border: '#E2E8F0',
  text:   '#0F172A',
  muted:  '#64748B',
  track:  '#F1F5F9',
  bg:     '#F8FAFC',
};

const STATE_BADGE = {
  ACTIVE:       { color: C.accent, label: 'Actif',         icon: ''  },
  PROVISIONING: { color: C.gold,   label: 'En cours',      icon: '⏳' },
  SUSPENDED:    { color: C.red,    label: 'Gelé',          icon: '⏸' },
  ARCHIVED:     { color: C.muted,  label: 'Archivé',       icon: '' },
  DRAFT:        { color: C.blue,   label: 'Brouillon',     icon: '' },
};

// ── Plans de licence disponibles (alignés sur license.schema.js) ────────────
const SUBSIDIARY_PLANS = [
  { id: 'STARTER',    label: 'Starter',    desc: '10 users · 5 modules · 5 Go' },
  { id: 'BUSINESS',   label: 'Business',   desc: '50 users · 10 modules · 50 Go' },
  { id: 'ENTERPRISE', label: 'Enterprise', desc: '200 users · tous modules · 500 Go' },
  { id: 'INDUSTRIAL', label: 'Industrial', desc: 'Production + GMAO · illimité' },
  { id: 'ACADEMY',    label: 'Academy',    desc: 'Formation · LMS · 100 users' },
];

const FOUNDATION_PLANS = [
  { id: 'FOUNDATION', label: 'Foundation',     desc: 'Programmes · Bénéficiaires' },
  { id: 'CUSTOM',     label: 'Custom mission', desc: 'Configuration sur mesure' },
];

// ── Modules par type d'entité (pour cocher dans le wizard) ─────────────────
const SUBSIDIARY_MODULES = [
  { id: 'crm',         label: 'CRM' },
  { id: 'sales',       label: 'Ventes' },
  { id: 'inventory',   label: 'Stocks' },
  { id: 'production',  label: 'Production' },
  { id: 'logistics',   label: 'Logistique' },
  { id: 'finance',     label: 'Finance' },
  { id: 'accounting',  label: 'Comptabilité' },
  { id: 'hr',          label: 'RH' },
  { id: 'talent',      label: 'Talent' },
  { id: 'payroll',     label: 'Paie' },
  { id: 'projects',    label: 'Projets' },
  { id: 'marketing',   label: 'Marketing' },
  { id: 'planning',    label: 'Planning' },
  { id: 'dms',         label: 'Documents' },
  { id: 'signature',   label: 'Signature' },
  { id: 'legal',       label: 'Juridique' },
  { id: 'connect',     label: 'Connect+' },
];

const FOUNDATION_MODULES = [
  { id: 'foundation_impact',    label: 'Impact & Programmes' },
  { id: 'foundation_donations', label: 'Dons' },
  { id: 'foundation_campaigns', label: 'Campagnes' },
  { id: 'foundation_benef',     label: 'Bénéficiaires' },
  { id: 'projects',             label: 'Projets' },
  { id: 'dms',                  label: 'Documents' },
  { id: 'signature',            label: 'Signature' },
  { id: 'connect',              label: 'Connect+' },
  { id: 'hr',                   label: 'RH locale' },
  { id: 'finance',              label: 'Finance locale' },
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function CountryManagementCenter() {
  const [scopes, setScopes]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [filter, setFilter]         = useState('ALL');

  // Live subscription to country_scopes
  useEffect(() => {
    const unsub = FirestoreService.subscribeToCollection('country_scopes',
      (docs) => { setScopes(docs); setLoading(false); },
      { orderBy: [{ field: '_createdAt', direction: 'desc' }] }
    );
    return () => typeof unsub === 'function' && unsub();
  }, []);

  const filteredScopes = useMemo(() => {
    if (filter === 'ALL') return scopes;
    return scopes.filter(s => s.state === filter);
  }, [scopes, filter]);

  const stats = useMemo(() => ({
    total:     scopes.length,
    active:    scopes.filter(s => s.state === 'ACTIVE').length,
    pending:   scopes.filter(s => s.state === 'PROVISIONING').length,
    suspended: scopes.filter(s => s.state === 'SUSPENDED').length,
  }), [scopes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header avec stats + CTA ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
        <div>
          <div style={{
            fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.18em',
            color: C.muted, fontWeight: 700, marginBottom: 6,
          }}>
            Gouvernance internationale · Provisioning automatique
          </div>
          <h2 style={{ fontSize: '1.7rem', fontWeight: 200, letterSpacing: '-0.03em', margin: 0, color: C.text }}>
            Country Management <strong style={{ fontWeight: 700 }}>Center</strong>
          </h2>
          <div style={{ marginTop: 8, fontSize: 13, color: C.muted, maxWidth: 600 }}>
            Crée un pays et le système provisionne automatiquement une <b>Filiale</b> et
            une <b>Foundation</b> jumelles, attribue les licences et installe les directeurs locaux.
          </div>
        </div>

        <button onClick={() => setShowWizard(true)} style={{
          padding: '12px 22px', borderRadius: 12,
          background: C.accent, color: '#fff', border: 'none', cursor: 'pointer',
          fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: `0 4px 14px ${C.accent}55`,
        }}>
          <span style={{ fontSize: 16 }}></span> Nouveau pays
        </button>
      </div>

      {/* ── Stats cards ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Total pays"  value={stats.total}     icon="" color={C.text} />
        <StatCard label="Actifs"      value={stats.active}    icon=""  color={C.accent} />
        <StatCard label="En cours"    value={stats.pending}   icon="⏳" color={C.gold} />
        <StatCard label="Gelés"       value={stats.suspended} icon="⏸"  color={C.red} />
      </div>

      {/* ── Filter chips ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8 }}>
        {['ALL', 'ACTIVE', 'PROVISIONING', 'SUSPENDED', 'ARCHIVED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 18,
            border: `1px solid ${filter === f ? C.accent : C.border}`,
            background: filter === f ? `${C.accent}15` : '#fff',
            color: filter === f ? C.accent : C.muted,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            {f === 'ALL' ? 'Tous' : STATE_BADGE[f]?.label}
          </button>
        ))}
      </div>

      {/* ── Liste des Country Scopes ──────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Chargement…</div>
      ) : filteredScopes.length === 0 ? (
        <EmptyState onCreate={() => setShowWizard(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filteredScopes.map(s => <CountryCard key={s.country_id || s.id} scope={s} />)}
        </div>
      )}

      {/* ── Wizard ────────────────────────────────────────────────────────── */}
      {showWizard && (
        <CountryWizard
          existingCountryIds={scopes.map(s => s.country_id)}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: 18,
      border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {label}
        </div>
        <span style={{ fontSize: 16, opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 200, color, letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  );
}

function CountryCard({ scope }) {
  const country = getCountryByCode(scope.country_id) || {};
  const badge = STATE_BADGE[scope.state] || STATE_BADGE.DRAFT;

  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: 20,
      border: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      display: 'flex', flexDirection: 'column', gap: 14,
      transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32 }}>{country.flag || scope.flag || ''}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{scope.country_name}</div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: '0.05em' }}>
              {scope.country_id} · {scope.currency}
            </div>
          </div>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700,
          background: `${badge.color}15`, color: badge.color, border: `1px solid ${badge.color}33`,
        }}>
          {badge.icon} {badge.label}
        </div>
      </div>

      {/* Entités jumelles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <EntityMini icon="" label="Filiale" name={scope.subsidiary_id} plan={scope.licenses?.subsidiary_plan} color={C.blue} />
        <EntityMini icon="" label="Foundation" name={scope.foundation_id} plan={scope.licenses?.foundation_plan} color={C.accent} />
      </div>

      {/* Erreurs si provisioning partiel */}
      {scope.errors?.length > 0 && (
        <div style={{
          padding: 10, borderRadius: 10,
          background: `${C.red}10`, border: `1px solid ${C.red}33`,
 fontSize: 11, color: C.red,
 }}>
 Provisioning partiel — {scope.errors.length} erreur(s)
 </div>
 )}
 </div>
 );
}

function EntityMini({ icon, label, name, plan, color }) {
 return (
 <div style={{
 padding: 10, borderRadius: 10, background: C.bg,
 border:`1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name || '—'}
      </div>
      {plan && (
        <div style={{ fontSize: 10, color, fontWeight: 700, marginTop: 2 }}>{plan}</div>
      )}
    </div>
  );
}

function EmptyState({ onCreate }) {
  return (
    <div style={{
      padding: '60px 20px', textAlign: 'center', background: '#fff',
      borderRadius: 18, border: `2px dashed ${C.border}`,
    }}>
      <div style={{ fontSize: 56, marginBottom: 12 }}></div>
      <div style={{ fontSize: 18, fontWeight: 200, color: C.text, marginBottom: 6 }}>
        Aucun pays provisionné
      </div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 20, maxWidth: 420, margin: '0 auto 20px' }}>
        Lance le wizard pour créer ton premier Country Scope. Le système provisionnera
        automatiquement une filiale et une foundation jumelles avec leurs directeurs locaux.
      </div>
      <button onClick={onCreate} style={{
        padding: '12px 26px', borderRadius: 12,
        background: C.accent, color: '#fff', border: 'none', cursor: 'pointer',
        fontWeight: 700, fontSize: 13,
      }}>
 Créer le premier pays
 </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WIZARD — 6 ÉTAPES
// ═══════════════════════════════════════════════════════════════════════════

function CountryWizard({ existingCountryIds, onClose }) {
  const addHint = useStore(s => s.addHint);
  const [step, setStep]             = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]             = useState({
    country_code: '',
    licenses: { subsidiary_plan: 'BUSINESS', foundation_plan: 'FOUNDATION' },
    subsidiary: {
      industry: 'Conglomérat',
      modules: ['crm', 'sales', 'finance', 'hr', 'inventory'],
      director: { email: '', nom: '', prenom: '' },
    },
    foundation: {
      modules: ['foundation_impact', 'foundation_donations', 'dms'],
      director: { email: '', nom: '', prenom: '' },
    },
  });

  const country = getCountryByCode(form.country_code);

  const STEPS = [
    { id: 'country',    label: 'Pays' },
    { id: 'subsidiary', label: 'Filiale' },
    { id: 'foundation', label: 'Foundation' },
    { id: 'licenses',   label: 'Licences' },
    { id: 'directors',  label: 'Directeurs' },
    { id: 'confirm',    label: 'Confirmation' },
  ];

  // Validation par étape
  const canAdvance = () => {
    if (step === 0) return form.country_code && !existingCountryIds.includes(form.country_code);
    if (step === 1) return form.subsidiary.modules.length > 0;
    if (step === 2) return form.foundation.modules.length > 0;
    if (step === 3) return form.licenses.subsidiary_plan && form.licenses.foundation_plan;
    if (step === 4) {
      const { subsidiary, foundation } = form;
      return subsidiary.director.email && subsidiary.director.nom
        && foundation.director.email && foundation.director.nom;
    }
    return true;
  };

  const submit = async () => {
    if (!country) return;
    setSubmitting(true);
    try {
      const functions = getFunctions(app, 'europe-west1');
      const provFn    = httpsCallable(functions, 'provisionCountryScope');
      const result    = await provFn({
        country_code: form.country_code,
        country_name: country.name,
        currency:     country.currency,
        timezone:     country.timezone,
        flag:         country.flag,
        licenses:     form.licenses,
        subsidiary:   form.subsidiary,
        foundation:   form.foundation,
      });

      addHint?.({
        title:   'Pays provisionné',
        message: `${country.name} créé · ${result.data.subsidiary_id} + ${result.data.foundation_id}`,
        type:    'success',
      });
      onClose();
    } catch (err) {
      console.error('[CountryWizard] submit:', err);
      addHint?.({
        title:   'Provisioning échoué',
        message: err.message || 'Erreur inconnue',
        type:    'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(8px)', padding: 20,
    }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#fff', borderRadius: 20, maxWidth: 720, width: '100%',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
      }}>
        {/* Wizard header */}
        <div style={{ padding: '20px 28px 0', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 200, color: C.text }}>
              Nouveau <strong style={{ fontWeight: 700 }}>Country Scope</strong>
            </h3>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 22, color: C.muted, padding: 4,
            }}></button>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{
                flex: 1, padding: '8px 6px', borderRadius: 8,
                background: i === step ? C.text : i < step ? `${C.accent}15` : C.bg,
                color: i === step ? '#fff' : i < step ? C.accent : C.muted,
                fontSize: 11, fontWeight: 700, textAlign: 'center',
                transition: 'all 0.2s',
              }}>
                {i + 1}. {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {step === 0 && <StepCountry form={form} setForm={setForm} existingCountryIds={existingCountryIds} />}
          {step === 1 && <StepSubsidiary form={form} setForm={setForm} country={country} />}
          {step === 2 && <StepFoundation form={form} setForm={setForm} country={country} />}
          {step === 3 && <StepLicenses  form={form} setForm={setForm} />}
          {step === 4 && <StepDirectors form={form} setForm={setForm} country={country} />}
          {step === 5 && <StepConfirm   form={form} country={country} />}
        </div>

        {/* Wizard footer */}
        <div style={{
          padding: '16px 28px', borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.bg,
        }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0 || submitting} style={{
            padding: '10px 18px', borderRadius: 10,
            background: 'transparent', border: `1px solid ${C.border}`,
            color: step === 0 ? C.muted : C.text, fontSize: 12, fontWeight: 700,
            cursor: step === 0 ? 'not-allowed' : 'pointer', opacity: step === 0 ? 0.5 : 1,
          }}>
            ← Précédent
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} style={{
              padding: '10px 22px', borderRadius: 10,
              background: canAdvance() ? C.text : C.muted, color: '#fff', border: 'none',
              fontSize: 12, fontWeight: 700, cursor: canAdvance() ? 'pointer' : 'not-allowed',
            }}>
              Suivant →
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} style={{
              padding: '10px 26px', borderRadius: 10,
              background: C.accent, color: '#fff', border: 'none',
              fontSize: 12, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {submitting ? '⏳ Provisioning…' : 'Lancer le provisioning'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Wizard steps ────────────────────────────────────────────────────────────

function StepCountry({ form, setForm, existingCountryIds }) {
  return (
    <div>
      <FieldLabel>Pays à provisionner</FieldLabel>
      <FieldHelp>Le système va créer une Filiale et une Foundation jumelles dans ce pays.</FieldHelp>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
        {SUPPORTED_COUNTRIES.map(c => {
          const taken    = existingCountryIds.includes(c.code);
          const selected = form.country_code === c.code;
          return (
            <button key={c.code} disabled={taken}
              onClick={() => setForm(f => ({ ...f, country_code: c.code }))}
              style={{
                padding: 12, borderRadius: 12, cursor: taken ? 'not-allowed' : 'pointer',
                border: `2px solid ${selected ? C.accent : C.border}`,
                background: selected ? `${C.accent}10` : taken ? C.bg : '#fff',
                opacity: taken ? 0.45 : 1, textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
              <span style={{ fontSize: 22 }}>{c.flag}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>
                  {c.code} · {c.currency}{taken ? ' · déjà créé' : ''}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepSubsidiary({ form, setForm, country }) {
  const ids = country ? buildEntityIds(country.code) : null;
  const names = country ? buildEntityNames(country.code) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: 12, borderRadius: 10, background: `${C.blue}10`, border: `1px solid ${C.blue}33` }}>
        <div style={{ fontSize: 11, color: C.blue, fontWeight: 700, marginBottom: 4 }}> ENTITÉ FILIALE</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{names?.subsidiary_name || '—'}</div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace', marginTop: 2 }}>{ids?.subsidiary_id}</div>
      </div>

      <div>
        <FieldLabel>Secteur d'activité</FieldLabel>
        <input type="text" value={form.subsidiary.industry}
          onChange={(e) => setForm(f => ({ ...f, subsidiary: { ...f.subsidiary, industry: e.target.value } }))}
          style={inputStyle} placeholder="Ex: Conglomérat, Industrie, Services…" />
      </div>

      <div>
        <FieldLabel>Modules à activer ({form.subsidiary.modules.length})</FieldLabel>
        <FieldHelp>Les modules cochés seront disponibles pour le directeur pays de la filiale.</FieldHelp>
        <ModuleGrid modules={SUBSIDIARY_MODULES} selected={form.subsidiary.modules}
          onChange={(modules) => setForm(f => ({ ...f, subsidiary: { ...f.subsidiary, modules } }))} />
      </div>
    </div>
  );
}

function StepFoundation({ form, setForm, country }) {
  const ids   = country ? buildEntityIds(country.code) : null;
  const names = country ? buildEntityNames(country.code) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: 12, borderRadius: 10, background: `${C.accent}10`, border: `1px solid ${C.accent}33` }}>
        <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginBottom: 4 }}> ENTITÉ FOUNDATION</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{names?.foundation_name || '—'}</div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace', marginTop: 2 }}>{ids?.foundation_id}</div>
      </div>

      <div>
        <FieldLabel>Modules mission/impact ({form.foundation.modules.length})</FieldLabel>
        <FieldHelp>Modules spécialisés ONG · impact.</FieldHelp>
        <ModuleGrid modules={FOUNDATION_MODULES} selected={form.foundation.modules}
          onChange={(modules) => setForm(f => ({ ...f, foundation: { ...f.foundation, modules } }))} />
      </div>
    </div>
  );
}

function StepLicenses({ form, setForm }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <FieldLabel>Plan Filiale</FieldLabel>
        <FieldHelp>Quotas utilisateurs, modules, stockage de la filiale.</FieldHelp>
        <PlanGrid plans={SUBSIDIARY_PLANS} selected={form.licenses.subsidiary_plan}
          onChange={(plan) => setForm(f => ({ ...f, licenses: { ...f.licenses, subsidiary_plan: plan } }))} color={C.blue} />
      </div>
      <div>
        <FieldLabel>Plan Foundation</FieldLabel>
        <FieldHelp>Spécialisé impact / programmes.</FieldHelp>
        <PlanGrid plans={FOUNDATION_PLANS} selected={form.licenses.foundation_plan}
          onChange={(plan) => setForm(f => ({ ...f, licenses: { ...f.licenses, foundation_plan: plan } }))} color={C.accent} />
      </div>
    </div>
  );
}

function StepDirectors({ form, setForm }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <DirectorBlock
        title="Directeur Pays · Filiale" color={C.blue}
        role="COUNTRY_DIRECTOR_SUBSIDIARY"
        value={form.subsidiary.director}
        onChange={(d) => setForm(f => ({ ...f, subsidiary: { ...f.subsidiary, director: d } }))}
      />
      <DirectorBlock
        title="Directeur Pays · Foundation" color={C.accent}
        role="COUNTRY_DIRECTOR_FOUNDATION"
        value={form.foundation.director}
        onChange={(d) => setForm(f => ({ ...f, foundation: { ...f.foundation, director: d } }))}
      />
    </div>
  );
}

function DirectorBlock({ title, color, role, value, onChange }) {
  return (
    <div style={{ padding: 16, borderRadius: 12, border: `1px solid ${color}33`, background: `${color}08` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace', marginBottom: 12 }}>Rôle attribué : {role}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input type="text" value={value.prenom} placeholder="Prénom"
          onChange={(e) => onChange({ ...value, prenom: e.target.value })} style={inputStyle} />
        <input type="text" value={value.nom} placeholder="Nom *"
          onChange={(e) => onChange({ ...value, nom: e.target.value })} style={inputStyle} />
      </div>
      <input type="email" value={value.email} placeholder="email@ipc.com *"
        onChange={(e) => onChange({ ...value, email: e.target.value })}
        style={{ ...inputStyle, marginTop: 10 }} />
    </div>
  );
}

function StepConfirm({ form, country }) {
  const ids = country ? buildEntityIds(country.code) : null;
  const names = country ? buildEntityNames(country.code) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center', padding: 12 }}>
        <div style={{ fontSize: 48 }}>{country?.flag}</div>
        <div style={{ fontSize: 20, fontWeight: 200, color: C.text, marginTop: 6 }}>
          {country?.name}
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginTop: 2 }}>
          {country?.code} · {country?.currency} · {country?.timezone}
        </div>
      </div>

      <SummaryRow icon="" label="Filiale" color={C.blue}>
        <div><b>{names?.subsidiary_name}</b> <span style={{ color: C.muted, fontSize: 11 }}>({ids?.subsidiary_id})</span></div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Plan : <b style={{ color: C.blue }}>{form.licenses.subsidiary_plan}</b> · {form.subsidiary.modules.length} modules</div>
        <div style={{ fontSize: 11, color: C.muted }}>Directeur : <b>{form.subsidiary.director.prenom} {form.subsidiary.director.nom}</b> · {form.subsidiary.director.email}</div>
      </SummaryRow>

      <SummaryRow icon="" label="Foundation" color={C.accent}>
        <div><b>{names?.foundation_name}</b> <span style={{ color: C.muted, fontSize: 11 }}>({ids?.foundation_id})</span></div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Plan : <b style={{ color: C.accent }}>{form.licenses.foundation_plan}</b> · {form.foundation.modules.length} modules</div>
        <div style={{ fontSize: 11, color: C.muted }}>Directeur : <b>{form.foundation.director.prenom} {form.foundation.director.nom}</b> · {form.foundation.director.email}</div>
      </SummaryRow>

      <div style={{
        padding: 12, borderRadius: 10, background: `${C.gold}10`,
        border: `1px solid ${C.gold}33`, fontSize: 11, color: '#B45309',
      }}>
 Action irréversible. Les comptes Auth des 2 directeurs seront créés et liés
 aux entités. Un email de bienvenue leur sera envoyé.
 </div>
    </div>
  );
}

function SummaryRow({ icon, label, color, children }) {
  return (
    <div style={{ padding: 12, borderRadius: 12, border: `1px solid ${color}33`, background: `${color}08` }}>
      <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 12, color: C.text }}>{children}</div>
    </div>
  );
}

// ── Generic field UI helpers ────────────────────────────────────────────────

function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{children}</div>;
}
function FieldHelp({ children }) {
  return <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{children}</div>;
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
  fontFamily: 'Inter, sans-serif', outline: 'none', background: '#fff',
  boxSizing: 'border-box',
};

function ModuleGrid({ modules, selected, onChange }) {
  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id));
    else onChange([...selected, id]);
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 8 }}>
      {modules.map(m => {
        const on = selected.includes(m.id);
        return (
          <button key={m.id} onClick={() => toggle(m.id)} style={{
            padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
            border: `1px solid ${on ? C.accent : C.border}`,
            background: on ? `${C.accent}15` : '#fff',
            color: on ? C.accent : C.muted,
            fontSize: 11, fontWeight: 700, textAlign: 'left',
          }}>
            {on ? '' : ''}{m.label}
          </button>
        );
      })}
    </div>
  );
}

function PlanGrid({ plans, selected, onChange, color }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginTop: 8 }}>
      {plans.map(p => {
        const on = selected === p.id;
        return (
          <button key={p.id} onClick={() => onChange(p.id)} style={{
            padding: 14, borderRadius: 12, cursor: 'pointer',
            border: `2px solid ${on ? color : C.border}`,
            background: on ? `${color}10` : '#fff',
            textAlign: 'left',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: on ? color : C.text }}>{p.label}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{p.desc}</div>
          </button>
        );
      })}
    </div>
  );
}
