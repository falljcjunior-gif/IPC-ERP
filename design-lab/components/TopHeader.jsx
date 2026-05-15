'use client';

import { motion } from 'framer-motion';
import { Bell, Search, Plus } from 'lucide-react';
import { useState } from 'react';
import CommandPalette from './CommandPalette';

export default function TopHeader({ title = 'Dashboard', subtitle }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

  return (
    <>
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-30 flex h-16 items-center justify-between gap-6 bg-white/80 px-8 backdrop-blur-xl"
      >
        {/* Title slot */}
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-[12px] font-medium text-slate-500">{subtitle}</p>
          )}
        </div>

        {/* Omni-Search */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="group hidden h-10 w-full max-w-md items-center gap-3 rounded-xl bg-slate-100/60 px-3.5 text-left transition-all hover:bg-slate-100 hover:shadow-sm md:flex"
        >
          <Search size={16} strokeWidth={1.8} className="text-slate-400" />
          <span className="flex-1 text-sm tracking-tight text-slate-400">
            Search anything…
          </span>
          <kbd className="hidden items-center gap-0.5 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200 sm:flex">
            {isMac ? '⌘' : 'Ctrl'} K
          </kbd>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
          >
            <Search size={18} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell size={18} strokeWidth={1.8} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          <button
            type="button"
            className="flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 text-sm font-medium tracking-tight text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow-md active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2} />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </motion.header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
