
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { batchOperations } from '@/utils/promise/batch';
import { normalizeLicensePlate } from '@/utils/searchUtils';
import { createLogger } from '@/utils/error-logger';

const logger = createLogger('license-plate-change');

export interface LicensePlateChangeResult {
  finesUpdated: number;
  totalFines: number;
  errors: any[];
}

/**
 * Hook for managing traffic fine reassignment when vehicle license plates change
 */
export function useLicensePlateChangeHandler() {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Find traffic fines associated with an old license plate
   */
  const findAssociatedFines = async (oldLicensePlate: string): Promise<any[]> => {
    // Normalize license plate for consistent matching
    const normalizedPlate = normalizeLicensePlate(oldLicensePlate);
    logger.debug(`Finding traffic fines for license plate: ${normalizedPlate}`);
    
    const { data, error } = await supabase
      .from('traffic_fines')
      .select('*')
      .eq('license_plate', normalizedPlate);
      
    if (error) {
      logger.error(`Error finding associated fines: ${error.message}`);
      throw new Error(`Failed to find associated fines: ${error.message}`);
    }
    
    logger.info(`Found ${data?.length || 0} fines associated with license plate ${normalizedPlate}`);
    return data || [];
  };

  /**
   * Update a traffic fine with a new license plate
   */
  const updateFine = async (fineId: string, newLicensePlate: string, vehicleId: string): Promise<any> => {
    const normalizedPlate = normalizeLicensePlate(newLicensePlate);
    logger.debug(`Updating fine ${fineId} with new license plate ${normalizedPlate}`);
    
    const { data, error } = await supabase
      .from('traffic_fines')
      .update({
        license_plate: normalizedPlate,
        vehicle_id: vehicleId,
        updated_at: new Date().toISOString()
      })
      .eq('id', fineId)
      .select();
      
    if (error) {
      logger.error(`Error updating fine ${fineId}: ${error.message}`);
      throw new Error(`Failed to update fine: ${error.message}`);
    }
    
    return data;
  };

  /**
   * Mutation for handling license plate changes
   */
  const handleLicensePlateChange = useMutation({
    mutationFn: async ({ 
      oldLicensePlate, 
      newLicensePlate, 
      vehicleId 
    }: { 
      oldLicensePlate: string; 
      newLicensePlate: string; 
      vehicleId: string;
    }) => {
      setIsProcessing(true);
      logger.info(`Processing license plate change: ${oldLicensePlate} → ${newLicensePlate}`);
      
      try {
        // Find all traffic fines associated with the old license plate
        const fines = await findAssociatedFines(oldLicensePlate);
        
        if (fines.length === 0) {
          logger.info(`No traffic fines found for license plate ${oldLicensePlate}`);
          return {
            finesUpdated: 0,
            totalFines: 0,
            errors: []
          };
        }
        
        // Use batch operations to update all fines
        const result = await batchOperations(
          fines,
          async (fine) => {
            return updateFine(fine.id, newLicensePlate, vehicleId);
          },
          {
            concurrency: 3,
            continueOnError: true,
            onProgress: (status) => {
              logger.debug(`Fine reassignment progress: ${status.completed}/${status.total}`);
            }
          }
        );
        
        return {
          finesUpdated: result.success ? result.data.completed : 0,
          totalFines: fines.length,
          errors: result.success ? result.data.errors : [{ message: result.error?.message }]
        };
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: (result) => {
      if (result.finesUpdated > 0) {
        toast.success(
          `Updated ${result.finesUpdated} traffic ${result.finesUpdated === 1 ? 'fine' : 'fines'}`, 
          { description: "Traffic fines have been reassigned to the updated license plate" }
        );
      }
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['trafficFines'] });
    },
    onError: (error: any) => {
      logger.error('Error handling license plate change:', error);
      toast.error('Failed to update traffic fines', {
        description: error.message || 'An error occurred while reassigning traffic fines'
      });
    }
  });

  return {
    handleLicensePlateChange: handleLicensePlateChange.mutateAsync,
    isProcessing: isProcessing || handleLicensePlateChange.isPending,
    findAssociatedFines
  };
}
