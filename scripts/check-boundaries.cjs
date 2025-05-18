const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '..', 'src', 'services');

function isServiceFile(file) {
  return file.endsWith('.ts') && file !== 'index.ts' && !file.startsWith('base');
}

let hasViolation = false;

for (const file of fs.readdirSync(servicesDir).filter(isServiceFile)) {
  const fullPath = path.join(servicesDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  const regex = /from\s+['"]@\/services\/(?!base\/)[^'";]+/g;
  const matches = content.match(regex);
  if (matches) {
    console.error(`Forbidden cross-service import in ${file}: ${matches.join(', ')}`);
    hasViolation = true;
  }
}

if (hasViolation) {
  console.error('Module boundary check failed.');
  process.exit(1);
} else {
  console.log('Module boundaries validated.');
}
