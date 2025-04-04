
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApiMutation } from '@/hooks/use-api';
import { toast } from 'sonner';
import { updateAgreementWithCheck } from '@/utils/agreement-utils';
import { useAuth } from '@/contexts/AuthContext';
import { SimpleAgreement, AgreementWithRelations } from '@/types/agreement';

// Custom hook for fetching and managing agreements
export function useAgreements(initialFilters = {}) {
  const [agreements, setAgreements] = useState<SimpleAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const { user } = useAuth();

  // Fetch agreements with optional filtering
  const fetchAgreements = useCallback(async (filterParams = {}) => {
    try {
      setLoading(true);
      
      // Combine default filters with any provided filter params
      const activeFilters = { ...filters, ...filterParams };
      
      // Start building the query
      let query = supabase
        .from('leases')
        .select(`
          *,
          customers:profiles!leases_customer_id_fkey(*),
          vehicles!leases_vehicle_id_fkey(*)
        `);
      
      // Apply filters if they exist
      if (activeFilters.status) {
        query = query.eq('status', activeFilters.status);
      }
      
      if (activeFilters.search) {
        query = query.or(
          `agreement_number.ilike.%${activeFilters.search}%,vehicles.license_plate.ilike.%${activeFilters.search}%,customers.full_name.ilike.%${activeFilters.search}%`
        );
      }
      
      // Execute the query and handle the response
      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Error fetching agreements: ${error.message}`);
      }
      
      // Transform the data to match our SimpleAgreement interface
      const transformedData: SimpleAgreement[] = data.map((item: any) => ({
        id: item.id,
        agreement_number: item.agreement_number,
        customer_id: item.customer_id,
        vehicle_id: item.vehicle_id,
        start_date: item.start_date,
        end_date: item.end_date,
        status: item.status,
        daily_rate: item.daily_rate || 0,
        signature_url: item.signature_url || null,
        created_at: item.created_at,
        updated_at: item.updated_at,
        total_amount: item.total_amount,
        deposit_amount: item.deposit_amount,
        notes: item.notes,
        rent_amount: item.rent_amount,
        daily_late_fee: item.daily_late_fee,
        // Include relationships
        customer: item.customers,
        vehicle: item.vehicles
      }));
      
      setAgreements(transformedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      toast.error(err instanceof Error ? err.message : 'Failed to fetch agreements');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Get a single agreement by ID
  const getAgreement = async (id: string): Promise<AgreementWithRelations | null> => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:profiles!leases_customer_id_fkey(*),
          vehicles!leases_vehicle_id_fkey(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(`Error fetching agreement: ${error.message}`);
      }
      
      if (!data) return null;
      
      // Transform the data to match our AgreementWithRelations interface
      const transformedData: AgreementWithRelations = {
        id: data.id,
        agreement_number: data.agreement_number,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status,
        daily_rate: data.daily_rate || 0,
        signature_url: data.signature_url || null,
        // Include relationships
        customer: {
          id: data.customers.id,
          name: data.customers.full_name || '',
          email: data.customers.email,
          phone: data.customers.phone_number
        },
        vehicle: {
          id: data.vehicles.id,
          make: data.vehicles.make || '',
          model: data.vehicles.model || '',
          year: data.vehicles.year || 0,
          plate_number: data.vehicles.license_plate || ''
        }
      };
      
      return transformedData;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch agreement details');
      return null;
    }
  };

  // Create a new agreement
  const createAgreement = useApiMutation(
    async (agreement: Omit<SimpleAgreement, 'id'>) => {
      const { data, error } = await supabase
        .from('leases')
        .insert(agreement)
        .select();
      
      if (error) throw new Error(`Failed to create agreement: ${error.message}`);
      return data;
    }
  );

  // Update an existing agreement
  const updateAgreement = useApiMutation(
    async ({ id, data }: { id: string; data: Partial<SimpleAgreement> }) => {
      return updateAgreementWithCheck(
        { id, data }, 
        user?.id,
        () => {
          toast.success("Agreement updated successfully");
          // You might want to refresh data here
          fetchAgreements(filters);
        },
        (error) => {
          toast.error(`Failed to update agreement: ${error.message}`);
        }
      );
    }
  );

  // Delete an agreement
  const deleteAgreement = useApiMutation(
    async (id: string) => {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(`Failed to delete agreement: ${error.message}`);
      return { success: true };
    }
  );

  return {
    agreements,
    loading,
    error,
    filters,
    setFilters,
    fetchAgreements,
    getAgreement,
    createAgreement,
    updateAgreement,
    deleteAgreement
  };
}
