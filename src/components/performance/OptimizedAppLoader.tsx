import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { preloadCriticalComponents } from '@/lib/performance/app-optimizer';

interface OptimizedAppLoaderProps {
  children: React.ReactNode;
  onLoadComplete?: () => void;
}

export const OptimizedAppLoader = ({ children, onLoadComplete }: OptimizedAppLoaderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('تهيئة التطبيق...');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Stage 1: Preload critical components
        setLoadingStage('تحميل المكونات الأساسية...');
        preloadCriticalComponents();
        
        // Stage 2: Wait for critical resources
        setLoadingStage('تحضير البيانات...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Stage 3: Complete
        setLoadingStage('جاري الانتهاء...');
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setIsLoading(false);
        onLoadComplete?.();
      } catch (error) {
        console.error('App initialization error:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [onLoadComplete]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner className="mx-auto mb-4" />
          <p className="text-muted-foreground">{loadingStage}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};