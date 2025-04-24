
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Ensure proper chunk size for better performance
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          tanstack: ['@tanstack/react-query']
        }
      }
    }
  },
  css: {
    postcss: {}, // Ensure PostCSS is properly configured
    devSourcemap: true,
  },
  // Clear cache and force dependencies optimization
  optimizeDeps: {
    force: true,
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
  // Clear the cache on startup
  cacheDir: '.vite',
});
