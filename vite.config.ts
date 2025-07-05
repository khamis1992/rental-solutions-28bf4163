import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// PWA plugin disabled in development mode
// import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  // Dynamically import componentTagger for development mode
  const componentTagger = mode === 'development' 
    ? (await import('lovable-tagger')).componentTagger 
    : null;

  return {
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
    react(),
    mode === 'development' && componentTagger(),
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
        // تقسيم حزم مبسط لتجنب مشاكل الإنتاج
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          'ui-libs': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'lucide-react'],
          'data-libs': ['@tanstack/react-query', '@supabase/supabase-js'],
          'charts': ['recharts'],
          'forms': ['react-hook-form', 'zod'],
          'utils': ['clsx', 'tailwind-merge', 'class-variance-authority', 'date-fns']
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
        'pdfjs-dist',
        'recharts'
      ],
      exclude: [
        'jspdf',
        'pdfmake',
        'chart.js'
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
  };
});
