'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Factory,
  Users,
  Package,
  Wallet,
  LayoutDashboard,
  FileText,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

const COMMANDS = [
  { id: 'go-dashboard',  group: 'Navigation', label: 'Go to Dashboard',     icon: LayoutDashboard, hint: 'G then D' },
  { id: 'go-production', group: 'Navigation', label: 'Go to Production',    icon: Factory,         hint: 'G then P' },
  { id: 'go-crm',        group: 'Navigation', label: 'Go to CRM',           icon: Users,           hint: 'G then C' },
  { id: 'go-stock',      group: 'Navigation', label: 'Go to Stock',         icon: Package,         hint: 'G then S' },
  { id: 'go-finance',    group: 'Navigation', label: 'Go to Finance',       icon: Wallet,          hint: 'G then F' },
  { id: 'new-order',     group: 'Actions',    label: 'Create production order',  icon: FileText,    hint: '⌘N' },
  { id: 'new-invoice',   group: 'Actions',    label: 'Issue new invoice',        icon: FileText,    hint: '⌘I' },
  { id: 'ai-analyze',    group: 'AI',         label: 'Ask Nexus AI…',            icon: Sparkles,    hint: '⌘J' },
];

export default function CommandPalette({ open, onOpenChange }) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Global key handler — ⌘K / Esc
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange?.(!open);
      } else if (e.key === 'Escape' && open) {
        onOpenChange?.(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );
  const grouped = filtered.reduce((acc, cmd) => {
    (acc[cmd.group] ||= []).push(cmd);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => onOpenChange?.(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-[18%] z-50 w-[92vw] max-w-[640px] -translate-x-1/2"
          >
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-slate-100 px-5">
                <Search size={18} strokeWidth={1.8} className="text-slate-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIdx(0);
                  }}
                  placeholder="Search modules, actions, customers…"
                  className="h-14 w-full bg-transparent text-[15px] tracking-tight text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[420px] overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <p className="text-sm text-slate-500">No results for "{query}"</p>
                  </div>
                ) : (
                  Object.entries(grouped).map(([group, items]) => (
                    <div key={group} className="px-2 py-1.5">
                      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        {group}
                      </p>
                      <ul>
                        {items.map((cmd) => {
                          const Icon = cmd.icon;
                          const idx = filtered.findIndex((f) => f.id === cmd.id);
                          const isActive = idx === activeIdx;
                          return (
                            <li key={cmd.id}>
                              <button
                                type="button"
                                onMouseEnter={() => setActiveIdx(idx)}
                                onClick={() => onOpenChange?.(false)}
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                                  isActive ? 'bg-slate-50' : 'hover:bg-slate-50'
                                )}
                              >
                                <Icon
                                  size={17}
                                  strokeWidth={1.8}
                                  className={cn(isActive ? 'text-emerald-600' : 'text-slate-500')}
                                />
                                <span className="flex-1 text-sm tracking-tight text-slate-800">
                                  {cmd.label}
                                </span>
                                <span className="text-[11px] font-medium text-slate-400">
                                  {cmd.hint}
                                </span>
                                <ArrowRight
                                  size={14}
                                  strokeWidth={1.8}
                                  className={cn(
                                    'transition-opacity',
                                    isActive ? 'opacity-100 text-emerald-600' : 'opacity-0'
                                  )}
                                />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-2.5">
                <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] shadow-sm ring-1 ring-slate-200">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] shadow-sm ring-1 ring-slate-200">↵</kbd>
                    Open
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400">Nexus OS · v3.0</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
