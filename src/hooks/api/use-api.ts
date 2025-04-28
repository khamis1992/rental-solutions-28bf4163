
import { handleApiError, handleApiSuccess } from '@/lib/api/error-handlers';
import { useApiMutation } from './use-api-mutation';
import { useApiQuery } from './use-api-query';

/**
 * Re-exports all API hook functionality
 */
export {
  useApiMutation,
  useApiQuery,
  handleApiError,
  handleApiSuccess
};
