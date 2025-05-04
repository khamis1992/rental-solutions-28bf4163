
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useErrorNotification } from '@/hooks/use-error-notification';
import { useValidationHistory } from './use-validation-history';
import { useFineValidation } from './use-fine-validation';
import { usePendingStatusUpdates } from './use-pending-status-updates';

/**
 * Hook for traffic fine management including validation and status updates
 */
export const useTrafficFineManagement = () => {
  const queryClient = useQueryClient();
  const errorNotification = useErrorNotification();
  const { validationHistory, isLoading, error } = useValidationHistory();
  const { validateTrafficFine, validationErrors, clearValidationErrors } = useFineValidation();
  const { 
    pendingUpdates, 
    addPendingUpdate, 
    confirmStatusUpdate, 
    confirmAllStatusUpdates,
    dismissStatusUpdate, 
    dismissAllStatusUpdates
  } = usePendingStatusUpdates();

  // Manually validate a specific fine by ID
  const validateFineById = useMutation({
    mutationFn: async (fineId: string) => {
      try {
        const { data: fine, error: fineError } = await supabase
          .from('traffic_fines')
          .select('license_plate')
          .eq('id', fineId)
          .maybeSingle();

        if (fineError || !fine) {
          throw new Error(`Failed to retrieve fine details: ${fineError?.message || 'Fine not found'}`);
        }

        if (!fine.license_plate) {
          throw new Error('Fine record is missing license plate information');
        }

        const result = await validateTrafficFine(fine.license_plate);

        // Check if fine should be marked as paid based on validation results
        if (!result.hasFine) {
          // Instead of automatically updating, add to pending updates that need confirmation
          addPendingUpdate({
            id: fineId,
            licensePlate: fine.license_plate,
            validationResult: result,
            timestamp: new Date()
          });
        }

        return { fineId, validationResult: result, requiresConfirmation: !result.hasFine };
      } catch (error) {
        const validationError = error instanceof Error ? error : new Error('Unknown error during validation');
        console.error('Error validating fine by ID:', validationError);
        throw validationError;
      }
    },
    onSuccess: (data) => {
      if (data.requiresConfirmation) {
        toast.success('Fine validation completed', {
          description: 'Result: No fine found. Confirmation required to mark as paid.'
        });
      } else {
        toast.success('Fine validation completed', {
          description: `Result: ${data.validationResult.hasFine ? 'Fine found' : 'No fine found'}`
        });
      }
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      errorNotification.showError('Fine Validation Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        id: 'validate-fine-error'
      });
    }
  });

  // Check and update status for all pending fines
  const updateAllPendingFines = useMutation({
    mutationFn: async (_: any = {}) => {
      // Use a more resilient approach that doesn't abandon the entire batch on error
      let pendingFines: { id: string; license_plate: string }[] = [];
      let fetchError = null;
      let results: { id: string; updated: boolean; error?: string; requiresConfirmation?: boolean }[] = [];

      // Step 1: Fetch pending fines - with error handling
      try {
        const response = await supabase
          .from('traffic_fines')
          .select('id, license_plate')
          .eq('payment_status', 'pending');

        if (response.error) {
          fetchError = response.error;
          errorNotification.showError('Fetch Error', {
            description: `Error fetching pending fines: ${response.error.message}`,
            id: 'fetch-pending-fines-error'
          });
        } else {
          pendingFines = response.data || [];
        }
      } catch (error) {
        fetchError = error;
        errorNotification.showError('Unexpected Error', {
          description: `Unexpected error fetching pending fines: ${error instanceof Error ? error.message : String(error)}`,
          id: 'fetch-pending-fines-unexpected-error'
        });
      }

      // If we couldn't fetch any fines, return early with partial results
      if (pendingFines.length === 0) {
        return {
          processed: 0,
          updated: 0,
          failed: 0,
          pendingConfirmation: 0,
          fetchError: fetchError ? (fetchError instanceof Error ? fetchError.message : String(fetchError)) : undefined,
          results: [],
          message: fetchError
            ? `Error fetching pending fines: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
            : 'No pending fines found'
        };
      }

      // Step 2: Process fines in batches with resilient error handling
      const batchSize = 5;

      // Track overall progress
      let processedCount = 0;
      const totalCount = pendingFines.length;

      // Process each batch
      for (let i = 0; i < pendingFines.length; i += batchSize) {
        const batch = pendingFines.slice(i, i + batchSize);
        const batchResults: typeof results = [];

        // Process each fine in the batch
        for (const fine of batch) {
          try {
            // Skip fines without license plates
            if (!fine.license_plate) {
              batchResults.push({
                id: fine.id,
                updated: false,
                error: 'Missing license plate'
              });
              continue;
            }

            // Validate the fine
            const validationResult = await validateTrafficFine(fine.license_plate);

            // If no fine found in validation system, add to pending updates
            if (!validationResult.hasFine) {
              // Add to pending updates that need confirmation
              addPendingUpdate({
                id: fine.id,
                licensePlate: fine.license_plate,
                validationResult,
                timestamp: new Date()
              });

              // Mark as requiring confirmation in results
              batchResults.push({
                id: fine.id,
                updated: false,
                requiresConfirmation: true
              });
            } else {
              // Fine still exists in the system
              batchResults.push({ id: fine.id, updated: false });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            batchResults.push({ id: fine.id, updated: false, error: errorMessage });

            // Log the error but continue processing
            console.error(`Error processing fine ${fine.id}:`, error);
          }

          // Update progress
          processedCount++;

          // Add a delay between requests to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Add batch results to overall results
        results = [...results, ...batchResults];
      }

      // Step 3: Generate summary statistics
      const processed = results.length;
      const updated = results.filter(r => r.updated).length;
      const failed = results.filter(r => r.error).length;
      const pendingConfirmation = results.filter(r => r.requiresConfirmation).length;

      return {
        processed,
        updated,
        failed,
        pendingConfirmation,
        results,
        fetchError: fetchError ? (fetchError instanceof Error ? fetchError.message : String(fetchError)) : undefined,
        message: `Processed ${processed} fines, ${pendingConfirmation} require confirmation, ${failed} errors`
      };
    },
    onSuccess: (result) => {
      // Handle fetch errors with a warning but still show results
      if (result.fetchError) {
        toast.warning('Partial results', {
          description: `Some fines may not have been processed. ${result.fetchError}`
        });
      }

      // Show appropriate message based on results
      if (result.pendingConfirmation > 0) {
        toast.info('Confirmation required', {
          description: `${result.pendingConfirmation} fines can be marked as paid. Please review and confirm.`
        });
      } else if (result.updated > 0) {
        toast.success('Batch update completed', {
          description: result.message
        });
      } else if (result.processed > 0) {
        toast.info('Batch validation completed', {
          description: result.message
        });
      } else if (!result.fetchError) { // Only show this if there wasn't a fetch error
        toast('No changes made', {
          description: result.message
        });
      }

      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      errorNotification.showError('Batch Update Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        id: 'batch-update-error'
      });
    }
  });

  return {
    validationHistory,
    isLoading,
    error,
    validateTrafficFine,
    validateFineById,
    updateAllPendingFines,
    validationErrors,
    clearValidationErrors,
    pendingUpdates,
    confirmStatusUpdate,
    confirmAllStatusUpdates,
    dismissStatusUpdate,
    dismissAllStatusUpdates
  };
};
