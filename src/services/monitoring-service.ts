import { performanceAnalytics } from './performance-analytics';

export interface MonitoringConfig {
  environment: 'development' | 'staging' | 'production';
  region: string;
  retention: {
    metrics: number; // days
    logs: number; // days
    events: number; // days
  };
  sampling: {
    metrics: number; // interval in seconds
    logs: number; // batch size
    traces: number; // percentage 0-100
  };
  alerting: {
    enabled: boolean;
    channels: AlertChannel[];
    escalation: EscalationPolicy[];
  };
  storage: {
    provider: 'prometheus' | 'influxdb' | 'cloudwatch' | 'datadog';
    endpoint: string;
    credentials?: any;
  };
}

export interface AlertChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms';
  config: {
    endpoint?: string;
    token?: string;
    recipients?: string[];
    webhook_url?: string;
  };
  enabled: boolean;
}

export interface EscalationPolicy {
  id: string;
  name: string;
  rules: EscalationRule[];
  enabled: boolean;
}

export interface EscalationRule {
  delay: number; // minutes
  channels: string[]; // channel IDs
  severity: AlertSeverity[];
}

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  labels: { [key: string]: string };
  source: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  source: string;
  service: string;
  metadata: { [key: string]: any };
  trace_id?: string;
  span_id?: string;
}

export interface Event {
  id: string;
  timestamp: number;
  type: string;
  source: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata: { [key: string]: any };
  resolved: boolean;
  resolved_at?: number;
}

export interface Alert {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  condition: AlertCondition;
  threshold: number;
  duration: number; // seconds
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
  created: number;
  updated: number;
  triggered_at?: number;
  resolved_at?: number;
  notification_count: number;
  last_notification: number;
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'active' | 'pending' | 'firing' | 'resolved' | 'silenced';

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
  value: number;
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
  window: number; // seconds
  labels?: { [key: string]: string };
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  panels: DashboardPanel[];
  variables: DashboardVariable[];
  tags: string[];
  created: number;
  updated: number;
  created_by: string;
  shared: boolean;
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: 'graph' | 'stat' | 'table' | 'heatmap' | 'logs' | 'alert-list';
  position: { x: number; y: number; width: number; height: number };
  targets: PanelTarget[];
  options: { [key: string]: any };
  thresholds?: PanelThreshold[];
}

export interface PanelTarget {
  metric: string;
  labels?: { [key: string]: string };
  aggregation?: string;
  refId: string;
}

export interface PanelThreshold {
  value: number;
  color: string;
  op: 'gt' | 'lt';
}

export interface DashboardVariable {
  name: string;
  type: 'query' | 'constant' | 'interval' | 'datasource';
  query?: string;
  values: string[];
  current: string;
}

export interface MonitoringReport {
  id: string;
  name: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  metrics: string[];
  alerts: AlertSummary;
  performance: PerformanceSummary;
  availability: AvailabilitySummary;
  generated: number;
  data: any;
}

export interface AlertSummary {
  total: number;
  by_severity: { [key in AlertSeverity]: number };
  by_service: { [key: string]: number };
  mean_resolution_time: number;
  escalated: number;
}

export interface PerformanceSummary {
  response_time: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requests_per_second: number;
    total_requests: number;
  };
  errors: {
    rate: number;
    total: number;
    by_type: { [key: string]: number };
  };
}

export interface AvailabilitySummary {
  uptime_percentage: number;
  downtime_minutes: number;
  incidents: number;
  mttr: number; // mean time to recovery
  mtbf: number; // mean time between failures
}

class MonitoringService {
  private config: MonitoringConfig;
  private metrics: Map<string, Metric[]> = new Map();
  private logs: LogEntry[] = [];
  private events: Event[] = [];
  private alerts: Map<string, Alert> = new Map();
  private dashboards: Map<string, Dashboard> = new Map();
  private channels: Map<string, AlertChannel> = new Map();
  private policies: Map<string, EscalationPolicy> = new Map();
  private isInitialized = false;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      environment: 'development',
      region: 'qatar',
      retention: {
        metrics: 30,
        logs: 7,
        events: 14
      },
      sampling: {
        metrics: 30,
        logs: 100,
        traces: 10
      },
      alerting: {
        enabled: true,
        channels: [],
        escalation: []
      },
      storage: {
        provider: 'prometheus',
        endpoint: 'http://localhost:9090'
      },
      ...config
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Setup default alert channels
      await this.initializeAlertChannels();
      
