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
      animate={{ width: collapsed ? 100 : 320 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        height: 'calc(100vh - 2.5rem)',
        margin: '1.25rem',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 50,
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-premium)',
        position: 'relative'
      }}
    >
      {/* Collapse Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        style={{
          position: 'absolute',
          right: '1rem',
          top: '2rem',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 60,
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <ChevronRight size={16} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: '0.3s' }} />
      </motion.button>

      <div style={{
        padding: collapsed ? '2rem 0' : '2.5rem 2rem',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '1rem', flexShrink: 0,
          background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 10px 20px -5px rgba(6, 78, 59, 0.3)',
        }}>
          <ShieldCheck size={24} color="#fff" />
        </div>
        {!collapsed && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
              IPC <span style={{ color: 'var(--accent)' }}>Foundation</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Impact Operating System
            </div>
          </motion.div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Overview Button */}
        <button
          onClick={() => onSelect(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: collapsed ? '1rem 0' : '1rem 1.25rem',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: !activeId ? 'var(--accent-glow)' : 'transparent',
            border: 'none',
            borderRadius: '1rem', cursor: 'pointer', width: '100%',
            transition: 'var(--transition)',
            color: !activeId ? 'var(--accent)' : 'var(--text-muted)',
            position: 'relative'
          }}
        >
          <LayoutDashboard size={20} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Tableau de Bord</span>}
          {!activeId && !collapsed && (
             <motion.div layoutId="sidebar-dot" style={{ position: 'absolute', right: '1.25rem', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          )}
        </button>

        <div style={{ margin: '1.5rem 0 0.5rem', padding: collapsed ? 0 : '0 1.25rem', textAlign: collapsed ? 'center' : 'left' }}>
           {!collapsed ? (
             <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Modules</span>
           ) : (
             <div style={{ width: '20px', height: '2px', background: 'var(--border-light)', margin: '0 auto' }} />
           )}
        </div>

        {NAV_ITEMS.map(item => {
          const NavIcon = item.Icon;
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: collapsed ? '1rem 0' : '1rem 1.25rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? 'var(--accent-glow)' : 'transparent',
                border: 'none',
                borderRadius: '1rem', cursor: 'pointer', width: '100%',
                transition: 'var(--transition)',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                position: 'relative'
              }}
            >
              <NavIcon size={20} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                  {item.label}
                </span>
              )}
              {active && !collapsed && (
                <motion.div layoutId="sidebar-dot" style={{ position: 'absolute', right: '1.25rem', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '2rem 1.25rem', borderTop: '1px solid var(--border-light)' }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '1rem',
          background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '1.25rem',
          border: '1px solid var(--border-light)',
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
          }}>
            <Shield size={18} color="white" />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
               <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{userRole}</div>
               <div style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>Accès Certifié</div>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

function DashboardOverview({ onNavigate }) {
  return (
    <div style={{ padding: '2.5rem 4rem', overflowY: 'auto', height: '100%', scrollbarWidth: 'none' }}>
      <header style={{ marginBottom: '4rem', position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '0.75rem', 
            background: 'var(--accent-glow)', padding: '0.5rem 1.25rem', 
            borderRadius: '2rem', marginBottom: '1.5rem', border: '1px solid var(--accent-glow)'
          }}>
            <Leaf size={14} color="var(--accent)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Impact Social & Environnemental
            </span>
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '1rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Foundation <span className="antigravity-gradient-text">Hub</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '700px', lineHeight: 1.6, fontWeight: 500 }}>
            Plateforme autonome dédiée à la gestion de l'impact. 
            Suivi temps réel des flux circulaires et des engagements communautaires.
          </p>
        </motion.div>
      </header>

      <div className="bento-grid" style={{ marginBottom: '4.5rem', gap: '2rem' }}>
        {GLOBAL_KPIS.map(({ label, value, unit, Icon, color }, idx) => (
          <motion.div 
            key={label} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="antigravity-card" 
            style={{ 
              gridColumn: 'span 3', 
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '180px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: '1rem', 
                background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${color}20`
              }}>
                <Icon size={24} color={color} />
              </div>
              <div style={{ 
                padding: '0.4rem 0.75rem', borderRadius: '0.75rem', 
                background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)'
              }}>
                Live
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>{value}</span>
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{unit}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--primary)' }}>
          <div style={{ width: 12, height: 12, borderRadius: '3px', background: 'var(--accent)', boxShadow: '0 0 15px var(--accent)' }} />
          Modules Stratégiques
        </h2>
        <div className="bento-grid" style={{ gap: '2rem' }}>
          {NAV_ITEMS.map((item, idx) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 + (idx * 0.1) }}
              className="antigravity-card" 
              style={{ gridColumn: 'span 6', padding: '2rem', cursor: 'pointer', position: 'relative' }}
              onClick={() => onNavigate(item.id)}
            >
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ 
                  width: 72, height: 72, borderRadius: '1.25rem', 
                  background: `linear-gradient(135deg, ${item.color}15, ${item.color}05)`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  border: `1px solid ${item.color}25`,
                  boxShadow: `0 10px 20px -5px ${item.color}20`
                }}>
                  <item.Icon size={32} color={item.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem', color: 'var(--text)', fontWeight: 800 }}>{item.label}</h3>
                  <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.5, fontWeight: 500 }}>{item.description}</p>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--border)', transition: 'var(--transition)'
                }}>
                  <ChevronRight size={22} color="var(--text-muted)" />
                </div>
              </div>
            </motion.div>
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
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
      <Sidebar
        activeId={activeId || ''}
        onSelect={id => setActiveId(id)}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        userRole={userRole}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {/* Sub-Header / Breadcrumbs */}
        <header style={{ 
          height: 90, borderBottom: '1px solid var(--border-light)', 
          background: 'var(--bg-card)', display: 'flex', alignItems: 'center', 
          padding: '0 4rem', justifyContent: 'space-between',
          zIndex: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveId(null)}
              style={{ 
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.6rem 1rem', borderRadius: '0.85rem',
                background: !activeId ? 'var(--accent-glow)' : 'transparent',
                transition: 'var(--transition)'
              }}
            >
              <LayoutDashboard size={20} color={!activeId ? 'var(--accent)' : 'var(--text-muted)'} />
              <span style={{ fontWeight: 800, fontSize: '1rem', color: !activeId ? 'var(--primary)' : 'var(--text-muted)' }}>
                Foundation
              </span>
            </motion.div>
            
            {activeId && (
              <>
                <ChevronRight size={18} color="var(--border)" />
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ 
                    fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)',
                    background: 'var(--bg-subtle)', padding: '0.6rem 1.25rem', borderRadius: '0.85rem',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  {activeNav?.label}
                </motion.div>
              </>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
             <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <button className="btn btn-sm btn-ghost" style={{ borderRadius: '8px' }}>Journal</button>
                <button className="btn btn-sm btn-secondary" style={{ borderRadius: '8px', background: 'white' }}>Analyses</button>
             </div>
             <div style={{ width: '1px', height: '24px', background: 'var(--border-light)' }} />
             <button className="btn btn-primary btn-md">
                <ShieldCheck size={18} />
                <span>Sécurité Audit</span>
             </button>
          </div>
        </header>

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {!activeId ? (
              <motion.div
                key="dash"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%' }}
              >
                <DashboardOverview onNavigate={id => setActiveId(id)} />
              </motion.div>
            ) : (
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', overflowY: 'auto', paddingBottom: '4rem' }}
              >
                <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '2.5rem 4rem' }}>
                  {ActiveComponent && <ActiveComponent />}
                </div>
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
