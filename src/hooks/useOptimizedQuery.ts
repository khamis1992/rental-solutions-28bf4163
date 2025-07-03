/**
 * Hook للاستعلامات المحسنة مع التخزين المؤقت
 * Optimized Query Hook with Caching
 */

import { useQuery, useQueryClient, QueryKey } from '@tanstack/react-query';
import { performanceOptimizer } from '@/utils/performance-optimizer';

interface OptimizedQueryOptions {
  staleTime?: number;
  cacheTime?: number;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  enableBackground?: boolean;
  batchKey?: string;
}

// Hook للاستعلامات المحسنة
export const useOptimizedQuery = <T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options: OptimizedQueryOptions = {}
) => {
  const queryClient = useQueryClient();
  const optimizedConfig = performanceOptimizer.optimize();

  // تحديد إعدادات التخزين المؤقت بناءً على الأولوية
  const getCacheConfig = (priority: string) => {
    const baseConfig = optimizedConfig.cacheConfig.durations;
    
    switch (priority) {
      case 'critical':
        return { staleTime: 30 * 1000, cacheTime: 2 * 60 * 1000 }; // 30s, 2min
      case 'high':
        return { staleTime: 2 * 60 * 1000, cacheTime: 5 * 60 * 1000 }; // 2min, 5min
      case 'normal':
        return { staleTime: baseConfig.api, cacheTime: baseConfig.user };
      case 'low':
        return { staleTime: baseConfig.user, cacheTime: baseConfig.static };
      default:
        return { staleTime: baseConfig.api, cacheTime: baseConfig.user };
    }
  };

  const cacheConfig = getCacheConfig(options.priority || 'normal');

  return useQuery({
    queryKey,
    queryFn,
    staleTime: options.staleTime || cacheConfig.staleTime,
    cacheTime: options.cacheTime || cacheConfig.cacheTime,
    refetchOnWindowFocus: false,
    refetchOnMount: options.priority === 'critical',
    retry: options.priority === 'critical' ? 2 : 1,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.warn(`❌ Query failed for key: ${JSON.stringify(queryKey)}`, error);
    },
    onSuccess: () => {
      console.log(`✅ Query succeeded for key: ${JSON.stringify(queryKey)}`);
    }
  });
};

// Hook للاستعلامات السريعة (بيانات الواجهة)
export const useQuickQuery = <T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>
) => {
  return useOptimizedQuery(queryKey, queryFn, {
    priority: 'critical',
    staleTime: 30 * 1000, // 30 ثانية
    cacheTime: 2 * 60 * 1000, // دقيقتان
  });
};

// Hook للاستعلامات المباشرة (تحديث مستمر)
export const useRealtimeQuery = <T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  interval: number = 30000 // 30 ثانية افتراضياً
) => {
  return useOptimizedQuery(queryKey, queryFn, {
    priority: 'high',
    staleTime: 0, // دائماً fresh
    cacheTime: 60 * 1000, // دقيقة واحدة في الكاش
  });
};

// Hook لمعاينة الكاش
export const useCacheInspector = () => {
  const queryClient = useQueryClient();
  
  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      cachedQueries: queries.filter(q => q.state.data !== undefined).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.error !== null).length,
    };
  };

  const clearCache = () => {
    queryClient.clear();
    console.log('🧹 Cache cleared');
  };

  const invalidateQueries = (pattern: string) => {
    queryClient.invalidateQueries([pattern]);
    console.log(`🔄 Invalidated queries matching: ${pattern}`);
  };

  return {
    getCacheStats,
    clearCache,
    invalidateQueries,
  };
};

// Hook لتجميع الاستعلامات
export const useBatchQueries = () => {
  const queryClient = useQueryClient();

  const executeBatch = async (queries: Array<{
    key: QueryKey;
    fn: () => Promise<any>;
    priority?: 'critical' | 'high' | 'normal' | 'low';
  }>) => {
    // ترتيب حسب الأولوية
    const sortedQueries = queries.sort((a, b) => {
      const priorities = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorities[a.priority || 'normal'] - priorities[b.priority || 'normal'];
    });

    // تنفيذ الاستعلامات في مجموعات
    const results = [];
    const batchSize = 3;

    for (let i = 0; i < sortedQueries.length; i += batchSize) {
      const batch = sortedQueries.slice(i, i + batchSize);
      const batchPromises = batch.map(async (query) => {
        try {
          const data = await queryClient.fetchQuery({
            queryKey: query.key,
            queryFn: query.fn,
            staleTime: query.priority === 'critical' ? 0 : 30000,
          });
          return { key: query.key, data, error: null };
        } catch (error) {
          return { key: query.key, data: null, error };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
    }

    return results;
  };

  return { executeBatch };
};

// Hook لمراقبة الأداء
export const useQueryPerformance = () => {
  const queryClient = useQueryClient();

  const getPerformanceMetrics = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const metrics = queries.map(query => {
      const state = query.state;
      return {
        key: JSON.stringify(query.queryKey),
        dataUpdatedAt: state.dataUpdatedAt,
        errorUpdatedAt: state.errorUpdatedAt,
        fetchStatus: state.fetchStatus,
        isStale: query.isStale(),
        isFetching: state.isFetching,
        isLoading: state.isLoading,
      };
    });

    return {
      totalQueries: metrics.length,
      averageAge: metrics.reduce((sum, m) => sum + (Date.now() - m.dataUpdatedAt), 0) / metrics.length,
      stalePercentage: (metrics.filter(m => m.isStale).length / metrics.length) * 100,
      metrics
    };
  };

  return { getPerformanceMetrics };
};

// Hook شامل للعقود المحسنة
export const useOptimizedAgreements = (options?: OptimizedQueryOptions) => {
  return useOptimizedQuery(
    ['agreements'],
    async () => {
      const { AgreementService } = await import('@/services/AgreementService');
      return AgreementService.fetchAgreements();
    },
    {
      priority: 'high',
      ...options
    }
  );
};

// Hook شامل للعملاء المحسنة
export const useOptimizedCustomers = (options?: OptimizedQueryOptions) => {
  return useOptimizedQuery(
    ['customers'],
    async () => {
      const { CustomerService } = await import('@/services/CustomerService');
      return CustomerService.fetchCustomers();
    },
    {
      priority: 'normal',
      ...options
    }
  );
};

// Hook شامل للمركبات المحسنة
export const useOptimizedVehicles = (options?: OptimizedQueryOptions) => {
  return useOptimizedQuery(
    ['vehicles'],
    async () => {
      const { VehicleService } = await import('@/services/VehicleService');
      return VehicleService.fetchVehicles();
    },
    {
      priority: 'normal',
      ...options
    }
  );
};

export default useOptimizedQuery; 