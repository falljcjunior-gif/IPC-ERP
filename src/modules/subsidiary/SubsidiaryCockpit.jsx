/**
 * ════════════════════════════════════════════════════════════════════════════
 * SUBSIDIARY COCKPIT — Tableau de bord Filiale
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Design : Antigravity OS — emerald-glass theme.
 * Accès  : SUBSIDIARY_DG, SUBSIDIARY_CFO, SUBSIDIARY_RH, COUNTRY_DIRECTOR_SUBSIDIARY,
 *          SUPER_ADMIN, ADMIN. Holding voit ce cockpit en read-only via switch.
 *
 * Scope  : strictement filiale courante (entity_id du user).
 *          Les KPI sont calculés en local sur les données déjà filtrées
 *          (Firestore Rules + FirestoreService defense-in-depth).
 */

import React, { useMemo } from 'react';
import {
  Building2, TrendingUp, Users, Package, ShoppingCart,
  Wallet, Factory, ClipboardList, Briefcase, AlertTriangle,
  CheckCircle2, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useStore } from '../../store';
import { getCurrentEntityId, getTenantContext } from '../../services/TenantContext';

// ── Design tokens (emerald-glass) ───────────────────────────────────────────
const C = {
  accent:  '#10B981',
  accentSoft: '#ECFDF5',
  gold:    '#F59E0B',
  blue:    '#3B82F6',
  red:     '#EF4444',
  purple:  '#8B5CF6',
  text:    '#0F172A',
  muted:   '#64748B',
  border:  '#E2E8F0',
};

const fmt  = (n) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
const fmtM = (n) => n >= 1e9 ? `${(n/1e9).toFixed(2)} Md` : n >= 1e6 ? `${(n/1e6).toFixed(1)} M` : fmt(n);

