/**
 * Context Error Handler Utility
 * Provides centralized error handling for React Context issues
 */

export interface ContextFallback<T> {
  fallbackValue: T;
  warningMessage: string;
}

/**
 * Safe context hook wrapper that provides fallback values
 */
export function withContextFallback<T>(
  contextValue: T | null | undefined,
  fallback: ContextFallback<T>
): T {
  if (contextValue === null || contextValue === undefined) {
    console.warn(fallback.warningMessage);
    return fallback.fallbackValue;
  }
  return contextValue;
}

/**
 * Auth context fallback values
 */
export const AUTH_FALLBACK = {
  fallbackValue: {
    user: null,
    session: null,
    loading: true,
    signIn: async () => { console.warn('signIn called outside SafeAuthProvider'); },
    signUp: async () => { console.warn('signUp called outside SafeAuthProvider'); },
    signOut: async () => { console.warn('signOut called outside SafeAuthProvider'); },
    resetPassword: async () => { console.warn('resetPassword called outside SafeAuthProvider'); },
    updateUserData: async () => { console.warn('updateUserData called outside SafeAuthProvider'); },
  },
  warningMessage: 'useSafeAuth called outside SafeAuthProvider, using fallback values'
};

/**
 * Profile context fallback values
 */
export const PROFILE_FALLBACK = {
  fallbackValue: {
    profile: null,
    isLoading: true,
    error: null,
    updateProfile: async () => { console.warn('updateProfile called outside ProfileProvider'); }
  },
  warningMessage: 'useProfile called outside ProfileProvider, using fallback values'
};

/**
 * Documentation mode context fallback values
 */
export const DOCUMENTATION_MODE_FALLBACK = {
  fallbackValue: {
    isDocumentationMode: false,
    toggleDocumentationMode: () => { console.warn('toggleDocumentationMode called outside provider'); }
  },
  warningMessage: 'useDocumentationMode called outside DocumentationModeProvider, using fallback'
};

/**
 * Settings context fallback values  
 */
export const SETTINGS_FALLBACK = {
  fallbackValue: {
    settings: {},
    loading: true,
    error: null,
    updateSetting: async () => { console.warn('updateSetting called outside SafeSettingsProvider'); },
    getSetting: () => undefined,
    refreshSettings: async () => { console.warn('refreshSettings called outside SafeSettingsProvider'); }
  },
  warningMessage: 'useSafeSettings called outside SafeSettingsProvider, using fallback values'
};

/**
 * Context error logging utility
 */
export function logContextError(error: Error, contextName: string, componentStack?: string) {
  console.error(`Context Error in ${contextName}:`, {
    error: error.message,
    stack: error.stack,
    componentStack,
    timestamp: new Date().toISOString(),
    url: window.location.href
  });
}

/**
 * Safe context access with error boundary
 */
export function safeContextAccess<T>(
  accessor: () => T,
  fallback: ContextFallback<T>,
  contextName: string
): T {
  try {
    const result = accessor();
    return withContextFallback(result, fallback);
  } catch (error) {
    logContextError(error as Error, contextName);
    return fallback.fallbackValue;
  }
} 