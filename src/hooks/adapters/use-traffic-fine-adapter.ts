/**
 * Traffic Fine Service Migration Adapter
 * 
 * This adapter provides backward compatibility with the old traffic fine hooks
 * while using the new standardized service implementation internally.
 * This ensures components can be migrated gradually without breaking existing functionality.
 */

import { useCallback } from 'react';
import { useTrafficFineQuery } from '@/hooks/use-traffic-fine-query';
import { TrafficFine, TrafficFineStatus } from '@/types/traffic-fine.types';

/**
 * Adapter hook that emulates the legacy useTrafficFines hook interface
 * but uses the standardized useTrafficFineQuery hook internally
 */
export const useTrafficFinesAdapter = (vehicleId?: string, agreementId?: string) => {
  const {
    getTrafficFines,
    getVehicleTrafficFines,
    createTrafficFine,
    updateTrafficFine,
    updateTrafficFineStatus,
    deleteTrafficFine,
    getTrafficFineStatistics,
    validateTrafficFines
  } = useTrafficFineQuery();

  // Use the appropriate query based on provided parameters
  const queryOptions = {} as any;
  if (vehicleId) queryOptions.vehicleId = vehicleId;
  if (agreementId) queryOptions.agreementId = agreementId;

  const { 
    data: trafficFines, 
    isLoading, 
    isError, 
    error 
  } = getTrafficFines(queryOptions);

  // Legacy methods reimplemented using the new service
  const addNewFine = useCallback(async (fineData: Partial<TrafficFine>) => {
    try {
      const { mutateAsync } = createTrafficFine();
      const result = await mutateAsync(fineData as any);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err };
    }
  }, [createTrafficFine]);

  const updateFine = useCallback(async (id: string, updates: Partial<TrafficFine>) => {
    try {
      const { mutateAsync } = updateTrafficFine();
      const result = await mutateAsync({ id, data: updates });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err };
    }
  }, [updateTrafficFine]);

  const deleteFine = useCallback(async (id: string) => {
    try {
      const { mutateAsync } = deleteTrafficFine();
      await mutateAsync(id);
      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  }, [deleteTrafficFine]);

  const payTrafficFine = useCallback(async (id: string, paymentDetails: any) => {
    try {
      const { mutateAsync } = updateTrafficFineStatus();
      const result = await mutateAsync({ 
        id, 
        status: TrafficFineStatus.PAID,
        paymentDetails
      });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err };
    }
  }, [updateTrafficFineStatus]);

  const disputeTrafficFine = useCallback(async (id: string, reason: string) => {
    try {
      const { mutateAsync } = updateTrafficFine();
      const result = await mutateAsync({ 
        id, 
        data: { 
          status: TrafficFineStatus.DISPUTED,
          disputed_reason: reason,
          disputed_date: new Date().toISOString()
        }
      });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err };
    }
  }, [updateTrafficFine]);

  const assignToCustomer = useCallback(async (fineId: string, customerId: string, agreementId?: string) => {
    try {
      const { mutateAsync } = updateTrafficFine();
      const updates: any = { customer_id: customerId };
      if (agreementId) updates.agreement_id = agreementId;
      
      const result = await mutateAsync({ id: fineId, data: updates });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err };
    }
  }, [updateTrafficFine]);

  const validateFine = useCallback(async (licensePlate: string) => {
    try {
      const { mutateAsync } = validateTrafficFines();
      const result = await mutateAsync({ licensePlate });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err };
    }
  }, [validateTrafficFines]);

  const cleanupInvalidAssignments = useCallback(async () => {
    console.log('Legacy method: cleanupInvalidAssignments is now deprecated');
    return { success: true };
  }, []);

  return {
    trafficFines: trafficFines || [],
    fines: trafficFines || [], // Some components use this alias
    isLoading,
    error: error instanceof Error ? error.message : isError ? 'An error occurred' : null,
    addNewFine,
    updateFine,
    deleteFine,
    payTrafficFine,
    disputeTrafficFine,
    assignToCustomer,
    validateFine,
    cleanupInvalidAssignments
  };
};

/**
 * Combined traffic fine hook adapter that provides both legacy and new functionality
 */
export const useTrafficFineAdapter = (vehicleId?: string, agreementId?: string) => {
  const legacyHookResult = useTrafficFinesAdapter(vehicleId, agreementId);
  const newHookResult = useTrafficFineQuery();
  
  // Return both the legacy interface and the new interface
  return {
    ...legacyHookResult,
    query: newHookResult
  };
};
