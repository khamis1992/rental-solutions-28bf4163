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
    // Skip TypeScript checking during build
    rollupOptions: {
      external: (id: any) => false,
      output: {
        manualChunks: (id: any) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  esbuild: {
    // Disable TypeScript checking
    loader: 'tsx',
    target: 'es2020',
    drop: ['console'],
  },
});