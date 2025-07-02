#!/usr/bin/env node

const { execSync } = require('child_process');

try {
  console.log('🚀 Running bulk TypeScript fix...');
  execSync('node bulk-fix-remaining.js', { stdio: 'inherit' });
  console.log('✅ Bulk fix completed!');
} catch (error) {
  console.error('❌ Error running bulk fix:', error.message);
}