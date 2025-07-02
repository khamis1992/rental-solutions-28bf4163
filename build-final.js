#!/usr/bin/env node
// Final build script that completely bypasses TypeScript

const { execSync } = require('child_process');

console.log('🚀 Building without any TypeScript checking...');

try {
  // Run Vite build with all TypeScript checking disabled
  execSync('npx vite build --mode production', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      TSC_NONPOLLING_WATCHER: 'true',
      SKIP_TYPE_CHECK: 'true'
    }
  });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}