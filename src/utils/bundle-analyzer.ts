/**
 * نظام شامل لتحليل وتحسين حجم الحزم
 * Comprehensive bundle size analysis and optimization system
 */

// تحليل الحزم والتبعيات
export interface BundleAnalysis {
  totalSize: number;
  chunks: ChunkInfo[];
  dependencies: DependencyInfo[];
  unusedDependencies: string[];
  recommendations: OptimizationRecommendation[];
  duplicates: DuplicateInfo[];
}

export interface ChunkInfo {
  name: string;
  size: number;
  gzipSize: number;
  modules: ModuleInfo[];
  isEntryPoint: boolean;
  loadPriority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ModuleInfo {
  name: string;
  size: number;
  path: string;
  isUsed: boolean;
  usageCount: number;
  lastAccessed?: Date;
}

export interface DependencyInfo {
  name: string;
  version: string;
  size: number;
  isDevDependency: boolean;
  usageCount: number;
  isTreeShakeable: boolean;
  alternatives?: string[];
}

export interface OptimizationRecommendation {
  type: 'remove' | 'replace' | 'lazy-load' | 'code-split' | 'tree-shake';
  target: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  estimatedSavings: number;
  effort: 'easy' | 'medium' | 'hard';
}

export interface DuplicateInfo {
  name: string;
  versions: string[];
  totalSize: number;
  locations: string[];
}

class BundleAnalyzer {
  private dependencies: Map<string, DependencyInfo> = new Map();
  private usage: Map<string, number> = new Map();
  private lastScan: Date | null = null;

  // تحليل الحزم الحالية
  async analyzeBundles(): Promise<BundleAnalysis> {
    const chunks = await this.analyzeChunks();
    const dependencies = await this.analyzeDependencies();
    const unusedDependencies = this.findUnusedDependencies();
    const recommendations = this.generateRecommendations();
    const duplicates = this.findDuplicates();

    const totalSize = chunks.reduce((total, chunk) => total + chunk.size, 0);

    return {
      totalSize,
      chunks,
      dependencies,
      unusedDependencies,
      recommendations,
      duplicates
    };
  }

  // تحليل الملفات والوحدات
  private async analyzeChunks(): Promise<ChunkInfo[]> {
    // محاكاة تحليل الحزم - في بيئة حقيقية سنستخدم webpack bundle analyzer
    const mockChunks: ChunkInfo[] = [
      {
        name: 'main',
        size: 245000,
        gzipSize: 78000,
        isEntryPoint: true,
        loadPriority: 'critical',
        modules: [
          {
            name: 'React',
            size: 45000,
            path: 'node_modules/react',
            isUsed: true,
            usageCount: 150
          },
          {
            name: 'ReactDOM',
            size: 35000,
            path: 'node_modules/react-dom',
            isUsed: true,
            usageCount: 100
          }
        ]
      },
      {
        name: 'vendor',
        size: 380000,
        gzipSize: 120000,
        isEntryPoint: false,
        loadPriority: 'high',
        modules: [
          {
            name: '@supabase/supabase-js',
            size: 85000,
            path: 'node_modules/@supabase',
            isUsed: true,
            usageCount: 75
          },
          {
            name: '@tanstack/react-query',
            size: 65000,
            path: 'node_modules/@tanstack',
            isUsed: true,
            usageCount: 45
          }
        ]
      },
      {
        name: 'pdf-heavy',
        size: 1200000,
        gzipSize: 350000,
        isEntryPoint: false,
        loadPriority: 'low',
        modules: [
          {
            name: 'jspdf',
            size: 450000,
            path: 'node_modules/jspdf',
            isUsed: true,
            usageCount: 12
          },
          {
            name: 'pdfmake',
            size: 380000,
            path: 'node_modules/pdfmake',
            isUsed: true,
            usageCount: 8
          }
        ]
      },
      {
        name: 'charts-heavy',
        size: 850000,
        gzipSize: 280000,
        isEntryPoint: false,
        loadPriority: 'medium',
        modules: [
          {
            name: 'recharts',
            size: 320000,
            path: 'node_modules/recharts',
            isUsed: true,
            usageCount: 25
          },
          {
            name: 'chart.js',
            size: 280000,
            path: 'node_modules/chart.js',
            isUsed: false,
            usageCount: 0
          }
        ]
      }
    ];

    return mockChunks;
  }

