
import { useState } from 'react';
import { useApiMutation, useApiQuery } from './use-api';
import { supabase } from '@/lib/supabase';
import { Agreement, AgreementFilters } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';

export const useAgreements = (initialFilters: AgreementFilters = {}) => {
  const [searchParams, setSearchParams] = useState<AgreementFilters>(initialFilters);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch agreements with filters - using leases table
  const { data: agreements, isLoading, refetch } = useApiQuery(
    ['agreements', JSON.stringify(searchParams)],
    async () => {
      try {
        console.log('Fetching agreements with params:', searchParams);
        
        let query = supabase
          .from('leases')
          .select(`
            *,
            customers(id, full_name, email),
            vehicles(id, make, model, license_plate, image_url)
          `);
        
        // Apply filters
        if (searchParams.query) {
          query = query.or(`agreement_number.ilike.%${searchParams.query}%,customers.full_name.ilike.%${searchParams.query}%`);
        }
        
        if (searchParams.status && searchParams.status !== 'all') {
          query = query.eq('status', searchParams.status);
        }
        
        if (searchParams.customer_id) {
          query = query.eq('customer_id', searchParams.customer_id);
        }
        
        if (searchParams.vehicle_id) {
          query = query.eq('vehicle_id', searchParams.vehicle_id);
        }
        
        // Get the data
        console.log('Executing query...');
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching agreements:", error);
          setError(`Failed to load agreements: ${error.message}`);
          toast.error(`Failed to load agreements: ${error.message}`);
          return [];
        }
        
        console.log('Query results:', data);
        if (!data || data.length === 0) {
          console.log('No agreements found in database');
        }
        
        // Transform the data to match the Agreement schema
        const transformedData = data.map((lease: any): Agreement => ({
          id: lease.id,
          customer_id: lease.customer_id,
          vehicle_id: lease.vehicle_id,
          start_date: new Date(lease.start_date),
          end_date: new Date(lease.end_date),
          status: lease.status,
          created_at: lease.created_at ? new Date(lease.created_at) : undefined,
          updated_at: lease.updated_at ? new Date(lease.updated_at) : undefined,
          total_amount: lease.total_amount || 0,
          deposit_amount: lease.down_payment || 0,
          agreement_number: lease.agreement_number || '',
          notes: lease.notes || '',
          terms_accepted: true, // Assuming existing leases have terms accepted
          pickup_location: lease.pickup_location || "",
          return_location: lease.return_location || "",
          additional_drivers: [],
          customers: lease.customers,
          vehicles: lease.vehicles
        }));
        
        console.log('Transformed agreements:', transformedData);
        return transformedData || [];
      } catch (err) {
        console.error("Unexpected error in useAgreements:", err);
        setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        toast.error("An unexpected error occurred while loading agreements");
        return [];
      }
    },
    {
      staleTime: 60000,
      refetchOnWindowFocus: false,
    }
  );
  
  // Create agreement
  const createAgreement = useApiMutation(
    async (agreement: Omit<Agreement, 'id'>) => {
      const { data, error } = await supabase
        .from('leases')
        .insert(agreement)
        .select()
        .single();
        
      if (error) {
        console.error("Error creating agreement:", error);
        throw new Error(error.message);
      }
      
      return data;
    },
    {
      onSuccess: () => {
        toast.success("Agreement created successfully");
        refetch();
      }
    }
  );
  
  // Update agreement
  const updateAgreement = useApiMutation(
    async ({ id, data }: { id: string, data: Partial<Agreement> }) => {
      const { data: updatedData, error } = await supabase
        .from('leases')
        .update(data)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating agreement:", error);
        throw new Error(error.message);
      }
      
      return updatedData;
    },
    {
      onSuccess: () => {
        toast.success("Agreement updated successfully");
        refetch();
      }
    }
  );
  
  // Delete agreement
  const deleteAgreement = useApiMutation(
    async (id: string) => {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting agreement:", error);
        throw new Error(error.message);
      }
      
      return id;
    },
    {
      onSuccess: () => {
        toast.success("Agreement deleted successfully");
        refetch();
      }
    }
  );
  
  // Get agreement by ID
  const getAgreement = async (id: string): Promise<Agreement | null> => {
    try {
      console.log(`Fetching agreement details for ID: ${id}`);
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers(id, full_name, email, phone),
          vehicles(id, make, model, license_plate, image_url, year, color)
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Error fetching agreement:", error);
        toast.error(`Failed to load agreement details: ${error.message}`);
        return null;
      }
      
      console.log('Agreement details:', data);
      
      // Transform to Agreement type
      if (data) {
        return {
          id: data.id,
          customer_id: data.customer_id,
          vehicle_id: data.vehicle_id,
          start_date: new Date(data.start_date),
          end_date: new Date(data.end_date),
          status: data.status,
          created_at: data.created_at ? new Date(data.created_at) : undefined,
          updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
          total_amount: data.total_amount || 0,
          deposit_amount: data.down_payment || 0,
          agreement_number: data.agreement_number || '',
          notes: data.notes || '',
          terms_accepted: true,
          pickup_location: data.pickup_location || "",
          return_location: data.return_location || "",
          additional_drivers: [],
          customers: data.customers,
          vehicles: data.vehicles
        };
      }
      
      return null;
    } catch (err) {
      console.error("Unexpected error in getAgreement:", err);
      toast.error("An unexpected error occurred while loading agreement details");
      return null;
    }
  };
  
  return {
    agreements,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    getAgreement,
    refetch
  };
};
