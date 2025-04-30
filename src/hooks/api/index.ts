
// Re-export the API hooks for easier imports
export { useApiQuery } from './use-api-query';
export { useApiMutation } from './use-api-mutation';
export { useCrudApi } from './use-crud-api';

// Export a single-file hook import for backward compatibility
export const useApi = {
  useApiQuery,
  useApiMutation,
  useCrudApi
};
