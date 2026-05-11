/**
 * FoundationHub v2 — IPC Collect Foundation
 *
 * Shell ANTIGRAVITY DARK avec sidebar interne + FoundationGuard RBAC.
 * Modules : Finance | RH | Notes de Frais | Opérations Terrain
 *
 * Design tokens : bg #0a0c10 / surface #0d1117 / card #111318
 *                 border #1f2937 / accent #2ecc71
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, DollarSign, Users, Receipt,
  MapPin, ChevronRight, Activity,
  Shield, TrendingUp, BarChart2, Menu, X,
} from 'lucide-react';

import FoundationGuard          from './FoundationGuard';
import FinanceFoundationTab     from './tabs/FinanceFoundationTab';
import HRFoundationTab          from './tabs/HRFoundationTab';
import ExpensesTab              from './tabs/ExpensesTab';
import OperationsTab            from './tabs/OperationsTab';
import { useStore }             from '../../store';

// ── Design tokens ─────────────────────────────────────────────
const T = {
  bg:       '#0a0c10',
  surface:  '#0d1117',
  card:     '#111318',
  border:   '#1f2937',
  accent:   '#2ecc71',
  accentDim:'rgba(46,204,113,0.10)',
  text:     '#e5e7eb',
  muted:    '#6b7280',
  danger:   '#EF4444',
  warning:  '#F59E0B',
  info:     '#3B82F6',
};

// ── Navigation items ──────────────────────────────────────────
const NAV_ITEMS = [
  {
    id:          'finance',
    label:       'Finance & Dons',
    Icon:        DollarSign,
    description: 'Livre journal, dons, décaissements',
    badge:       null,
    color:       T.accent,
    component:   FinanceFoundationTab,
  },
  {
    id:          'rh',
    label:       'RH Foundation',
    Icon:        Users,
    description: 'foundation_employees · contrats · paie',
    badge:       null,
    color:       T.info,
    component:   HRFoundationTab,
  },
  {
    id:          'frais',
    label:       'Notes de Frais',
    Icon:        Receipt,
    description: 'Workflow approbation · fonds indépendants',
    badge:       2,
    color:       T.warning,
    component:   ExpensesTab,
  },
  {
    id:          'operations',
    label:       'Opérations Terrain',
    Icon:        MapPin,
    description: 'Collecteurs · Centres de Tri · Plastique',
    badge:       null,
    color:       '#8B5CF6',
    component:   OperationsTab,
  },
];

// ── Global KPIs ───────────────────────────────────────────────
const GLOBAL_KPIS = [
  { label: 'Dons collectés',    value: '4 820 000', unit: 'FCFA',   Icon: TrendingUp, color: T.accent },
  { label: 'Collecteurs',       value: '24',         unit: 'actifs', Icon: Users,      color: T.info },
  { label: 'Tonnes plastique',  value: '12,4',       unit: 'T',      Icon: Activity,   color: '#8B5CF6' },
  { label: 'Impact bénéfic.',   value: '1 247',      unit: 'pers.',  Icon: BarChart2,  color: T.warning },
];

// ── Sidebar ───────────────────────────────────────────────────
function Sidebar({ activeId, onSelect, collapsed, onToggle, userRole }) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      style={{
        height: '100%',
        background: T.surface,
        borderRight: `1px solid ${T.border}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Foundation branding */}
      <div style={{
        padding: collapsed ? '1.25rem 0' : '1.5rem 1.25rem',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '0.75rem', flexShrink: 0,
          background: `linear-gradient(135deg, ${T.accent}30, ${T.accent}08)`,
          border: `1px solid ${T.accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Leaf size={17} color={T.accent} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.accent, lineHeight: 1.2 }}>
                IPC Collect
              </div>
              <div style={{ fontSize: '0.68rem', color: T.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Foundation
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onToggle}
          style={{
            marginLeft: collapsed ? 0 : 'auto', background: 'transparent', border: 'none',
            cursor: 'pointer', color: T.muted, padding: 4, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          {collapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0.875rem 0.625rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {NAV_ITEMS.map(item => {
          const NavIcon = item.Icon;
          const active  = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: collapsed ? '0.75rem 0' : '0.75rem 0.875rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? T.accentDim : 'transparent',
                border: `1px solid ${active ? T.accent + '30' : 'transparent'}`,
                borderRadius: '0.75rem', cursor: 'pointer', width: '100%',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '0.5rem', flexShrink: 0,
                background: active ? `${item.color}20` : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}>
                <NavIcon size={16} color={active ? item.color : T.muted} />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ flex: 1, textAlign: 'left', minWidth: 0 }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: active ? 700 : 500, color: active ? T.text : T.muted, whiteSpace: 'nowrap' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                      {item.description}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {item.badge && !collapsed && (
                <span style={{
                  background: T.warning, color: '#000', fontSize: '0.65rem', fontWeight: 800,
                  width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {item.badge}
                </span>
              )}
              {active && !collapsed && (
                <ChevronRight size={13} color={T.accent} style={{ flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer: role badge */}
      <div style={{
        padding: collapsed ? '1rem 0' : '1rem 1.25rem',
        borderTop: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <Shield size={13} color={T.accent} />
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: '0.72rem', color: T.muted }}>
              <code style={{ color: T.accent, background: T.accentDim, padding: '2px 8px', borderRadius: '0.3rem' }}>{userRole}</code>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}

// ── Dashboard overview ────────────────────────────────────────
function DashboardOverview({ onNavigate }) {
  return (
    <div style={{ padding: '2rem', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '1rem',
            background: `linear-gradient(135deg, ${T.accent}30, ${T.accent}08)`,
            border: `1px solid ${T.accent}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Leaf size={22} color={T.accent} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: T.text }}>IPC Collect Foundation</h1>
            <p style={{ margin: 0, fontSize: '0.82rem', color: T.muted }}>Filiale indépendante · Environnement & Impact Social</p>
          </div>
        </div>
      </div>

      {/* Global KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {GLOBAL_KPIS.map(({ label, value, unit, Icon, color }) => (
          <div key={label} style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: '1rem',
            padding: '1.25rem 1.5rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '0.625rem',
                background: `${color}18`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{ fontSize: '0.72rem', color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{label}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color }}>{value}</span>
              <span style={{ fontSize: '0.78rem', color: T.muted }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Module cards */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, marginBottom: '1rem' }}>
          Modules Foundation
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {NAV_ITEMS.map(item => {
            const NavIcon = item.Icon;
            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                whileHover={{ scale: 1.02, borderColor: item.color + '50' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left',
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: '1rem', padding: '1.25rem 1.5rem', cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: '0.875rem', flexShrink: 0,
                  background: `${item.color}18`, border: `1px solid ${item.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <NavIcon size={22} color={item.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: T.text, marginBottom: '0.25rem' }}>
                    {item.label}
                    {item.badge && (
                      <span style={{ marginLeft: 8, background: T.warning, color: '#000', fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px', borderRadius: '2rem' }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.description}
                  </div>
                </div>
                <ChevronRight size={16} color={T.muted} style={{ flexShrink: 0 }} />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Isolation notice */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
        background: T.accentDim, border: `1px solid ${T.accent}25`,
        borderRadius: '0.875rem', padding: '1rem 1.25rem', marginTop: '1.5rem',
      }}>
        <Shield size={16} color={T.accent} style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: T.accent, marginBottom: '0.25rem' }}>Données strictement isolées</div>
          <div style={{ fontSize: '0.78rem', color: T.muted, lineHeight: 1.5 }}>
            Les collections <code style={{ color: T.accent }}>foundation_*</code> sont distinctes du Groupe IPC Green Blocks.
            Seuls les rôles <code style={{ color: T.accent }}>FOUNDATION_ADMIN</code> et <code style={{ color: T.accent }}>FOUNDATION_STAFF</code> y ont accès.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inner hub (post-guard) ────────────────────────────────────
function FoundationHubInner() {
  const userRole   = useStore(s => s.userRole);
  const [activeId, setActiveId] = useState(null);  // null = dashboard overview
  const [collapsed, setCollapsed] = useState(false);

  const activeNav = NAV_ITEMS.find(n => n.id === activeId);
  const ActiveComponent = activeNav?.component || null;

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      background: T.bg,
      color: T.text,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <Sidebar
        activeId={activeId || ''}
        onSelect={id => setActiveId(id)}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        userRole={userRole}
      />

      {/* Main area */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Breadcrumb bar */}
        <div style={{
          height: 52, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', padding: '0 1.5rem', gap: '0.5rem',
          background: T.surface, flexShrink: 0,
        }}>
          <button
            onClick={() => setActiveId(null)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: activeId ? T.muted : T.accent,
              fontSize: '0.82rem', fontWeight: activeId ? 500 : 700,
              padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
            }}
          >
            Foundation
          </button>
          {activeNav && (
            <>
              <ChevronRight size={12} color={T.muted} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>{activeNav.label}</span>
            </>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: '0.72rem', color: T.muted, background: T.card, border: `1px solid ${T.border}`, padding: '3px 10px', borderRadius: '0.375rem' }}>
            Filiale Indépendante
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {!activeId ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%' }}
              >
                <DashboardOverview onNavigate={id => setActiveId(id)} />
              </motion.div>
            ) : (
              <motion.div
                key={activeId}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%', overflowY: 'auto' }}
              >
                {ActiveComponent && <ActiveComponent />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Public export (with RBAC guard) ──────────────────────────
export default function FoundationHub() {
  return (
    <FoundationGuard>
      <FoundationHubInner />
    </FoundationGuard>
  );
}
