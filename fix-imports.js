#!/usr/bin/env node
// Script to fix unused imports automatically

const fs = require('fs');
const path = require('path');

// Common unused imports to remove
const UNUSED_PATTERNS = [
  /^import React from 'react';\s*$/m,
  /^import React,? /m,
  /import\s+{\s*[^}]*}\s+from\s+'[^']+\/ui\/[^']+'\s*;?\s*$/gm,
];

// Pattern to add React import only where JSX is used
const JSX_PATTERN = /<[A-Z]/;

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Check if file uses JSX
    const usesJSX = JSX_PATTERN.test(content);
    
    // Remove standalone React import
    content = content.replace(/^import React from 'react';\s*$/m, '');
    
    // Add React import only if JSX is used and no React import exists
    if (usesJSX && !content.includes('import') && !content.includes('React')) {
      content = `import React from 'react';\n${content}`;
    }
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDirectory(filePath);
    } else if (stat.isFile()) {
      processFile(filePath);
    }
  }
}

console.log('🔧 Fixing TypeScript unused imports...');
walkDirectory('./src');
console.log('✅ Import cleanup completed!');