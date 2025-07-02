#!/usr/bin/env node

const { execSync } = require('child_process');

try {
  console.log('🚀 Running ultimate TypeScript fix...');
  execSync('node ultimate-fix-all.js', { stdio: 'inherit' });
  console.log('✅ Ultimate fix completed!');
} catch (error) {
  console.error('❌ Error running ultimate fix:', error.message);
  process.exit(1);
}