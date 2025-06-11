
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react()];
  
  // Dynamically import the ESM-only lovable-tagger package
  if (mode === 'development') {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(componentTagger());
    } catch (error) {
      console.warn('Failed to load lovable-tagger:', error);
    }
  }

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
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
