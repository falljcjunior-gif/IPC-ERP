'use client';

import { motion } from 'framer-motion';
import {
  Factory,
  AlertTriangle,
  TrendingUp,
  Package,
} from 'lucide-react';
import ActivityFeed from '../components/ActivityFeed';
import KPICard from '../components/KPICard';
import ProductionChart from '../components/ProductionChart';

const formatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

export default function Dashboard() {
  const today = formatter.format(new Date());

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-2"
      >
        <p className="text-[12px] font-medium tracking-tight text-slate-500">{today}</p>
        <h1 className="text-[32px] font-semibold leading-[1.1] tracking-tight text-slate-900">
          Good morning, Raphaël.
        </h1>
        <p className="max-w-2xl text-[14px] tracking-tight text-slate-500">
          Production is <span className="font-semibold text-emerald-600">+12.4%</span> above
          target this week. 3 stock alerts require your attention.
        </p>
      </motion.header>

      {/* KPI grid */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          index={0}
          label="Active Production"
          value="1,284 u/h"
          delta={12.4}
          hint="vs. 1,142 last week"
          icon={Factory}
          accent="emerald"
        />
        <KPICard
          index={1}
          label="Stock Alerts"
          value="3"
          delta={-25.0}
          hint="2 critical · 1 low"
          icon={AlertTriangle}
          accent="amber"
        />
        <KPICard
          index={2}
          label="Monthly Revenue"
          value="€2.84M"
          delta={8.2}
          hint="May · 14 days remaining"
          icon={TrendingUp}
          accent="emerald"
        />
        <KPICard
          index={3}
          label="Open Orders"
          value="148"
          delta={3.6}
          hint="22 awaiting fulfillment"
          icon={Package}
          accent="slate"
        />
      </section>

      {/* Chart + Activity */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductionChart />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </section>
    </div>
  );
}
