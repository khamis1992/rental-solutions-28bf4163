import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig(async ({ mode }) => {
  const plugins = [react()];
  
  if (mode === 'development') {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(componentTagger());
    } catch (error) {
      console.warn('lovable-tagger not available:', error.message);
    }
  }

  return {
    plugins,
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
      target: 'es2020',
      drop: ['console'],
      logOverride: {
        'this-is-undefined-in-esm': 'silent',
      },
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
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.ts': 'ts',
          '.tsx': 'tsx',
        },
        target: 'es2020',
        logOverride: {
          'this-is-undefined-in-esm': 'silent',
        }
      },
    },
    define: {
      __DEV__: false,
    },
  };
});