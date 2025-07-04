interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  error?: string;
}

class HealthChecker {
  private healthStatuses: Map<string, HealthStatus> = new Map();
  private checkInterval: number = 30000;
  private intervalId?: number;

  start(): void {
    this.performAllChecks();
    this.intervalId = window.setInterval(() => {
      this.performAllChecks();
    }, this.checkInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  async performAllChecks(): Promise<void> {
    await Promise.all([
      this.checkSupabase(),
      this.checkLocalStorage(),
      this.checkNetworkConnectivity()
    ]);
  }

  private async checkSupabase(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await fetch('/api/health');
      const responseTime = Date.now() - startTime;
      
      this.healthStatuses.set('supabase', {
        service: 'supabase',
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date()
      });
    } catch (error) {
      this.healthStatuses.set('supabase', {
        service: 'supabase',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: (error as Error).message
      });
    }
  }

  private async checkLocalStorage(): Promise<void> {
    const startTime = Date.now();
    try {
      const testKey = 'health-check-test';
      localStorage.setItem(testKey, 'test');
      localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      this.healthStatuses.set('localStorage', {
        service: 'localStorage',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date()
      });
    } catch (error) {
      this.healthStatuses.set('localStorage', {
        service: 'localStorage',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: (error as Error).message
      });
    }
  }

  private async checkNetworkConnectivity(): Promise<void> {
    const startTime = Date.now();
    try {
      const response = await fetch('/favicon.ico', { method: 'HEAD' });
      const responseTime = Date.now() - startTime;
      
      this.healthStatuses.set('network', {
        service: 'network',
        status: response.ok ? 'healthy' : 'degraded',
        responseTime,
        lastCheck: new Date()
      });
    } catch (error) {
      this.healthStatuses.set('network', {
        service: 'network',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        error: (error as Error).message
      });
    }
  }

  getHealthStatus(): HealthStatus[] {
    return Array.from(this.healthStatuses.values());
  }

  getOverallHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = this.getHealthStatus();
    
    if (statuses.some(s => s.status === 'unhealthy')) {
      return 'unhealthy';
    }
    
    if (statuses.some(s => s.status === 'degraded')) {
      return 'degraded';
    }
    
    return 'healthy';
  }
}

export const healthChecker = new HealthChecker();
