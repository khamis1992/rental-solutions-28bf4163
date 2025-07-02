#!/usr/bin/env node
// Test build script to verify TypeScript bypassing works

const { execSync } = require('child_process');

console.log('🔍 Testing build process...');

try {
  // Test import consistency first
  console.log('📦 Testing TypeScript compilation...');
  
  // Run TypeScript with no emit to check for import errors
  execSync('npx tsc --noEmit --skipLibCheck', { 
    stdio: ['inherit', 'pipe', 'pipe']
  });
  
  console.log('✅ TypeScript compilation test passed');
  
  // Test Vite build
  console.log('🏗️ Testing Vite build...');
  execSync('npx vite build --mode production', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  
  console.log('✅ Build test completed successfully!');
} catch (error) {
  console.error('❌ Build test failed');
  console.error('Error details:', error.message);
  if (error.stdout) {
    console.log('Stdout:', error.stdout.toString());
  }
  if (error.stderr) {
    console.log('Stderr:', error.stderr.toString());
  }
  process.exit(1);
}