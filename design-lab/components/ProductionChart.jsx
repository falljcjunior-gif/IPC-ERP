'use client';

import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmt } from '../lib/utils';

// 30-day mock data — replace with your API stream
const DATA = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const base = 320 + i * 12;
  const wobble = Math.sin(i / 2.7) * 60 + (Math.random() - 0.5) * 40;
  const sales = Math.max(120, base + wobble);
  const production = sales + 80 + Math.cos(i / 1.8) * 70;
  return {
    day: `Day ${day}`,
    sales: Math.round(sales),
    production: Math.round(production),
  };
});

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload.find((x) => x.dataKey === 'production')?.value ?? 0;
  const s = payload.find((x) => x.dataKey === 'sales')?.value ?? 0;
  return (
    <div className="rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs text-white shadow-2xl ring-1 ring-white/10">
      <p className="mb-1.5 font-semibold tracking-tight">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300">Production</span>
          <span className="ml-auto font-medium text-white">{fmt.format(p)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span className="text-slate-300">Sales</span>
          <span className="ml-auto font-medium text-white">{fmt.format(s)}</span>
        </div>
      </div>
    </div>
  );
}

export default function ProductionChart() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.04]"
    >
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Trend · Last 30 days
          </p>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tight text-slate-900">
            Production vs. Sales
          </h2>
        </div>

        <div className="flex items-center gap-5 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="font-medium tracking-tight">Production</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="font-medium tracking-tight">Sales</span>
          </div>

          <div className="ml-2 inline-flex rounded-lg bg-slate-100/80 p-0.5">
            {['7D', '30D', '90D'].map((p, i) => (
              <button
                key={p}
                type="button"
                className={
                  i === 1
                    ? 'rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-900 shadow-sm'
                    : 'rounded-md px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-900'
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={DATA} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grad-production" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#10B981" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="grad-sales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#94A3B8" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#94A3B8" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#94A3B8"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fontWeight: 500 }}
              interval={4}
            />
            <YAxis
              stroke="#94A3B8"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fontWeight: 500 }}
              tickFormatter={(v) => fmt.format(v)}
              width={40}
            />
            <Tooltip
              cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={<ChartTooltip />}
            />

            {/* Sales — soft slate underlay */}
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#94A3B8"
              strokeWidth={2}
              fill="url(#grad-sales)"
              activeDot={{ r: 4, fill: '#94A3B8', stroke: '#fff', strokeWidth: 2 }}
            />

            {/* Production — emerald hero */}
            <Area
              type="monotone"
              dataKey="production"
              stroke="#10B981"
              strokeWidth={2.5}
              fill="url(#grad-production)"
              activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}
