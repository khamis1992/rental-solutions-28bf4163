import { performanceAnalytics } from './performance-analytics';
import { aiAnalytics } from './ai-analytics';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'user_behavior' | 'business' | 'ai_insights' | 'comprehensive';
  sections: ReportSection[];
  schedule?: ReportSchedule;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  recipients?: string[];
  isActive: boolean;
  createdAt: number;
  lastGenerated?: number;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'chart' | 'table' | 'metrics' | 'insights' | 'text';
  dataSource: string;
  config: any;
  order: number;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  timezone: string;
  isActive: boolean;
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  title: string;
  generatedAt: number;
  format: string;
  size: number;
  downloadUrl?: string;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
  metadata: {
    dateRange: { start: number; end: number };
    dataPoints: number;
    sections: number;
  };
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  dateRange: { start: number; end: number };
  includeCharts: boolean;
  includeRawData: boolean;
  compression: boolean;
  password?: string;
}

class AdvancedReportingService {
  private templates: ReportTemplate[] = [];
  private generatedReports: GeneratedReport[] = [];
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.startScheduler();
  }

  private initializeDefaultTemplates(): void {
    // Performance Report Template
    this.templates.push({
      id: 'perf-daily',
      name: 'Daily Performance Report',
      description: 'Comprehensive daily performance metrics and trends',
      type: 'performance',
      format: 'pdf',
      isActive: true,
      createdAt: Date.now(),
      sections: [
        {
          id: 'perf-overview',
          title: 'Performance Overview',
          type: 'metrics',
          dataSource: 'performance_metrics',
          config: {
            metrics: ['Page Load Time', 'Memory Usage', 'API Call Duration', 'Error Rate'],
            timeRange: '24h'
          },
          order: 1
        },
        {
          id: 'perf-trends',
          title: 'Performance Trends',
          type: 'chart',
          dataSource: 'performance_metrics',
          config: {
            chartType: 'line',
            metrics: ['Page Load Time', 'First Contentful Paint'],
            timeRange: '7d'
          },
          order: 2
        },
        {
          id: 'perf-alerts',
          title: 'Performance Alerts',
          type: 'table',
          dataSource: 'performance_alerts',
          config: {
            columns: ['timestamp', 'metric', 'severity', 'message'],
            timeRange: '24h'
          },
          order: 3
        }
      ],
      schedule: {
        frequency: 'daily',
        time: '09:00',
        timezone: 'Asia/Qatar',
        isActive: true
      }
    });

    // User Behavior Report Template
    this.templates.push({
      id: 'user-weekly',
      name: 'Weekly User Behavior Report',
      description: 'User engagement and behavior analysis',
      type: 'user_behavior',
      format: 'pdf',
      isActive: true,
      createdAt: Date.now(),
      sections: [
        {
          id: 'user-overview',
          title: 'User Activity Overview',
          type: 'metrics',
          dataSource: 'user_actions',
          config: {
            metrics: ['Total Sessions', 'Average Session Duration', 'Mobile Users %'],
            timeRange: '7d'
          },
          order: 1
        },
        {
          id: 'user-engagement',
          title: 'User Engagement Trends',
          type: 'chart',
          dataSource: 'user_actions',
          config: {
            chartType: 'area',
            metrics: ['User Actions', 'Session Duration'],
            timeRange: '7d'
          },
          order: 2
        },
        {
          id: 'user-flows',
          title: 'Popular User Flows',
          type: 'table',
          dataSource: 'user_flows',
          config: {
            columns: ['flow', 'users', 'completion_rate', 'avg_duration'],
            limit: 10
          },
          order: 3
        }
      ],
      schedule: {
        frequency: 'weekly',
        time: '10:00',
        dayOfWeek: 1, // Monday
        timezone: 'Asia/Qatar',
        isActive: true
      }
    });

    // AI Insights Report Template
    this.templates.push({
      id: 'ai-insights',
      name: 'AI Insights Report',
      description: 'AI-powered insights and recommendations',
      type: 'ai_insights',
      format: 'pdf',
      isActive: true,
      createdAt: Date.now(),
      sections: [
        {
          id: 'ai-health',
          title: 'System Health Score',
          type: 'metrics',
          dataSource: 'ai_health',
          config: {
            includeCategories: true,
            timeRange: '24h'
          },
          order: 1
        },
        {
          id: 'ai-insights',
          title: 'Key Insights',
          type: 'insights',
          dataSource: 'ai_insights',
          config: {
            maxInsights: 10,
            minConfidence: 70,
            timeRange: '7d'
          },
          order: 2
        },
        {
          id: 'ai-predictions',
          title: 'Predictions',
          type: 'table',
          dataSource: 'ai_predictions',
          config: {
            columns: ['metric', 'predicted_value', 'confidence', 'trend'],
            minConfidence: 60
          },
          order: 3
        },
        {
          id: 'ai-anomalies',
          title: 'Detected Anomalies',
          type: 'table',
          dataSource: 'ai_anomalies',
          config: {
            columns: ['metric', 'severity', 'deviation', 'timestamp'],
            timeRange: '7d'
          },
          order: 4
        }
      ]
    });

    // Comprehensive Business Report
    this.templates.push({
      id: 'business-monthly',
      name: 'Monthly Business Report',
      description: 'Comprehensive business performance and insights',
      type: 'comprehensive',
      format: 'pdf',
      isActive: true,
      createdAt: Date.now(),
      sections: [
        {
          id: 'exec-summary',
          title: 'Executive Summary',
          type: 'text',
          dataSource: 'executive_summary',
          config: {
            includeKPIs: true,
            includeRecommendations: true
          },
          order: 1
        },
        {
          id: 'business-metrics',
          title: 'Key Business Metrics',
          type: 'metrics',
          dataSource: 'business_metrics',
          config: {
            metrics: ['User Growth', 'Engagement Rate', 'Performance Score', 'Error Rate'],
            timeRange: '30d',
            comparison: 'previous_period'
          },
          order: 2
        },
        {
          id: 'performance-analysis',
          title: 'Performance Analysis',
          type: 'chart',
          dataSource: 'performance_metrics',
          config: {
            chartType: 'combined',
            timeRange: '30d'
          },
          order: 3
        },
        {
          id: 'user-insights',
          title: 'User Behavior Insights',
          type: 'insights',
          dataSource: 'user_behavior',
          config: {
            timeRange: '30d'
          },
          order: 4
        },
        {
          id: 'ai-recommendations',
          title: 'AI Recommendations',
          type: 'insights',
          dataSource: 'ai_insights',
          config: {
            type: 'recommendation',
            minImpact: 'medium',
            timeRange: '30d'
          },
          order: 5
        }
      ],
      schedule: {
        frequency: 'monthly',
        time: '08:00',
        dayOfMonth: 1,
        timezone: 'Asia/Qatar',
        isActive: true
      }
    });
  }

  private startScheduler(): void {
    // Check for scheduled reports every minute
    setInterval(() => {
      this.checkScheduledReports();
    }, 60000);
  }

  private checkScheduledReports(): void {
    const now = new Date();
    
    this.templates.forEach(template => {
      if (!template.schedule?.isActive || !template.isActive) return;
      
      const shouldGenerate = this.shouldGenerateReport(template, now);
      if (shouldGenerate) {
        this.generateReport(template.id, {
          format: template.format,
          dateRange: this.getDefaultDateRange(template.schedule!.frequency),
          includeCharts: true,
          includeRawData: false,
          compression: true
        });
      }
    });
  }

  private shouldGenerateReport(template: ReportTemplate, now: Date): boolean {
    const schedule = template.schedule!;
    const [hour, minute] = schedule.time.split(':').map(Number);
    
    // Check if it's the right time
    if (now.getHours() !== hour || now.getMinutes() !== minute) {
      return false;
    }
    
    // Check if already generated today/this period
    const lastGenerated = template.lastGenerated;
    if (lastGenerated) {
      const lastDate = new Date(lastGenerated);
      const timeDiff = now.getTime() - lastDate.getTime();
      
      switch (schedule.frequency) {
        case 'daily':
          if (timeDiff < 23 * 60 * 60 * 1000) return false; // Less than 23 hours
          break;
        case 'weekly':
          if (now.getDay() !== schedule.dayOfWeek) return false;
          if (timeDiff < 6 * 24 * 60 * 60 * 1000) return false; // Less than 6 days
          break;
        case 'monthly':
          if (now.getDate() !== schedule.dayOfMonth) return false;
          if (timeDiff < 25 * 24 * 60 * 60 * 1000) return false; // Less than 25 days
          break;
        case 'quarterly':
          // Quarterly logic would be more complex
          break;
      }
    }
    
    return true;
  }

  private getDefaultDateRange(frequency: string): { start: number; end: number } {
    const now = Date.now();
    let start: number;
    
    switch (frequency) {
      case 'daily':
        start = now - 24 * 60 * 60 * 1000; // Last 24 hours
        break;
      case 'weekly':
        start = now - 7 * 24 * 60 * 60 * 1000; // Last 7 days
        break;
      case 'monthly':
        start = now - 30 * 24 * 60 * 60 * 1000; // Last 30 days
        break;
      case 'quarterly':
        start = now - 90 * 24 * 60 * 60 * 1000; // Last 90 days
        break;
      default:
        start = now - 24 * 60 * 60 * 1000;
    }
    
    return { start, end: now };
  }

  // Public API methods
  async generateReport(templateId: string, options: ExportOptions): Promise<GeneratedReport> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const reportId = this.generateId();
    const report: GeneratedReport = {
      id: reportId,
      templateId,
      title: `${template.name} - ${new Date().toLocaleDateString()}`,
      generatedAt: Date.now(),
      format: options.format,
      size: 0,
      status: 'generating',
      metadata: {
        dateRange: options.dateRange,
        dataPoints: 0,
        sections: template.sections.length
      }
    };

    this.generatedReports.push(report);

    try {
      // Collect data for all sections
      const reportData = await this.collectReportData(template, options);
      
      // Generate the report based on format
      const generatedFile = await this.generateReportFile(template, reportData, options);
      
      // Update report status
      report.status = 'completed';
      report.size = generatedFile.size;
      report.downloadUrl = generatedFile.url;
      report.metadata.dataPoints = generatedFile.dataPoints;

      // Update template last generated time
      template.lastGenerated = Date.now();

      // Send to recipients if configured
      if (template.recipients && template.recipients.length > 0) {
        await this.sendReportToRecipients(report, template.recipients);
      }

    } catch (error) {
      report.status = 'failed';
      report.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return report;
  }

  private async collectReportData(template: ReportTemplate, options: ExportOptions): Promise<any> {
    const data: any = {};

    for (const section of template.sections) {
      try {
        data[section.id] = await this.collectSectionData(section, options);
      } catch (error) {
        console.error(`Failed to collect data for section ${section.id}:`, error);
        data[section.id] = { error: 'Data collection failed' };
      }
    }

    return data;
  }

  private async collectSectionData(section: ReportSection, options: ExportOptions): Promise<any> {
    const { start, end } = options.dateRange;
    const timeRange = end - start;

    switch (section.dataSource) {
      case 'performance_metrics':
        return this.getPerformanceData(section.config, timeRange);
      
      case 'user_actions':
        return this.getUserBehaviorData(section.config, timeRange);
      
      case 'ai_insights':
        return this.getAIInsightsData(section.config, timeRange);
      
      case 'ai_health':
        return this.getAIHealthData(section.config);
      
      case 'ai_predictions':
        return this.getAIPredictionsData(section.config);
      
      case 'ai_anomalies':
        return this.getAIAnomaliesData(section.config, timeRange);
      
      case 'performance_alerts':
        return this.getPerformanceAlertsData(section.config, timeRange);
      
      case 'user_flows':
        return this.getUserFlowsData(section.config, timeRange);
      
      case 'business_metrics':
        return this.getBusinessMetricsData(section.config, timeRange);
      
      case 'executive_summary':
        return this.getExecutiveSummaryData(section.config, timeRange);
      
      default:
        return { error: `Unknown data source: ${section.dataSource}` };
    }
  }

  private getPerformanceData(config: any, timeRange: number): any {
    const metrics = performanceAnalytics.getMetrics('performance', timeRange);
    
    if (config.metrics) {
      const filteredMetrics = metrics.filter(m => config.metrics.includes(m.name));
      return this.aggregateMetrics(filteredMetrics);
    }
    
    return this.aggregateMetrics(metrics);
  }

  private getUserBehaviorData(config: any, timeRange: number): any {
    const userActions = performanceAnalytics.getUserActions(timeRange);
    
    return {
      totalSessions: this.calculateUniqueSessions(userActions),
      totalActions: userActions.length,
      averageSessionDuration: this.calculateAverageSessionDuration(userActions),
      mobileUsersPercentage: this.calculateMobileUsersPercentage(userActions),
      successRate: this.calculateSuccessRate(userActions),
      topComponents: this.getTopComponents(userActions)
    };
  }

  private getAIInsightsData(config: any, timeRange: number): any {
    const insights = aiAnalytics.getInsights(config.category, timeRange);
    
    let filtered = insights;
    if (config.minConfidence) {
      filtered = filtered.filter(i => i.confidence >= config.minConfidence);
    }
    if (config.type) {
      filtered = filtered.filter(i => i.type === config.type);
    }
    if (config.minImpact) {
      const impactOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      const minLevel = impactOrder[config.minImpact as keyof typeof impactOrder];
      filtered = filtered.filter(i => impactOrder[i.impact] >= minLevel);
    }
    
    return {
      insights: config.maxInsights ? filtered.slice(0, config.maxInsights) : filtered,
      summary: {
        total: filtered.length,
        byImpact: this.groupInsightsByImpact(filtered),
        byCategory: this.groupInsightsByCategory(filtered)
      }
    };
  }

  private getAIHealthData(config: any): any {
    return aiAnalytics.getSystemHealth();
  }

  private getAIPredictionsData(config: any): any {
    const predictions = aiAnalytics.getPredictions();
    
    let filtered = predictions;
    if (config.minConfidence) {
      filtered = filtered.filter(p => p.confidence >= config.minConfidence);
    }
    
    return {
      predictions: filtered,
      summary: {
        total: filtered.length,
        averageConfidence: filtered.reduce((sum, p) => sum + p.confidence, 0) / filtered.length,
        byTrend: this.groupPredictionsByTrend(filtered)
      }
    };
  }

  private getAIAnomaliesData(config: any, timeRange: number): any {
    const anomalies = aiAnalytics.getAnomalies(timeRange);
    
    return {
      anomalies,
      summary: {
        total: anomalies.length,
        bySeverity: this.groupAnomaliesBySeverity(anomalies),
        byMetric: this.groupAnomaliesByMetric(anomalies)
      }
    };
  }

  private getPerformanceAlertsData(config: any, timeRange: number): any {
    const alerts = performanceAnalytics.getAlerts(config.severity);
    
    return {
      alerts: alerts.filter(a => Date.now() - a.timestamp <= timeRange),
      summary: {
        total: alerts.length,
        bySeverity: this.groupAlertsBySeverity(alerts)
      }
    };
  }

  private getUserFlowsData(config: any, timeRange: number): any {
    // This would require more complex user flow analysis
    // For now, return mock data structure
    return {
      flows: [],
      summary: {
        totalFlows: 0,
        averageCompletionRate: 0
      }
    };
  }

  private getBusinessMetricsData(config: any, timeRange: number): any {
    const insights = performanceAnalytics.getPerformanceInsights();
    
    return {
      userEngagement: insights.userEngagement,
      errorRate: insights.errorRate,
      performanceScore: insights.performanceScore,
      averageLoadTime: insights.averageLoadTime,
      recommendations: insights.recommendations
    };
  }

  private getExecutiveSummaryData(config: any, timeRange: number): any {
    const systemHealth = aiAnalytics.getSystemHealth();
    const performanceInsights = performanceAnalytics.getPerformanceInsights();
    
    return {
      overallHealth: systemHealth.overallScore,
      keyMetrics: {
        performanceScore: performanceInsights.performanceScore,
        userEngagement: performanceInsights.userEngagement,
        errorRate: performanceInsights.errorRate
      },
      topRecommendations: systemHealth.recommendations.slice(0, 5),
      criticalIssues: systemHealth.criticalIssues,
      period: {
        start: Date.now() - timeRange,
        end: Date.now()
      }
    };
  }

  private async generateReportFile(template: ReportTemplate, data: any, options: ExportOptions): Promise<any> {
    // In a real implementation, this would generate actual files
    // For now, return mock file data
    
    const mockSize = Math.floor(Math.random() * 1000000) + 100000; // 100KB - 1MB
    const mockDataPoints = Object.values(data).reduce((sum: number, sectionData: any) => {
      if (Array.isArray(sectionData)) return sum + sectionData.length;
      if (sectionData && typeof sectionData === 'object') {
        return sum + Object.keys(sectionData).length;
      }
      return sum + 1;
    }, 0);

    return {
      size: mockSize,
      url: `/reports/${template.id}_${Date.now()}.${options.format}`,
      dataPoints: mockDataPoints
    };
  }

  private async sendReportToRecipients(report: GeneratedReport, recipients: string[]): Promise<void> {
    // In a real implementation, this would send emails or notifications
    console.log(`Sending report ${report.id} to recipients:`, recipients);
  }

  // Helper methods for data aggregation
  private aggregateMetrics(metrics: any[]): any {
    const grouped = this.groupBy(metrics, 'name');
    const aggregated: any = {};
    
    Object.entries(grouped).forEach(([name, values]: [string, any[]]) => {
      const numericValues = values.map(v => v.value).filter(v => typeof v === 'number');
      aggregated[name] = {
        count: values.length,
        average: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        latest: values[values.length - 1]?.value
      };
    });
    
    return aggregated;
  }

  private calculateUniqueSessions(userActions: any[]): number {
    const uniqueSessions = new Set(userActions.map(a => a.sessionId));
    return uniqueSessions.size;
  }

  private calculateAverageSessionDuration(userActions: any[]): number {
    const sessionDurations = this.groupBy(userActions, 'sessionId');
    const durations = Object.values(sessionDurations).map((actions: any[]) => {
      if (actions.length < 2) return 0;
      const sorted = actions.sort((a, b) => a.timestamp - b.timestamp);
      return sorted[sorted.length - 1].timestamp - sorted[0].timestamp;
    });
    
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  private calculateMobileUsersPercentage(userActions: any[]): number {
    const mobileActions = userActions.filter(a => a.metadata?.isMobile);
    return (mobileActions.length / userActions.length) * 100;
  }

  private calculateSuccessRate(userActions: any[]): number {
    const successfulActions = userActions.filter(a => a.success);
    return (successfulActions.length / userActions.length) * 100;
  }

  private getTopComponents(userActions: any[]): any[] {
    const componentCounts = this.groupBy(userActions, 'component');
    return Object.entries(componentCounts)
      .map(([component, actions]: [string, any[]]) => ({
        component,
        count: actions.length,
        successRate: (actions.filter(a => a.success).length / actions.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private groupInsightsByImpact(insights: any[]): any {
    return this.groupBy(insights, 'impact');
  }

  private groupInsightsByCategory(insights: any[]): any {
    return this.groupBy(insights, 'category');
  }

  private groupPredictionsByTrend(predictions: any[]): any {
    return this.groupBy(predictions, 'trend');
  }

  private groupAnomaliesBySeverity(anomalies: any[]): any {
    return this.groupBy(anomalies, 'severity');
  }

  private groupAnomaliesByMetric(anomalies: any[]): any {
    return this.groupBy(anomalies, 'metric');
  }

  private groupAlertsBySeverity(alerts: any[]): any {
    return this.groupBy(alerts, 'severity');
  }

  private groupBy(array: any[], key: string): any {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  private generateId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getTemplates(): ReportTemplate[] {
    return [...this.templates];
  }

  getTemplate(id: string): ReportTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt'>): ReportTemplate {
    const newTemplate: ReportTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: Date.now()
    };
    
    this.templates.push(newTemplate);
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<ReportTemplate>): ReportTemplate | null {
    const template = this.templates.find(t => t.id === id);
    if (!template) return null;
    
    Object.assign(template, updates);
    return template;
  }

  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    this.templates.splice(index, 1);
    return true;
  }

  getGeneratedReports(templateId?: string): GeneratedReport[] {
    let reports = [...this.generatedReports];
    
    if (templateId) {
      reports = reports.filter(r => r.templateId === templateId);
    }
    
    return reports.sort((a, b) => b.generatedAt - a.generatedAt);
  }

  getReport(id: string): GeneratedReport | undefined {
    return this.generatedReports.find(r => r.id === id);
  }

  async exportData(dataType: string, options: ExportOptions): Promise<GeneratedReport> {
    // Quick export without template
    const reportId = this.generateId();
    const report: GeneratedReport = {
      id: reportId,
      templateId: 'quick-export',
      title: `${dataType} Export - ${new Date().toLocaleDateString()}`,
      generatedAt: Date.now(),
      format: options.format,
      size: 0,
      status: 'generating',
      metadata: {
        dateRange: options.dateRange,
        dataPoints: 0,
        sections: 1
      }
    };

    this.generatedReports.push(report);

    try {
      let data: any;
      const timeRange = options.dateRange.end - options.dateRange.start;

      switch (dataType) {
        case 'performance':
          data = this.getPerformanceData({}, timeRange);
          break;
        case 'user_behavior':
          data = this.getUserBehaviorData({}, timeRange);
          break;
        case 'ai_insights':
          data = this.getAIInsightsData({}, timeRange);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }

      const generatedFile = await this.generateReportFile(
        { id: 'export', name: dataType, sections: [] } as any,
        { [dataType]: data },
        options
      );

      report.status = 'completed';
      report.size = generatedFile.size;
      report.downloadUrl = generatedFile.url;
      report.metadata.dataPoints = generatedFile.dataPoints;

    } catch (error) {
      report.status = 'failed';
      report.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return report;
  }

  // Cleanup
  destroy(): void {
    this.scheduledJobs.forEach(job => clearTimeout(job));
    this.scheduledJobs.clear();
    this.templates = [];
    this.generatedReports = [];
  }
}

// Create singleton instance
export const advancedReporting = new AdvancedReportingService();

// Convenience functions
export const generateReport = (templateId: string, options: ExportOptions) => 
  advancedReporting.generateReport(templateId, options);

export const getReportTemplates = () => advancedReporting.getTemplates();

export const exportData = (dataType: string, options: ExportOptions) => 
  advancedReporting.exportData(dataType, options); 