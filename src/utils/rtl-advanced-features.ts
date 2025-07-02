/**
 * Advanced RTL Features for Qatar Rental Solutions
 * Provides RTL-aware animations, transitions, chart rendering, and mobile gestures
 */

/**
 * RTL-aware animation configurations
 */
export const rtlAnimations = {
  // Slide animations
  slideInRight: 'animate-in slide-in-from-right-full duration-300',
  slideInLeft: 'animate-in slide-in-from-left-full duration-300',
  slideOutRight: 'animate-out slide-out-to-right-full duration-300',
  slideOutLeft: 'animate-out slide-out-to-left-full duration-300',
  
  // RTL-aware slide animations (reversed for RTL)
  slideInStart: 'animate-in slide-in-from-right-full duration-300', // From start (right in RTL)
  slideInEnd: 'animate-in slide-in-from-left-full duration-300',     // From end (left in RTL)
  slideOutStart: 'animate-out slide-out-to-right-full duration-300', // To start (right in RTL)
  slideOutEnd: 'animate-out slide-out-to-left-full duration-300',    // To end (left in RTL)
  
  // Fade animations
  fadeIn: 'animate-in fade-in duration-300',
  fadeOut: 'animate-out fade-out duration-300',
  
  // Scale animations
  scaleIn: 'animate-in zoom-in-95 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-200',
  
  // Bounce animations
  bounceIn: 'animate-bounce-in duration-500',
  bounceOut: 'animate-bounce-out duration-300',
  
  // Drawer animations (RTL-aware)
  drawerSlideIn: 'animate-in slide-in-from-right-full duration-300 ease-out',
  drawerSlideOut: 'animate-out slide-out-to-right-full duration-300 ease-in',
  
  // Modal animations
  modalFadeIn: 'animate-in fade-in-0 zoom-in-95 duration-300',
  modalFadeOut: 'animate-out fade-out-0 zoom-out-95 duration-200',
  
  // Notification animations (RTL-aware)
  notificationSlideIn: 'animate-in slide-in-from-right-full fade-in duration-300',
  notificationSlideOut: 'animate-out slide-out-to-right-full fade-out duration-200',
  
  // Loading animations
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  
  // Custom RTL animations
  rtlSlideInFromStart: 'rtl-slide-in-start',
  rtlSlideInFromEnd: 'rtl-slide-in-end',
  rtlSlideOutToStart: 'rtl-slide-out-start',
  rtlSlideOutToEnd: 'rtl-slide-out-end',
};

/**
 * RTL-aware transition configurations
 */
export const rtlTransitions = {
  // Standard transitions
  all: 'transition-all duration-200 ease-in-out',
  colors: 'transition-colors duration-200 ease-in-out',
  opacity: 'transition-opacity duration-200 ease-in-out',
  shadow: 'transition-shadow duration-200 ease-in-out',
  transform: 'transition-transform duration-200 ease-in-out',
  
  // RTL-aware transform transitions
  slideHorizontal: 'transition-transform duration-300 ease-out',
  slideVertical: 'transition-transform duration-300 ease-out',
  
  // Interactive transitions
  hover: 'transition-all duration-150 ease-in-out hover:scale-105',
  focus: 'transition-all duration-150 ease-in-out focus:scale-105',
  active: 'transition-all duration-100 ease-in-out active:scale-95',
  
  // Button transitions (RTL-aware)
  button: 'transition-all duration-150 ease-in-out hover:shadow-md active:scale-95',
  buttonPrimary: 'transition-all duration-150 ease-in-out hover:shadow-lg hover:scale-105 active:scale-95',
  
  // Card transitions
  card: 'transition-all duration-200 ease-in-out hover:shadow-lg hover:-translate-y-1',
  cardInteractive: 'transition-all duration-200 ease-in-out hover:shadow-xl hover:-translate-y-2 cursor-pointer',
  
  // Navigation transitions (RTL-aware)
  navItem: 'transition-all duration-150 ease-in-out hover:bg-accent hover:text-accent-foreground',
  navItemActive: 'transition-all duration-150 ease-in-out bg-accent text-accent-foreground',
  
  // Form transitions
  input: 'transition-all duration-150 ease-in-out focus:ring-2 focus:ring-primary focus:border-primary',
  inputError: 'transition-all duration-150 ease-in-out border-red-500 focus:ring-red-500',
  
  // Loading transitions
  skeleton: 'animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted',
  shimmer: 'animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent',
};

