interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface AlertRule {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  duration: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AlertData {
  rule: AlertRule;
  metric: MetricData;
  timestamp: number;
  message: string;
}

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: number;
  responseTime: number;
  error?: string;
}

class MonitoringService {
  private metrics: MetricData[] = [];
  private alerts: AlertRule[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private maxMetricsHistory = 1000;

  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    this.checkAlerts(metric);
    this.sendToAnalytics(metric);
  }

  addAlert(rule: AlertRule): void {
    this.alerts.push(rule);
  }

  async performHealthCheck(name: string, checkFn: () => Promise<boolean>): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await checkFn();
      const responseTime = Date.now() - startTime;
      
      const healthCheck: HealthCheck = {
        name,
        status: isHealthy ? 'healthy' : 'degraded',
        lastCheck: Date.now(),
        responseTime
      };

      this.healthChecks.set(name, healthCheck);
      this.recordMetric(`health_check.${name}`, isHealthy ? 1 : 0, {
        status: healthCheck.status
      });

      return healthCheck;
    } catch (error) {
      const healthCheck: HealthCheck = {
        name,
        status: 'unhealthy',
        lastCheck: Date.now(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.healthChecks.set(name, healthCheck);
      this.recordMetric(`health_check.${name}`, 0, {
        status: 'unhealthy',
        error: healthCheck.error
      });

      return healthCheck;
    }
  }

  getSystemHealth(): { overall: string; checks: HealthCheck[] } {
    const checks = Array.from(this.healthChecks.values());
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;

    let overall = 'healthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    }

    return { overall, checks };
  }

  getMetrics(name?: string, since?: number): MetricData[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    if (since) {
      filtered = filtered.filter(m => m.timestamp >= since);
    }

    return filtered;
  }

  getAverageMetric(name: string, duration: number): number {
    const since = Date.now() - duration;
    const metrics = this.getMetrics(name, since);
    
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  private checkAlerts(metric: MetricData): void {
    const relevantAlerts = this.alerts.filter(alert => alert.metric === metric.name);

    for (const alert of relevantAlerts) {
      const shouldTrigger = this.evaluateAlert(alert, metric);
      
      if (shouldTrigger) {
        this.triggerAlert(alert, metric);
      }
    }
  }

  private evaluateAlert(alert: AlertRule, metric: MetricData): boolean {
    switch (alert.operator) {
      case 'gt':
        return metric.value > alert.threshold;
      case 'lt':
        return metric.value < alert.threshold;
      case 'eq':
        return metric.value === alert.threshold;
      default:
        return false;
    }
  }

  private triggerAlert(alert: AlertRule, metric: MetricData): void {
    const alertData = {
      rule: alert,
      metric,
      timestamp: Date.now(),
      message: `Alert: ${alert.metric} ${alert.operator} ${alert.threshold} (current: ${metric.value})`
    };

    if (import.meta.env.DEV) {
      console.warn('🚨 Alert triggered:', alertData);
    }

    this.sendAlert(alertData);
  }

  private async sendAlert(alertData: AlertData): Promise<void> {
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData)
      });
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  private async sendToAnalytics(metric: MetricData): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      try {
        await fetch('/api/analytics/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metric)
        });
      } catch (error) {
      }
    }
  }

  setupDefaultHealthChecks(): void {
    setInterval(async () => {
      await this.performHealthCheck('database', async () => {
        try {
          const response = await fetch('/api/health/database');
          return response.ok;
        } catch {
          return false;
        }
      });

      await this.performHealthCheck('api', async () => {
        try {
          const response = await fetch('/api/health');
          return response.ok;
        } catch {
          return false;
        }
      });

      await this.performHealthCheck('cache', async () => {
        try {
          const response = await fetch('/api/health/cache');
          return response.ok;
        } catch {
          return false;
        }
      });
    }, 30000); // Check every 30 seconds
  }

  setupDefaultAlerts(): void {
    this.addAlert({
      metric: 'response_time',
      threshold: 2000,
      operator: 'gt',
      duration: 60000,
      severity: 'high'
    });

    this.addAlert({
      metric: 'error_rate',
      threshold: 0.05,
      operator: 'gt',
      duration: 300000,
      severity: 'critical'
    });

    this.addAlert({
      metric: 'memory_usage',
      threshold: 0.9,
      operator: 'gt',
      duration: 120000,
      severity: 'high'
    });
  }
}

export const monitoringService = new MonitoringService();

export const withMonitoring = <T extends (...args: any[]) => any>(
  fn: T,
  metricName: string
): T => {
  return ((...args: any[]) => {
    const startTime = Date.now();
    
    try {
      const result = fn(...args);
      
      if (result instanceof Promise) {
        return result
          .then((value) => {
            monitoringService.recordMetric(`${metricName}.duration`, Date.now() - startTime);
            monitoringService.recordMetric(`${metricName}.success`, 1);
            return value;
          })
          .catch((error) => {
            monitoringService.recordMetric(`${metricName}.duration`, Date.now() - startTime);
            monitoringService.recordMetric(`${metricName}.error`, 1);
            throw error;
          });
      } else {
        monitoringService.recordMetric(`${metricName}.duration`, Date.now() - startTime);
        monitoringService.recordMetric(`${metricName}.success`, 1);
        return result;
      }
    } catch (error) {
      monitoringService.recordMetric(`${metricName}.duration`, Date.now() - startTime);
      monitoringService.recordMetric(`${metricName}.error`, 1);
      throw error;
    }
  }) as T;
};
