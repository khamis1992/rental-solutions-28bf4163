
/**
 * Simple performance monitoring utility for tracking component render times
 * and application performance metrics
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = false;
  private thresholds: Map<string, number> = new Map();
  
  /**
   * Enable or disable performance monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Set threshold for warning in ms
   */
  public setThreshold(metricName: string, thresholdMs: number): void {
    this.thresholds.set(metricName, thresholdMs);
  }
  
  /**
   * Start measuring a metric
   */
  public startMeasure(name: string): void {
    if (!this.enabled) return;
    
    this.metrics.set(name, {
      name,
      startTime: performance.now()
    });
  }
  
  /**
   * End measuring a metric and return the duration
   */
  public endMeasure(name: string, logToConsole: boolean = false): number | undefined {
    if (!this.enabled) return;
    
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`No metric started with name: ${name}`);
      return undefined;
    }
    
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    // Check threshold
    const threshold = this.thresholds.get(name);
    if (threshold && metric.duration > threshold) {
      console.warn(`Performance warning: ${name} took ${metric.duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }
    
    if (logToConsole) {
      console.log(`Performance: ${name} took ${metric.duration.toFixed(2)}ms`);
    }
    
    return metric.duration;
  }
  
  /**
   * Create a component wrapper to measure render time
   */
  public measureComponent(name: string) {
    return {
      beforeRender: () => this.startMeasure(`render_${name}`),
      afterRender: () => this.endMeasure(`render_${name}`, true)
    };
  }
  
  /**
   * Reset all metrics
   */
  public resetMetrics(): void {
    this.metrics.clear();
  }
  
  /**
   * Get all current metrics
   */
  public getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }
}

// Create a singleton instance
const performanceMonitor = new PerformanceMonitor();

// In development mode, enable performance monitoring by default
if (import.meta.env.DEV) {
  performanceMonitor.setEnabled(true);
  
  // Set some default thresholds
  performanceMonitor.setThreshold('render_Dashboard', 100);
  performanceMonitor.setThreshold('render_VehicleStatusChart', 50);
  performanceMonitor.setThreshold('render_RevenueChart', 50);
  performanceMonitor.setThreshold('initial_load', 1000);
  
  // Start measuring initial load
  performanceMonitor.startMeasure('initial_load');
  
  // When the window loads, end the measurement
  window.addEventListener('load', () => {
    const duration = performanceMonitor.endMeasure('initial_load', true);
    console.log(`Initial load completed in ${duration?.toFixed(2)}ms`);
  });
}

export default performanceMonitor;
