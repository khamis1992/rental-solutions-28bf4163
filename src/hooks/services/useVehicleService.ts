import { useState, useCallback } from 'react';
import { VehicleService } from '@/services/VehicleService';
import { ExtendedVehicle, VehicleStatus, VehicleInsert, VehicleUpdate } from '@/types/vehicle';
import { Result } from '@/types/response.types';

export function useVehicleService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const service = new VehicleService();

  const getAllVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await service.getAllVehicles();
      if (!result.success) {
        setError(result.error);
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const getVehicleById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await service.getVehicleById(id);
      if (!result.success) {
        setError(result.error);
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const createVehicle = useCallback(async (vehicle: VehicleInsert) => {
    setLoading(true);
    setError(null);
    try {
      const result = await service.createVehicle(vehicle);
      if (!result.success) {
        setError(result.error);
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const updateVehicle = useCallback(async (id: string, vehicle: VehicleUpdate) => {
    setLoading(true);
    setError(null);
    try {
      const result = await service.updateVehicle(id, vehicle);
      if (!result.success) {
        setError(result.error);
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const deleteVehicle = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await service.deleteVehicle(id);
      if (!result.success) {
        setError(result.error);
        return false;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      return false;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const getAvailableVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await service.getAvailableVehicles();
      if (!result.success) {
        setError(result.error);
        return null;
      }
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  return {
    loading,
    error,
    getAllVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    getAvailableVehicles
  };
}
