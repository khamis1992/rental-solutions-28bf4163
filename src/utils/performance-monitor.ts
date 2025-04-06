
import { toast } from '@/components/ui/use-toast';

export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  private static readonly PERFORMANCE_THRESHOLD = 1000; // 1 second
  private static readonly METRICS_LIMIT = 100; // Prevent memory leaks
  
  private static trimMetrics(name: string) {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length > this.METRICS_LIMIT) {
      metrics.splice(0, metrics.length - this.METRICS_LIMIT);
      this.metrics.set(name, metrics);
    }
  }
  
  static startMeasure(name: string) {
    return performance.mark(name + '_start');
  }
  
  static endMeasure(name: string) {
    performance.mark(name + '_end');
    performance.measure(name, name + '_start', name + '_end');
    
    const measure = performance.getEntriesByName(name).pop();
    if (measure) {
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)?.push(measure.duration);
      
      if (measure.duration > 1000) {
        toast({
          title: "Performance Warning",
          description: `Operation ${name} took ${Math.round(measure.duration)}ms`,
          variant: "destructive"
        });
      }
    }
  }
}
