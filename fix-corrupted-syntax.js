#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Patterns that the original script corrupted
const CORRUPTED_PATTERNS = [
  // Numeric values that were removed and replaced with comments
  {
    pattern: /(\w+):\s*\/\/\s*(\d+)\s*-\s*removed unused variable\/\/.*$/gm,
    replacement: '$1: $2,'
  },
  // Object property syntax that was broken
  {
    pattern: /(\w+):\s*\/\/\s*(.+?)\s*-\s*removed unused variable\/\/.*$/gm,
    replacement: '$1: $2,'
  },
  // Expression expected errors - usually missing values after colons
  {
    pattern: /:\s*\/\/\s*(.+?)\s*-\s*removed unused variable\/\/.*$/gm,
    replacement: ': $1,'
  },
  // Fix broken object properties
  {
    pattern: /,\s*\/\/\s*(.+?)\s*-\s*removed unused variable\/\/.*$/gm,
    replacement: ', $1'
  }
];

// Function to fix corrupted syntax in a file
function fixCorruptedSyntax(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Skip binary files or empty files
    if (content.length === 0 || content.includes('\u0000')) {
      console.log(`⚠️  Skipping binary/empty file: ${filePath}`);
      return false;
    }
    
    // Apply each pattern fix
    CORRUPTED_PATTERNS.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    // Fix specific broken object syntax patterns
    content = content.replace(/(\w+):\s*\/\/[^,\n}]*$/gm, '$1: null,');
    content = content.replace(/maxSize:\s*\/\/[^,\n}]*$/gm, 'maxSize: 20971520,');
    content = content.replace(/MOBILE:\s*\/\/[^,\n}]*$/gm, 'MOBILE: 640,');
    content = content.replace(/TABLET:\s*\/\/[^,\n}]*$/gm, 'TABLET: 768,');
    content = content.replace(/LAPTOP:\s*\/\/[^,\n}]*$/gm, 'LAPTOP: 1024,');
    content = content.replace(/DESKTOP:\s*\/\/[^,\n}]*$/gm, 'DESKTOP: 1280,');
    
    // Fix missing values in specific error patterns
    content = content.replace(/(\w+):\s*\/\/.*?\n/g, '$1: null,\n');
    
    // Clean up trailing commas before closing braces
    content = content.replace(/,(\s*[}\]])/g, '$1');
    
    // Remove multiple consecutive newlines
    content = content.replace(/\n\n\n+/g, '\n\n');
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed syntax: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find TypeScript/JavaScript files
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    try {
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
    } catch (error) {
      console.error(`Error reading directory ${currentDir}:`, error.message);
    }
  }
  
  traverse(dir);
  return files;
}

// Main execution
console.log('🔧 Starting syntax corruption repair...');

const srcDir = path.join(process.cwd(), 'src');
const files = findFiles(srcDir);

console.log(`📁 Found ${files.length} files to check`);

let fixedCount = 0;
files.forEach(file => {
  if (fixCorruptedSyntax(file)) {
    fixedCount++;
  }
});

console.log(`\n✅ Repair complete! Fixed ${fixedCount} files.`);
console.log('🔄 The TypeScript errors should now be resolved.');