'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Factory,
  Users,
  Package,
  Wallet,
  Settings,
  LifeBuoy,
  ChevronsLeft,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'production', label: 'Production', icon: Factory },
  { id: 'crm',        label: 'CRM',        icon: Users },
  { id: 'stock',      label: 'Stock',      icon: Package },
  { id: 'finance',    label: 'Finance',    icon: Wallet },
];

const SECONDARY = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'support',  label: 'Support',  icon: LifeBuoy },
];

export default function Sidebar({ active = 'dashboard', onSelect, onCollapse }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      onCollapse?.(next);
      return next;
    });
  };

  return (
    <motion.aside
      initial={{ x: -32, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col',
        'bg-slate-950 text-slate-300 transition-[width] duration-300',
        collapsed ? 'w-[72px]' : 'w-[248px]'
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/15 ring-1 ring-emerald-400/30">
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold tracking-tight text-white">Nexus OS</p>
            <p className="text-[11px] font-medium text-slate-500">Industrial Suite</p>
          </div>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV.map((item, i) => {
            const Icon = item.icon;
            const isActive = item.id === active;
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04, duration: 0.4 }}
              >
                <button
                  type="button"
                  onClick={() => onSelect?.(item.id)}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                    'transition-colors',
                    isActive
                      ? 'bg-white/[0.06] text-white'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-emerald-400"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                    className={cn(
                      'shrink-0 transition-colors',
                      isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-200'
                    )}
                  />
                  {!collapsed && <span className="truncate tracking-tight">{item.label}</span>}
                </button>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Secondary nav */}
      <div className="px-3 pb-3">
        <ul className="space-y-1">
          {SECONDARY.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(item.id)}
                  className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/[0.04] hover:text-white"
                >
                  <Icon size={18} strokeWidth={1.8} className="text-slate-500 group-hover:text-slate-200" />
                  {!collapsed && <span className="tracking-tight">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User card + collapse */}
      <div className="border-t border-white/[0.06] px-3 py-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.03]">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-semibold text-slate-950 ring-2 ring-white/10">
            RF
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-white">Raphaël F.</p>
              <p className="truncate text-[11px] text-slate-500">CTO · Nexus Group</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={toggle}
              type="button"
              className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-white/[0.06] hover:text-white"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
