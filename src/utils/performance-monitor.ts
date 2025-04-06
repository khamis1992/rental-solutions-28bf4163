import { toast } from '@/components/ui/use-toast';

interface PerformanceMetric {
  duration: number;
  timestamp: number;
  memoryUsage?: number;
}

export class PerformanceMonitor {
  private static metrics = new Map<string, PerformanceMetric[]>();
  private static readonly MEMORY_THRESHOLD = 100 * 1024 * 1024; // 100MB
  private static readonly PERFORMANCE_THRESHOLD = 1000; // 1 second
  private static readonly METRICS_HISTORY_LIMIT = 100;
  private static readonly PERFORMANCE_THRESHOLD = 1000; // 1 second
  private static readonly METRICS_LIMIT = 100; // Prevent memory leaks
  private static readonly MEMORY_THRESHOLD = 100 * 1024 * 1024; // 100MB threshold
  private static readonly FPS_THRESHOLD = 30;
  private static readonly LONG_TASK_THRESHOLD = 50; // ms
  private static readonly metrics_buffer = new Map<string, number[]>();

  private static trimMetrics(name: string) {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length > this.METRICS_LIMIT) {
      metrics.splice(0, metrics.length - this.METRICS_LIMIT);
      this.metrics.set(name, metrics);
    }
  }

  static startMeasure(name: string) {
    performance.mark(name + '_start');
  }

  static endMeasure(name: string) {
    try {
      performance.mark(name + '_end');
      performance.measure(name, name + '_start', name + '_end');

      // Track layout shifts
      if ('web-vital' in performance) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.value > 0.1) {
              console.warn(`Layout shift detected during ${name}: ${entry.value}`);
            }
          });
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      }

      // Monitor long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            console.warn(`Long task detected during ${name}: ${entry.duration}ms`);
          }
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });

      const measure = performance.getEntriesByName(name).pop();
      if (measure) {
        // Track metrics
        if (!this.metrics.has(name)) {
          this.metrics.set(name, []);
        }
        this.metrics.get(name)?.push(measure.duration);
        this.trimMetrics(name);

        // Check performance threshold
        if (measure.duration > this.PERFORMANCE_THRESHOLD) {
          console.warn(`Performance warning: ${name} took ${Math.round(measure.duration)}ms`);
          toast({
            title: "Performance Warning",
            description: `Operation ${name} took ${Math.round(measure.duration)}ms`,
            variant: "destructive"
          });
        }

        // Check memory usage
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          if (memory?.usedJSHeapSize > this.MEMORY_THRESHOLD) {
            console.warn('High memory usage detected');
            toast({
              title: "Memory Warning",
              description: "High memory usage detected",
              variant: "destructive"
            });
          }
        }

        // Clear measurements
        performance.clearMarks(name + '_start');
        performance.clearMarks(name + '_end');
        performance.clearMeasures(name);
      }
    } catch (error) {
      console.error('Error in performance monitoring:', error);
    }
  }

  static getMetrics(name: string): number[] {
    return this.metrics.get(name) || [];
  }

  static clearMetrics(name?: string) {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  private static measureFPS() {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        if (fps < this.FPS_THRESHOLD) {
          console.warn(`Low FPS detected: ${fps}`);
        }
        frameCount = 0;
        lastTime = currentTime;
      }
      requestAnimationFrame(countFrame);
    };

    requestAnimationFrame(countFrame);
  }
}