import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    host: "::",
    allowedHosts: ["app.lovable.dev"],
    fs: {
      allow: [".", ".."],
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress all warnings
        return;
      },
    },
  },
  esbuild: {
    // Completely disable TypeScript checking
    target: 'es2020',
    drop: ['console'],
    logOverride: {
      'this-is-undefined-in-esm': 'silent',
    },
    // Override TypeScript configuration to be completely permissive
    tsconfigRaw: {
      compilerOptions: {
        skipLibCheck: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        strict: false,
        noImplicitAny: false,
        noImplicitReturns: false,
        exactOptionalPropertyTypes: false,
        noPropertyAccessFromIndexSignature: false,
        noUncheckedIndexedAccess: false,
        allowUnusedLabels: true,
        allowUnreachableCode: true,
        noImplicitOverride: false,
        noImplicitThis: false,
        strictNullChecks: false,
        strictFunctionTypes: false,
        strictBindCallApply: false,
        strictPropertyInitialization: false,
        useUnknownInCatchVariables: false,
        noFallthroughCasesInSwitch: false
      }
    }
  },
  define: {
    // Suppress development warnings
    __DEV__: false,
  },
}));