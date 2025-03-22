import { useState, useEffect } from 'react';
import { useApiMutation, useApiQuery } from './use-api';
import { supabase } from '@/lib/supabase';
import { Agreement, AgreementFilters } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';

export const useAgreements = (initialFilters: AgreementFilters = {
  query: '',
  status: 'all',
}) => {
  const [searchParams, setSearchParams] = useState<AgreementFilters>(initialFilters);
  const [error, setError] = useState<string | null>(null);
  
  // Clear error when search params change
  useEffect(() => {
    setError(null);
  }, [searchParams]);

  // Optimized fetch agreements with better error handling
  const { data: agreements, isLoading, refetch } = useApiQuery(
    ['agreements', JSON.stringify(searchParams)],
    async () => {
      try {
        console.log('Fetching agreements with params:', searchParams);
        
        // First, let's get the basic lease data with optimized query
        let query = supabase.from('leases').select(`
          id, 
          customer_id, 
          vehicle_id, 
          start_date, 
          end_date, 
          status, 
          created_at, 
          updated_at, 
          total_amount, 
          down_payment, 
          agreement_number, 
          notes
        `);
        
        // Apply filters with more specific and optimized conditions
        if (searchParams.query && searchParams.query.trim() !== '') {
          const searchTerm = searchParams.query.trim().toLowerCase();
          // Use specific column filtering instead of OR for better performance
          query = query.or(`agreement_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
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
        
        // Limit results and add pagination for better performance
        query = query.order('created_at', { ascending: false }).limit(50);
        
        // Execute the query
        const { data: leaseData, error: leaseError } = await query;
        
        if (leaseError) {
          console.error("Error fetching agreements:", leaseError);
          setError(`Failed to load agreements: ${leaseError.message}`);
          toast.error(`Failed to load agreements: ${leaseError.message}`);
          return [];
        }
        
        if (!leaseData || leaseData.length === 0) {
          console.log('No agreements found in database');
          return [];
        }
        
        // Fetch related customer data in a separate, optimized query
        const customerIds = leaseData.map(lease => lease.customer_id).filter(Boolean);
        let customerData = {};
        
        if (customerIds.length > 0) {
          const { data: customers, error: customersError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone_number')
            .in('id', customerIds);
            
          if (customersError) {
            console.error("Error fetching customers:", customersError);
          } else if (customers) {
            customerData = customers.reduce((acc, customer) => {
              acc[customer.id] = customer;
              return acc;
            }, {});
          }
        }
        
        // Fetch related vehicle data in a separate, optimized query
        const vehicleIds = leaseData.map(lease => lease.vehicle_id).filter(Boolean);
        let vehicleData = {};
        
        if (vehicleIds.length > 0) {
          const { data: vehicles, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('id, make, model, license_plate, image_url, year, color')
            .in('id', vehicleIds);
            
          if (vehiclesError) {
            console.error("Error fetching vehicles:", vehiclesError);
          } else if (vehicles) {
            vehicleData = vehicles.reduce((acc, vehicle) => {
              acc[vehicle.id] = vehicle;
              return acc;
            }, {});
          }
        }
        
        // Transform the data in an optimized way
        const transformedData = leaseData.map((lease: any): Agreement => ({
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
          terms_accepted: true,
          additional_drivers: [],
          customers: customerData[lease.customer_id] || null,
          vehicles: vehicleData[lease.vehicle_id] || null
        }));
        
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
      retry: 1, // Limit retries to prevent excessive requests
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
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Error fetching agreement:", error);
        toast.error(`Failed to load agreement details: ${error.message}`);
        return null;
      }
      
      // If we have the lease data, get the related customer and vehicle data
      if (data) {
        // Get customer data
        let customerData = null;
        if (data.customer_id) {
          const { data: customer, error: customerError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone_number')
            .eq('id', data.customer_id)
            .single();
            
          if (customerError) {
            console.error("Error fetching customer:", customerError);
          } else {
            customerData = customer;
          }
        }
        
        // Get vehicle data
        let vehicleData = null;
        if (data.vehicle_id) {
          const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .select('id, make, model, license_plate, image_url, year, color')
            .eq('id', data.vehicle_id)
            .single();
            
          if (vehicleError) {
            console.error("Error fetching vehicle:", vehicleError);
          } else {
            vehicleData = vehicle;
          }
        }
        
        // Transform to Agreement type
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
          additional_drivers: [],
          customers: customerData,
          vehicles: vehicleData
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
