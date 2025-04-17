
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    cssCodeSplit: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    }
  },
  css: {
    devSourcemap: true,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Add Node.js polyfills
      "stream": "stream-browserify",
      "util": "util",
    },
    // Simplify the main fields to avoid dependency issues
    mainFields: ['browser', 'module', 'main'],
  },
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable'],
    force: true, // Force re-optimization of dependencies
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  define: {
    // Define global for the browser environment
    global: 'globalThis',
  },
  // Add specific esbuild options to improve ESM handling
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
}));
