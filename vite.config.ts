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
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
        skipWaiting: true,
        clientsClaim: true,
      },
      includeAssets: ['favicon.ico', 'robots.txt', '*.png', '*.svg', '*.ttf'],
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
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            'lucide-react'
          ],
          'supabase-vendor': ['@supabase/supabase-js', '@supabase/ssr'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['chart.js', 'recharts'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable', 'pdfmake'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'date-vendor': ['date-fns'],
          'utils-vendor': ['clsx', 'class-variance-authority', 'tailwind-merge']
        }
      }
    },
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
}));
