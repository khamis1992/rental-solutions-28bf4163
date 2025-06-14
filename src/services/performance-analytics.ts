import { logError } from './monitoring';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: 'performance' | 'user' | 'error' | 'business';
  tags?: Record<string, string>;
}

export interface UserAction {
  id: string;
  action: string;
  component: string;
  timestamp: number;
  duration?: number;
  success: boolean;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId: string;
}

export interface ErrorMetric {
  id: string;
  type: string;
  message: string;
  component: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  userId?: string;
  sessionId: string;
}

export interface PerformanceAlert {
  id: string;
  type: 'performance' | 'error' | 'user';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: number;
  metric: string;
  threshold: number;
  currentValue: number;
}

class PerformanceAnalyticsService {
  private metrics: PerformanceMetric[] = [];
  private userActions: UserAction[] = [];
  private errors: ErrorMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private sessionId: string;
  private startTime: number;
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.initializePerformanceObservers();
    this.startPerformanceMonitoring();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializePerformanceObservers(): void {
    // Navigation timing observer
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);

        // Resource timing observer
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              this.recordResourceMetrics(entry as PerformanceResourceTiming);
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

        // Paint timing observer
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'paint') {
              this.recordPaintMetrics(entry);
            }
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);

        // Layout shift observer
        const layoutObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              this.recordLayoutShift(entry as any);
            }
          }
        });
        layoutObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutObserver);
      } catch (error) {
        console.warn('Performance observers not fully supported:', error);
      }
    }
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming): void {
    const metrics = [
      {
        name: 'DNS Lookup Time',
        value: entry.domainLookupEnd - entry.domainLookupStart,
        unit: 'ms'
      },
      {
        name: 'TCP Connection Time',
        value: entry.connectEnd - entry.connectStart,
        unit: 'ms'
      },
      {
        name: 'Request Time',
        value: entry.responseStart - entry.requestStart,
        unit: 'ms'
      },
      {
        name: 'Response Time',
        value: entry.responseEnd - entry.responseStart,
        unit: 'ms'
      },
      {
        name: 'DOM Content Loaded',
        value: entry.domContentLoadedEventEnd - entry.navigationStart,
        unit: 'ms'
      },
      {
        name: 'Page Load Time',
        value: entry.loadEventEnd - entry.navigationStart,
        unit: 'ms'
      },
      {
        name: 'Time to Interactive',
        value: entry.domInteractive - entry.navigationStart,
        unit: 'ms'
      }
    ];

    metrics.forEach(metric => {
      this.recordMetric({
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        category: 'performance',
        tags: {
          type: 'navigation',
          page: window.location.pathname
        }
      });
    });
  }

  private recordResourceMetrics(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.startTime;
    const size = (entry as any).transferSize || 0;

    this.recordMetric({
      name: 'Resource Load Time',
      value: duration,
      unit: 'ms',
      category: 'performance',
      tags: {
        type: 'resource',
        resource: entry.name,
        resourceType: this.getResourceType(entry.name)
      }
    });

    if (size > 0) {
      this.recordMetric({
        name: 'Resource Size',
        value: size,
        unit: 'bytes',
        category: 'performance',
        tags: {
          type: 'resource',
          resource: entry.name,
          resourceType: this.getResourceType(entry.name)
        }
      });
    }
  }

  private recordPaintMetrics(entry: PerformanceEntry): void {
    this.recordMetric({
      name: entry.name === 'first-paint' ? 'First Paint' : 'First Contentful Paint',
      value: entry.startTime,
      unit: 'ms',
      category: 'performance',
      tags: {
        type: 'paint'
      }
    });
  }

  private recordLayoutShift(entry: any): void {
    this.recordMetric({
      name: 'Cumulative Layout Shift',
      value: entry.value,
      unit: 'score',
      category: 'performance',
      tags: {
        type: 'layout-shift'
      }
    });
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  private startPerformanceMonitoring(): void {
    // Monitor memory usage
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.recordMetric({
          name: 'Memory Usage',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          category: 'performance',
          tags: { type: 'memory' }
        });

        this.recordMetric({
          name: 'Memory Limit',
          value: memory.jsHeapSizeLimit,
          unit: 'bytes',
          category: 'performance',
          tags: { type: 'memory' }
        });
      }
    }, 30000); // Every 30 seconds

    // Monitor connection quality
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric({
        name: 'Connection Speed',
        value: connection.downlink || 0,
        unit: 'mbps',
        category: 'performance',
        tags: {
          type: 'connection',
          effectiveType: connection.effectiveType || 'unknown'
        }
      });
    }
  }

  // Public API methods
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const fullMetric: PerformanceMetric = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...metric
    };

    this.metrics.push(fullMetric);
    this.checkAlerts(fullMetric);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  recordUserAction(action: Omit<UserAction, 'id' | 'timestamp' | 'sessionId'>): void {
    const fullAction: UserAction = {
      id: this.generateId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...action
    };

    this.userActions.push(fullAction);

    // Track user engagement metrics
    this.recordMetric({
      name: 'User Action',
      value: 1,
      unit: 'count',
      category: 'user',
      tags: {
        action: action.action,
        component: action.component,
        success: action.success.toString()
      }
    });

    // Keep only last 500 actions
    if (this.userActions.length > 500) {
      this.userActions = this.userActions.slice(-500);
    }
  }

  recordError(error: Omit<ErrorMetric, 'id' | 'timestamp' | 'sessionId'>): void {
    const fullError: ErrorMetric = {
      id: this.generateId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...error
    };

    this.errors.push(fullError);

    // Track error rate metrics
    this.recordMetric({
      name: 'Error Rate',
      value: 1,
      unit: 'count',
      category: 'error',
      tags: {
        type: error.type,
        component: error.component,
        severity: error.severity
      }
    });

    // Create alert for critical errors
    if (error.severity === 'critical') {
      this.createAlert({
        type: 'error',
        severity: 'critical',
        message: `Critical error in ${error.component}: ${error.message}`,
        metric: 'error_rate',
        threshold: 0,
        currentValue: 1
      });
    }

    // Keep only last 200 errors
    if (this.errors.length > 200) {
      this.errors = this.errors.slice(-200);
    }
  }

  private checkAlerts(metric: PerformanceMetric): void {
    const thresholds = {
      'Page Load Time': 3000, // 3 seconds
      'First Contentful Paint': 2000, // 2 seconds
      'Memory Usage': 50 * 1024 * 1024, // 50MB
      'Resource Load Time': 5000, // 5 seconds
      'Cumulative Layout Shift': 0.1 // CLS score
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      this.createAlert({
        type: 'performance',
        severity: metric.value > threshold * 1.5 ? 'critical' : 'warning',
        message: `${metric.name} exceeded threshold: ${metric.value}${metric.unit} > ${threshold}${metric.unit}`,
        metric: metric.name,
        threshold,
        currentValue: metric.value
      });
    }
  }

  private createAlert(alert: Omit<PerformanceAlert, 'id' | 'timestamp'>): void {
    const fullAlert: PerformanceAlert = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...alert
    };

    this.alerts.push(fullAlert);

    // Log critical alerts
    if (alert.severity === 'critical') {
      logError(new Error(alert.message), {
        component: 'PerformanceAnalytics',
        alert: fullAlert
      });
    }

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analytics methods
  getMetrics(category?: string, timeRange?: number): PerformanceMetric[] {
    let filtered = this.metrics;

    if (category) {
      filtered = filtered.filter(m => m.category === category);
    }

    if (timeRange) {
      const cutoff = Date.now() - timeRange;
      filtered = filtered.filter(m => m.timestamp > cutoff);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  getUserActions(timeRange?: number): UserAction[] {
    let filtered = this.userActions;

    if (timeRange) {
      const cutoff = Date.now() - timeRange;
      filtered = filtered.filter(a => a.timestamp > cutoff);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  getErrors(timeRange?: number): ErrorMetric[] {
    let filtered = this.errors;

    if (timeRange) {
      const cutoff = Date.now() - timeRange;
      filtered = filtered.filter(e => e.timestamp > cutoff);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  getAlerts(severity?: string): PerformanceAlert[] {
    let filtered = this.alerts;

    if (severity) {
      filtered = filtered.filter(a => a.severity === severity);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Performance insights
  getPerformanceInsights(): {
    averageLoadTime: number;
    errorRate: number;
    userEngagement: number;
    performanceScore: number;
    recommendations: string[];
  } {
    const timeRange = 30 * 60 * 1000; // Last 30 minutes
    const recentMetrics = this.getMetrics('performance', timeRange);
    const recentErrors = this.getErrors(timeRange);
    const recentActions = this.getUserActions(timeRange);

    // Calculate average load time
    const loadTimes = recentMetrics
      .filter(m => m.name === 'Page Load Time')
      .map(m => m.value);
    const averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length 
      : 0;

    // Calculate error rate
    const totalActions = recentActions.length;
    const errorRate = totalActions > 0 ? (recentErrors.length / totalActions) * 100 : 0;

    // Calculate user engagement (actions per minute)
    const timeRangeMinutes = timeRange / (60 * 1000);
    const userEngagement = totalActions / timeRangeMinutes;

    // Calculate performance score (0-100)
    let performanceScore = 100;
    if (averageLoadTime > 3000) performanceScore -= 20;
    if (averageLoadTime > 5000) performanceScore -= 20;
    if (errorRate > 5) performanceScore -= 30;
    if (errorRate > 10) performanceScore -= 20;

    // Generate recommendations
    const recommendations: string[] = [];
    if (averageLoadTime > 3000) {
      recommendations.push('Optimize page load time - consider code splitting and lazy loading');
    }
    if (errorRate > 5) {
      recommendations.push('High error rate detected - review error handling and user flows');
    }
    if (userEngagement < 1) {
      recommendations.push('Low user engagement - consider improving UX and reducing friction');
    }

    return {
      averageLoadTime,
      errorRate,
      userEngagement,
      performanceScore: Math.max(0, performanceScore),
      recommendations
    };
  }

  // Cleanup
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
    this.userActions = [];
    this.errors = [];
    this.alerts = [];
  }
}

// Create singleton instance
export const performanceAnalytics = new PerformanceAnalyticsService();

// Convenience functions for common tracking
export const trackUserAction = (
  action: string,
  component: string,
  success: boolean = true,
  metadata?: Record<string, any>
) => {
  performanceAnalytics.recordUserAction({
    action,
    component,
    success,
    metadata
  });
};

export const trackError = (
  type: string,
  message: string,
  component: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) => {
  performanceAnalytics.recordError({
    type,
    message,
    component,
    severity,
    resolved: false
  });
};

export const trackPerformance = (
  name: string,
  value: number,
  unit: string = 'ms',
  tags?: Record<string, string>
) => {
  performanceAnalytics.recordMetric({
    name,
    value,
    unit,
    category: 'performance',
    tags
  });
}; 