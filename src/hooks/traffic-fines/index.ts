
// Main integrated hook for traffic fine validation
export { useTrafficFineManagement as useTrafficFinesValidation } from './use-traffic-fine-management';

// Export the main hook that was previously missing
export { useTrafficFines } from './use-traffic-fines';

// Individual hooks for specific functionality
export { useFineValidation, validateFineDate } from './use-fine-validation';
export { useBatchValidation } from './use-batch-validation';
export { useValidationHistory } from './use-validation-history';
export { usePendingStatusUpdates } from './use-pending-status-updates';

// Types
export type { 
  ValidationResult,
  ApiValidationResult,
  PendingStatusUpdate,
  ValidationError,
  BatchValidationOptions,
  ValidationProgress,
  BatchValidationResult,
  BasicMutationResult
} from './types';

// Utilities
export {
  mapToValidationError,
  groupValidationErrors,
  generateErrorSummary
} from './validation-errors';
