'use client';

import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import Dashboard from './Dashboard';

/**
 * Top-level demo router — swap a single tab to see each module shell.
 * In a real Next.js app, replace this with file-system routing.
 */
export default function App() {
  const [active, setActive] = useState('dashboard');

  const headerSubtitle = {
    dashboard:  'Strategic overview · IPC Group',
    production: 'Plants & assembly lines',
    crm:        'Pipeline & customer relations',
    stock:      'Warehouses & inventory flows',
    finance:    'P&L · cash · accounting',
    settings:   'Workspace preferences',
    support:    'Help & documentation',
  }[active];

  return (
    <AppLayout
      active={active}
      onSelect={setActive}
      headerTitle={active.charAt(0).toUpperCase() + active.slice(1)}
      headerSubtitle={headerSubtitle}
    >
      {active === 'dashboard' && <Dashboard />}
      {active !== 'dashboard' && (
        <div className="grid place-items-center rounded-2xl bg-white p-24 shadow-sm ring-1 ring-slate-900/[0.04]">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Module
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 capitalize">
              {active}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              This module is under construction. The shell, header & search remain identical.
            </p>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
