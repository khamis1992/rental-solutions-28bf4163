
import debounce from 'lodash/debounce';
import performanceMonitor from './performance-monitor';

// Track loaded stylesheets to avoid duplicate loading
const loadedStylesheets = new Set<string>();

/**
 * Enhanced helper function to efficiently load RTL specific stylesheets
 * @param isRTL Boolean indicating if the current mode is RTL
 */
export const loadRTLStyles = (isRTL: boolean) => {
  performanceMonitor.startMeasure('rtl_style_loading');
  
  try {
    // Apply document direction attribute change - this is most critical
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = isRTL ? 'ar' : 'en';
    
    // Add/remove RTL class to body
    if (isRTL) {
      document.body.classList.add('rtl-mode');
    } else {
      document.body.classList.remove('rtl-mode');
    }
  } finally {
    performanceMonitor.endMeasure('rtl_style_loading', true);
  }
};

/**
 * Pre-load RTL stylesheets in the background during idle time
 */
export const preloadRTLStylesheets = () => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      loadRTLStylesheetFiles();
    }, { timeout: 2000 });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      loadRTLStylesheetFiles();
    }, 1000);
  }
};

/**
 * Setup an observer to handle RTL style changes across the application
 */
export const setupRTLStylesObserver = () => {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === 'dir') {
        const isRTL = document.documentElement.dir === 'rtl';
        toggleRTLStylesheets(isRTL);
      }
    }
  });
  
  observer.observe(document.documentElement, { attributes: true });
  return observer;
};

/**
 * Load all RTL stylesheets
 */
const loadRTLStylesheetFiles = () => {
  performanceMonitor.startMeasure('rtl_stylesheet_loading');
  
  const stylesheets = [
    '/css/rtl.css',
    '/css/rtl-charts.css',
    '/css/rtl-forms.css'
  ];
  
  // Load each stylesheet only once
  stylesheets.forEach(stylesheet => {
    if (!loadedStylesheets.has(stylesheet)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = stylesheet;
      link.dataset.rtl = 'true';
      document.head.appendChild(link);
      loadedStylesheets.add(stylesheet);
    }
  });
  
  performanceMonitor.endMeasure('rtl_stylesheet_loading', true);
};

/**
 * Efficiently toggle RTL stylesheets visibility based on current direction
 */
export const toggleRTLStylesheets = debounce((isRTL: boolean) => {
  performanceMonitor.startMeasure('toggle_rtl_stylesheets');
  
  const rtlStylesheets = document.querySelectorAll('link[data-rtl="true"]');
  rtlStylesheets.forEach(sheet => {
    (sheet as HTMLLinkElement).disabled = !isRTL;
  });
  
  performanceMonitor.endMeasure('toggle_rtl_stylesheets', true);
}, 100);

/**
 * Initialize RTL handling on app start
 */
export const initializeRTL = () => {
  // Check for RTL setting from localStorage
  const savedDirection = localStorage.getItem('direction');
  const isRTL = savedDirection === 'rtl';
  
  // Apply direction settings
  loadRTLStyles(isRTL);
  
  // Preload stylesheets for faster switching later
  if (!isRTL) {
    preloadRTLStylesheets();
  }
  
  return isRTL;
};
