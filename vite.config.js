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
        },
      },
    },
  },
})
