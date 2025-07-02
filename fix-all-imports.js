#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common unused import patterns to remove
const UNUSED_PATTERNS = [
  // React imports that aren't used
  /^import React from 'react';\s*$/gm,
  /^import \{ React \} from 'react';\s*$/gm,
  
  // Specific unused imports from the error list
  /^import \{ cn \} from '@\/lib\/utils';\s*$/gm,
  /^import \{ Label \} from '@\/components\/ui\/label';\s*$/gm,
  /^import \{ Input \} from '@\/components\/ui\/input';\s*$/gm,
  /^import \{ Progress \} from '@\/components\/ui\/progress';\s*$/gm,
  /^import \{ Badge \} from '@\/components\/ui\/badge';\s*$/gm,
  /^import \{ ScrollArea \} from '@\/components\/ui\/scroll-area';\s*$/gm,
  /^import \{ Button \} from '@\/components\/ui\/button';\s*$/gm,
  /^import \{ Card \} from '@\/components\/ui\/card';\s*$/gm,
  /^import \{ CardFooter \} from '@\/components\/ui\/card';\s*$/gm,
];

// Function to remove unused imports from a file
function removeUnusedImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Add React import if JSX is used but React is not imported
    if (/<[A-Z]/.test(content) && !content.includes('import React') && filePath.endsWith('.tsx')) {
      content = `import React from 'react';\n${content}`;
      modified = true;
    }
    
    // Remove unused React import if no JSX is used
    if (!/<[A-Z]/.test(content) && /^import React from 'react';\s*$/m.test(content)) {
      content = content.replace(/^import React from 'react';\s*$/m, '');
      modified = true;
    }
    
    // Remove standalone React imports that aren't being used
    if (!/\bReact\b/.test(content.replace(/^import React from 'react';\s*$/m, ''))) {
      content = content.replace(/^import React from 'react';\s*$/m, '');
      modified = true;
    }
    
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
    
    // Remove unused variables by commenting them out
    content = content.replace(/(\s+)(\w+),?\s*(?=\/\/|$)/g, (match, space, varName) => {
      // Don't remove if it's used elsewhere in the file
      const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
      const matches = content.match(usageRegex);
      if (matches && matches.length <= 1) {
        modified = true;
        return `${space}// ${varName} - removed unused variable`;
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