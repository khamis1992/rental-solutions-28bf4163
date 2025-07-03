import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PaginatedAgreementService,
  PaginatedAgreementFilters,
  PaginatedResult
} from '@/services/PaginatedAgreementService';
import { useServerPagination } from '@/hooks/use-pagination';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';
import { useErrorHandler } from '@/hooks/useErrorHandler';

// إنشاء instance من الخدمة
const paginatedAgreementService = new PaginatedAgreementService();

interface UsePaginatedAgreementServiceOptions {
  initialFilters?: PaginatedAgreementFilters;
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  staleTime?: number;
  cacheTime?: number;
}

export const usePaginatedAgreementService = (options: UsePaginatedAgreementServiceOptions = {}) => {
  const {
    initialFilters = { page: 1, pageSize: 25 },
    enableAutoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    staleTime = 300000, // 5 minutes
    cacheTime = 600000, // 10 minutes
  } = options;

  const [filters, setFilters] = useState<PaginatedAgreementFilters>(initialFilters);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  // Query key for caching
  const queryKey = useMemo(() => 
    ['agreements-paginated', filters, searchTerm], 
    [filters, searchTerm]
  );

  // Main paginated query
  const {
    data: paginatedResult,
    isLoading,
    isFetching,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        let result;
        
        if (searchTerm?.trim()) {
          result = await paginatedAgreementService.searchAgreementsPaginated(
            searchTerm,
            filters
          );
        } else {
          result = await paginatedAgreementService.fetchAgreementsPaginated(filters);
        }

        if (!result.success) {
          throw new Error(result.error?.toString() || 'Failed to fetch agreements');
        }

        return result.data;
      } catch (error) {
        handleError(error, {
          showToast: true,
          logError: true,
          context: { 
            service: 'paginatedAgreements', 
            action: searchTerm ? 'search' : 'fetch',
            filters,
            searchTerm 
          }
        });
        throw error;
      }
    },
    staleTime,
    gcTime: cacheTime,
    refetchInterval: enableAutoRefresh ? refreshInterval : false,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Server-side pagination hook
  const serverPagination = useServerPagination(
    paginatedResult?.totalCount || 0,
    {
      pageSize: filters.pageSize || 25,
      initialPage: filters.page || 1,
    },
    useCallback((page: number, pageSize: number) => {
      setFilters(prev => ({ ...prev, page, pageSize }));
    }, [])
  );

  // Recent agreements query (for dashboard)
  const {
    data: recentAgreements,
    isLoading: isLoadingRecent
  } = useQuery({
    queryKey: ['agreements-recent'],
    queryFn: async () => {
      const result = await paginatedAgreementService.getRecentAgreements(10);
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch recent agreements');
      }
      return result.data;
    },
    staleTime: 60000, // 1 minute for recent data
    gcTime: 300000, // 5 minutes
  });

  // Agreement stats query (for dashboard)
  const {
    data: agreementStats,
    isLoading: isLoadingStats
  } = useQuery({
    queryKey: ['agreements-stats'],
    queryFn: async () => {
      const result = await paginatedAgreementService.getAgreementStats();
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Failed to fetch agreement stats');
      }
      return result.data;
    },
    staleTime: 300000, // 5 minutes for stats
    gcTime: 600000, // 10 minutes
  });

  // Actions
  const updateFilters = useCallback((newFilters: Partial<PaginatedAgreementFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: newFilters.page || 1, // Reset to first page unless explicitly set
    }));
  }, []);

  const search = useCallback((term: string) => {
    setSearchTerm(term);
    setFilters(prev => ({ ...prev, page: 1 })); // Reset to first page on search
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchTerm('');
  }, [initialFilters]);

  const refreshData = useCallback(async () => {
    try {
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: ['agreements-paginated'] });
      await queryClient.invalidateQueries({ queryKey: ['agreements-recent'] });
      await queryClient.invalidateQueries({ queryKey: ['agreements-stats'] });
      
      // Refetch current data
      await refetch();
      
      toast.success('تم تحديث البيانات بنجاح');
    } catch (error) {
      handleError(error, {
        showToast: true,
        logError: true,
        context: { action: 'refresh' }
      });
    }
  }, [queryClient, refetch, handleError]);

  // Prefetch next page for better UX
  const prefetchNextPage = useCallback(() => {
    if (paginatedResult?.hasNextPage) {
      const nextPageFilters = { ...filters, page: (filters.page || 1) + 1 };
      
      queryClient.prefetchQuery({
        queryKey: ['agreements-paginated', nextPageFilters, searchTerm],
        queryFn: async () => {
          const result = searchTerm 
            ? await paginatedAgreementService.searchAgreementsPaginated(searchTerm, nextPageFilters)
            : await paginatedAgreementService.fetchAgreementsPaginated(nextPageFilters);
          
          return result.success ? result.data : null;
        },
        staleTime: 300000, // 5 minutes
      });
    }
  }, [paginatedResult?.hasNextPage, filters, searchTerm, queryClient]);

  // Auto-prefetch when current page changes
  useMemo(() => {
    if (paginatedResult?.hasNextPage && !isLoading && !isFetching) {
      const timer = setTimeout(() => {
        prefetchNextPage();
      }, 1000); // Delay prefetch by 1 second

      return () => clearTimeout(timer);
    }
  }, [paginatedResult?.currentPage, paginatedResult?.hasNextPage, isLoading, isFetching, prefetchNextPage]);

  return {
    // Data
    agreements: paginatedResult?.data || [],
    totalCount: paginatedResult?.totalCount || 0,
    totalPages: paginatedResult?.totalPages || 0,
    currentPage: paginatedResult?.currentPage || 1,
    pageSize: paginatedResult?.pageSize || 25,
    hasNextPage: paginatedResult?.hasNextPage || false,
    hasPreviousPage: paginatedResult?.hasPreviousPage || false,
    
    // Loading states
    isLoading,
    isFetching,
    isRefetching,
    isLoadingRecent,
    isLoadingStats,
    
    // Additional data
    recentAgreements: recentAgreements || [],
    agreementStats: agreementStats || { total: 0, active: 0, expired: 0, pending: 0 },
    
    // Current state
    filters,
    searchTerm,
    error,
    
    // Actions
    updateFilters,
    search,
    clearSearch,
    resetFilters,
    refreshData,
    refetch,
    prefetchNextPage,
    
    // Pagination helpers
    serverPagination,
  };
};

// Separate hook for quick agreement lookup
export const useAgreementLookup = () => {
  const queryClient = useQueryClient();
  
  const searchMutation = useMutation({
    mutationFn: async (searchTerm: string) => {
      if (!searchTerm?.trim()) {
        return [];
      }
      
      const result = await paginatedAgreementService.searchAgreementsPaginated(
        searchTerm,
        { pageSize: 10 } // Small page size for lookup
      );
      
      if (!result.success) {
        throw new Error(result.error?.toString() || 'Search failed');
      }
      
      return result.data.data;
    },
    onError: (error) => {
      toast.error(`خطأ في البحث: ${error.message}`);
    }
  });

  return {
    search: searchMutation.mutate,
    searchAsync: searchMutation.mutateAsync,
    results: searchMutation.data || [],
    isSearching: searchMutation.isPending,
    error: searchMutation.error,
    reset: searchMutation.reset,
  };
}; 