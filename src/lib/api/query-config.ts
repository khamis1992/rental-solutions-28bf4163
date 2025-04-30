
import { UseQueryOptions } from '@tanstack/react-query';

export const defaultQueryConfig = {
  retry: (failureCount: number, error: any) => {
    // Don't retry on specific error types
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      if (['23505', '23503', '42P01', '42703'].includes(code)) {
        return false;
      }
    }
    return failureCount < 3;
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: false
};

export function createQueryConfig<TData>(
  options?: Partial<UseQueryOptions<TData, Error>>
): UseQueryOptions<TData, Error> {
  return {
    ...defaultQueryConfig,
    ...options
  };
}