  // تحليل التبعيات
  private async analyzeDependencies(): Promise<DependencyInfo[]> {
    // قراءة package.json وتحليل التبعيات
    try {
      const packageJsonResponse = await fetch('/package.json');
      if (!packageJsonResponse.ok) {
        throw new Error('Failed to fetch package.json');
      }
      
      const packageJson = await packageJsonResponse.json();
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};

      const analysis: DependencyInfo[] = [];

      // تحليل التبعيات الإنتاجية
      for (const [name, version] of Object.entries(dependencies)) {
        analysis.push({
          name,
          version: version as string,
          size: this.estimatePackageSize(name),
          isDevDependency: false,
          usageCount: this.usage.get(name) || 0,
          isTreeShakeable: this.isTreeShakeable(name),
          alternatives: this.getAlternatives(name)
        });
      }

      // تحليل تبعيات التطوير
      for (const [name, version] of Object.entries(devDependencies)) {
        analysis.push({
          name,
          version: version as string,
          size: this.estimatePackageSize(name),
          isDevDependency: true,
          usageCount: this.usage.get(name) || 0,
          isTreeShakeable: this.isTreeShakeable(name),
          alternatives: this.getAlternatives(name)
        });
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing dependencies:', error);
      return [];
    }
  }

  // العثور على التبعيات غير المستخدمة
  private findUnusedDependencies(): string[] {
    const unused: string[] = [];

    // قائمة بالحزم الشائعة غير المستخدمة
    const commonUnused = [
      'lodash', // إذا لم تكن مستخدمة فعلياً
      'moment', // يفضل استخدام date-fns
      'jquery', // غير مطلوب مع React
      '@types/node', // إذا لم تكن في بيئة Node.js
      'chai', // إذا كنت تستخدم Jest
      'enzyme' // إذا كنت تستخدم React Testing Library
    ];

    for (const pkg of commonUnused) {
      const usage = this.usage.get(pkg) || 0;
      if (usage === 0) {
        unused.push(pkg);
      }
    }

    return unused;
  }

  // توليد توصيات التحسين
  private generateRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [
      {
        type: 'replace',
        target: 'moment',
        description: 'استبدال moment.js بـ date-fns لتوفير حجم كبير',
        impact: 'high',
        estimatedSavings: 67000,
        effort: 'medium'
      },
      {
        type: 'lazy-load',
        target: 'pdf-heavy chunk',
        description: 'تحميل مكتبات PDF عند الحاجة فقط',
        impact: 'high',
        estimatedSavings: 1200000,
        effort: 'easy'
      },
      {
        type: 'tree-shake',
        target: 'lodash',
        description: 'استيراد وظائف lodash المحددة بدلاً من الحزمة كاملة',
        impact: 'medium',
        estimatedSavings: 45000,
        effort: 'easy'
      },
      {
        type: 'remove',
        target: 'chart.js',
        description: 'إزالة chart.js لأنك تستخدم recharts بالفعل',
        impact: 'medium',
        estimatedSavings: 280000,
        effort: 'easy'
      },
      {
        type: 'code-split',
        target: 'admin components',
        description: 'فصل مكونات الإدارة إلى حزمة منفصلة',
        impact: 'medium',
        estimatedSavings: 150000,
        effort: 'medium'
      }
    ];

    return recommendations;
  }

  // العثور على التبعيات المكررة
  private findDuplicates(): DuplicateInfo[] {
    // محاكاة العثور على التبعيات المكررة
    return [
      {
        name: 'react',
        versions: ['18.2.0', '18.1.0'],
        totalSize: 90000,
        locations: ['node_modules/react', 'node_modules/some-package/node_modules/react']
      }
    ];
  }

  // تقدير حجم الحزمة
  private estimatePackageSize(packageName: string): number {
    // أحجام تقديرية للحزم الشائعة (بالبايت)
    const packageSizes: { [key: string]: number } = {
      'react': 45000,
      'react-dom': 130000,
      'lodash': 70000,
      'moment': 67000,
      'date-fns': 20000,
      '@supabase/supabase-js': 85000,
      '@tanstack/react-query': 65000,
      'recharts': 320000,
      'chart.js': 280000,
      'jspdf': 450000,
      'pdfmake': 380000,
      'axios': 15000,
      'uuid': 2000,
      'clsx': 1000,
      'tailwind-merge': 8000
    };

    return packageSizes[packageName] || 5000; // حجم افتراضي للحزم غير المعروفة
  }

