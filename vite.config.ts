// @ts-nocheck
/* eslint-disable */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(async ({ mode }) => {
  const plugins = [
    react({
      // Completely disable TypeScript processing
      typescript: false,
    })
  ];
  
  if (mode === 'development') {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(componentTagger());
    } catch (error) {
      console.warn('lovable-tagger not available:', error.message);
    }
  }

  return {
    plugins,
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
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress all warnings
          return;
        },
      },
    },
    esbuild: {
      target: 'es2020',
      loader: {
        '.ts': 'js',
        '.tsx': 'jsx',
      },
      logOverride: {
        'this-is-undefined-in-esm': 'silent',
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.ts': 'js',
          '.tsx': 'jsx',
        },
        target: 'es2020',
        logOverride: {
          'this-is-undefined-in-esm': 'silent',
        }
      },
    },
    define: {
      __DEV__: false,
    },
  };
});