import { useEffect, useRef, useCallback } from 'react';
import { performanceAnalytics, trackUserAction, trackError, trackPerformance } from '@/services/performance-analytics';

interface UsePerformanceTrackingOptions {
  componentName: string;
  trackMount?: boolean;
  trackUnmount?: boolean;
  trackRenders?: boolean;
  trackUserInteractions?: boolean;
}

interface PerformanceTrackingHook {
  trackAction: (action: string, success?: boolean, metadata?: Record<string, any>) => void;
  trackError: (error: Error | string, severity?: 'low' | 'medium' | 'high' | 'critical') => void;
  trackTiming: (name: string, startTime: number, endTime?: number) => void;
  startTimer: (name: string) => () => void;
  trackClick: (elementName: string, metadata?: Record<string, any>) => void;
  trackFormSubmit: (formName: string, success: boolean, metadata?: Record<string, any>) => void;
  trackPageView: (pageName: string, metadata?: Record<string, any>) => void;
  trackApiCall: (endpoint: string, method: string, success: boolean, duration: number) => void;
}

export const usePerformanceTracking = (
  options: UsePerformanceTrackingOptions
): PerformanceTrackingHook => {
  const {
    componentName,
    trackMount = true,
    trackUnmount = true,
    trackRenders = false,
    trackUserInteractions = true
  } = options;

  const mountTime = useRef<number>(Date.now());
  const renderCount = useRef<number>(0);
  const timers = useRef<Map<string, number>>(new Map());

  // Track component mount
  useEffect(() => {
    if (trackMount) {
      trackUserAction('component_mount', componentName, true, {
        timestamp: mountTime.current,
        isMobile: window.innerWidth < 768,
        userAgent: navigator.userAgent
      });
    }

    // Track component unmount
    return () => {
      if (trackUnmount) {
        const unmountTime = Date.now();
        const componentLifetime = unmountTime - mountTime.current;
        
        trackUserAction('component_unmount', componentName, true, {
          lifetime: componentLifetime,
          renderCount: renderCount.current
        });

        trackPerformance(
          'Component Lifetime',
          componentLifetime,
          'ms',
          { component: componentName }
        );
      }
    };
  }, [componentName, trackMount, trackUnmount]);

  // Track renders
  useEffect(() => {
    renderCount.current += 1;
    
    if (trackRenders) {
      trackPerformance(
        'Component Render',
        1,
        'count',
        { 
          component: componentName,
          renderNumber: renderCount.current.toString()
        }
      );
    }
  });

  // Track user action
  const trackAction = useCallback((
    action: string, 
    success: boolean = true, 
    metadata?: Record<string, any>
  ) => {
    trackUserAction(action, componentName, success, {
      ...metadata,
      timestamp: Date.now(),
      renderCount: renderCount.current
    });
  }, [componentName]);

  // Track error
  const trackErrorCallback = useCallback((
    error: Error | string, 
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorType = typeof error === 'string' ? 'manual' : error.name;
    
    trackError(errorType, errorMessage, componentName, severity);
  }, [componentName]);

  // Track timing
  const trackTiming = useCallback((
    name: string, 
    startTime: number, 
    endTime: number = Date.now()
  ) => {
    const duration = endTime - startTime;
    trackPerformance(name, duration, 'ms', { component: componentName });
  }, [componentName]);

  // Start timer and return stop function
  const startTimer = useCallback((name: string) => {
    const startTime = Date.now();
    timers.current.set(name, startTime);
    
    return () => {
      const endTime = Date.now();
      const storedStartTime = timers.current.get(name);
      if (storedStartTime) {
        trackTiming(name, storedStartTime, endTime);
        timers.current.delete(name);
      }
    };
  }, [trackTiming]);

  // Track click events
  const trackClick = useCallback((
    elementName: string, 
    metadata?: Record<string, any>
  ) => {
    trackAction('click', true, {
      element: elementName,
      ...metadata
    });
  }, [trackAction]);

  // Track form submissions
  const trackFormSubmit = useCallback((
    formName: string, 
    success: boolean, 
    metadata?: Record<string, any>
  ) => {
    trackAction('form_submit', success, {
      form: formName,
      ...metadata
    });
  }, [trackAction]);

  // Track page views
  const trackPageView = useCallback((
    pageName: string, 
    metadata?: Record<string, any>
  ) => {
    trackAction('page_view', true, {
      page: pageName,
      url: window.location.href,
      referrer: document.referrer,
      ...metadata
    });
  }, [trackAction]);

  // Track API calls
  const trackApiCall = useCallback((
    endpoint: string, 
    method: string, 
    success: boolean, 
    duration: number
  ) => {
    trackAction('api_call', success, {
      endpoint,
      method,
      duration
    });

    trackPerformance(
      'API Call Duration',
      duration,
      'ms',
      {
        component: componentName,
        endpoint,
        method,
        success: success.toString()
      }
    );
  }, [componentName, trackAction]);

  return {
    trackAction,
    trackError: trackErrorCallback,
    trackTiming,
    startTimer,
    trackClick,
    trackFormSubmit,
    trackPageView,
    trackApiCall
  };
};