/**
 * RTL-aware chart and graph configurations
 */
export const rtlChartConfig = {
  // Chart direction settings
  direction: 'rtl' as const,
  
  // Axis configurations
  xAxis: {
    position: 'bottom' as const,
    labelRotation: -45, // Rotate labels for RTL readability
    textAnchor: 'end' as const,
  },
  
  yAxis: {
    position: 'right' as const, // Y-axis on right for RTL
    labelOffset: 10,
    textAnchor: 'start' as const,
  },
  
  // Legend configuration
  legend: {
    position: 'top' as const,
    align: 'right' as const, // Align legend to right for RTL
    direction: 'rtl' as const,
  },
  
  // Tooltip configuration
  tooltip: {
    direction: 'rtl' as const,
    textAlign: 'right' as const,
    position: 'auto' as const,
  },
  
  // Color schemes optimized for RTL
  colorSchemes: {
    primary: ['#3b82f6', '#1d4ed8', '#1e40af', '#1e3a8a'],
    success: ['#10b981', '#059669', '#047857', '#065f46'],
    warning: ['#f59e0b', '#d97706', '#b45309', '#92400e'],
    danger: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b'],
    neutral: ['#6b7280', '#4b5563', '#374151', '#1f2937'],
    qatar: ['#8B1538', '#A91B47', '#C72456', '#E52D65'], // Qatar national colors
  },
  
  // RTL-specific chart options
  options: {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 20,
        right: // 40 - removed unused variable// More padding on right for RTL
        top: 20,
        bottom: 20,
      },
    },
    plugins: {
      legend: {
        rtl: true,
        textDirection: 'rtl',
        align: 'end',
      },
      tooltip: {
        rtl: true,
        textDirection: 'rtl',
        titleAlign: 'right',
        bodyAlign: 'right',
      },
    },
    scales: {
      x: {
        position: 'bottom',
        reverse: false, // Don't reverse x-axis data
        ticks: {
          textDirection: 'rtl',
        },
      },
      y: {
        position: 'right',
        ticks: {
          textDirection: 'rtl',
        },
      },
    },
  },
};

/**
 * RTL-optimized print layout configurations
 */
export const rtlPrintLayouts = {
  // Base print styles
  base: `
    @media print {
      * {
        direction: rtl !important;
        text-align: right !important;
      }
      
      body {
        font-family: 'Arial', 'Tahoma', sans-serif !important;
        font-size: 12pt !important;
        line-height: 1.4 !important;
        color: #000 !important;
        background: #fff !important;
      }
      
      .print-hidden {
        display: none !important;
      }
      
      .print-visible {
        display: block !important;
      }
      
      .page-break {
        page-break-before: always !important;
      }
      
      .no-page-break {
        page-break-inside: avoid !important;
      }
    }
  `,
  
  // Invoice print layout
  invoice: `
    @media print {
      .invoice-header {
        text-align: right !important;
        margin-bottom: 20pt !important;
        border-bottom: 2pt solid #000 !important;
        padding-bottom: 10pt !important;
      }
      
      .invoice-details {
        display: flex !important;
        justify-content: space-between !important;
        direction: rtl !important;
        margin-bottom: 20pt !important;
      }
      
      .invoice-table {
        width: 100% !important;
        border-collapse: collapse !important;
        direction: rtl !important;
      }
      
      .invoice-table th,
      .invoice-table td {
        text-align: right !important;
        padding: 8pt !important;
        border: 1pt solid #000 !important;
      }
      
      .invoice-total {
        text-align: right !important;
        font-weight: bold !important;
        font-size: 14pt !important;
        margin-top: 20pt !important;
      }
    }
  `,
  
  // Report print layout
  report: `
    @media print {
      .report-header {
        text-align: center !important;
        margin-bottom: 30pt !important;
        border-bottom: 1pt solid #ccc !important;
        padding-bottom: 15pt !important;
      }
      
      .report-section {
        margin-bottom: 25pt !important;
        page-break-inside: avoid !important;
      }
      
      .report-table {
        width: 100% !important;
        border-collapse: collapse !important;
        direction: rtl !important;
        font-size: 10pt !important;
      }
      
      .report-table th {
        background-color: #f0f0f0 !important;
        font-weight: bold !important;
        text-align: right !important;
        padding: 6pt !important;
        border: 1pt solid #000 !important;
      }
      
      .report-table td {
        text-align: right !important;
        padding: 6pt !important;
        border: 1pt solid #ccc !important;
      }
      
      .report-summary {
        background-color: #f9f9f9 !important;
        padding: 15pt !important;
        margin-top: 20pt !important;
        border: 1pt solid #ccc !important;
        text-align: right !important;
      }
    }
  `,
  
  // Agreement print layout
  agreement: `
    @media print {
      .agreement-header {
        text-align: center !important;
        margin-bottom: 25pt !important;
        font-size: 16pt !important;
        font-weight: bold !important;
      }
      
      .agreement-parties {
        display: flex !important;
        justify-content: space-between !important;
        direction: rtl !important;
        margin-bottom: 20pt !important;
      }
      
      .agreement-terms {
        text-align: right !important;
        line-height: 1.6 !important;
        margin-bottom: 15pt !important;
      }
      
      .agreement-signatures {
        display: flex !important;
        justify-content: space-between !important;
        direction: rtl !important;
        margin-top: 40pt !important;
        padding-top: 20pt !important;
        border-top: 1pt solid #000 !important;
      }
      
      .signature-box {
        width: 200pt !important;
        height: 60pt !important;
        border: 1pt solid #000 !important;
        text-align: center !important;
        padding-top: 40pt !important;
      }
    }
  `,
};

