// Fallback Sentry implementation for when Sentry is not available
const createSentryFallback = () => ({
  init: () => {},
  addBreadcrumb: (breadcrumb: any) => {
    if (import.meta.env.MODE === 'development') {
      console.log('📊 Breadcrumb:', breadcrumb);
    }
  },
  captureException: (error: Error, options?: any) => {
    console.error('🚨 Error:', error, options);
  },
  captureMessage: (message: string, options?: any) => {
    console.warn('⚠️ Warning:', message, options);
  },
  setContext: (key: string, context: any) => {
    if (import.meta.env.MODE === 'development') {
      console.log(`🔧 Context [${key}]:`, context);
    }
  },
  BrowserTracing: class {
    constructor(options?: any) {}
  },
  reactRouterV6Instrumentation: () => {}
});

// Use fallback implementation
const sentryClient = createSentryFallback();

// Initialize monitoring (uses console logging instead of Sentry)
export const initializeMonitoring = () => {
  console.log('🔧 Monitoring initialized with fallback implementation');
  
  // Mobile-specific setup
  if (typeof window !== 'undefined') {
    // Track mobile device info
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window;
    
    sentryClient.setContext('device', {
      isMobile,
      isTouch,
      userAgent: navigator.userAgent,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  }
};

// Enhanced Performance monitoring with mobile focus
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private mobileMetrics: Map<string, any> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track page load times with mobile-specific metrics
  trackPageLoad(pageName: string) {
    const startTime = performance.now();
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    
    return () => {
      const loadTime = performance.now() - startTime;
      this.metrics.set(`page_load_${pageName}`, loadTime);
      
      // Mobile-specific tracking
      if (isMobile && typeof window !== 'undefined') {
        this.mobileMetrics.set(`mobile_page_load_${pageName}`, {
          loadTime,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          timestamp: new Date().toISOString()
        });
      }
      
      // Send to analytics if enabled
      if (import.meta.env.VITE_PERFORMANCE_MONITORING === 'true') {
        console.log(`📱 ${isMobile ? 'Mobile' : 'Desktop'} Page Load - ${pageName}:`, `${loadTime.toFixed(2)}ms`);
        
        // Track with Sentry
        sentryClient.addBreadcrumb({
          category: 'performance',
          message: `Page loaded: ${pageName}`,
          level: 'info',
          data: { 
            loadTime: loadTime.toFixed(2),
            device: isMobile ? 'mobile' : 'desktop',
            viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown'
          }
        });
        
        // Track slow pages (> 3 seconds)
        if (loadTime > 3000) {
          sentryClient.captureMessage(`Slow page load: ${pageName}`, {
            level: 'warning',
            extra: {
              loadTime,
              device: isMobile ? 'mobile' : 'desktop',
              pageName
            }
          });
        }
      }
    };
  }

  // Track API call performance with mobile context
  trackApiCall(endpoint: string, method: string = 'GET') {
    const startTime = performance.now();
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    
    return (success: boolean, statusCode?: number, responseSize?: number) => {
      const duration = performance.now() - startTime;
      const metricKey = `api_${method}_${endpoint}`;
      
      this.metrics.set(metricKey, duration);
      
      if (import.meta.env.VITE_PERFORMANCE_MONITORING === 'true') {
        console.log(`🌐 ${isMobile ? 'Mobile' : 'Desktop'} API Call - ${method} ${endpoint}:`, {
          duration: `${duration.toFixed(2)}ms`,
          success,
          statusCode,
          responseSize: responseSize ? `${(responseSize / 1024).toFixed(2)}KB` : 'unknown'
        });
        
        // Track with Sentry
        sentryClient.addBreadcrumb({
          category: 'api',
          message: `${method} ${endpoint}`,
          level: success ? 'info' : 'error',
          data: { 
            duration: duration.toFixed(2),
            success,
            statusCode,
            device: isMobile ? 'mobile' : 'desktop',
            responseSize
          }
        });
        
        // Track slow API calls (> 2 seconds)
        if (duration > 2000) {
          sentryClient.captureMessage(`Slow API call: ${method} ${endpoint}`, {
            level: 'warning',
            extra: {
              duration,
              endpoint,
              method,
              device: isMobile ? 'mobile' : 'desktop'
            }
          });
        }
      }
    };
  }

  // Track touch interactions (mobile-specific)
  trackTouchInteraction(element: string, action: string) {
    if (typeof window !== 'undefined' && 'ontouchstart' in window) {
      const touchMetric = {
        element,
        action,
        timestamp: new Date().toISOString(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
      
      this.mobileMetrics.set(`touch_${element}_${action}`, touchMetric);
      
      if (import.meta.env.VITE_PERFORMANCE_MONITORING === 'true') {
        console.log(`👆 Touch Interaction:`, touchMetric);
        
        sentryClient.addBreadcrumb({
          category: 'touch',
          message: `Touch ${action} on ${element}`,
          level: 'info',
          data: touchMetric
        });
      }
    }
  }

  // Get performance metrics
  getMetrics() {
    return {
      general: Object.fromEntries(this.metrics),
      mobile: Object.fromEntries(this.mobileMetrics)
    };
  }

  // Track user actions with mobile context
  trackUserAction(action: string, details?: any) {
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    const enrichedDetails = {
      ...details,
      device: isMobile ? 'mobile' : 'desktop',
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
      timestamp: new Date().toISOString()
    };
    
    if (import.meta.env.VITE_PERFORMANCE_MONITORING === 'true') {
      console.log(`👤 User Action: ${action}`, enrichedDetails);
      
      sentryClient.addBreadcrumb({
        category: 'user',
        message: action,
        level: 'info',
        data: enrichedDetails
      });
    }
  }

  // Mobile performance insights
  getMobileInsights() {
    if (typeof window === 'undefined') {
      return {
        deviceType: 'server',
        viewport: { width: 0, height: 0 },
        touchSupport: false,
        connectionType: 'unknown',
        metrics: {}
      };
    }

    const insights = {
      deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      touchSupport: 'ontouchstart' in window,
      connectionType: (navigator as any)?.connection?.effectiveType || 'unknown',
      metrics: Object.fromEntries(this.mobileMetrics)
    };
    
    return insights;
  }
}

// Enhanced error logging with mobile context
export const logError = (error: Error, context?: any) => {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const enhancedContext = {
    ...context,
    device: isMobile ? 'mobile' : 'desktop',
    viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    timestamp: new Date().toISOString()
  };
  
  console.error('🚨 Application Error:', error, enhancedContext);
  
  sentryClient.captureException(error, {
    tags: {
      component: context?.component,
      action: context?.action,
      device: isMobile ? 'mobile' : 'desktop'
    },
    extra: enhancedContext,
  });
};

// Warning logging with mobile context
export const logWarning = (message: string, context?: any) => {
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const enhancedContext = {
    ...context,
    device: isMobile ? 'mobile' : 'desktop',
    viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown'
  };
  
  console.warn('⚠️ Application Warning:', message, enhancedContext);
  
  sentryClient.captureMessage(message, {
    level: 'warning',
    extra: enhancedContext
  });
};

// Performance hook for React components with mobile awareness
export const usePerformanceTracking = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  
  const trackAction = (actionName: string, details?: any) => {
    const enhancedDetails = {
      ...details,
      device: isMobile ? 'mobile' : 'desktop'
    };
    monitor.trackUserAction(`${componentName}:${actionName}`, enhancedDetails);
  };
  
  const trackApiCall = (endpoint: string, method?: string) => {
    return monitor.trackApiCall(endpoint, method);
  };
  
  const trackTouch = (element: string, action: string) => {
    monitor.trackTouchInteraction(element, action);
  };
  
  return { 
    trackAction, 
    trackApiCall, 
    trackTouch,
    isMobile,
    deviceType: isMobile ? 'mobile' : 'desktop'
  };
};
