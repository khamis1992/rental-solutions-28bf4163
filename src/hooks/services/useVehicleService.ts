import { useState, useCallback } from 'react';
import { ExtendedVehicle } from '@/types/vehicle';
import { supabase } from '@/lib/supabase';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export const useVehicleService = () => {
  const [loading, setLoading] = useState(false);
  const { error: errorState, handleError, clearError } = useErrorHandler();

  const getAllVehicles = useCallback(async (): Promise<ExtendedVehicle[]> => {
    try {
      setLoading(true);
      clearError();

      const { data, error: supabaseError } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      return data as ExtendedVehicle[];
    } catch (err) {
      handleError(err, {
        showToast: true,
        logError: true,
        context: { service: 'vehicle', action: 'getAllVehicles' }
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  const getVehicleById = useCallback(async (id: string): Promise<ExtendedVehicle | null> => {
    try {
      setLoading(true);
      clearError();

      const { data, error: supabaseError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      return data as ExtendedVehicle;
    } catch (err) {
      handleError(err, {
        showToast: true,
        logError: true,
        context: { service: 'vehicle', action: 'getVehicleById', id }
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  const createVehicle = useCallback(async (vehicle: Omit<ExtendedVehicle, 'id' | 'created_at' | 'updated_at'>): Promise<ExtendedVehicle> => {
    try {
      setLoading(true);
      clearError();

      const { data, error: supabaseError } = await supabase
        .from('vehicles')
        .insert(vehicle)
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      return data as ExtendedVehicle;
    } catch (err) {
      handleError(err, {
        showToast: true,
        logError: true,
        context: { service: 'vehicle', action: 'createVehicle' }
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  const updateVehicle = useCallback(async (id: string, vehicle: Partial<ExtendedVehicle>): Promise<ExtendedVehicle> => {
    try {
      setLoading(true);
      clearError();

      const { data, error: supabaseError } = await supabase
        .from('vehicles')
        .update(vehicle)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      return data as ExtendedVehicle;
    } catch (err) {
      handleError(err, {
        showToast: true,
        logError: true,
        context: { service: 'vehicle', action: 'updateVehicle', id }
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  const deleteVehicle = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const { error: supabaseError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
    } catch (err) {
      handleError(err, {
        showToast: true,
        logError: true,
        context: { service: 'vehicle', action: 'deleteVehicle', id }
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  return {
    loading,
    error: errorState,
    getAllVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle
  };
};
