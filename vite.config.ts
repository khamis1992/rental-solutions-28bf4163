import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { componentTagger } from "lovable-tagger";
import { splitVendorChunkPlugin } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins: [
          mode === 'production' && [
            'babel-plugin-transform-remove-console',
            { exclude: ['error', 'warn'] }
          ]
        ].filter(Boolean)
      }
    }),
    mode === 'development' && componentTagger(),
    splitVendorChunkPlugin(),
    mode === 'production' && visualizer({
      filename: './dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'sunburst'
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui', '@shadcn'],
          'chart-vendor': ['recharts'],
          'auth': ['@supabase/supabase-js'],
          'utils': ['date-fns', 'framer-motion', 'lucide-react'],
          'form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'monitoring': ['web-vitals'],
          'misc': ['sonner', '@tanstack/react-query']
        },
        chunkFileNames: (chunkInfo) => {
          const hash = chunkInfo.hash.slice(0, 8);
          return `js/[name].[hash].js`.replace('[hash]', hash);
        },
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType ?? '')) {
            return 'assets/images/[name].[hash][extname]';
          }
          if (/woff|woff2|eot|ttf|otf/i.test(extType ?? '')) {
            return 'assets/fonts/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
    },
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: mode === 'development',
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    reportCompressedSize: false,
    dynamicImportVarsOptions: {
      warnOnError: false,
    }
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      '@supabase/supabase-js',
      'date-fns',
      'framer-motion',
      'recharts',
      'web-vitals'
    ],
    exclude: ['@supabase/gotrue-js']
  },
  server: {
    host: "localhost",
    port: 8080,
    watch: {
      usePolling: true
    },
    hmr: {
      overlay: true
    }
  },
  preview: {
    port: 8080,
    host: true,
    strictPort: true,
  }
}))
