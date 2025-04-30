
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { handleApiError } from '@/lib/api/error-handlers';
import { createQueryConfig } from '@/lib/api/query-config';

export function useApiQuery<TData>(
  queryKey: unknown[],
  queryFn: () => Promise<TData>,
  options?: {
    enabled?: boolean;
    refetchOnMount?: boolean;
    refetchOnWindowFocus?: boolean;
    refetchOnReconnect?: boolean;
    retry?: boolean | number;
  }
): UseQueryResult<TData | null, Error> {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await queryFn();
        
        if (response === null || response === undefined) {
          throw new Error('No data received from the server');
        }
        
        if (typeof response === 'object' && 'error' in response) {
          const supabaseResponse = response as { error: any; data: TData };
          if (supabaseResponse.error) {
            throw supabaseResponse.error;
          }
          return supabaseResponse.data;
        }
        
        return response;
      } catch (error) {
        handleApiError(error, `Error fetching ${queryKey[0]}`);
        throw error;
      }
    },
    ...createQueryConfig(options)
  });
}
