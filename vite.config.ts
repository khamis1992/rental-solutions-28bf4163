import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// PWA plugin disabled in development mode
// import { VitePWA } from 'vite-plugin-pwa';

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
    fs: {
      allow: ['..']
    }
  },
  plugins: [
    react()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // تحسين للجوال
    target: ['es2015', 'safari11'],
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      mangle: {
        safari10: true,
      },
    },
    // تقليل حد التحذير
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // تحسين تقسيم الحزم للجوال
        manualChunks: (id) => {
          // مكتبات أساسية - تحميل فوري
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-core';
          }
          
          // مكتبات UI أساسية - تحميل فوري
          if (id.includes('@radix-ui') || id.includes('lucide-react')) {
            return 'ui-core';
          }
          
          // مكتبات PDF - تحميل عند الحاجة
          if (id.includes('jspdf') || id.includes('pdfmake') || id.includes('canvas')) {
            return 'pdf-heavy';
          }
          
          // مكتبات الرسوم البيانية - تحميل عند الحاجة
          if (id.includes('chart.js') || id.includes('recharts') || id.includes('plotly')) {
            return 'charts-heavy';
          }
          
          // Supabase
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          
          // مكتبات التاريخ والنماذج
          if (id.includes('date-fns') || id.includes('react-hook-form') || id.includes('zod')) {
            return 'forms-dates';
          }
          
          // مكتبات الاستعلام
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          
          // مكتبات مساعدة
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
            return 'utils';
          }
          
          // المكونات الثقيلة
          if (id.includes('/reports/') || id.includes('/analytics/') || id.includes('/legal/')) {
            return 'heavy-features';
          }
          
          // كل ما تبقى من node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          
          // PDF.js
          if (id.includes('pdfjs-dist')) {
            return 'pdfjs';
          }
        },
        // تحسين أسماء الملفات
        entryFileNames: (chunkInfo) => {
          const name = chunkInfo.name === 'main' ? 'index' : chunkInfo.name;
          return `assets/${name}-[hash].js`;
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/style-[hash].css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
      // تحسين تحميل الملفات الخارجية
      external: (id) => {
        // استبعاد ملفات الخطوط الضخمة من الحزمة الرئيسية
        if (id.includes('vfs_fonts') || id.includes('Amiri-') && id.includes('.js')) {
          return true;
        }
        return false;
      },
    },
    // تحسين الضغط للجوال
    assetsInlineLimit: 2048, // تصغير حد الملفات المضمنة للجوال
    cssCodeSplit: true,
    sourcemap: mode === 'development',
    // Pre-bundling للجوال
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        'lucide-react',
        '@tanstack/react-query',
        '@supabase/supabase-js',
        'pdfjs-dist'
      ],
      exclude: [
        'jspdf',
        'pdfmake',
        'chart.js',
        'recharts'
      ],
    },
    define: {
      // Fix for PDF.js worker
      global: 'globalThis',
    },
    worker: {
      format: 'es'
    }
  },
  // تحسين خاص للجوال
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
