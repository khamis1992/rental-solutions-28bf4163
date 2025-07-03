import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    // تحسينات Development Server
    cors: true,
    force: true,
    // Pre-bundle dependencies للتحميل الأسرع
    optimizeDeps: {
      include: [
        'react', 'react-dom', 'react-router-dom',
        '@tanstack/react-query', '@supabase/supabase-js',
        'lucide-react', 'framer-motion'
      ]
    }
  },
  plugins: [
    react({
      // تحسينات React SWC
      plugins: [
        ['@swc/plugin-styled-components', {
          displayName: false,
          ssr: false
        }]
      ]
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    // تحسين حجم Bundle
    reportCompressedSize: false,
    chunkSizeWarningLimit: 600,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
                 // تقسيم Bundle محسن ومتقدم
         manualChunks: (id: string) => {
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-core';
          }
          
          // Routing
          if (id.includes('react-router')) {
            return 'router';
          }
          
          // Data fetching
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          
          // Supabase
          if (id.includes('@supabase') || id.includes('supabase')) {
            return 'supabase';
          }
          
          // UI Components (Radix)
          if (id.includes('@radix-ui')) {
            return 'ui-radix';
          }
          
          // Icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }
          
          // Animations
          if (id.includes('framer-motion')) {
            return 'animations';
          }
          
          // PDF Processing
          if (id.includes('jspdf') || id.includes('pdfjs') || id.includes('pdfmake')) {
            return 'pdf-processing';
          }
          
          // Charts and Analytics
          if (id.includes('chart.js') || id.includes('recharts')) {
            return 'charts';
          }
          
          // Forms and Validation
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
            return 'forms';
          }
          
          // Date utilities
          if (id.includes('date-fns') || id.includes('moment')) {
            return 'date-utils';
          }
          
          // Large node_modules
          if (id.includes('node_modules')) {
            // Split large libraries into separate chunks
            if (id.includes('lodash') || id.includes('uuid') || id.includes('xlsx')) {
              return 'utilities';
            }
            return 'vendor';
          }
        },
                 chunkFileNames: (chunkInfo: any) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `js/[name]-${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
                 assetFileNames: (assetInfo: any) => {
          const info = assetInfo.name?.split('.') || [];
          const extType = info[info.length - 1];
          
          // تنظيم الأصول حسب النوع
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(extType)) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    // تحسينات أداء البناء
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
  },
  // تحسين حل التبعيات
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'lucide-react',
      'framer-motion',
      'date-fns',
      'zod'
    ],
    exclude: [
      '@vite/client',
      '@vite/env'
    ]
  },
  // تحسين الأداء العام
  esbuild: {
    // إزالة console في الإنتاج
    drop: ['console', 'debugger'],
    // تحسين الكود
    legalComments: 'none',
    // ضغط أكثر
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  }
}); 