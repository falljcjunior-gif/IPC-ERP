/**
 * FoundationHub v2 — IPC Collect Foundation
 * 
 * DESIGN: Harmonisé avec le Design de l'ERP (Senior Pristine Architecture).
 * Utilisation des tokens CSS variables de index.css.
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

// ── Navigation items ──────────────────────────────────────────
const NAV_ITEMS = [
  { 
    id:          'finance', 
    label:       'Finance & Dons', 
    Icon:        DollarSign, 
    description: 'Livre journal, dons, décaissements',
    color:       '#064E3B', 
    component:   FinanceFoundationTab,
  },
  { 
    id:          'rh', 
    label:       'RH Foundation', 
    Icon:        Users, 
    description: 'foundation_employees · contrats · paie',
    color:       '#10B981', 
    component:   HRFoundationTab,
  },
  { 
    id:          'frais', 
    label:       'Notes de Frais', 
    Icon:        Receipt, 
    description: 'Workflow approbation · fonds indépendants',
    color:       '#F59E0B', 
    component:   ExpensesTab,
  },
  { 
    id:          'operations', 
    label:       'Opérations Terrain', 
    Icon:        MapPin, 
    description: 'Collecteurs · Centres de Tri · Plastique',
    color:       '#8B5CF6', 
    component:   OperationsTab,
  },
];

const GLOBAL_KPIS = [
  { label: 'Dons collectés',    value: '4 820 000', unit: 'FCFA',   Icon: TrendingUp, color: '#064E3B' },
  { label: 'Collecteurs',       value: '24',         unit: 'actifs', Icon: Users,      color: '#10B981' },
  { label: 'Tonnes plastique',  value: '12,4',       unit: 'T',      Icon: Activity,   color: '#8B5CF6' },
  { label: 'Impact bénéfic.',   value: '1 247',      unit: 'pers.',  Icon: BarChart2,  color: '#F59E0B' },
];

// ── Components ────────────────────────────────────────────────

function Sidebar({ activeId, onSelect, collapsed, onToggle, userRole }) {
  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="glass"
      style={{
        height: 'calc(100% - 2rem)',
        margin: '1rem',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      <div style={{
        padding: collapsed ? '1.5rem 0' : '2rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '0.85rem', flexShrink: 0,
          background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-accent)',
        }}>
          <Leaf size={20} color="#fff" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              IPC Foundation
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nexus OS Subsidiary</div>
          </motion.div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '1.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {NAV_ITEMS.map(item => {
          const NavIcon = item.Icon;
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: collapsed ? '0.85rem 0' : '0.85rem 1rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? 'var(--accent-glow)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', width: '100%',
                transition: 'var(--transition)',
              }}
            >
              <NavIcon size={18} color={active ? 'var(--accent)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: active ? 700 : 500, color: active ? 'var(--text)' : 'var(--text-muted)' }}>
                    {item.label}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', textAlign: collapsed ? 'center' : 'left' }}>
        {!collapsed && (
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Access Level
          </div>
        )}
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--bg-subtle)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem',
          border: '1px solid var(--border)',
        }}>
          <Shield size={14} color="var(--accent)" />
          {!collapsed && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>{userRole}</span>}
        </div>
      </div>
    </motion.aside>
  );
}

function DashboardOverview({ onNavigate }) {
  return (
    <div style={{ padding: '2rem 3rem', overflowY: 'auto', height: '100%' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
          Foundation <span className="text-gradient">Hub</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px' }}>
          Gestion autonome de l'impact social et environnemental. 
          Isolation complète des flux financiers et opérationnels.
        </p>
      </header>

      <div className="bento-grid" style={{ marginBottom: '3rem' }}>
        {GLOBAL_KPIS.map(({ label, value, unit, Icon, color }) => (
          <div key={label} className="bento-card" style={{ gridColumn: 'span 3', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '0.75rem', background: `${color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
              <Activity size={16} color="var(--border)" />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text)' }}>{value}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <section>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
          Modules de Gestion
        </h2>
        <div className="bento-grid">
          {NAV_ITEMS.map(item => (
            <div 
              key={item.id} 
              className="bento-card" 
              style={{ gridColumn: 'span 6', padding: '1.5rem', cursor: 'pointer' }}
              onClick={() => onNavigate(item.id)}
            >
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ 
                  width: 56, height: 56, borderRadius: '1rem', 
                  background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <item.Icon size={28} color={item.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{item.label}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{item.description}</p>
                </div>
                <div className="btn-icon btn-secondary">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FoundationHubInner() {
  const userRole = useStore(s => s.userRole);
  const [activeId, setActiveId] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const activeNav = NAV_ITEMS.find(n => n.id === activeId);
  const ActiveComponent = activeNav?.component || null;

  return (
    <div style={{ display: 'flex', height: '100%', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
      <Sidebar
        activeId={activeId || ''}
        onSelect={id => setActiveId(id)}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        userRole={userRole}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Sub-Header / Breadcrumbs */}
        <header style={{ 
          height: 70, borderBottom: '1px solid var(--border)', 
          background: 'var(--bg)', display: 'flex', alignItems: 'center', 
          padding: '0 2.5rem', justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span 
              onClick={() => setActiveId(null)}
              style={{ cursor: 'pointer', fontWeight: 700, color: activeId ? 'var(--text-muted)' : 'var(--primary)' }}
            >
              Foundation
            </span>
            {activeId && (
              <>
                <ChevronRight size={14} color="var(--border)" />
                <span style={{ fontWeight: 800, color: 'var(--text)' }}>{activeNav?.label}</span>
              </>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
             <button className="btn btn-sm btn-secondary">
               <Activity size={14} /> Report
             </button>
             <button className="btn btn-sm btn-primary">
               <Shield size={14} /> Audit Log
             </button>
          </div>
        </header>

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {!activeId ? (
              <motion.div
                key="dash"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%' }}
              >
                <DashboardOverview onNavigate={id => setActiveId(id)} />
              </motion.div>
            ) : (
              <motion.div
                key={activeId}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                style={{ height: '100%', overflowY: 'auto' }}
              >
                {ActiveComponent && <ActiveComponent />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function FoundationHub() {
  return (
    <FoundationGuard>
      <FoundationHubInner />
    </FoundationGuard>
  );
}
