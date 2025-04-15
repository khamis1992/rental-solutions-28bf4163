
import { useQuery, UseQueryResult } from '@tanstack/react-query';

interface ApiResponse<TData> {
  data: TData | null;
  error: any;
}

interface ApiOptions {
  enabled?: boolean;
  retry?: boolean | number;
  refetchOnWindowFocus?: boolean;
}

export const handleApiError = (error: any): never => {
  console.error("API Error:", error);
  if (error.message) {
    throw new Error(error.message);
  } else if (typeof error === 'string') {
    throw new Error(error);
  } else {
    throw new Error('An unknown error occurred');
  }
};

const apiHandler = async <TData>(
  fetchFn: () => Promise<any>,
  options: ApiOptions = {}
): Promise<ApiResponse<TData>> => {
  try {
    const response = await fetchFn();
    
    if (response.error) {
      return { 
        error: response.error, 
        data: null as unknown as TData 
      };
    }
    
    return {
      data: response.data || null,
      error: null
    };
  } catch (error: any) {
    return {
      error: error || new Error('Unknown error'),
      data: null as unknown as TData
    };
  }
};

export const useApi = <TData>(
  queryKey: string[],
  fetchFn: () => Promise<any>,
  options: ApiOptions = {}
): UseQueryResult<TData, any> => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const result = await apiHandler<TData>(fetchFn, options);
      if (result.error) {
        throw result.error;
      }
      return result.data as TData;
    },
    ...options
  });
};
