
// Re-export from the api hooks for backward compatibility
import { useApiQuery, useApiMutation, useCrudApi } from '@/hooks/api';

export { useApiQuery, useApiMutation, useCrudApi };

// For named imports
export const useApi = {
  useApiQuery,
  useApiMutation,
  useCrudApi
};

export default {
  useApiQuery,
  useApiMutation,
  useCrudApi
};
