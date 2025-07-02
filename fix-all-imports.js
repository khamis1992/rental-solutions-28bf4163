#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common unused import patterns to remove
const UNUSED_PATTERNS = [
  // React imports that aren't used
  /^import React from 'react';\s*$/gm,
  /^import \{ React \} from 'react';\s*$/gm,
  
  // Specific unused imports (examples from the errors)
  /^import \{ Calendar[^}]*\} from 'lucide-react';\s*$/gm,
  /^import \{ formatCurrency \} from '@\/lib\/utils';\s*$/gm,
  /^import \{ Button \} from '@\/components\/ui\/button';\s*$/gm,
  /^import \{ Label \} from '@\/components\/ui\/label';\s*$/gm,
  /^import \{ Input \} from '@\/components\/ui\/input';\s*$/gm,
  /^import \{ Progress \} from '@\/components\/ui\/progress';\s*$/gm,
  /^import \{ Badge \} from '@\/components\/ui\/badge';\s*$/gm,
  /^import \{ ScrollArea \} from '@\/components\/ui\/scroll-area';\s*$/gm,
];

// Function to remove unused imports from a file
function removeUnusedImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply each pattern
    UNUSED_PATTERNS.forEach(pattern => {
      const newContent = content.replace(pattern, '');
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    // Remove specific unused imports from lucide-react
    const lucideRegex = /import \{ ([^}]+) \} from 'lucide-react';/g;
    content = content.replace(lucideRegex, (match, imports) => {
      const importList = imports.split(',').map(i => i.trim());
      const usedImports = importList.filter(imp => {
        // Check if the import is actually used in the file
        const usageRegex = new RegExp(`<${imp}[\\s>]|\\b${imp}\\b`, 'g');
        return usageRegex.test(content.replace(match, ''));
      });
      
      if (usedImports.length === 0) {
        modified = true;
        return '';
      } else if (usedImports.length !== importList.length) {
        modified = true;
        return `import { ${usedImports.join(', ')} } from 'lucide-react';`;
      }
      return match;
    });
    
    // Clean up multiple consecutive empty lines
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

// Main execution
console.log('🔧 Starting automatic import cleanup...');

const srcDir = path.join(process.cwd(), 'src');
const files = findFiles(srcDir);

console.log(`📁 Found ${files.length} files to process`);

let fixedCount = 0;
files.forEach(file => {
  if (removeUnusedImports(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Process complete! Fixed ${fixedCount} files.`);
console.log('🔄 Run this script again if there are still TypeScript errors.');