import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from "lovable-tagger";

export default defineConfig(async ({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    server: {
      host: "::",
      port: 8080,
      allowedHosts: ["app.lovable.dev"],
      fs: {
        allow: [".", ".."],
      },
    },
    plugins: [
      react(),
      componentTagger(),
    ],
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
        onwarn(warning, warn) {
          // Suppress specific warnings
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
          if (warning.code === 'CIRCULAR_DEPENDENCY') return;
          warn(warning);
        },
      },
    },
    esbuild: {
      // Disable TypeScript checking entirely for build
      target: 'es2020',
      drop: ['console'],
      logOverride: {
        'this-is-undefined-in-esm': 'silent',
      },
    },
    define: {
      // Suppress development warnings
      __DEV__: false,
    },
  };
});