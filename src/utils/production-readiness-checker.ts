interface ReadinessCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

interface ReadinessReport {
  overall: 'ready' | 'not-ready' | 'warnings';
  checks: ReadinessCheck[];
  timestamp: string;
}

class ProductionReadinessChecker {
  async runAllChecks(): Promise<ReadinessReport> {
    const checks: ReadinessCheck[] = [];

    checks.push(await this.checkEnvironmentVariables());
    checks.push(await this.checkSecurityHeaders());
    checks.push(await this.checkPerformanceMetrics());
    checks.push(await this.checkErrorHandling());
    checks.push(await this.checkLogging());
    checks.push(await this.checkDatabaseConnections());
    checks.push(await this.checkCacheSystem());
    checks.push(await this.checkMonitoring());

    const failedChecks = checks.filter(check => check.status === 'fail');
    const warningChecks = checks.filter(check => check.status === 'warning');

    let overall: 'ready' | 'not-ready' | 'warnings' = 'ready';
    if (failedChecks.length > 0) {
      overall = 'not-ready';
    } else if (warningChecks.length > 0) {
      overall = 'warnings';
    }

    return {
      overall,
      checks,
      timestamp: new Date().toISOString()
    };
  }

  private async checkEnvironmentVariables(): Promise<ReadinessCheck> {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);

    if (missingVars.length > 0) {
      return {
        name: 'Environment Variables',
        status: 'fail',
        message: `Missing required environment variables: ${missingVars.join(', ')}`,
        details: { missingVars }
      };
    }

    return {
      name: 'Environment Variables',
      status: 'pass',
      message: 'All required environment variables are present'
    };
  }

  private async checkSecurityHeaders(): Promise<ReadinessCheck> {
    try {
      const response = await fetch(window.location.origin, { method: 'HEAD' });
      const headers = response.headers;

      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection'
      ];

      const missingHeaders = securityHeaders.filter(header => !headers.get(header));

      if (missingHeaders.length > 0) {
        return {
          name: 'Security Headers',
          status: 'warning',
          message: `Missing security headers: ${missingHeaders.join(', ')}`,
          details: { missingHeaders }
        };
      }

      return {
        name: 'Security Headers',
        status: 'pass',
        message: 'Security headers are properly configured'
      };
    } catch (error) {
      return {
        name: 'Security Headers',
        status: 'warning',
        message: 'Could not check security headers',
        details: { error: (error as Error).message }
      };
    }
  }

  private async checkPerformanceMetrics(): Promise<ReadinessCheck> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;

    if (loadTime > 3000) {
      return {
        name: 'Performance Metrics',
        status: 'warning',
        message: `Page load time is ${loadTime}ms, which exceeds 3 seconds`,
        details: { loadTime }
      };
    }

    return {
      name: 'Performance Metrics',
      status: 'pass',
      message: `Page load time is acceptable: ${loadTime}ms`
    };
  }

  private async checkErrorHandling(): Promise<ReadinessCheck> {
    const hasErrorBoundary = document.querySelector('[data-error-boundary]') !== null;
    const hasGlobalErrorHandler = typeof window.onerror === 'function';

    if (!hasErrorBoundary && !hasGlobalErrorHandler) {
      return {
        name: 'Error Handling',
        status: 'fail',
        message: 'No error boundaries or global error handlers detected'
      };
    }

    return {
      name: 'Error Handling',
      status: 'pass',
      message: 'Error handling mechanisms are in place'
    };
  }

  private async checkLogging(): Promise<ReadinessCheck> {
    const hasConsoleOverride = console.log.toString().includes('enterpriseLogger');

    if (!hasConsoleOverride && import.meta.env.PROD) {
      return {
        name: 'Logging System',
        status: 'warning',
        message: 'Console logging not properly replaced in production'
      };
    }

    return {
      name: 'Logging System',
      status: 'pass',
      message: 'Logging system is properly configured'
    };
  }

  private async checkDatabaseConnections(): Promise<ReadinessCheck> {
    try {
      const response = await fetch('/api/health/database');
      if (!response.ok) {
        return {
          name: 'Database Connection',
          status: 'fail',
          message: 'Database health check failed'
        };
      }

      return {
        name: 'Database Connection',
        status: 'pass',
        message: 'Database connection is healthy'
      };
    } catch (error) {
      return {
        name: 'Database Connection',
        status: 'warning',
        message: 'Could not verify database connection',
        details: { error: (error as Error).message }
      };
    }
  }

  private async checkCacheSystem(): Promise<ReadinessCheck> {
    try {
      const cacheTest = localStorage.getItem('cache-test');
      localStorage.setItem('cache-test', 'working');
      localStorage.removeItem('cache-test');

      return {
        name: 'Cache System',
        status: 'pass',
        message: 'Cache system is functional'
      };
    } catch (error) {
      return {
        name: 'Cache System',
        status: 'warning',
        message: 'Cache system may not be working properly',
        details: { error: (error as Error).message }
      };
    }
  }

  private async checkMonitoring(): Promise<ReadinessCheck> {
    const hasPerformanceAPI = 'performance' in window;
    const hasNavigationTiming = 'getEntriesByType' in performance;

    if (!hasPerformanceAPI || !hasNavigationTiming) {
      return {
        name: 'Monitoring Capabilities',
        status: 'warning',
        message: 'Limited monitoring capabilities in this browser'
      };
    }

    return {
      name: 'Monitoring Capabilities',
      status: 'pass',
      message: 'Monitoring systems are available'
    };
  }
}

export const productionReadinessChecker = new ProductionReadinessChecker();
