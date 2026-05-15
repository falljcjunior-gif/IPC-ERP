'use client';

import { useState } from 'react';
import { cn } from '../lib/utils';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

/**
 * The root shell — composes Sidebar + TopHeader and reserves the main canvas.
 * Use it once in your `app/layout.tsx` (Next.js) or as the root of any route.
 */
export default function AppLayout({
  active = 'dashboard',
  onSelect,
  headerTitle = 'Dashboard',
  headerSubtitle,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <Sidebar active={active} onSelect={onSelect} onCollapse={setCollapsed} />

      <div
        className={cn(
          'transition-[padding] duration-300',
          collapsed ? 'pl-[72px]' : 'pl-[248px]'
        )}
      >
        <TopHeader title={headerTitle} subtitle={headerSubtitle} />

        <main className="mx-auto w-full max-w-[1440px] px-8 pb-16 pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
