import React, { useState, useEffect } from 'react';
import { LoadingFallback } from '@/components/ui/loading-fallback';

interface SafeContextLoaderProps {
  children: React.ReactNode;
  delayMs?: number;
}

/**
 * SafeContextLoader - ensures contexts are loaded before rendering children
 * Helps prevent "useContext called outside provider" errors during initial app load
 */
export const SafeContextLoader: React.FC<SafeContextLoaderProps> = ({ 
  children, 
  delayMs = 100 
}) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure all context providers are mounted
    const timer = setTimeout(() => {
      setIsReady(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!isReady) {
    return <LoadingFallback />;
  }

  return <>{children}</>;
};

/**
 * Higher-order component to wrap components that use contexts
 */
export function withSafeContext<P extends object>(
  Component: React.ComponentType<P>,
  delayMs?: number
) {
  return function SafeContextWrapper(props: P) {
    return (
      <SafeContextLoader delayMs={delayMs}>
        <Component {...props} />
      </SafeContextLoader>
    );
  };
}

/**
 * Context error boundary for handling context-related errors
 */
interface ContextErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ContextErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ContextErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ContextErrorBoundaryState {
    // Check if error is context-related
    const isContextError = error.message.includes('useContext') || 
                          error.message.includes('must be used within') ||
                          error.message.includes('outside provider');
    
    if (isContextError) {
      console.error('Context error caught by boundary:', error);
      return { hasError: true, error };
    }
    
    // Re-throw non-context errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Context error details:', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">خطأ في تحميل السياق</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 