      // Create default alerts
      await this.createDefaultAlerts();
      
      // Setup default dashboards
      await this.createDefaultDashboards();
      
      // Start monitoring loops
      this.startMonitoring();
      
      this.isInitialized = true;
      
      this.logEvent('monitoring_service_initialized', {
        environment: this.config.environment,
        region: this.config.region
      });
      
    } catch (error) {
      console.error('Failed to initialize Monitoring service:', error);
      throw error;
    }
  }

  private async initializeAlertChannels(): Promise<void> {
    // Email channel
    const emailChannel: AlertChannel = {
      id: this.generateId(),
      name: 'Email Alerts',
      type: 'email',
      config: {
        recipients: ['admin@rental-solutions.com', 'ops@rental-solutions.com']
      },
      enabled: true
    };
    this.channels.set(emailChannel.id, emailChannel);

    // Slack channel
    const slackChannel: AlertChannel = {
      id: this.generateId(),
      name: 'Slack Alerts',
      type: 'slack',
      config: {
        webhook_url: 'https://hooks.slack.com/services/...',
        recipients: ['#alerts', '#ops']
      },
      enabled: true
    };
    this.channels.set(slackChannel.id, slackChannel);

    // Create escalation policy
    const policy: EscalationPolicy = {
      id: this.generateId(),
      name: 'Default Escalation',
      enabled: true,
      rules: [
        {
          delay: 0,
          channels: [emailChannel.id],
          severity: ['medium', 'high', 'critical']
        },
        {
          delay: 15,
          channels: [slackChannel.id],
          severity: ['high', 'critical']
        },
        {
          delay: 30,
          channels: [emailChannel.id, slackChannel.id],
          severity: ['critical']
        }
      ]
    };
    this.policies.set(policy.id, policy);
  }

  private async createDefaultAlerts(): Promise<void> {
    const defaultAlerts: Omit<Alert, 'id' | 'created' | 'updated' | 'notification_count' | 'last_notification'>[] = [
      {
        name: 'High CPU Usage',
        description: 'CPU usage is above threshold',
        severity: 'high',
        status: 'active',
        condition: {
          metric: 'cpu_usage_percent',
          operator: 'gt',
          value: 80,
          aggregation: 'avg',
          window: 300,
          labels: { service: 'rental-solutions' }
        },
        threshold: 80,
        duration: 300,
        labels: { service: 'rental-solutions', category: 'resource' },
        annotations: { 
          runbook: 'https://docs.rental-solutions.com/runbooks/high-cpu',
          summary: 'CPU usage is above 80% for 5 minutes'
        }
      },
      {
        name: 'High Memory Usage',
        description: 'Memory usage is above threshold',
        severity: 'high',
        status: 'active',
        condition: {
          metric: 'memory_usage_percent',
          operator: 'gt',
          value: 85,
          aggregation: 'avg',
          window: 300
        },
        threshold: 85,
        duration: 300,
        labels: { service: 'rental-solutions', category: 'resource' },
        annotations: { 
          runbook: 'https://docs.rental-solutions.com/runbooks/high-memory',
          summary: 'Memory usage is above 85% for 5 minutes'
        }
      },
      {
        name: 'High Error Rate',
        description: 'Application error rate is above threshold',
        severity: 'critical',
        status: 'active',
        condition: {
          metric: 'error_rate_percent',
          operator: 'gt',
          value: 5,
          aggregation: 'avg',
          window: 60
        },
        threshold: 5,
        duration: 60,
        labels: { service: 'rental-solutions', category: 'application' },
        annotations: { 
          runbook: 'https://docs.rental-solutions.com/runbooks/high-errors',
          summary: 'Error rate is above 5% for 1 minute'
        }
      },
      {
        name: 'Slow Response Time',
        description: 'Response time is above threshold',
        severity: 'medium',
        status: 'active',
        condition: {
          metric: 'response_time_ms',
          operator: 'gt',
          value: 1000,
          aggregation: 'avg',
          window: 180
        },
        threshold: 1000,
        duration: 180,
        labels: { service: 'rental-solutions', category: 'performance' },
        annotations: { 
          runbook: 'https://docs.rental-solutions.com/runbooks/slow-response',
          summary: 'Response time is above 1000ms for 3 minutes'
        }
      },
      {
        name: 'Service Down',
        description: 'Service health check is failing',
        severity: 'critical',
        status: 'active',
        condition: {
          metric: 'service_up',
          operator: 'lt',
          value: 1,
          aggregation: 'min',
          window: 60
        },
        threshold: 1,
        duration: 60,
        labels: { service: 'rental-solutions', category: 'availability' },
        annotations: { 
          runbook: 'https://docs.rental-solutions.com/runbooks/service-down',
          summary: 'Service is not responding to health checks'
        }
      }
    ];

    defaultAlerts.forEach(alertData => {
      const alert: Alert = {
        id: this.generateId(),
        created: Date.now(),
        updated: Date.now(),
        notification_count: 0,
        last_notification: 0,
        ...alertData
      };
      this.alerts.set(alert.id, alert);
    });
  }

  private async createDefaultDashboards(): Promise<void> {
    // System Overview Dashboard
    const systemDashboard: Dashboard = {
      id: this.generateId(),
      name: 'System Overview',
      description: 'Overview of system health and performance',
      tags: ['system', 'overview'],
      created: Date.now(),
      updated: Date.now(),
      created_by: 'system',
      shared: true,
      variables: [
        {
          name: 'service',
          type: 'query',
          query: 'label_values(service)',
          values: ['rental-solutions', 'database', 'cache'],
          current: 'rental-solutions'
        }
      ],
      panels: [
        {
          id: this.generateId(),
          title: 'CPU Usage',
          type: 'graph',
          position: { x: 0, y: 0, width: 12, height: 8 },
          targets: [
            { metric: 'cpu_usage_percent', refId: 'A', labels: { service: '$service' } }
          ],
          options: { yAxis: { unit: 'percent', max: 100 } },
          thresholds: [
            { value: 80, color: 'orange', op: 'gt' },
            { value: 90, color: 'red', op: 'gt' }
          ]
        },
        {
          id: this.generateId(),
          title: 'Memory Usage',
          type: 'graph',
          position: { x: 12, y: 0, width: 12, height: 8 },
          targets: [
            { metric: 'memory_usage_percent', refId: 'A', labels: { service: '$service' } }
          ],
          options: { yAxis: { unit: 'percent', max: 100 } },
          thresholds: [
            { value: 85, color: 'orange', op: 'gt' },
            { value: 95, color: 'red', op: 'gt' }
          ]
        },
        {
          id: this.generateId(),
          title: 'Request Rate',
          type: 'graph',
          position: { x: 0, y: 8, width: 12, height: 8 },
          targets: [
            { metric: 'request_rate', refId: 'A', labels: { service: '$service' } }
          ],
          options: { yAxis: { unit: 'reqps' } }
        },
        {
          id: this.generateId(),
          title: 'Response Time',
          type: 'graph',
          position: { x: 12, y: 8, width: 12, height: 8 },
          targets: [
            { metric: 'response_time_ms', refId: 'A', labels: { service: '$service' } }
          ],
          options: { yAxis: { unit: 'ms' } },
          thresholds: [
            { value: 500, color: 'orange', op: 'gt' },
            { value: 1000, color: 'red', op: 'gt' }
          ]
        }
      ]
    };

    this.dashboards.set(systemDashboard.id, systemDashboard);

    // Application Dashboard
    const appDashboard: Dashboard = {
      id: this.generateId(),
      name: 'Application Metrics',
      description: 'Application-specific metrics and performance',
      tags: ['application', 'performance'],
      created: Date.now(),
      updated: Date.now(),
      created_by: 'system',
      shared: true,
      variables: [],
      panels: [
        {
          id: this.generateId(),
          title: 'Error Rate',
          type: 'stat',
          position: { x: 0, y: 0, width: 6, height: 4 },
          targets: [
            { metric: 'error_rate_percent', refId: 'A' }
          ],
          options: { unit: 'percent' },
          thresholds: [
            { value: 1, color: 'green', op: 'lt' },
            { value: 5, color: 'orange', op: 'lt' },
            { value: 5, color: 'red', op: 'gt' }
          ]
        },
        {
          id: this.generateId(),
          title: 'Active Users',
          type: 'stat',
          position: { x: 6, y: 0, width: 6, height: 4 },
          targets: [
            { metric: 'active_users', refId: 'A' }
          ],
          options: { unit: 'short' }
        },
        {
          id: this.generateId(),
          title: 'Database Connections',
          type: 'graph',
          position: { x: 0, y: 4, width: 12, height: 6 },
          targets: [
            { metric: 'db_connections_active', refId: 'A' },
            { metric: 'db_connections_idle', refId: 'B' }
          ],
          options: { yAxis: { unit: 'short' } }
        },
        {
          id: this.generateId(),
          title: 'Cache Hit Rate',
          type: 'graph',
          position: { x: 12, y: 4, width: 12, height: 6 },
          targets: [
            { metric: 'cache_hit_rate_percent', refId: 'A' }
          ],
          options: { yAxis: { unit: 'percent', max: 100 } }
        }
      ]
    };

    this.dashboards.set(appDashboard.id, appDashboard);
  }

  private startMonitoring(): void {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics();
    }, this.config.sampling.metrics * 1000);

    // Evaluate alerts every minute
    setInterval(() => {
      this.evaluateAlerts();
    }, 60000);

    // Cleanup old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 3600000);

    // Generate hourly reports
    setInterval(() => {
      this.generateHourlyReport();
    }, 3600000);
  }

  private collectMetrics(): void {
    const timestamp = Date.now();

    // System metrics
    const systemMetrics: Metric[] = [
      {
        name: 'cpu_usage_percent',
        value: Math.random() * 100,
        unit: 'percent',
        timestamp,
        labels: { service: 'rental-solutions', node: 'node-1' },
        source: 'system',
        type: 'gauge'
      },
      {
        name: 'memory_usage_percent',
        value: Math.random() * 100,
        unit: 'percent',
        timestamp,
        labels: { service: 'rental-solutions', node: 'node-1' },
        source: 'system',
        type: 'gauge'
      },
      {
        name: 'disk_usage_percent',
        value: Math.random() * 100,
        unit: 'percent',
        timestamp,
        labels: { service: 'rental-solutions', node: 'node-1' },
        source: 'system',
        type: 'gauge'
      }
    ];

    // Application metrics
    const appMetrics: Metric[] = [
      {
        name: 'request_rate',
        value: Math.random() * 1000,
        unit: 'reqps',
        timestamp,
        labels: { service: 'rental-solutions', endpoint: '/api' },
        source: 'application',
        type: 'gauge'
      },
      {
        name: 'response_time_ms',
        value: Math.random() * 2000,
        unit: 'ms',
        timestamp,
        labels: { service: 'rental-solutions', endpoint: '/api' },
        source: 'application',
        type: 'histogram'
      },
      {
        name: 'error_rate_percent',
        value: Math.random() * 10,
        unit: 'percent',
        timestamp,
        labels: { service: 'rental-solutions', status: 'error' },
        source: 'application',
        type: 'gauge'
      },
      {
        name: 'active_users',
        value: Math.floor(Math.random() * 1000),
        unit: 'count',
        timestamp,
        labels: { service: 'rental-solutions' },
        source: 'application',
        type: 'gauge'
      }
    ];

    // Store metrics
    [...systemMetrics, ...appMetrics].forEach(metric => {
      const key = `${metric.name}_${JSON.stringify(metric.labels)}`;
      if (!this.metrics.has(key)) {
        this.metrics.set(key, []);
      }
      this.metrics.get(key)!.push(metric);
    });

    // Report to performance analytics
    [...systemMetrics, ...appMetrics].forEach(metric => {
      performanceAnalytics.recordMetric({
        name: `Monitoring ${metric.name}`,
        value: metric.value,
        unit: metric.unit,
        category: 'monitoring',
        tags: metric.labels
      });
    });
  }

  private evaluateAlerts(): void {
    this.alerts.forEach(alert => {
      if (alert.status === 'silenced') return;

      const metrics = this.getMetricsForAlert(alert);
      const isTriggered = this.evaluateAlertCondition(alert, metrics);

      if (isTriggered && !['firing', 'pending'].includes(alert.status)) {
        alert.status = 'pending';
        alert.triggered_at = Date.now();
        alert.updated = Date.now();

        // Check if alert should fire (duration threshold met)
        setTimeout(() => {
          if (alert.status === 'pending') {
            alert.status = 'firing';
            this.sendAlert(alert);
          }
        }, alert.duration * 1000);

      } else if (!isTriggered && ['firing', 'pending'].includes(alert.status)) {
        alert.status = 'resolved';
        alert.resolved_at = Date.now();
        alert.updated = Date.now();
        this.sendAlert(alert);
      }
    });
  }

  private getMetricsForAlert(alert: Alert): Metric[] {
    const key = `${alert.condition.metric}_${JSON.stringify(alert.condition.labels || {})}`;
    const metrics = this.metrics.get(key) || [];
    const since = Date.now() - (alert.condition.window * 1000);
    
    return metrics.filter(m => m.timestamp > since);
  }

  private evaluateAlertCondition(alert: Alert, metrics: Metric[]): boolean {
    if (metrics.length === 0) return false;

    let value: number;
    switch (alert.condition.aggregation) {
      case 'avg':
        value = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
        break;
      case 'sum':
        value = metrics.reduce((sum, m) => sum + m.value, 0);
        break;
      case 'min':
        value = Math.min(...metrics.map(m => m.value));
        break;
      case 'max':
        value = Math.max(...metrics.map(m => m.value));
        break;
      case 'count':
        value = metrics.length;
        break;
      default:
        value = metrics[metrics.length - 1]?.value || 0;
    }

    switch (alert.condition.operator) {
      case 'gt': return value > alert.condition.value;
      case 'gte': return value >= alert.condition.value;
      case 'lt': return value < alert.condition.value;
      case 'lte': return value <= alert.condition.value;
      case 'eq': return value === alert.condition.value;
      case 'ne': return value !== alert.condition.value;
      default: return false;
    }
  }

  private sendAlert(alert: Alert): void {
    alert.notification_count++;
    alert.last_notification = Date.now();

    this.logEvent('alert_triggered', {
      alertId: alert.id,
      name: alert.name,
      severity: alert.severity,
      status: alert.status
    });

    // Find applicable escalation policies
    this.policies.forEach(policy => {
      if (!policy.enabled) return;

      policy.rules.forEach(rule => {
        if (rule.severity.includes(alert.severity)) {
          setTimeout(() => {
            this.sendNotification(alert, rule.channels);
          }, rule.delay * 60000);
        }
      });
    });

    console.log(`Alert ${alert.status}: ${alert.name} - ${alert.description}`);
  }

  private sendNotification(alert: Alert, channelIds: string[]): void {
    channelIds.forEach(channelId => {
      const channel = this.channels.get(channelId);
      if (!channel || !channel.enabled) return;

      const message = this.formatAlertMessage(alert);

      switch (channel.type) {
        case 'email':
          this.sendEmailNotification(channel, alert, message);
          break;
        case 'slack':
          this.sendSlackNotification(channel, alert, message);
          break;
        case 'webhook':
          this.sendWebhookNotification(channel, alert, message);
          break;
        default:
          console.log(`Notification sent via ${channel.type}: ${message}`);
      }
    });
  }

  private formatAlertMessage(alert: Alert): string {
    const status = alert.status.toUpperCase();
    const severity = alert.severity.toUpperCase();
    return `[${status}] ${severity}: ${alert.name} - ${alert.description}`;
  }

  private sendEmailNotification(channel: AlertChannel, alert: Alert, message: string): void {
    // Simulate email sending
    console.log(`Email notification sent to ${channel.config.recipients}: ${message}`);
  }

  private sendSlackNotification(channel: AlertChannel, alert: Alert, message: string): void {
    // Simulate Slack webhook
    console.log(`Slack notification sent to ${channel.config.recipients}: ${message}`);
  }

  private sendWebhookNotification(channel: AlertChannel, alert: Alert, message: string): void {
    // Simulate webhook call
    console.log(`Webhook notification sent to ${channel.config.webhook_url}: ${message}`);
  }

  private cleanupOldData(): void {
    const now = Date.now();
    
    // Cleanup metrics
    const metricRetention = this.config.retention.metrics * 24 * 60 * 60 * 1000;
    this.metrics.forEach((metrics, key) => {
      this.metrics.set(key, metrics.filter(m => m.timestamp > now - metricRetention));
    });

    // Cleanup logs
    const logRetention = this.config.retention.logs * 24 * 60 * 60 * 1000;
    this.logs = this.logs.filter(log => log.timestamp > now - logRetention);

    // Cleanup events
    const eventRetention = this.config.retention.events * 24 * 60 * 60 * 1000;
    this.events = this.events.filter(event => event.timestamp > now - eventRetention);
  }

  private generateHourlyReport(): void {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);

    const recentAlerts = Array.from(this.alerts.values()).filter(
      alert => alert.triggered_at && alert.triggered_at > hourAgo
    );

    const report: MonitoringReport = {
      id: this.generateId(),
      name: 'Hourly System Report',
      period: 'hourly',
      metrics: ['cpu_usage_percent', 'memory_usage_percent', 'response_time_ms'],
      generated: now,
      alerts: {
        total: recentAlerts.length,
        by_severity: {
          low: recentAlerts.filter(a => a.severity === 'low').length,
          medium: recentAlerts.filter(a => a.severity === 'medium').length,
          high: recentAlerts.filter(a => a.severity === 'high').length,
          critical: recentAlerts.filter(a => a.severity === 'critical').length
        },
        by_service: {},
        mean_resolution_time: 0,
        escalated: 0
      },
      performance: {
        response_time: { avg: 0, p50: 0, p95: 0, p99: 0 },
        throughput: { requests_per_second: 0, total_requests: 0 },
        errors: { rate: 0, total: 0, by_type: {} }
      },
      availability: {
        uptime_percentage: 99.9,
        downtime_minutes: 0,
        incidents: 0,
        mttr: 0,
        mtbf: 0
      },
      data: {}
    };

    this.logEvent('hourly_report_generated', {
      reportId: report.id,
      alertCount: report.alerts.total,
      period: 'hourly'
    });
  }

  // Public API methods
  async recordMetric(metric: Omit<Metric, 'timestamp'>): Promise<void> {
    const fullMetric: Metric = {
      ...metric,
      timestamp: Date.now()
    };

    const key = `${metric.name}_${JSON.stringify(metric.labels)}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(fullMetric);
  }

  async recordLog(log: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullLog: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...log
    };

    this.logs.push(fullLog);

    // Auto-create alert for high-severity logs
    if (log.level === 'error' || log.level === 'fatal') {
      this.recordEvent({
        type: 'application_error',
        source: log.source,
        severity: log.level === 'fatal' ? 'critical' : 'high',
        title: `${log.level.toUpperCase()}: ${log.message}`,
        description: log.message,
        metadata: log.metadata
      });
    }
  }

  async recordEvent(event: Omit<Event, 'id' | 'timestamp' | 'resolved' | 'resolved_at'>): Promise<void> {
    const fullEvent: Event = {
      id: this.generateId(),
      timestamp: Date.now(),
      resolved: false,
      ...event
    };

    this.events.push(fullEvent);

    this.logEvent('event_recorded', {
      eventId: fullEvent.id,
      type: fullEvent.type,
      severity: fullEvent.severity
    });
  }

  async createAlert(alertConfig: Omit<Alert, 'id' | 'created' | 'updated' | 'notification_count' | 'last_notification'>): Promise<string> {
    const alert: Alert = {
      id: this.generateId(),
      created: Date.now(),
      updated: Date.now(),
      notification_count: 0,
      last_notification: 0,
      ...alertConfig
    };

    this.alerts.set(alert.id, alert);

    this.logEvent('alert_created', {
      alertId: alert.id,
      name: alert.name,
      severity: alert.severity
    });

    return alert.id;
  }

  async silenceAlert(alertId: string, duration: number): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) throw new Error(`Alert ${alertId} not found`);

    alert.status = 'silenced';
    alert.updated = Date.now();

    setTimeout(() => {
      if (alert.status === 'silenced') {
        alert.status = 'active';
        alert.updated = Date.now();
      }
    }, duration * 1000);

    this.logEvent('alert_silenced', {
      alertId,
      duration
    });
  }

  // Getter methods
  getMetrics(name?: string, labels?: { [key: string]: string }, duration?: number): Metric[] {
    let allMetrics: Metric[] = [];
    
    this.metrics.forEach(metrics => {
      allMetrics.push(...metrics);
    });

    if (name) {
      allMetrics = allMetrics.filter(m => m.name === name);
    }

    if (labels) {
      allMetrics = allMetrics.filter(m => {
        return Object.entries(labels).every(([key, value]) => m.labels[key] === value);
      });
    }

    if (duration) {
      const since = Date.now() - (duration * 1000);
      allMetrics = allMetrics.filter(m => m.timestamp > since);
    }

    return allMetrics.sort((a, b) => a.timestamp - b.timestamp);
  }

  getLogs(level?: string, source?: string, duration?: number): LogEntry[] {
    let logs = [...this.logs];

    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    if (source) {
      logs = logs.filter(log => log.source === source);
    }

    if (duration) {
      const since = Date.now() - (duration * 1000);
      logs = logs.filter(log => log.timestamp > since);
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  getEvents(type?: string, severity?: string, duration?: number): Event[] {
    let events = [...this.events];

    if (type) {
      events = events.filter(event => event.type === type);
    }

    if (severity) {
      events = events.filter(event => event.severity === severity);
    }

    if (duration) {
      const since = Date.now() - (duration * 1000);
      events = events.filter(event => event.timestamp > since);
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  getAlerts(status?: AlertStatus): Alert[] {
    const alerts = Array.from(this.alerts.values());
    return status ? alerts.filter(alert => alert.status === status) : alerts;
  }

  getDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }

  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'down';
    metrics: { [key: string]: number };
    alerts: { firing: number; total: number };
    uptime: number;
  } {
    const firingAlerts = this.getAlerts('firing');
    const criticalAlerts = firingAlerts.filter(a => a.severity === 'critical');
    
    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (criticalAlerts.length > 0) {
      status = 'down';
    } else if (firingAlerts.length > 0) {
      status = 'degraded';
    }

    const recentMetrics = this.getMetrics(undefined, undefined, 300); // Last 5 minutes
    const metrics: { [key: string]: number } = {};
    
    ['cpu_usage_percent', 'memory_usage_percent', 'response_time_ms', 'error_rate_percent'].forEach(metricName => {
      const metricData = recentMetrics.filter(m => m.name === metricName);
      if (metricData.length > 0) {
        metrics[metricName] = metricData.reduce((sum, m) => sum + m.value, 0) / metricData.length;
      }
    });

    return {
      status,
      metrics,
      alerts: {
        firing: firingAlerts.length,
        total: this.alerts.size
      },
      uptime: 99.9 // Would be calculated from actual uptime data
    };
  }

  private logEvent(event: string, data?: any): void {
    console.log(`Monitoring Event: ${event}`, data);
    
    performanceAnalytics.recordMetric({
      name: `Monitoring ${event}`,
      value: 1,
      unit: 'count',
      category: 'monitoring',
      tags: data
    });
  }

  private generateId(): string {
    return `mon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  destroy(): void {
    this.metrics.clear();
    this.logs = [];
    this.events = [];
    this.alerts.clear();
    this.dashboards.clear();
    this.channels.clear();
    this.policies.clear();
  }
}

// Create singleton instance
export const monitoringService = new MonitoringService();

// Convenience functions
export const recordMetric = (metric: any) => monitoringService.recordMetric(metric);
export const recordLog = (log: any) => monitoringService.recordLog(log);
export const recordEvent = (event: any) => monitoringService.recordEvent(event);
export const createAlert = (config: any) => monitoringService.createAlert(config);
export const getSystemHealth = () => monitoringService.getSystemHealth();
export const getMetrics = (name?: string, labels?: any, duration?: number) => monitoringService.getMetrics(name, labels, duration);
export const getAlerts = (status?: any) => monitoringService.getAlerts(status);
