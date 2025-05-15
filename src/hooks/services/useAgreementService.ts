
import { useState } from 'react';
import { AgreementFilters } from '@/types/filters';
import { Agreement, SimpleAgreement } from '@/types/agreement';
import { supabase } from '@/lib/supabase';
import { adaptApiResponseToAgreement, adaptApiResponseToAgreements } from '@/utils/agreement-type-adapter';

export const useAgreementService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [agreements, setAgreements] = useState<SimpleAgreement[]>([]);

  const getAgreements = async (filters?: AgreementFilters) => {
    setIsLoading(true);
    setError(null);

    let query = supabase
      .from('leases')
      .select('*, customers:profiles(*), vehicles(*)');

    // Apply filters if provided
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.search && filters.search.trim() !== '') {
        const searchTerm = `%${filters.search.toLowerCase()}%`;
        query = query.or(`customers.full_name.ilike.${searchTerm},vehicles.license_plate.ilike.${searchTerm}`);
      }

      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      if (filters.vehicleId) {
        query = query.eq('vehicle_id', filters.vehicleId);
      }

      if (filters.date && filters.date[0] && filters.date[1]) {
        const startDate = filters.date[0].toISOString();
        const endDate = filters.date[1].toISOString();
        query = query
          .or(`start_date.gte.${startDate},end_date.lte.${endDate}`);
      }
    }

    try {
      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch agreements: ${error.message}`);
      }

      const adaptedData = adaptApiResponseToAgreements(data || []);
      setAgreements(adaptedData);
      return adaptedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching agreements';
      setError(new Error(errorMessage));
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getAgreementById = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('leases')
        .select('*, customers:profiles(*), vehicles(*)')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch agreement: ${error.message}`);
      }

      return adaptApiResponseToAgreement(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching agreement';
      setError(new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAgreement = async (agreement: Agreement) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('leases')
        .update(agreement)
        .eq('id', agreement.id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to update agreement: ${error.message}`);
      }

      return adaptApiResponseToAgreement(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error updating agreement';
      setError(new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createAgreement = async (agreement: Omit<Agreement, 'id'>) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('leases')
        .insert(agreement)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to create agreement: ${error.message}`);
      }

      return adaptApiResponseToAgreement(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error creating agreement';
      setError(new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAgreement = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete agreement: ${error.message}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error deleting agreement';
      setError(new Error(errorMessage));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a save method for backward compatibility
  const save = async (agreement: Agreement) => {
    if (agreement.id) {
      return updateAgreement(agreement);
    } else {
      return createAgreement(agreement as Omit<Agreement, 'id'>);
    }
  };

  return {
    agreements,
    isLoading,
    error,
    getAgreements,
    getAgreementById,
    updateAgreement,
    createAgreement,
    deleteAgreement,
    save
  };
};
