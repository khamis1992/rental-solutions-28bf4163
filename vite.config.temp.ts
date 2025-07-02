// Temporary Vite config with looser TypeScript settings for build
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog'],
        },
      },
    },
  },
  esbuild: {
    // Remove unused imports and disable strict checks
    drop: ['console', 'debugger'],
    legalComments: 'none',
    target: 'es2020'
  }
});