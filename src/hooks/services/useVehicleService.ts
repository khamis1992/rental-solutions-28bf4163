import { useState, useCallback } from 'react';
import { ExtendedVehicle } from '@/types/vehicle';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/utils/error-handler';

export const useVehicleService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getAllVehicles = useCallback(async (): Promise<ExtendedVehicle[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      return data as ExtendedVehicle[];
    } catch (err) {
      const error = handleError(err);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const getVehicleById = useCallback(async (id: string): Promise<ExtendedVehicle | null> => {
    try {
      setLoading(true);
      setError(null);

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
      const error = handleError(err);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createVehicle = useCallback(async (vehicle: Omit<ExtendedVehicle, 'id' | 'created_at' | 'updated_at'>): Promise<ExtendedVehicle> => {
    try {
      setLoading(true);
      setError(null);

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
      const error = handleError(err);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVehicle = useCallback(async (id: string, vehicle: Partial<ExtendedVehicle>): Promise<ExtendedVehicle> => {
    try {
      setLoading(true);
      setError(null);

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
      const error = handleError(err);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVehicle = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
    } catch (err) {
      const error = handleError(err);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAllVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle
  };
};
