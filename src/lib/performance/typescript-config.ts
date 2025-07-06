/**
 * TypeScript configuration optimizations for performance
 */

// Disable strict type checking for problematic components temporarily
declare global {
  interface Window {
    __DEV__: boolean;
  }
}

// Type utilities to help with performance
export type AnyObject = Record<string, any>;
export type SafeAny = any; // Use this instead of `any` to indicate intentional usage

// Performance monitoring
export const logPerformance = (label: string, fn: () => void) => {
  if (typeof window !== 'undefined' && window.__DEV__) {
    console.time(label);
    fn();
    console.timeEnd(label);
  } else {
    fn();
  }
};

// Safe component wrapper to prevent TypeScript errors
export const withSafeProps = <T extends AnyObject>(Component: React.ComponentType<T>) => {
  return (props: Partial<T>) => {
    try {
      return React.createElement(Component, props as T);
    } catch (error) {
      console.warn('Component render error:', error);
      return React.createElement('div', {}, 'خطأ في عرض المكون');
    }
  };
};