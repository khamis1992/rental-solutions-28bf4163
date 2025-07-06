// Environment configuration constants
export const ENV_CONFIG = {
  SUPABASE_URL: "https://vqdlsidkucrownbfuouq.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZGxzaWRrdWNyb3duYmZ1b3VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMDc4NDgsImV4cCI6MjA0OTg4Mzg0OH0.ARDnjN_J_bz74zQfV7IRDrq6ZL5-xs9L21zI3eG6O5Y",
  
  // API Keys (these will be loaded from Supabase Edge Function secrets)
  API_KEYS: {
    OPENAI: '', // Will be loaded from server
    GOOGLE_VISION: '', // Will be loaded from server
  },
  
  // App configuration
  APP: {
    NAME: 'Fleet Management System',
    VERSION: '1.0.0',
    LOCALE: 'ar-SA',
  }
} as const;

// Helper to check if we're in development mode
export const isDevelopment = () => {
  return typeof window !== 'undefined' && window.location.hostname === 'localhost';
};

// Helper to suppress common development warnings
export const suppressDevelopmentWarnings = () => {
  if (isDevelopment()) {
    // Override console.warn for specific messages
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      
      // Suppress known development warnings
      if (
        message.includes('Environment variables not loaded') ||
        message.includes('Multiple GoTrueClient instances') ||
        message.includes('API key not found') ||
        message.includes('using fallback values')
      ) {
        return; // Suppress these warnings
      }
      
      // Show other warnings normally
      originalWarn.apply(console, args);
    };
  }
};

// Initialize warning suppression on module load
suppressDevelopmentWarnings();