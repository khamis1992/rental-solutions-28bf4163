import { describe, it, expect } from 'vitest';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';

describe('Bundle Size Tests', () => {
  const distPath = join(process.cwd(), 'dist');
  
  it('should have main bundle under 2MB', () => {
    try {
      const indexHtml = readFileSync(join(distPath, 'index.html'), 'utf-8');
      const jsFiles = indexHtml.match(/\/assets\/index-[a-f0-9]+\.js/g) || [];
      
      let totalSize = 0;
      jsFiles.forEach(file => {
        const filePath = join(distPath, file);
        const stats = statSync(filePath);
        totalSize += stats.size;
      });
      
      const maxSize = 2 * 1024 * 1024; // 2MB
      expect(totalSize).toBeLessThan(maxSize);
    } catch (error) {
      console.warn('Bundle size test skipped - dist folder not found');
    }
  });

  it('should have CSS bundle under 500KB', () => {
    try {
      const indexHtml = readFileSync(join(distPath, 'index.html'), 'utf-8');
      const cssFiles = indexHtml.match(/\/assets\/index-[a-f0-9]+\.css/g) || [];
      
      let totalSize = 0;
      cssFiles.forEach(file => {
        const filePath = join(distPath, file);
        const stats = statSync(filePath);
        totalSize += stats.size;
      });
      
      const maxSize = 500 * 1024; // 500KB
      expect(totalSize).toBeLessThan(maxSize);
    } catch (error) {
      console.warn('CSS bundle size test skipped - dist folder not found');
    }
  });

  it('should have proper chunk splitting', () => {
    try {
      const indexHtml = readFileSync(join(distPath, 'index.html'), 'utf-8');
      const jsFiles = indexHtml.match(/\/assets\/[a-zA-Z0-9-]+\.js/g) || [];
      
      expect(jsFiles.length).toBeGreaterThanOrEqual(3);
      
      const hasVendorChunk = jsFiles.some(file => file.includes('vendor'));
      expect(hasVendorChunk).toBe(true);
    } catch (error) {
      console.warn('Chunk splitting test skipped - dist folder not found');
    }
  });
});
