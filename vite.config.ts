
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      plugins: []
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          tanstack: ['@tanstack/react-query']
        }
      }
    }
  },
  css: {
    postcss: {},
    devSourcemap: true,
    modules: {
      scopeBehaviour: 'local'
    }
  },
  optimizeDeps: {
    force: true,
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
  cacheDir: '.vite',
}));
