
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      "3443e083-f60b-43c2-aa17-354a2369068f.lovableproject.com",
      "localhost",
      "d2cd0355-32f1-4a1c-8126-f471727111ab-00-2ovli70y4qqjz.pike.replit.dev",
      "rental-solutions-28-bf-4163-khamis4everever.replit.app"
    ],
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            'lucide-react'
          ],
          'supabase-vendor': ['@supabase/supabase-js', '@supabase/ssr'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['chart.js', 'recharts'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable', 'pdfmake'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'date-vendor': ['date-fns'],
          'utils-vendor': ['clsx', 'class-variance-authority', 'tailwind-merge']
        }
      }
    },
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true
    },
    // PWA specific build optimizations
    assetsDir: 'assets',
    sourcemap: mode === 'development',
    minify: mode === 'production' ? 'esbuild' : false,
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
  },
  // PWA specific optimizations
  define: {
    __PWA_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  // Enable PWA features in preview mode
  preview: {
    port: 8080,
    host: true,
  }
}));
