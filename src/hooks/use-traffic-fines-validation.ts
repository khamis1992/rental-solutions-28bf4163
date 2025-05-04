import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { BasicMutationResult } from '@/utils/type-utils';
import {
  ValidationError,
  mapToValidationError,
  groupValidationErrors,
  generateErrorSummary
} from '@/utils/validation/traffic-fine-validation-errors';
import { useErrorNotification } from '@/hooks/use-error-notification';

export interface ValidationResult {
  licensePlate: string;
  validationDate: Date;
  validationSource: string;
  hasFine: boolean;
  details?: string;
  validationId?: string;
}

export interface PendingStatusUpdate {
  id: string;
  licensePlate: string;
  validationResult: ValidationResult;
  timestamp: Date;
}

export const useTrafficFinesValidation = () => {
  const queryClient = useQueryClient();
  const errorNotification = useErrorNotification();

  // Track validation errors
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Track pending status updates that need confirmation
  const [pendingUpdates, setPendingUpdates] = useState<PendingStatusUpdate[]>([]);

  // Fetch validation history
  const { data: validationHistory, isLoading, error } = useQuery({
    queryKey: ['trafficFineValidations'],
    queryFn: async (): Promise<ValidationResult[]> => {
      try {
        const { data, error } = await supabase
          .from('traffic_fine_validations')
          .select('*')
          .order('validation_date', { ascending: false })
          .limit(20);

        if (error) {
          const errorMessage = `Failed to fetch validation history: ${error.message}`;
          errorNotification.showError('Validation History Error', {
            description: errorMessage,
            id: 'validation-history-error'
          });
          throw new Error(errorMessage);
        }

        if (!data) return [];

        // Transform the data to match the ValidationResult interface
        return data.map(item => {
          // Parse the result JSON field which contains our validation data
          let resultData: Record<string, any> = {};
          try {
            if (typeof item.result === 'string') {
              resultData = JSON.parse(item.result);
            } else if (typeof item.result === 'object' && item.result !== null) {
              resultData = item.result;
            }
          } catch (parseError) {
            console.error('Error parsing result data:', parseError);
            resultData = {};
          }

          return {
            validationId: item.id,
            licensePlate: resultData.licensePlate || '',
            validationDate: new Date(item.validation_date),
            validationSource: resultData.validationSource || 'MOI Traffic System',
            hasFine: resultData.hasFine === true,
            details: resultData.details || ''
          };
        });
      } catch (error) {
        console.error('Error fetching validation history:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Track validation attempts - simplified return type to avoid deep type instantiation
  interface ValidationAttempt {
    id: string;
    license_plate: string;
    validation_date: string;
    status: string;
  }

  const incrementValidationAttempt = async (licensePlate: string): Promise<ValidationAttempt | null> => {
    if (typeof licensePlate !== 'string' || !licensePlate.trim()) {
      throw new Error('Invalid license plate format');
    }

    try {
      const { data: existingValidations, error: queryError } = await supabase
        .from('traffic_fine_validations')
        .select('id, license_plate, validation_date, status')
        .eq('license_plate', licensePlate.trim())
        .maybeSingle();

      if (queryError) {
        console.error('Error checking validation attempts:', queryError);
        return null;
      }

      return existingValidations;
    } catch (error) {
      console.error('Error in incrementValidationAttempt:', error);
      return null;
    }
  };

  // Validate traffic fine - explicitly specify return type to avoid deep type instantiation
  const validateTrafficFine = async (licensePlate: string): Promise<ValidationResult> => {
    try {
      // Validate input
      if (!licensePlate || typeof licensePlate !== 'string' || !licensePlate.trim()) {
        throw new Error('Invalid license plate format');
      }

      // Log validation attempt
      await incrementValidationAttempt(licensePlate);

      // Call the edge function to validate the traffic fine
      const { data, error } = await supabase.functions.invoke('validate-traffic-fine', {
        body: { licensePlate }
      });

      if (error) {
        console.error('Error from validation function:', error);
        throw new Error(`Validation failed: ${error.message}`);
      }

      // Ensure we have valid data that matches our ValidationResult interface
      const validationData = data as ValidationResult;

      // Store validation result in database
      const { error: logError } = await supabase
        .from('traffic_fine_validations')
        .insert({
          license_plate: validationData.licensePlate,
          validation_date: new Date().toISOString(),
          result: data,
          status: 'completed'
        });

      if (logError) {
        errorNotification.showError('Validation Logging Error', {
          description: `Error logging validation: ${logError.message}`,
          id: 'validation-log-error'
        });
      }

      // Invalidate the query to refresh the validation history
      queryClient.invalidateQueries({ queryKey: ['trafficFineValidations'] });

      return validationData;
    } catch (error) {
      const validationError = mapToValidationError(error, licensePlate);

      // Store validation errors for later analysis
      setValidationErrors(prev => [...prev, validationError]);

      // Show notification for critical errors
      errorNotification.showError(`Validation Error: ${validationError.code}`, {
        description: validationError.message,
        id: `traffic-validation-${validationError.code}`
      });

      throw validationError;
    }
  };

  // Batch validate multiple license plates
  const batchValidateTrafficFines = async (licensePlates: string[]): Promise<{
    results: ValidationResult[];
    errors: ValidationError[];
    summary: {
      total: number;
      succeeded: number;
      failed: number;
    }
  }> => {
    const results: ValidationResult[] = [];
    const errors: ValidationError[] = [];

    // Process each license plate sequentially to avoid overwhelming the system
    for (const plate of licensePlates) {
      try {
        const result = await validateTrafficFine(plate);
        results.push(result);

        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        // If it's already a ValidationError, use it directly
        if (error && typeof error === 'object' && 'code' in error) {
          errors.push(error as ValidationError);
        } else {
          // Otherwise, map it to a structured validation error
          errors.push(mapToValidationError(error, plate));
        }
      }
    }

    // Process and group errors for better reporting
    const groupedErrors = groupValidationErrors(errors);
    const errorSummary = generateErrorSummary(groupedErrors);

    // Show summary notification
    if (results.length > 0) {
      if (errors.length > 0) {
        // Partial success
        toast.warning(
          `Validated ${results.length}/${licensePlates.length} license plates`,
          {
            description: `Failed: ${errors.length} plates. ${errorSummary}`,
            duration: 5000
          }
        );
      } else {
        // Complete success
        toast.success(
          `Validated ${results.length}/${licensePlates.length} license plates`,
          {
            description: 'All validations completed successfully'
          }
        );
      }
    } else if (errors.length > 0) {
      // Complete failure
      errorNotification.showError(
        `Validation Failed`,
        {
          description: errorSummary,
          id: 'batch-validation-error'
        }
      );
    }

    // Return comprehensive results for further handling if needed
    return {
      results,
      errors,
      summary: {
        total: licensePlates.length,
        succeeded: results.length,
        failed: errors.length
      }
    };
  };

  // Manually validate a specific fine by ID - using BasicMutationResult to avoid type issues
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
          throw new Error(`Fine record is missing license plate information`);
        }

        const result = await validateTrafficFine(fine.license_plate);

        // Check if fine should be marked as paid based on validation results
        if (!result.hasFine) {
          // Instead of automatically updating, add to pending updates that need confirmation
          const pendingUpdate: PendingStatusUpdate = {
            id: fineId,
            licensePlate: fine.license_plate,
            validationResult: result,
            timestamp: new Date()
          };

          // Add to pending updates
          setPendingUpdates(prev => {
            // Remove any existing pending update for this fine
            const filtered = prev.filter(update => update.id !== fineId);
            // Add the new pending update
            return [...filtered, pendingUpdate];
          });

          // Notify user that confirmation is needed
          toast.info('Confirmation Required', {
            description: `Fine with license plate ${fine.license_plate} can be marked as paid. Please confirm this action.`,
            duration: 5000
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
        toast.success(`Fine validation completed`, {
          description: `Result: No fine found. Confirmation required to mark as paid.`
        });
      } else {
        toast.success(`Fine validation completed`, {
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

  // Check and update status for all pending fines - using BasicMutationResult type
  const updateAllPendingFines = useMutation({
    // Fix TypeScript error by accepting an empty object parameter
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
              const pendingUpdate: PendingStatusUpdate = {
                id: fine.id,
                licensePlate: fine.license_plate,
                validationResult: validationResult,
                timestamp: new Date()
              };

              // Add to pending updates
              setPendingUpdates(prev => {
                // Remove any existing pending update for this fine
                const filtered = prev.filter(update => update.id !== fine.id);
                // Add the new pending update
                return [...filtered, pendingUpdate];
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

  // Clear all validation errors
  const clearValidationErrors = () => {
    setValidationErrors([]);
  };

  // Apply a single pending update
  const confirmStatusUpdate = useMutation({
    mutationFn: async (fineId: string) => {
      try {
        // Find the pending update
        const pendingUpdate = pendingUpdates.find(update => update.id === fineId);

        if (!pendingUpdate) {
          throw new Error('No pending update found for this fine');
        }

        // Apply the update
        const { error: updateError } = await supabase
          .from('traffic_fines')
          .update({
            payment_status: 'paid',
            payment_date: new Date().toISOString()
          })
          .eq('id', fineId);

        if (updateError) {
          throw new Error(`Failed to update fine status: ${updateError.message}`);
        }

        // Remove from pending updates
        setPendingUpdates(prev => prev.filter(update => update.id !== fineId));

        return { success: true, fineId };
      } catch (error) {
        console.error('Error confirming status update:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Fine status updated', {
        description: `Fine has been marked as paid`
      });
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      errorNotification.showError('Status Update Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        id: 'confirm-update-error'
      });
    }
  });

  // Apply all pending updates
  const confirmAllStatusUpdates = useMutation({
    mutationFn: async () => {
      try {
        if (pendingUpdates.length === 0) {
          return { success: true, updated: 0 };
        }

        const results = [];

        // Process each pending update
        for (const update of pendingUpdates) {
          try {
            const { error: updateError } = await supabase
              .from('traffic_fines')
              .update({
                payment_status: 'paid',
                payment_date: new Date().toISOString()
              })
              .eq('id', update.id);

            results.push({
              id: update.id,
              success: !updateError,
              error: updateError ? updateError.message : undefined
            });
          } catch (error) {
            results.push({
              id: update.id,
              success: false,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }

        // Clear all pending updates
        setPendingUpdates([]);

        const successCount = results.filter(r => r.success).length;

        return {
          success: true,
          updated: successCount,
          total: pendingUpdates.length,
          results
        };
      } catch (error) {
        console.error('Error confirming all status updates:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast.success('Batch update completed', {
        description: `${data.updated} of ${data.total} fines have been marked as paid`
      });
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error) => {
      errorNotification.showError('Batch Update Failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        id: 'confirm-all-error'
      });
    }
  });

  // Dismiss a pending update without applying it
  const dismissStatusUpdate = (fineId: string) => {
    setPendingUpdates(prev => prev.filter(update => update.id !== fineId));
    toast('Update dismissed', {
      description: 'The fine status will remain unchanged'
    });
  };

  // Dismiss all pending updates
  const dismissAllStatusUpdates = () => {
    setPendingUpdates([]);
    toast('All updates dismissed', {
      description: 'No changes have been made to fine statuses'
    });
  };

  return {
    validationHistory,
    isLoading,
    error,
    validateTrafficFine,
    validateFineById,
    batchValidateTrafficFines,
    updateAllPendingFines,
    validationErrors,
    clearValidationErrors,
    // New confirmation-related properties and methods
    pendingUpdates,
    confirmStatusUpdate,
    confirmAllStatusUpdates,
    dismissStatusUpdate,
    dismissAllStatusUpdates
  };
};
