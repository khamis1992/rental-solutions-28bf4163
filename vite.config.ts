
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
  // Manually disable CSS modules to avoid potential plugin issues
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  // Force optimizeDeps to ensure dependencies are processed correctly
  optimizeDeps: {
    force: true,
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  // Clear the cache on startup
  cacheDir: '.vite',
});