/**
 * Mobile RTL gesture support
 */
export const rtlMobileGestures = {
  // Swipe directions (reversed for RTL)
  swipeDirections: {
    left: 'right',    // Swipe left becomes swipe right in RTL
    right: 'left',    // Swipe right becomes swipe left in RTL
    up: 'up',         // Up remains up
    down: 'down',     // Down remains down
  },
  
  // Touch event configurations
  touchConfig: {
    threshold: 50,        // Minimum distance for swipe
    restraint: 100,       // Maximum perpendicular distance
    allowedTime: 300,     // Maximum time for swipe
    
    // RTL-aware swipe handlers
    onSwipeLeft: (element: HTMLElement) => {
      // In RTL, swipe left should trigger "next" action
      element.dispatchEvent(new CustomEvent('rtl-swipe-next'));
    },
    
    onSwipeRight: (element: HTMLElement) => {
      // In RTL, swipe right should trigger "previous" action
      element.dispatchEvent(new CustomEvent('rtl-swipe-previous'));
    },
    
    onSwipeUp: (element: HTMLElement) => {
      element.dispatchEvent(new CustomEvent('rtl-swipe-up'));
    },
    
    onSwipeDown: (element: HTMLElement) => {
      element.dispatchEvent(new CustomEvent('rtl-swipe-down'));
    },
  },
  
  // Gesture classes for mobile
  gestureClasses: {
    swipeable: 'touch-pan-y select-none',
    draggable: 'touch-none select-none',
    scrollable: 'touch-auto overflow-auto',
    pinchZoom: 'touch-pinch-zoom',
  },
};

/**
 * RTL-aware animation utilities
 */
export const createRTLAnimation = (
  animationType: keyof typeof rtlAnimations,
  options: {
    duration?: string;
    delay?: string;
    easing?: string;
    fillMode?: string;
  } = {}
) => {
  // Return the base animation class only, inline styles will be handled separately
  return rtlAnimations[animationType];
};

/**
 * Create inline styles for animation properties
 */
export const createAnimationStyles = (options: {
  duration?: string;
  delay?: string;
  easing?: string;
  fillMode?: string;
} = {}) => {
  const {
    duration = '300ms',
    delay = '0ms',
    easing = 'ease-in-out',
    fillMode = 'both',
  } = options;

  return {
    animationDuration: duration,
    animationDelay: delay,
    animationTimingFunction: easing,
    animationFillMode: fillMode,
  };
};

/**
 * RTL-aware transition utilities
 */