  // فحص إمكانية Tree Shaking
  private isTreeShakeable(packageName: string): boolean {
    const treeShakeablePackages = [
      'lodash',
      'date-fns',
      'ramda',
      '@material-ui/icons',
      'lucide-react'
    ];

    return treeShakeablePackages.includes(packageName);
  }

  // الحصول على بدائل للحزم
  private getAlternatives(packageName: string): string[] {
    const alternatives: { [key: string]: string[] } = {
      'moment': ['date-fns', 'dayjs'],
      'lodash': ['ramda', 'native ES6'],
      'axios': ['fetch API', 'ky'],
      'chart.js': ['recharts', 'd3'],
      'jquery': ['native DOM', 'cash'],
      'underscore': ['lodash', 'ramda']
    };

    return alternatives[packageName] || [];
  }

  // تتبع استخدام الحزم
  trackUsage(packageName: string): void {
    const currentCount = this.usage.get(packageName) || 0;
    this.usage.set(packageName, currentCount + 1);
  }

  // تصدير التحليل
  exportAnalysis(analysis: BundleAnalysis): string {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSize: this.formatSize(analysis.totalSize),
        chunksCount: analysis.chunks.length,
        dependenciesCount: analysis.dependencies.length,
        unusedDependencies: analysis.unusedDependencies.length,
        recommendations: analysis.recommendations.length
      },
      chunks: analysis.chunks.map(chunk => ({
        name: chunk.name,
        size: this.formatSize(chunk.size),
        gzipSize: this.formatSize(chunk.gzipSize),
        priority: chunk.loadPriority,
        modules: chunk.modules.length
      })),
      recommendations: analysis.recommendations.map(rec => ({
        type: rec.type,
        target: rec.target,
        description: rec.description,
        impact: rec.impact,
        savings: this.formatSize(rec.estimatedSavings),
        effort: rec.effort
      })),
      unusedDependencies: analysis.unusedDependencies,
      duplicates: analysis.duplicates
    };

    return JSON.stringify(report, null, 2);
  }

  // تنسيق حجم الملف
  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// مثيل عام للمحلل
export const bundleAnalyzer = new BundleAnalyzer();

// أدوات مساعدة لتحسين الحزم
export const BundleOptimizationUtils = {
  // فحص سريع للحزم الكبيرة
  async quickScan(): Promise<{ largeChunks: string[]; suggestions: string[] }> {
    const analysis = await bundleAnalyzer.analyzeBundles();
    
    const largeChunks = analysis.chunks
      .filter(chunk => chunk.size > 500000) // أكبر من 500KB
      .map(chunk => `${chunk.name} (${bundleAnalyzer['formatSize'](chunk.size)})`);

    const suggestions = analysis.recommendations
      .filter(rec => rec.impact === 'high')
      .map(rec => rec.description);

    return { largeChunks, suggestions };
  },

  // توليد تقرير سريع
  async generateQuickReport(): Promise<string> {
    const analysis = await bundleAnalyzer.analyzeBundles();
    const totalSavings = analysis.recommendations
      .reduce((total, rec) => total + rec.estimatedSavings, 0);

    return `
📊 تقرير تحسين الحزم السريع
=======================

📈 الحجم الإجمالي: ${bundleAnalyzer['formatSize'](analysis.totalSize)}
🔧 توصيات التحسين: ${analysis.recommendations.length}
💾 إجمالي التوفير المحتمل: ${bundleAnalyzer['formatSize'](totalSavings)}
🗑️ تبعيات غير مستخدمة: ${analysis.unusedDependencies.length}

أهم التوصيات:
${analysis.recommendations
  .filter(rec => rec.impact === 'high')
  .map(rec => `• ${rec.description} (توفير: ${bundleAnalyzer['formatSize'](rec.estimatedSavings)})`)
  .join('\n')}

التبعيات غير المستخدمة:
${analysis.unusedDependencies.map(dep => `• ${dep}`).join('\n')}
    `.trim();
  }
};

// Hook لاستخدام تحليل الحزم في React
export const useBundleAnalysis = () => {
  const [analysis, setAnalysis] = useState<BundleAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = async (): Promise<void> => {
    setIsAnalyzing(true);
    try {
      const result = await bundleAnalyzer.analyzeBundles();
      setAnalysis(result);
    } catch (error) {
      console.error('Bundle analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportReport = (): string | null => {
    if (!analysis) return null;
    return bundleAnalyzer.exportAnalysis(analysis);
  };

  return {
    analysis,
    isAnalyzing,
    runAnalysis,
    exportReport
  };
};

// React Hook لتوليد useState
import { useState } from 'react'; 