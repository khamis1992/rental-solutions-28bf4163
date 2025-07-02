const { execSync } = require('child_process');

try {
  console.log('🚀 Running TypeScript error fix script...');
  execSync('node fix-all-remaining-ts-errors-final.js', { stdio: 'inherit' });
  console.log('✅ Script completed successfully!');
} catch (error) {
  console.error('❌ Script failed:', error.message);
}