export const createRTLTransition = (
  transitionType: keyof typeof rtlTransitions,
  customClasses?: string
) => {
  return cn(rtlTransitions[transitionType], customClasses);
};

/**
 * Chart.js RTL configuration helper
 */
export const createRTLChartConfig = (chartType: 'line' | 'bar' | 'pie' | 'doughnut', customOptions: any = {}) => {
  const baseConfig = {
    ...rtlChartConfig.options,
    ...customOptions,
  };

  // Chart-specific RTL configurations
  switch (chartType) {
    case 'line':
      return {
        ...baseConfig,
        elements: {
          line: {
            tension: 0.4,
          },
          point: {
            radius: 4,
            hoverRadius: 6,
          },
        },
      };
    
    case 'bar':
      return {
        ...baseConfig,
        indexAxis: 'y', // Horizontal bars work better with RTL
        scales: {
          ...baseConfig.scales,
          x: {
            ...baseConfig.scales.x,
            position: 'top', // X-axis on top for horizontal bars
          },
        },
      };
    
    case 'pie':
    case 'doughnut':
      return {
        ...baseConfig,
        plugins: {
          ...baseConfig.plugins,
          legend: {
            ...baseConfig.plugins.legend,
            position: 'right', // Legend on right for RTL
          },
        },
      };
    
    default:
      return baseConfig;
  }
};

/**
 * Print layout helper
 */
export const applyRTLPrintLayout = (layoutType: keyof typeof rtlPrintLayouts) => {
  const styleId = `rtl-print-${layoutType}`;
  
  // Remove existing style if present
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create and append new style
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = rtlPrintLayouts.base + rtlPrintLayouts[layoutType];
  document.head.appendChild(style);
  
  return () => {
    // Cleanup function
    const styleElement = document.getElementById(styleId);
    if (styleElement) {
      styleElement.remove();
    }
  };
};

/**
 * Mobile gesture handler for RTL
 */
export const setupRTLGestures = (element: HTMLElement) => {
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = endTime - startTime;
    
    const { threshold, restraint, allowedTime, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown } = rtlMobileGestures.touchConfig;
    
    if (deltaTime <= allowedTime) {
      if (Math.abs(deltaX) >= threshold && Math.abs(deltaY) <= restraint) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight(element);
        } else {
          onSwipeLeft(element);
        }
      } else if (Math.abs(deltaY) >= threshold && Math.abs(deltaX) <= restraint) {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown(element);
        } else {
          onSwipeUp(element);
        }
      }
    }
  };
  
  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  // Add gesture classes
  element.classList.add(...rtlMobileGestures.gestureClasses.swipeable.split(' '));
  
  // Cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
  };
};

/**
 * RTL-aware loading animations
 */
export const rtlLoadingAnimations = {
  spinner: 'animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full',
  dots: 'flex space-x-1 rtl:space-x-reverse',
  pulse: 'animate-pulse bg-muted rounded',
  skeleton: 'animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted rounded',
  shimmer: 'relative overflow-hidden bg-muted rounded before:absolute before:inset-0 before:-translate-x-full rtl:before:translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
};

/**
 * RTL-aware notification animations
 */
export const rtlNotificationAnimations = {
  slideIn: 'animate-in slide-in-from-right-full fade-in duration-300',
  slideOut: 'animate-out slide-out-to-right-full fade-out duration-200',
  toast: 'animate-in slide-in-from-top-full fade-in duration-300',
  toastOut: 'animate-out slide-out-to-top-full fade-out duration-200',
};

/**
 * Export all RTL advanced features
 */
export const rtlAdvancedFeatures = {
  animations: rtlAnimations,
  transitions: rtlTransitions,
  chartConfig: rtlChartConfig,
  printLayouts: rtlPrintLayouts,
  mobileGestures: rtlMobileGestures,
  loadingAnimations: rtlLoadingAnimations,
  notificationAnimations: rtlNotificationAnimations,
  
  // Utility functions
  createAnimation: createRTLAnimation,
  createTransition: createRTLTransition,
  createChartConfig: createRTLChartConfig,
  applyPrintLayout: applyRTLPrintLayout,
  setupGestures: setupRTLGestures,
}; 