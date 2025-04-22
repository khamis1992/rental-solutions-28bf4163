interface StartupMetrics {
  navigationStart?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  domInteractive?: number;
  domComplete?: number;
  loadComplete?: number;
  timeToInteractive?: number;
  firstRouteRender?: number;
  resourcesLoaded?: number;
  javaScriptParseTime?: number;
}

class StartupPerformanceMonitor {
  private static instance: StartupPerformanceMonitor;
  private metrics: StartupMetrics = {};
  private marksRecorded = new Set<string>();
  private observers: Array<(metrics: StartupMetrics) => void> = [];
  private initialized = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): StartupPerformanceMonitor {
    if (!StartupPerformanceMonitor.instance) {
      StartupPerformanceMonitor.instance = new StartupPerformanceMonitor();
    }
    return StartupPerformanceMonitor.instance;
  }

  private initialize(): void {
    if (typeof window === 'undefined' || this.initialized) {
      return;
    }

    this.initialized = true;

    // Record navigation start time
    if (window.performance && window.performance.timing) {
      this.metrics.navigationStart = window.performance.timing.navigationStart;
    } else {
      this.metrics.navigationStart = Date.now();
    }

    // Listen for paint events
    if (window.PerformanceObserver) {
      try {
        const paintObserver = new PerformanceObserver((entries) => {
          entries.getEntries().forEach((entry) => {
            const entryName = entry.name;
            
            if (entryName === 'first-paint') {
              this.metrics.firstPaint = entry.startTime;
              this.notifyObservers();
            } else if (entryName === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime;
              this.notifyObservers();
            }
          });
        });
        
        paintObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.error('Failed to observe paint events:', e);
      }

      // Listen for resource timing events
      try {
        const resourceObserver = new PerformanceObserver((entries) => {
          const resources = entries.getEntries();
          this.metrics.resourcesLoaded = resources.length;
          
          // Calculate JavaScript parse time (approximate)
          const scriptEntries = resources.filter(entry => 
            entry.initiatorType === 'script'
          );
          
          if (scriptEntries.length > 0) {
            const totalDuration = scriptEntries.reduce(
              (sum, entry) => sum + entry.duration, 0
            );
            this.metrics.javaScriptParseTime = totalDuration;
            this.notifyObservers();
          }
        });
        
        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (e) {
        console.error('Failed to observe resource timing:', e);
      }
    }

    // Listen for DOM events
    window.addEventListener('DOMContentLoaded', () => {
      this.metrics.domInteractive = Date.now() - this.metrics.navigationStart!;
      this.notifyObservers();
    });

    window.addEventListener('load', () => {
      this.metrics.loadComplete = Date.now() - this.metrics.navigationStart!;
      this.notifyObservers();
      
      // Estimate Time to Interactive (TTI)
      setTimeout(() => {
        this.estimateTimeToInteractive();
      }, 1000);
    });
  }

  private estimateTimeToInteractive(): void {
    if (typeof window === 'undefined') return;
    
    // Check if the main thread is idle
    const checkIdle = (startTime: number) => {
      const MAX_IDLE_WAIT = 10000; // Give up after 10 seconds
      
      if (Date.now() - startTime > MAX_IDLE_WAIT) {
        // Fallback to load time if we can't determine TTI
        this.metrics.timeToInteractive = this.metrics.loadComplete;
        this.notifyObservers();
        return;
      }
      
      // Use requestIdleCallback if available, otherwise setTimeout
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          this.metrics.timeToInteractive = Date.now() - this.metrics.navigationStart!;
          this.notifyObservers();
        });
      } else {
        // Check if there are no long tasks in the queue
        const start = Date.now();
        setTimeout(() => {
          const end = Date.now();
          
          // If the timeout fired reasonably close to when it was scheduled,
          // the main thread wasn't too busy
          if (end - start < 50) {
            this.metrics.timeToInteractive = Date.now() - this.metrics.navigationStart!;
            this.notifyObservers();
          } else {
            // Try again later
            setTimeout(() => checkIdle(startTime), 100);
          }
        }, 50);
      }
    };
    
    checkIdle(Date.now());
  }

  markFirstRouteRender(): void {
    if (typeof window === 'undefined' || this.marksRecorded.has('firstRouteRender')) {
      return;
    }
    
    this.metrics.firstRouteRender = Date.now() - this.metrics.navigationStart!;
    this.marksRecorded.add('firstRouteRender');
    this.notifyObservers();
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => observer(this.metrics));
  }

  addObserver(callback: (metrics: StartupMetrics) => void): () => void {
    this.observers.push(callback);
    
    // Immediately notify with current metrics
    callback(this.metrics);
    
    // Return unsubscribe function
    return () => {
      this.observers = this.observers.filter(obs => obs !== callback);
    };
  }

  getMetrics(): StartupMetrics {
    return { ...this.metrics };
  }

  logMetricsToConsole(): void {
    console.group('Startup Performance Metrics');
    Object.entries(this.metrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        console.log(`${key}: ${Math.round(value)}ms`);
      }
    });
    console.groupEnd();
  }
}

export const startupMonitor = StartupPerformanceMonitor.getInstance();