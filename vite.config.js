import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vite 8 (rolldown) requires manualChunks as a function
        manualChunks(id) {
          // Firebase SDK — always needed, split from app
          if (id.includes('node_modules/firebase/')) return 'vendor-firebase';
          if (id.includes('node_modules/@firebase/')) return 'vendor-firebase';
          // React runtime
          if (id.includes('node_modules/react-dom/') || id.includes('node_modules/react/')) return 'vendor-react';
          // Animation & motion — used throughout, but in its own chunk
          if (id.includes('node_modules/framer-motion/')) return 'vendor-motion';
          // Charts — heavy, used only in analytics/dashboard tabs
          if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3-')) return 'vendor-recharts';
          // PDF generation — lazy-loaded, never in initial bundle
          if (id.includes('node_modules/jspdf')) return 'vendor-pdf';
          if (id.includes('node_modules/html2canvas')) return 'vendor-pdf';
          // Sentry monitoring — defer init until consent banner interaction
          if (id.includes('node_modules/@sentry/')) return 'vendor-sentry';
          // 3D scene — already lazy via requestIdleCallback (ERPOrbitalScene)
          if (id.includes('node_modules/three/') || id.includes('node_modules/troika-')) return 'vendor-three';
          // i18n — loaded after app init
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) return 'vendor-i18n';
          // DOMPurify — only used in markdown rendering components
          if (id.includes('node_modules/dompurify') || id.includes('node_modules/DOMPurify')) return 'vendor-purify';
        },
      },
    },
  },
})
