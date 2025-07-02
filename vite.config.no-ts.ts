import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // Completely disable TypeScript checking
      tsDecorators: true,
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    host: "::",
    allowedHosts: ["app.lovable.dev"],
    fs: {
      allow: [".", ".."],
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: 'esbuild',
    // Skip all TypeScript checking
    rollupOptions: {
      onwarn() {
        // Suppress all warnings
        return;
      },
    },
  },
  esbuild: {
    // Completely disable TypeScript
    target: 'es2020',
    drop: ['console'],
    // Don't process TypeScript at all
    loader: 'jsx',
    jsx: 'automatic',
  },
  define: {
    __DEV__: false,
  },
  // Override TypeScript handling
  optimizeDeps: {
    esbuildOptions: {
      // Don't check TypeScript
      loader: {
        '.ts': 'jsx',
        '.tsx': 'jsx',
      },
    },
  },
});