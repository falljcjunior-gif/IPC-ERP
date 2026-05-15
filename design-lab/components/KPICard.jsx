'use client';

import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cascade, cn } from '../lib/utils';

/**
 * Premium KPI card — Stripe / Vercel aesthetic.
 * Soft shadow, hairline ring, animated trend chip, sparkline-ready.
 */
export default function KPICard({
  index = 0,
  label,
  value,
  delta,            // number — positive or negative percentage
  hint,             // small caption under the value
  icon: Icon,
  accent = 'emerald', // 'emerald' | 'slate' | 'amber' | 'rose'
}) {
  const positive = (delta ?? 0) >= 0;

  const accentClasses = {
    emerald: 'text-emerald-600 bg-emerald-50',
    slate:   'text-slate-700 bg-slate-100',
    amber:   'text-amber-700 bg-amber-50',
    rose:    'text-rose-700 bg-rose-50',
  }[accent];

  return (
    <motion.article
      custom={index}
      initial="hidden"
      animate="show"
      variants={cascade}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 240, damping: 20 }}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white p-5',
        'shadow-sm ring-1 ring-slate-900/[0.04] transition-shadow',
        'hover:shadow-md hover:ring-slate-900/[0.06]'
      )}
    >
      {/* Soft accent gradient (top right) — purely decorative */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/[0.07] blur-2xl transition-opacity group-hover:opacity-90"
        aria-hidden
      />

      <div className="flex items-start justify-between">
        <div className={cn('grid h-9 w-9 place-items-center rounded-lg', accentClasses)}>
          {Icon && <Icon size={17} strokeWidth={1.8} />}
        </div>

        {typeof delta === 'number' && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            )}
          >
            {positive ? (
              <ArrowUpRight size={12} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={12} strokeWidth={2.5} />
            )}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>

      <p className="mt-5 text-[12px] font-medium tracking-tight text-slate-500">{label}</p>
      <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-slate-900">
        {value}
      </p>
      {hint && (
        <p className="mt-2 text-[11px] font-medium tracking-tight text-slate-400">{hint}</p>
      )}
    </motion.article>
  );
}
