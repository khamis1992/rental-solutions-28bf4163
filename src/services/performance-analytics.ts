// Simplified performance analytics service placeholder
export interface PerformanceMetrics {
  cpu: number;
  memory: number;
  network: number;
  responseTime: number;
  throughput: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  category: string;
  timestamp: number;
  unit: string;
}

export interface UserAction {
  id: string;
  action: string;
  timestamp: number;
  success: boolean;
  metadata?: { isMobile?: boolean };
}

export interface ErrorMetric {
  id: string;
  message: string;
  timestamp: number;
  severity: string;
  stack?: string;
}

export const performanceAnalytics = {
  track: async (metrics: PerformanceMetrics) => {
    console.log('Performance tracking not implemented');
  },
  getMetrics: async (category?: string, timeRange?: number): Promise<PerformanceMetric[]> => {
    console.log('Performance metrics not implemented', category, timeRange);
    return [];
  },
  getUserActions: (timeRange?: number): UserAction[] => {
    console.log('User actions not implemented', timeRange);
    return [];
  },
  getErrors: (timeRange?: number): ErrorMetric[] => {
    console.log('Errors not implemented', timeRange);
    return [];
  },
  getPerformanceInsights: () => {
    console.log('Performance insights not implemented');
    return {
      performanceScore: 85,
      averageLoadTime: 1200,
      errorRate: 2.1,
      userEngagement: 4.5
    };
  },
  getAlerts: () => {
    console.log('Alerts not implemented');
    return [];
  }
};