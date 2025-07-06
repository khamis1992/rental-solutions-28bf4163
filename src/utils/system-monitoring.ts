/**
 * System monitoring utilities for health checks and diagnostics
 */
import { logger, logInfo, logWarn, logError } from './enhanced-logging';
import { supabase } from '../lib/supabase';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthCheck;
    authentication: HealthCheck;
    storage: HealthCheck;
    performance: HealthCheck;
  };
  overall: {
    score: number;
    issues: string[];
    recommendations: string[];
  };
}

export interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  responseTime?: number;
  error?: string;
  details?: any;
}

export class SystemMonitor {
  private healthCheckInterval: number = 300000; // 5 minutes
  private performanceThresholds = {
    databaseResponseTime: 1000, // 1 second
    apiResponseTime: 2000, // 2 seconds
    memoryUsage: 0.8, // 80%
    errorRate: 0.05 // 5%
  };

  constructor() {
    this.startHealthChecks();
    this.initializePerformanceMonitoring();
  }

  private startHealthChecks() {
    // Initial health check
    this.performHealthCheck();
    
    // Schedule periodic health checks
    setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);
  }

  private initializePerformanceMonitoring() {
    // Monitor page performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.collectWebVitals();
        }, 0);
      });
    }
  }

  async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    
    try {
      logInfo('system', 'Starting system health check');
      
      const [database, authentication, storage, performance] = await Promise.allSettled([
        this.checkDatabase(),
        this.checkAuthentication(),
        this.checkStorage(),
        this.checkPerformance()
      ]);

      const checks = {
        database: database.status === 'fulfilled' ? database.value : { status: 'fail' as const, error: 'Check failed' },
        authentication: authentication.status === 'fulfilled' ? authentication.value : { status: 'fail' as const, error: 'Check failed' },
        storage: storage.status === 'fulfilled' ? storage.value : { status: 'fail' as const, error: 'Check failed' },
        performance: performance.status === 'fulfilled' ? performance.value : { status: 'fail' as const, error: 'Check failed' }
      };

      const systemHealth = this.calculateOverallHealth(checks);
      const totalTime = Date.now() - startTime;
      
      logInfo('system', `Health check completed in ${totalTime}ms`, systemHealth);
      
      // Log warnings or errors based on health status
      if (systemHealth.status === 'degraded') {
        logWarn('system', 'System health is degraded', systemHealth.overall);
      } else if (systemHealth.status === 'unhealthy') {
        logError('system', 'System health is unhealthy', systemHealth.overall);
      }

      return systemHealth;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError('system', 'Health check failed', { error: errorMessage }, error as Error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: { status: 'fail', error: 'Health check failed' },
          authentication: { status: 'fail', error: 'Health check failed' },
          storage: { status: 'fail', error: 'Health check failed' },
          performance: { status: 'fail', error: 'Health check failed' }
        },
        overall: {
          score: 0,
          issues: ['Health check system failure'],
          recommendations: ['Investigate health check system']
        }
      };
    }
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Simple query to test database connectivity
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          status: 'fail',
          responseTime,
          error: error.message
        };
      }
      
      const status = responseTime > this.performanceThresholds.databaseResponseTime ? 'warn' : 'pass';
      
      return {
        status,
        responseTime,
        details: { query: 'SELECT id FROM profiles LIMIT 1' }
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async checkAuthentication(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.auth.getSession();
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          status: 'fail',
          responseTime,
          error: error.message
        };
      }
      
      return {
        status: 'pass',
        responseTime,
        details: { hasSession: !!data.session }
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async checkStorage(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Check if storage is accessible by listing buckets
      const { data, error } = await supabase.storage.listBuckets();
      const responseTime = Date.now() - startTime;
      
      if (error) {
        return {
          status: 'fail',
          responseTime,
          error: error.message
        };
      }
      
      return {
        status: 'pass',
        responseTime,
        details: { bucketCount: data?.length || 0 }
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async checkPerformance(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Check memory usage if available
      let memoryUsage = 0;
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsage = memory.usedJSHeapSize / memory.totalJSHeapSize;
      }
      
      const responseTime = Date.now() - startTime;
      const isMemoryHigh = memoryUsage > this.performanceThresholds.memoryUsage;
      
      return {
        status: isMemoryHigh ? 'warn' : 'pass',
        responseTime,
        details: {
          memoryUsage: memoryUsage * 100, // Convert to percentage
          threshold: this.performanceThresholds.memoryUsage * 100
        }
      };
    } catch (error) {
      return {
        status: 'fail',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private calculateOverallHealth(checks: SystemHealth['checks']): SystemHealth {
    const checkValues = Object.values(checks);
    const passCount = checkValues.filter(check => check.status === 'pass').length;
    const warnCount = checkValues.filter(check => check.status === 'warn').length;
    const failCount = checkValues.filter(check => check.status === 'fail').length;
    
    const score = (passCount * 100 + warnCount * 50) / checkValues.length;
    
    let status: SystemHealth['status'];
    if (failCount > 0 || score < 50) {
      status = 'unhealthy';
    } else if (warnCount > 0 || score < 80) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    Object.entries(checks).forEach(([component, check]) => {
      if (check.status === 'fail') {
        issues.push(`${component} is failing: ${check.error}`);
        recommendations.push(`Investigate ${component} connectivity`);
      } else if (check.status === 'warn') {
        issues.push(`${component} performance is degraded`);
        recommendations.push(`Monitor ${component} performance closely`);
      }
    });
    
    return {
      status,
      timestamp: new Date().toISOString(),
      checks,
      overall: {
        score: Math.round(score),
        issues,
        recommendations
      }
    };
  }

  private collectWebVitals() {
    if (typeof window === 'undefined' || !window.performance) return;
    
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstContentfulPaint: 0,
          timeToInteractive: navigation.loadEventEnd - navigation.fetchStart
        };
        
        // Get First Contentful Paint if available
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          metrics.firstContentfulPaint = fcpEntry.startTime;
        }
        
        logger.trackPerformance('page_load_time', metrics.pageLoadTime, metrics);
        logger.trackPerformance('dom_content_loaded', metrics.domContentLoaded, metrics);
        logger.trackPerformance('first_contentful_paint', metrics.firstContentfulPaint, metrics);
        
        logInfo('performance', 'Web Vitals collected', metrics);
      }
    } catch (error) {
      logError('performance', 'Failed to collect Web Vitals', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  // Public methods for manual checks
  async getDatabaseHealth(): Promise<HealthCheck> {
    return this.checkDatabase();
  }

  async getAuthenticationHealth(): Promise<HealthCheck> {
    return this.checkAuthentication();
  }

  async getStorageHealth(): Promise<HealthCheck> {
    return this.checkStorage();
  }

  async getPerformanceHealth(): Promise<HealthCheck> {
    return this.checkPerformance();
  }
}

// Create singleton instance
export const systemMonitor = new SystemMonitor();

// Convenience functions
export const getSystemHealth = () => systemMonitor.performHealthCheck();
export const getDatabaseHealth = () => systemMonitor.getDatabaseHealth();
export const getAuthenticationHealth = () => systemMonitor.getAuthenticationHealth();
export const getStorageHealth = () => systemMonitor.getStorageHealth();
export const getPerformanceHealth = () => systemMonitor.getPerformanceHealth();