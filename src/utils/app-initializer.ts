
import performanceMonitor from './performance-monitor';

/**
 * Stages of app initialization
 */
export type InitStage = 
  | 'pre-init'       // Before any initialization
  | 'essential'      // Critical core services
  | 'ui'             // UI framework setup
  | 'auth'           // Authentication
  | 'data'           // Data loading/prefetching
  | 'features'       // Additional features
  | 'complete';      // All initialization done

interface InitializeOptions {
  skipFeatures?: boolean;
  skipPrefetching?: boolean;
  onStageComplete?: (stage: InitStage) => void;
}

/**
 * Initializes the application in stages to optimize loading
 */
const initializeApp = async (options: InitializeOptions = {}): Promise<void> => {
  const { 
    skipFeatures = false, 
    skipPrefetching = false,
    onStageComplete 
  } = options;
  
  // Start measuring full initialization
  performanceMonitor.startMeasure('app_full_initialization');
  
  try {
    // STAGE 1: Essential core services
    performanceMonitor.startMeasure('init_essential');
    
    // Critical error handling setup
    setupErrorHandling();
    
    // End of essential stage
    performanceMonitor.endMeasure('init_essential', true);
    if (onStageComplete) onStageComplete('essential');
    
    // STAGE 2: UI initialization
    performanceMonitor.startMeasure('init_ui');
    
    // Detect and set appropriate theme/RTL settings
    await initializeUISettings();
    
    // End of UI stage
    performanceMonitor.endMeasure('init_ui', true);
    if (onStageComplete) onStageComplete('ui');
    
    // STAGE 3: Authentication
    performanceMonitor.startMeasure('init_auth');
    
    // Check authentication state
    await initializeAuth();
    
    // End of auth stage
    performanceMonitor.endMeasure('init_auth', true);
    if (onStageComplete) onStageComplete('auth');
    
    // STAGE 4: Initial data
    performanceMonitor.startMeasure('init_data');
    
    // Prefetch essential data
    if (!skipPrefetching) {
      await prefetchEssentialData();
    }
    
    // End of data stage
    performanceMonitor.endMeasure('init_data', true);
    if (onStageComplete) onStageComplete('data');
    
    // STAGE 5: Features
    if (!skipFeatures) {
      performanceMonitor.startMeasure('init_features');
      
      // Initialize additional features in parallel
      await Promise.all([
        initializeAnalytics(),
        initializeNotifications()
      ]);
      
      // End of features stage
      performanceMonitor.endMeasure('init_features', true);
      if (onStageComplete) onStageComplete('features');
    }
    
    // All done
    if (onStageComplete) onStageComplete('complete');
    
    // End full initialization measurement
    performanceMonitor.endMeasure('app_full_initialization', true);
    
    return;
  } catch (error) {
    console.error('Error during app initialization:', error);
    throw error;
  }
};

// Helper functions for each initialization stage

function setupErrorHandling() {
  // Set up global error handlers
  if (typeof window !== 'undefined') {
    window.onerror = (message, source, lineno, colno, error) => {
      console.error('Global error:', error);
      // We could send this to an error reporting service
      return false;
    };
    
    // Suppress Supabase schema cache errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('schema cache')) {
        return; // Suppress schema cache related errors
      }
      originalConsoleError.apply(console, args);
    };
  }
}

async function initializeUISettings() {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  }

  // Check for RTL setting
  const savedDirection = localStorage.getItem('direction');
  if (savedDirection === 'rtl') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }

  // Preload critical fonts
  const linkFont = document.createElement('link');
  linkFont.rel = 'preload';
  linkFont.href = '/fonts/inter-var-latin.woff2';
  linkFont.as = 'font';
  linkFont.type = 'font/woff2';
  linkFont.crossOrigin = 'anonymous';
  document.head.appendChild(linkFont);
}

async function initializeAuth() {
  // Auth initialization
  return Promise.resolve();
}

async function prefetchEssentialData() {
  // Prefetch essential data needed for the initial view
  return Promise.resolve();
}

async function initializeAnalytics() {
  // Initialize analytics
  return Promise.resolve();
}

async function initializeNotifications() {
  // Initialize notification system
  return Promise.resolve();
}

export default initializeApp;

