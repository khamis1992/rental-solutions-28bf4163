
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    // Improve build reliability and prevent CSS processing issues
    cssCodeSplit: true,
    sourcemap: true,
  },
  css: {
    // Add proper error handling for CSS imports
    devSourcemap: true,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Ensure package resolution prioritizes modern modules
    mainFields: ['module', 'jsnext:main', 'main'],
  },
  optimizeDeps: {
    // Force include problematic dependencies
    include: ['jspdf', 'jspdf-autotable'],
  }
}));
