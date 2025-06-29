import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

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
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,ttf,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 12, // 12 hours
              },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(woff|woff2|ttf|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: /\.(js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
            },
          }
        ],
        skipWaiting: true,
        clientsClaim: true,
      },
      includeAssets: ['favicon.ico', 'robots.txt', '*.png', '*.svg'],
      manifest: {
        name: 'نظام إدارة تأجير السيارات - العراف',
        short_name: 'العراف للتأجير',
        description: 'نظام شامل لإدارة تأجير السيارات مع الاتفاقيات والمدفوعات وتتبع الصيانة وإنتاج الوثائق القانونية',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        dir: 'rtl',
        lang: 'ar',
        categories: ['business', 'productivity', 'finance'],
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'اتفاقية جديدة',
            short_name: 'اتفاقية',
            description: 'إنشاء اتفاقية تأجير جديدة',
            url: '/agreements/add',
            icons: [{ src: '/icons/agreement-192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'المدفوعات',
            short_name: 'المدفوعات',
            description: 'عرض وإدارة المدفوعات',
            url: '/payments',
            icons: [{ src: '/icons/payment-192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'المركبات',
            short_name: 'المركبات',
            description: 'إدارة أسطول المركبات',
            url: '/vehicles',
            icons: [{ src: '/icons/vehicle-192.png', sizes: '192x192', type: 'image/png' }]
          },
          {
            name: 'الخطابات القانونية',
            short_name: 'قانونية',
            description: 'إنتاج الوثائق القانونية',
            url: '/legal/ai-letter-generator',
            icons: [{ src: '/icons/legal-192.png', sizes: '192x192', type: 'image/png' }]
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
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
        '@supabase/supabase-js'
      ],
      exclude: [
        'jspdf',
        'pdfmake',
        'chart.js',
        'recharts'
      ],
    },
  },
  // تحسين خاص للجوال
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