// Higher-order component for automatic performance tracking
export const withPerformanceTracking = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string,
  options?: Partial<UsePerformanceTrackingOptions>
) => {
  const WithPerformanceTracking = (props: P) => {
    const tracking = usePerformanceTracking({
      componentName,
      ...options
    });

    // Add tracking to props
    const enhancedProps = {
      ...props,
      performanceTracking: tracking
    } as P & { performanceTracking: PerformanceTrackingHook };

    return <WrappedComponent {...enhancedProps} />;
  };

  WithPerformanceTracking.displayName = `withPerformanceTracking(${componentName})`;
  return WithPerformanceTracking;
};

// Hook for tracking API calls with automatic timing
export const useApiTracking = (componentName: string) => {
  const { trackApiCall } = usePerformanceTracking({ componentName });

  const trackApi = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    method: string = 'GET'
  ): Promise<T> => {
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      trackApiCall(endpoint, method, true, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      trackApiCall(endpoint, method, false, duration);
      throw error;
    }
  }, [trackApiCall]);

  return { trackApi };
};

// Hook for tracking form performance
export const useFormTracking = (componentName: string, formName: string) => {
  const { trackFormSubmit, trackAction, startTimer } = usePerformanceTracking({ componentName });

  const trackFormStart = useCallback(() => {
    trackAction('form_start', true, { form: formName });
    return startTimer(`form_completion_${formName}`);
  }, [trackAction, startTimer, formName]);

  const trackFormField = useCallback((fieldName: string, value: any) => {
    trackAction('form_field_change', true, {
      form: formName,
      field: fieldName,
      hasValue: !!value
    });
  }, [trackAction, formName]);

  const trackFormValidation = useCallback((isValid: boolean, errors?: string[]) => {
    trackAction('form_validation', isValid, {
      form: formName,
      errors: errors || []
    });
  }, [trackAction, formName]);

  const trackFormSubmission = useCallback((success: boolean, errors?: string[]) => {
    trackFormSubmit(formName, success, {
      errors: errors || []
    });
  }, [trackFormSubmit, formName]);

  return {
    trackFormStart,
    trackFormField,
    trackFormValidation,
    trackFormSubmission
  };
};

// Hook for tracking user engagement
export const useEngagementTracking = (componentName: string) => {
  const { trackAction } = usePerformanceTracking({ componentName });
  const engagementStartTime = useRef<number>(Date.now());
  const lastActivityTime = useRef<number>(Date.now());

  const trackEngagement = useCallback(() => {
    lastActivityTime.current = Date.now();
  }, []);

  const trackScroll = useCallback((scrollPercentage: number) => {
    trackAction('scroll', true, {
      scrollPercentage,
      timestamp: Date.now()
    });
    trackEngagement();
  }, [trackAction, trackEngagement]);

  const trackTimeOnPage = useCallback(() => {
    const timeSpent = Date.now() - engagementStartTime.current;
    trackAction('time_on_page', true, {
      timeSpent,
      lastActivity: lastActivityTime.current
    });
  }, [trackAction]);

  // Track time on page when component unmounts
  useEffect(() => {
    return () => {
      trackTimeOnPage();
    };
  }, [trackTimeOnPage]);

  return {
    trackEngagement,
    trackScroll,
    trackTimeOnPage
  };
};

// Hook for tracking mobile-specific interactions
export const useMobileTracking = (componentName: string) => {
  const { trackAction } = usePerformanceTracking({ componentName });
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const trackTouch = useCallback((elementName: string, touchType: 'start' | 'end' | 'move') => {
    if (isMobile) {
      trackAction('touch', true, {
        element: elementName,
        touchType,
        isMobile: true
      });
    }
  }, [trackAction, isMobile]);

  const trackSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down', distance: number) => {
    if (isMobile) {
      trackAction('swipe', true, {
        direction,
        distance,
        isMobile: true
      });
    }
  }, [trackAction, isMobile]);

  const trackOrientation = useCallback((orientation: 'portrait' | 'landscape') => {
    if (isMobile) {
      trackAction('orientation_change', true, {
        orientation,
        isMobile: true
      });
    }
  }, [trackAction, isMobile]);

  // Track orientation changes
  useEffect(() => {
    if (isMobile) {
      const handleOrientationChange = () => {
        const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
        trackOrientation(orientation);
      };

      window.addEventListener('orientationchange', handleOrientationChange);
      return () => window.removeEventListener('orientationchange', handleOrientationChange);
    }
  }, [isMobile, trackOrientation]);

  return {
    trackTouch,
    trackSwipe,
    trackOrientation,
    isMobile
  };
}; 