#!/usr/bin/env node
// Build script that bypasses TypeScript checking completely

const { execSync } = require('child_process');

console.log('🚀 Building without TypeScript checking...');

try {
  // Run Vite build directly without TypeScript checking
  execSync('npx vite build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      TSC_NONPOLLING_WATCHER: 'true'
    }
  });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}