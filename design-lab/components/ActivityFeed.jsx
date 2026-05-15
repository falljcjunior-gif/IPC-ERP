'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  Truck,
  Factory,
  FileCheck,
} from 'lucide-react';
import { cn } from '../lib/utils';

const ITEMS = [
  {
    id: 1,
    icon: CheckCircle2,
    tone: 'emerald',
    title: 'Batch #4521 completed',
    meta: 'Plant Dakar · Line A · 1 240 units',
    when: '2m ago',
  },
  {
    id: 2,
    icon: AlertTriangle,
    tone: 'amber',
    title: 'Stock alert — Carbon fiber roll',
    meta: 'Warehouse N°3 below reorder point',
    when: '14m ago',
  },
  {
    id: 3,
    icon: Truck,
    tone: 'slate',
    title: 'Shipment dispatched',
    meta: 'PO-2289 → Lagos · ETA 3 days',
    when: '1h ago',
  },
  {
    id: 4,
    icon: FileCheck,
    tone: 'emerald',
    title: 'Invoice paid · €82 400',
    meta: 'Customer · BlocConstruct SA',
    when: '3h ago',
  },
  {
    id: 5,
    icon: Factory,
    tone: 'slate',
    title: 'New work order opened',
    meta: 'WO-1147 · 850 panels',
    when: '5h ago',
  },
];

const TONE_MAP = {
  emerald: 'bg-emerald-50 text-emerald-600',
  amber:   'bg-amber-50 text-amber-600',
  slate:   'bg-slate-100 text-slate-600',
};

export default function ActivityFeed() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.04]"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Live · Last 24h
          </p>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-slate-900">
            Activity
          </h2>
        </div>
        <button
          type="button"
          className="text-[12px] font-semibold tracking-tight text-emerald-600 hover:text-emerald-700"
        >
          View all →
        </button>
      </div>

      <ul className="space-y-1">
        {ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.06, duration: 0.45 }}
              className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50"
            >
              <div
                className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                  TONE_MAP[item.tone]
                )}
              >
                <Icon size={16} strokeWidth={1.9} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium tracking-tight text-slate-900">
                  {item.title}
                </p>
                <p className="truncate text-[12px] text-slate-500">{item.meta}</p>
              </div>
              <span className="text-[11px] font-medium text-slate-400">{item.when}</span>
            </motion.li>
          );
        })}
      </ul>
    </motion.section>
  );
}
