# Nexus OS · Design Lab

A self-contained, production-ready front-end shell for a next-gen industrial ERP.
Premium, minimalist, Stripe / Vercel-grade UX.

## What's inside

```
design-lab/
├── components/
│   ├── Sidebar.jsx          ← Deep slate-950 sidebar, collapsible, active layout-id pill
│   ├── TopHeader.jsx        ← Sticky 64px header w/ Omni-Search trigger
│   ├── CommandPalette.jsx   ← ⌘K palette w/ groups, hints, fuzzy filter
│   ├── AppLayout.jsx        ← Composes Sidebar + Header + reserved canvas
│   ├── KPICard.jsx          ← Soft-shadow KPI w/ trend chip
│   ├── ProductionChart.jsx  ← Recharts AreaChart, emerald gradient, custom tooltip
│   └── ActivityFeed.jsx     ← Right-rail live activity stream
├── pages/
│   ├── App.jsx              ← Demo router (swap modules)
│   └── Dashboard.jsx        ← Welcome + KPI grid + Chart + Activity
├── lib/
│   └── utils.js             ← cn(), formatters, framer-motion cascade variant
├── tailwind.config.js       ← Inter, soft shadows, tight tracking
├── globals.css              ← Tailwind directives + base resets
└── README.md
```

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 (Vite or Next.js 14+) |
| Styling | Tailwind CSS v3 |
| Icons | `lucide-react` |
| Charts | `recharts` |
| Motion | `framer-motion` |

All four are already declared in the project's root `package.json`.

## Design system

| Token | Value | Usage |
|---|---|---|
| Background | `bg-slate-50` | Main canvas |
| Surface | `bg-white` | Cards, palette, header |
| Nav | `bg-slate-950` | Sidebar |
| Text primary | `text-slate-900` | Headings |
| Text secondary | `text-slate-500` | Captions, meta |
| Accent | `#10B981` (emerald-500) | Primary actions, active states, gradient stops |
| Accent soft | `bg-emerald-50` | KPI icon halos, success chips |
| Hairline | `ring-1 ring-slate-900/[0.04]` | Card borders — replaces full borders |
| Shadow | `shadow-sm` → `shadow-md` on hover | Soft elevation only |
| Radius | `rounded-2xl` (16px) for cards, `rounded-xl` (12px) for inputs |
| Type | Inter — 12px / 14px / 15px / 18px / 28px / 32px |
| Tracking | `tracking-tight` (`-0.012em`) on everything ≥ 14px |

## Wiring it up

### Next.js 14+ (app router)

```tsx
// app/layout.tsx
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// app/page.tsx
import App from '@/design-lab/pages/App';
export default function Page() { return <App />; }
```

### Vite + React

```jsx
// src/main.jsx
import { createRoot } from 'react-dom/client';
import App from '../design-lab/pages/App';
import '../design-lab/globals.css';

createRoot(document.getElementById('root')).render(<App />);
```

### Tailwind setup (if not already)

```bash
npm i -D tailwindcss@^3 postcss autoprefixer
npx tailwindcss init -p
```

Then replace the generated `tailwind.config.js` with the one in this folder.

## Keyboard

| Shortcut | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open Omni-Search |
| `Esc` | Close palette |
| `↑` / `↓` | Navigate results |
| `↵` | Open selected result |

## Animation budget

Every entry animation uses `ease: [0.22, 1, 0.36, 1]` (ease-out-quint) at 0.5–0.7s.
Cards stagger by 70ms via the `cascade` variant exported from `lib/utils.js`.
Hover transitions stay under 200ms. **No animation exceeds 700ms** — that's the
"premium feel" budget: noticeable, never sluggish.

## Production checklist

- [ ] Replace `DATA` in `ProductionChart.jsx` with a SWR / React Query hook
- [ ] Wire `Sidebar` `onSelect` to your router
- [ ] Hook `CommandPalette` to your search index (Algolia, Meilisearch, or local fuse.js)
- [ ] Lazy-load module routes (`React.lazy` + `Suspense`)
- [ ] Add skeleton states for KPI cards (use the same `rounded-2xl` shape, `bg-slate-100`)
- [ ] Dark mode (flip `slate-50` → `slate-900`, `white` → `slate-950`)
