import { performanceAnalytics, PerformanceMetric, UserAction, ErrorMetric } from './performance-analytics';

export interface AIInsight {
  id: string;
  type: 'prediction' | 'anomaly' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'user_behavior' | 'business' | 'technical';
  data: any;
  timestamp: number;
  actionable: boolean;
  actions?: AIAction[];
}

export interface AIAction {
  id: string;
  title: string;
  description: string;
  type: 'optimize' | 'investigate' | 'monitor' | 'alert';
  priority: 'low' | 'medium' | 'high';
  estimatedImpact: string;
  implementation: string;
}

export interface PredictionModel {
  name: string;
  type: 'performance' | 'user_behavior' | 'business_metrics';
  accuracy: number;
  lastTrained: number;
  predictions: Prediction[];
}

export interface Prediction {
  metric: string;
  timeframe: '1h' | '24h' | '7d' | '30d';
  predictedValue: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
}

export interface AnomalyDetection {
  metric: string;
  timestamp: number;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  possibleCauses: string[];
}

class AIAnalyticsService {
  private insights: AIInsight[] = [];
  private models: PredictionModel[] = [];
  private anomalies: AnomalyDetection[] = [];
  private isAnalyzing: boolean = false;
  private analysisInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeModels();
    this.startContinuousAnalysis();
  }

  private initializeModels(): void {
    // Initialize AI models for different aspects
    this.models = [
      {
        name: 'Performance Predictor',
        type: 'performance',
        accuracy: 85.5,
        lastTrained: Date.now() - 24 * 60 * 60 * 1000, // 24 hours ago
        predictions: []
      },
      {
        name: 'User Behavior Analyzer',
        type: 'user_behavior',
        accuracy: 78.2,
        lastTrained: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
        predictions: []
      },
      {
        name: 'Business Metrics Forecaster',
        type: 'business_metrics',
        accuracy: 82.7,
        lastTrained: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
        predictions: []
      }
    ];
  }

  private startContinuousAnalysis(): void {
    // Run analysis every 5 minutes
    this.analysisInterval = setInterval(() => {
      this.runAIAnalysis();
    }, 5 * 60 * 1000);

    // Run initial analysis
    setTimeout(() => this.runAIAnalysis(), 1000);
  }

  private async runAIAnalysis(): Promise<void> {
    if (this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    
    try {
      // Get recent data
      const metrics = performanceAnalytics.getMetrics(undefined, 60 * 60 * 1000); // Last hour
      const userActions = performanceAnalytics.getUserActions(60 * 60 * 1000);
      const errors = performanceAnalytics.getErrors(60 * 60 * 1000);

      // Run different AI analysis types
      await Promise.all([
        this.detectAnomalies(metrics),
        this.generatePredictions(metrics, userActions),
        this.analyzeUserBehaviorPatterns(userActions),
        this.identifyPerformanceBottlenecks(metrics, errors),
        this.generateBusinessInsights(metrics, userActions, errors)
      ]);

      // Generate actionable recommendations
      this.generateRecommendations();

    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  private async detectAnomalies(metrics: PerformanceMetric[]): Promise<void> {
    const metricGroups = this.groupMetricsByName(metrics);
    
    for (const [metricName, metricData] of metricGroups.entries()) {
      if (metricData.length < 10) continue; // Need enough data points
      
      const values = metricData.map(m => m.value);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
      
      // Check for anomalies (values beyond 2 standard deviations)
      const recentValues = values.slice(-5);
      for (let i = 0; i < recentValues.length; i++) {
        const value = recentValues[i];
        const deviation = Math.abs(value - mean) / stdDev;
        
        if (deviation > 2) {
          const anomaly: AnomalyDetection = {
            metric: metricName,
            timestamp: metricData[metricData.length - 5 + i].timestamp,
            expectedValue: mean,
            actualValue: value,
            deviation,
            severity: deviation > 3 ? 'critical' : deviation > 2.5 ? 'high' : 'medium',
            possibleCauses: this.identifyAnomalyCauses(metricName, value, mean)
          };
          
          this.anomalies.push(anomaly);
          this.createAnomalyInsight(anomaly);
        }
      }
    }
    
    // Keep only recent anomalies
    this.anomalies = this.anomalies.filter(a => Date.now() - a.timestamp < 24 * 60 * 60 * 1000);
  }

  private groupMetricsByName(metrics: PerformanceMetric[]): Map<string, PerformanceMetric[]> {
    const groups = new Map<string, PerformanceMetric[]>();
    
    metrics.forEach(metric => {
      if (!groups.has(metric.name)) {
        groups.set(metric.name, []);
      }
      groups.get(metric.name)!.push(metric);
    });
    
    return groups;
  }

  private identifyAnomalyCauses(metricName: string, actualValue: number, expectedValue: number): string[] {
    const causes: string[] = [];
    const isHigher = actualValue > expectedValue;
    
    switch (metricName) {
      case 'Page Load Time':
        if (isHigher) {
          causes.push('Network congestion', 'Large resource files', 'Server performance issues', 'Database query slowdown');
        } else {
          causes.push('Caching improvements', 'CDN optimization', 'Code optimization');
        }
        break;
      case 'Memory Usage':
        if (isHigher) {
          causes.push('Memory leaks', 'Large data sets', 'Inefficient algorithms', 'Resource not being freed');
        }
        break;
      case 'Error Rate':
        if (isHigher) {
          causes.push('New deployment issues', 'External service failures', 'Data validation problems', 'User input errors');
        }
        break;
      case 'User Action':
        if (isHigher) {
          causes.push('Increased user engagement', 'Marketing campaign', 'New feature adoption');
        } else {
          causes.push('User experience issues', 'Performance problems', 'Feature bugs');
        }
        break;
      default:
        causes.push('Data collection changes', 'System configuration updates', 'External factors');
    }
    
    return causes;
  }

  private createAnomalyInsight(anomaly: AnomalyDetection): void {
    const insight: AIInsight = {
      id: this.generateId(),
      type: 'anomaly',
      title: `Anomaly Detected: ${anomaly.metric}`,
      description: `${anomaly.metric} showed unusual behavior with a ${(anomaly.deviation * 100).toFixed(1)}% deviation from expected values.`,
      confidence: Math.min(95, anomaly.deviation * 30),
      impact: anomaly.severity,
      category: this.categorizeMetric(anomaly.metric),
      data: anomaly,
      timestamp: Date.now(),
      actionable: true,
      actions: this.generateAnomalyActions(anomaly)
    };
    
    this.insights.push(insight);
  }

  private generateAnomalyActions(anomaly: AnomalyDetection): AIAction[] {
    const actions: AIAction[] = [];
    
    actions.push({
      id: this.generateId(),
      title: 'Investigate Root Cause',
      description: `Analyze the underlying causes of the ${anomaly.metric} anomaly`,
      type: 'investigate',
      priority: anomaly.severity === 'critical' ? 'high' : 'medium',
      estimatedImpact: 'Identify and resolve performance issues',
      implementation: 'Review logs, check system resources, analyze user patterns'
    });
    
    if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
      actions.push({
        id: this.generateId(),
        title: 'Set Up Monitoring Alert',
        description: `Create automated alerts for ${anomaly.metric} threshold breaches`,
        type: 'alert',
        priority: 'high',
        estimatedImpact: 'Prevent future issues through early detection',
        implementation: 'Configure monitoring thresholds and notification channels'
      });
    }
    
    return actions;
  }

  private async generatePredictions(metrics: PerformanceMetric[], userActions: UserAction[]): Promise<void> {
    // Simple trend-based predictions (in a real system, this would use ML models)
    const metricGroups = this.groupMetricsByName(metrics);
    
    for (const model of this.models) {
      model.predictions = [];
      
      if (model.type === 'performance') {
        for (const [metricName, metricData] of metricGroups.entries()) {
          if (metricData.length < 5) continue;
          
          const prediction = this.predictMetricTrend(metricName, metricData);
          if (prediction) {
            model.predictions.push(prediction);
            this.createPredictionInsight(prediction, model);
          }
        }
      } else if (model.type === 'user_behavior') {
        const userPrediction = this.predictUserBehavior(userActions);
        if (userPrediction) {
          model.predictions.push(userPrediction);
          this.createPredictionInsight(userPrediction, model);
        }
      }
    }
  }

  private predictMetricTrend(metricName: string, data: PerformanceMetric[]): Prediction | null {
    if (data.length < 5) return null;
    
    const sortedData = data.sort((a, b) => a.timestamp - b.timestamp);
    const values = sortedData.map(d => d.value);
    
    // Simple linear regression for trend prediction
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Predict next value
    const nextValue = slope * n + intercept;
    const currentValue = values[values.length - 1];
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(slope) > currentValue * 0.05) { // 5% change threshold
      trend = slope > 0 ? 'increasing' : 'decreasing';
    }
    
    // Calculate confidence based on data consistency
    const variance = values.reduce((sum, val) => sum + Math.pow(val - sumY/n, 2), 0) / n;
    const confidence = Math.max(50, Math.min(95, 100 - (variance / (sumY/n)) * 100));
    
    return {
      metric: metricName,
      timeframe: '1h',
      predictedValue: Math.max(0, nextValue),
      confidence,
      trend,
      factors: this.identifyTrendFactors(metricName, trend, slope)
    };
  }

  private predictUserBehavior(userActions: UserAction[]): Prediction | null {
    if (userActions.length < 10) return null;
    
    const hourlyActions = this.groupActionsByHour(userActions);
    const avgActionsPerHour = Object.values(hourlyActions).reduce((a, b) => a + b, 0) / Object.keys(hourlyActions).length;
    
    // Predict next hour's activity
    const recentHours = Object.values(hourlyActions).slice(-3);
    const recentAvg = recentHours.reduce((a, b) => a + b, 0) / recentHours.length;
    
    const trend = recentAvg > avgActionsPerHour * 1.1 ? 'increasing' : 
                  recentAvg < avgActionsPerHour * 0.9 ? 'decreasing' : 'stable';
    
    return {
      metric: 'User Activity',
      timeframe: '1h',
      predictedValue: Math.round(recentAvg * 1.1), // Slight increase prediction
      confidence: 75,
      trend,
      factors: ['Historical patterns', 'Recent activity trends', 'Time of day factors']
    };
  }

  private groupActionsByHour(actions: UserAction[]): Record<string, number> {
    const hourlyGroups: Record<string, number> = {};
    
    actions.forEach(action => {
      const hour = new Date(action.timestamp).getHours();
      const key = hour.toString();
      hourlyGroups[key] = (hourlyGroups[key] || 0) + 1;
    });
    
    return hourlyGroups;
  }

  private identifyTrendFactors(metricName: string, trend: string, slope: number): string[] {
    const factors: string[] = [];
    
    switch (metricName) {
      case 'Page Load Time':
        if (trend === 'increasing') {
          factors.push('Increasing data volume', 'Growing user base', 'Resource optimization needed');
        } else if (trend === 'decreasing') {
          factors.push('Performance optimizations', 'Caching improvements', 'Infrastructure upgrades');
        }
        break;
      case 'Memory Usage':
        if (trend === 'increasing') {
          factors.push('Data accumulation', 'Memory leaks', 'Feature complexity growth');
        }
        break;
      case 'User Action':
        if (trend === 'increasing') {
          factors.push('User engagement growth', 'Feature adoption', 'Marketing effectiveness');
        } else if (trend === 'decreasing') {
          factors.push('User experience issues', 'Seasonal patterns', 'Competition impact');
        }
        break;
    }
    
    factors.push('Historical patterns', 'System changes', 'External factors');
    return factors;
  }

  private createPredictionInsight(prediction: Prediction, model: PredictionModel): void {
    if (prediction.confidence < 60) return; // Only create insights for confident predictions
    
    const insight: AIInsight = {
      id: this.generateId(),
      type: 'prediction',
      title: `Prediction: ${prediction.metric} Trend`,
      description: `${prediction.metric} is predicted to ${prediction.trend} with ${prediction.confidence.toFixed(1)}% confidence over the next ${prediction.timeframe}.`,
      confidence: prediction.confidence,
      impact: this.assessPredictionImpact(prediction),
      category: this.categorizeMetric(prediction.metric),
      data: { prediction, model: model.name },
      timestamp: Date.now(),
      actionable: prediction.trend !== 'stable',
      actions: this.generatePredictionActions(prediction)
    };
    
    this.insights.push(insight);
  }

  private assessPredictionImpact(prediction: Prediction): 'low' | 'medium' | 'high' | 'critical' {
    if (prediction.confidence > 85 && prediction.trend !== 'stable') {
      if (prediction.metric.includes('Error') || prediction.metric.includes('Load Time')) {
        return prediction.trend === 'increasing' ? 'high' : 'medium';
      }
      return 'medium';
    }
    return 'low';
  }

  private generatePredictionActions(prediction: Prediction): AIAction[] {
    const actions: AIAction[] = [];
    
    if (prediction.trend === 'increasing' && prediction.metric.includes('Load Time')) {
      actions.push({
        id: this.generateId(),
        title: 'Optimize Performance',
        description: 'Implement performance optimizations to prevent load time increases',
        type: 'optimize',
        priority: 'medium',
        estimatedImpact: 'Maintain or improve user experience',
        implementation: 'Code splitting, lazy loading, caching strategies'
      });
    }
    
    if (prediction.trend === 'decreasing' && prediction.metric.includes('User')) {
      actions.push({
        id: this.generateId(),
        title: 'Investigate User Engagement',
        description: 'Analyze factors causing decreased user activity',
        type: 'investigate',
        priority: 'high',
        estimatedImpact: 'Prevent user churn and improve engagement',
        implementation: 'User feedback analysis, UX improvements, feature usage tracking'
      });
    }
    
    return actions;
  }

  private async analyzeUserBehaviorPatterns(userActions: UserAction[]): Promise<void> {
    // Analyze user behavior patterns
    const patterns = this.identifyBehaviorPatterns(userActions);
    
    patterns.forEach(pattern => {
      const insight: AIInsight = {
        id: this.generateId(),
        type: 'trend',
        title: `User Behavior Pattern: ${pattern.name}`,
        description: pattern.description,
        confidence: pattern.confidence,
        impact: pattern.impact,
        category: 'user_behavior',
        data: pattern,
        timestamp: Date.now(),
        actionable: pattern.actionable,
        actions: pattern.actions
      };
      
      this.insights.push(insight);
    });
  }

  private identifyBehaviorPatterns(userActions: UserAction[]): any[] {
    const patterns: any[] = [];
    
    // Pattern 1: High error rate in specific component
    const componentErrors = this.analyzeComponentErrors(userActions);
    if (componentErrors.errorRate > 10) {
      patterns.push({
        name: 'High Error Rate Component',
        description: `${componentErrors.component} has a ${componentErrors.errorRate.toFixed(1)}% error rate`,
        confidence: 85,
        impact: 'high',
        actionable: true,
        actions: [{
          id: this.generateId(),
          title: 'Fix Component Issues',
          description: `Investigate and fix issues in ${componentErrors.component}`,
          type: 'optimize',
          priority: 'high',
          estimatedImpact: 'Improve user experience and reduce frustration',
          implementation: 'Code review, testing, user feedback analysis'
        }]
      });
    }
    
    // Pattern 2: Mobile vs Desktop usage patterns
    const devicePattern = this.analyzeMobileUsage(userActions);
    if (devicePattern.mobilePercentage > 70) {
      patterns.push({
        name: 'Mobile-First Usage',
        description: `${devicePattern.mobilePercentage.toFixed(1)}% of users are on mobile devices`,
        confidence: 90,
        impact: 'medium',
        actionable: true,
        actions: [{
          id: this.generateId(),
          title: 'Optimize Mobile Experience',
          description: 'Prioritize mobile optimization and features',
          type: 'optimize',
          priority: 'medium',
          estimatedImpact: 'Better mobile user experience',
          implementation: 'Mobile-first design, touch optimization, performance tuning'
        }]
      });
    }
    
    return patterns;
  }

  private analyzeComponentErrors(userActions: UserAction[]): any {
    const componentStats: Record<string, { total: number; errors: number }> = {};
    
    userActions.forEach(action => {
      if (!componentStats[action.component]) {
        componentStats[action.component] = { total: 0, errors: 0 };
      }
      componentStats[action.component].total++;
      if (!action.success) {
        componentStats[action.component].errors++;
      }
    });
    
    let highestErrorRate = 0;
    let problematicComponent = '';
    
    Object.entries(componentStats).forEach(([component, stats]) => {
      if (stats.total > 5) { // Only consider components with enough data
        const errorRate = (stats.errors / stats.total) * 100;
        if (errorRate > highestErrorRate) {
          highestErrorRate = errorRate;
          problematicComponent = component;
        }
      }
    });
    
    return {
      component: problematicComponent,
      errorRate: highestErrorRate
    };
  }

  private analyzeMobileUsage(userActions: UserAction[]): any {
    const mobileActions = userActions.filter(action => action.metadata?.isMobile);
    const mobilePercentage = (mobileActions.length / userActions.length) * 100;
    
    return { mobilePercentage };
  }

  private async identifyPerformanceBottlenecks(metrics: PerformanceMetric[], errors: ErrorMetric[]): Promise<void> {
    // Identify performance bottlenecks
    const bottlenecks = this.findBottlenecks(metrics, errors);
    
    bottlenecks.forEach(bottleneck => {
      const insight: AIInsight = {
        id: this.generateId(),
        type: 'recommendation',
        title: `Performance Bottleneck: ${bottleneck.area}`,
        description: bottleneck.description,
        confidence: bottleneck.confidence,
        impact: bottleneck.impact,
        category: 'performance',
        data: bottleneck,
        timestamp: Date.now(),
        actionable: true,
        actions: bottleneck.actions
      };
      
      this.insights.push(insight);
    });
  }

  private findBottlenecks(metrics: PerformanceMetric[], errors: ErrorMetric[]): any[] {
    const bottlenecks: any[] = [];
    
    // Check for slow API calls
    const apiMetrics = metrics.filter(m => m.name === 'API Call Duration');
    if (apiMetrics.length > 0) {
      const avgDuration = apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length;
      if (avgDuration > 1000) { // > 1 second
        bottlenecks.push({
          area: 'API Performance',
          description: `API calls are averaging ${avgDuration.toFixed(0)}ms, which may impact user experience`,
          confidence: 80,
          impact: 'medium',
          actions: [{
            id: this.generateId(),
            title: 'Optimize API Performance',
            description: 'Improve API response times through optimization',
            type: 'optimize',
            priority: 'medium',
            estimatedImpact: 'Faster user interactions and better experience',
            implementation: 'Database optimization, caching, query optimization'
          }]
        });
      }
    }
    
    // Check for memory issues
    const memoryMetrics = metrics.filter(m => m.name === 'Memory Usage');
    if (memoryMetrics.length > 0) {
      const avgMemory = memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length;
      if (avgMemory > 100 * 1024 * 1024) { // > 100MB
        bottlenecks.push({
          area: 'Memory Usage',
          description: `High memory usage detected (${(avgMemory / (1024 * 1024)).toFixed(1)}MB average)`,
          confidence: 75,
          impact: 'medium',
          actions: [{
            id: this.generateId(),
            title: 'Optimize Memory Usage',
            description: 'Reduce memory consumption and prevent leaks',
            type: 'optimize',
            priority: 'medium',
            estimatedImpact: 'Better performance and stability',
            implementation: 'Memory profiling, leak detection, optimization'
          }]
        });
      }
    }
    
    return bottlenecks;
  }

  private async generateBusinessInsights(metrics: PerformanceMetric[], userActions: UserAction[], errors: ErrorMetric[]): Promise<void> {
    // Generate business-focused insights
    const businessMetrics = this.calculateBusinessMetrics(metrics, userActions, errors);
    
    if (businessMetrics.userEngagement < 0.5) {
      const insight: AIInsight = {
        id: this.generateId(),
        type: 'recommendation',
        title: 'Low User Engagement Detected',
        description: `User engagement is below optimal levels (${businessMetrics.userEngagement.toFixed(2)} actions per minute)`,
        confidence: 85,
        impact: 'high',
        category: 'business',
        data: businessMetrics,
        timestamp: Date.now(),
        actionable: true,
        actions: [{
          id: this.generateId(),
          title: 'Improve User Engagement',
          description: 'Implement strategies to increase user interaction',
          type: 'optimize',
          priority: 'high',
          estimatedImpact: 'Higher user satisfaction and retention',
          implementation: 'UX improvements, feature enhancements, user feedback integration'
        }]
      };
      
      this.insights.push(insight);
    }
    
    if (businessMetrics.errorImpact > 5) {
      const insight: AIInsight = {
        id: this.generateId(),
        type: 'recommendation',
        title: 'Errors Impacting Business Metrics',
        description: `Error rate is affecting ${businessMetrics.errorImpact.toFixed(1)}% of user interactions`,
        confidence: 90,
        impact: 'high',
        category: 'business',
        data: businessMetrics,
        timestamp: Date.now(),
        actionable: true,
        actions: [{
          id: this.generateId(),
          title: 'Reduce Error Impact',
          description: 'Focus on fixing high-impact errors',
          type: 'optimize',
          priority: 'high',
          estimatedImpact: 'Improved user experience and business outcomes',
          implementation: 'Error prioritization, root cause analysis, preventive measures'
        }]
      };
      
      this.insights.push(insight);
    }
  }

  private calculateBusinessMetrics(metrics: PerformanceMetric[], userActions: UserAction[], errors: ErrorMetric[]): any {
    const timeRange = 60 * 60 * 1000; // 1 hour
    const userEngagement = userActions.length / (timeRange / (60 * 1000)); // actions per minute
    const errorImpact = (errors.length / userActions.length) * 100; // error percentage
    
    return {
      userEngagement,
      errorImpact,
      totalActions: userActions.length,
      totalErrors: errors.length
    };
  }

  private generateRecommendations(): void {
    // Generate high-level recommendations based on all insights
    const recentInsights = this.insights.filter(i => Date.now() - i.timestamp < 60 * 60 * 1000);
    
    if (recentInsights.length === 0) return;
    
    const highImpactInsights = recentInsights.filter(i => i.impact === 'high' || i.impact === 'critical');
    
    if (highImpactInsights.length > 2) {
      const recommendation: AIInsight = {
        id: this.generateId(),
        type: 'recommendation',
        title: 'Multiple High-Impact Issues Detected',
        description: `${highImpactInsights.length} high-impact issues require immediate attention`,
        confidence: 95,
        impact: 'critical',
        category: 'technical',
        data: { relatedInsights: highImpactInsights.map(i => i.id) },
        timestamp: Date.now(),
        actionable: true,
        actions: [{
          id: this.generateId(),
          title: 'Prioritize Critical Issues',
          description: 'Address high-impact issues in order of business impact',
          type: 'optimize',
          priority: 'high',
          estimatedImpact: 'Significant improvement in system performance and user experience',
          implementation: 'Create action plan, allocate resources, implement fixes systematically'
        }]
      };
      
      this.insights.push(recommendation);
    }
  }

  private categorizeMetric(metricName: string): 'performance' | 'user_behavior' | 'business' | 'technical' {
    if (metricName.includes('Load Time') || metricName.includes('Memory') || metricName.includes('API')) {
      return 'performance';
    }
    if (metricName.includes('User') || metricName.includes('Action')) {
      return 'user_behavior';
    }
    if (metricName.includes('Error') || metricName.includes('System')) {
      return 'technical';
    }
    return 'business';
  }

  private generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getInsights(category?: string, timeRange?: number): AIInsight[] {
    let filtered = this.insights;
    
    if (category) {
      filtered = filtered.filter(i => i.category === category);
    }
    
    if (timeRange) {
      const cutoff = Date.now() - timeRange;
      filtered = filtered.filter(i => i.timestamp > cutoff);
    }
    
    return filtered.sort((a, b) => {
      // Sort by impact, then confidence, then timestamp
      const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aImpact = impactOrder[a.impact];
      const bImpact = impactOrder[b.impact];
      
      if (aImpact !== bImpact) return bImpact - aImpact;
      if (a.confidence !== b.confidence) return b.confidence - a.confidence;
      return b.timestamp - a.timestamp;
    });
  }

  getModels(): PredictionModel[] {
    return [...this.models];
  }

  getAnomalies(timeRange?: number): AnomalyDetection[] {
    let filtered = this.anomalies;
    
    if (timeRange) {
      const cutoff = Date.now() - timeRange;
      filtered = filtered.filter(a => a.timestamp > cutoff);
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  getPredictions(type?: string): Prediction[] {
    const allPredictions: Prediction[] = [];
    
    this.models.forEach(model => {
      if (!type || model.type === type) {
        allPredictions.push(...model.predictions);
      }
    });
    
    return allPredictions.sort((a, b) => b.confidence - a.confidence);
  }

  getSystemHealth(): {
    overallScore: number;
    categories: Record<string, number>;
    recommendations: string[];
    criticalIssues: number;
  } {
    const recentInsights = this.getInsights(undefined, 60 * 60 * 1000); // Last hour
    
    const criticalIssues = recentInsights.filter(i => i.impact === 'critical').length;
    const highIssues = recentInsights.filter(i => i.impact === 'high').length;
    const mediumIssues = recentInsights.filter(i => i.impact === 'medium').length;
    
    // Calculate overall score (0-100)
    let overallScore = 100;
    overallScore -= criticalIssues * 20;
    overallScore -= highIssues * 10;
    overallScore -= mediumIssues * 5;
    overallScore = Math.max(0, overallScore);
    
    // Category scores
    const categories = {
      performance: this.calculateCategoryScore('performance', recentInsights),
      user_behavior: this.calculateCategoryScore('user_behavior', recentInsights),
      business: this.calculateCategoryScore('business', recentInsights),
      technical: this.calculateCategoryScore('technical', recentInsights)
    };
    
    // Top recommendations
    const recommendations = recentInsights
      .filter(i => i.actionable && i.impact !== 'low')
      .slice(0, 5)
      .map(i => i.title);
    
    return {
      overallScore,
      categories,
      recommendations,
      criticalIssues
    };
  }

  private calculateCategoryScore(category: string, insights: AIInsight[]): number {
    const categoryInsights = insights.filter(i => i.category === category);
    if (categoryInsights.length === 0) return 100;
    
    let score = 100;
    categoryInsights.forEach(insight => {
      switch (insight.impact) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 8; break;
        case 'low': score -= 3; break;
      }
    });
    
    return Math.max(0, score);
  }

  // Cleanup
  destroy(): void {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    this.insights = [];
    this.models = [];
    this.anomalies = [];
  }
}

// Create singleton instance
export const aiAnalytics = new AIAnalyticsService();

// Convenience functions
export const getAIInsights = (category?: string) => aiAnalytics.getInsights(category);
export const getSystemHealth = () => aiAnalytics.getSystemHealth();
export const getPredictions = (type?: string) => aiAnalytics.getPredictions(type);
export const getAnomalies = () => aiAnalytics.getAnomalies(); 