export default function SubsidiaryCockpit() {
  const data = useStore(s => s.data);
  const entityId = getCurrentEntityId();
  const ctx = getTenantContext();

  // ── KPI calculés à partir du store (déjà scopé entity_id côté FirestoreService) ─
  const kpis = useMemo(() => {
    const sales       = data?.sales?.orders   || [];
    const invoices    = data?.finance?.invoices || [];
    const employees   = data?.hr?.employees   || data?.employees || [];
    const inventory   = data?.inventory?.products || [];
    const workOrders  = data?.production?.workOrders || [];
    const projects    = data?.projects?.items || [];

    const revenue = invoices
      .filter(i => i.statut === 'Payé' || i.status === 'paid')
      .reduce((s, i) => s + (Number(i.montant) || Number(i.amount) || 0), 0);

    const pendingOrders = sales.filter(o => o.status === 'pending' || o.statut === 'En attente').length;
    const lowStock      = inventory.filter(p => Number(p.stock_reel || 0) < Number(p.stock_min || 0)).length;
    const activeWO      = workOrders.filter(w => w.status === 'in_progress' || w.statut === 'En cours').length;

    return [
      {
        label: 'CA Filiale (payé)',
        value: fmtM(revenue),
        unit:  'XOF',
        Icon:  Wallet,
        color: C.accent,
        empty: revenue === 0,
      },
      {
        label: 'Commandes en cours',
        value: pendingOrders,
        unit:  '',
        Icon:  ShoppingCart,
        color: C.blue,
        empty: pendingOrders === 0,
      },
      {
        label: 'Effectif Filiale',
        value: employees.length,
        unit:  'emp',
        Icon:  Users,
        color: C.gold,
        empty: employees.length === 0,
      },
      {
        label: 'Ordres de Fabrication',
        value: activeWO,
        unit:  '',
        Icon:  Factory,
        color: C.purple,
        empty: activeWO === 0,
      },
      {
        label: 'Stocks Critiques',
        value: lowStock,
        unit:  '',
        Icon:  Package,
        color: lowStock > 0 ? C.red : C.muted,
        empty: lowStock === 0,
      },
      {
        label: 'Projets Actifs',
        value: projects.filter(p => p.status === 'active' || p.statut === 'En cours').length,
        unit:  '',
        Icon:  Briefcase,
        color: C.accent,
        empty: projects.length === 0,
      },
    ];
  }, [data]);

  return (
    <div style={{
      background: '#F8FAFC',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '2.5rem 3rem 0',
        background: '#fff',
        borderBottom: `1px solid ${C.border}`,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{
              fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.18em',
              color: '#9CA3AF', fontWeight: 700, marginBottom: '0.5rem',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Building2 size={14} strokeWidth={2.2} />
              Espace Filiale · {ctx?.entity_name || entityId || 'Filiale'}
            </div>
            <h1 style={{
              fontSize: '2.2rem', fontWeight: 200, letterSpacing: '-0.04em',
              margin: 0, color: '#000', lineHeight: 1.1,
            }}>
              Cockpit <strong style={{ fontWeight: 700 }}>Opérationnel</strong>
            </h1>
            <p style={{ color: C.muted, fontSize: 14, margin: '0.6rem 0 0 0' }}>
              Performance locale, KPI métier et alertes opérationnelles de votre filiale.
            </p>
          </div>

          {/* Badge espace */}
          <div style={{
            padding: '6px 14px', borderRadius: 20,
            background: `${C.accent}12`, border: `1px solid ${C.accent}33`,
            fontSize: 12, fontWeight: 700, color: C.accent,
          }}>
            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={{ padding: '2rem 3rem' }}>

        {/* KPI Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}>
          {kpis.map(k => {
            const Icon = k.Icon;
            return (
              <div key={k.label} style={{
                background: '#fff',
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: '1.5rem',
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: `${k.color}15`, color: k.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} strokeWidth={2} />
                  </div>
                </div>
                <div style={{
                  fontSize: '1.6rem', fontWeight: 800, color: k.empty ? C.muted : C.text,
                  lineHeight: 1,
                }}>
                  {k.empty ? '—' : k.value}
                  {!k.empty && k.unit && (
                    <span style={{ fontSize: 12, color: C.muted, marginLeft: 5, fontWeight: 400 }}>
                      {k.unit}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 6, fontWeight: 600 }}>
                  {k.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state global */}
        {kpis.every(k => k.empty) && (
          <div style={{
            background: '#fff',
            border: `1px dashed ${C.border}`,
            borderRadius: 16,
            padding: '3rem 2rem',
            textAlign: 'center',
          }}>
            <Building2 size={36} strokeWidth={1.5} style={{ color: C.muted, marginBottom: 12 }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              Bienvenue dans votre Cockpit Filiale
            </div>
            <div style={{ fontSize: 14, color: C.muted, maxWidth: 520, margin: '0 auto', lineHeight: 1.5 }}>
              Vos KPI opérationnels (ventes, stocks, RH, production, projets) s'afficheront ici
              dès que vous aurez créé vos premières fiches via les modules CRM, Sales, HR, etc.
            </div>
          </div>
        )}

        {/* Sections additionnelles — viendront en sessions futures */}
        <div style={{
          marginTop: 28,
          padding: '2rem',
          background: '#fff',
          borderRadius: 16,
          border: `1px solid ${C.border}`,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.15em',
            color: C.muted, fontWeight: 700, marginBottom: 16,
          }}>
            <ClipboardList size={14} strokeWidth={2} />
            Prochaines étapes
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {[
              { Icon: Users,       label: 'Inviter vos premiers employés',     hint: 'Module RH → Onboarding' },
              { Icon: ShoppingCart, label: 'Créer votre premier client',         hint: 'Module CRM → Nouveau' },
              { Icon: Package,     label: 'Référencer vos produits',            hint: 'Module Stocks → Catalogue' },
              { Icon: Wallet,      label: 'Configurer vos comptes bancaires',   hint: 'Module Finance → Trésorerie' },
            ].map((s, i) => {
              const Icon = s.Icon;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: C.accentSoft,
                  borderRadius: 12,
                  border: `1px solid ${C.accent}22`,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: '#fff', color: C.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{s.hint}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
