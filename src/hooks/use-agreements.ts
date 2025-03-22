
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

  // Optimized fetch agreements with better error handling and vehicle search capabilities
  const { data: agreements, isLoading, refetch } = useApiQuery(
    ['agreements', JSON.stringify(searchParams)],
    async () => {
      try {
        console.log('Fetching agreements with params:', searchParams);
        
        // Search term handling (early preparation)
        const searchTerm = searchParams.query?.trim().toLowerCase() || '';
        const hasSearchTerm = searchTerm !== '';
        console.log(`Search term: "${searchTerm}", hasSearchTerm: ${hasSearchTerm}`);
        
        // First, build a more comprehensive query that includes vehicle data for searching
        let query = supabase.from('leases')
          .select(`
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
            notes,
            vehicles!leases_vehicle_id_fkey (
              id, 
              make, 
              model, 
              license_plate, 
              year,
              vin,
              color
            ),
            profiles!leases_customer_id_fkey (
              id,
              full_name,
              email,
              phone_number
            )
          `);
        
        // Apply filters for status, customer_id, and vehicle_id
        if (searchParams.status && searchParams.status !== 'all') {
          query = query.eq('status', searchParams.status);
        }
        
        if (searchParams.customer_id) {
          query = query.eq('customer_id', searchParams.customer_id);
        }
        
        if (searchParams.vehicle_id) {
          query = query.eq('vehicle_id', searchParams.vehicle_id);
        }
        
        // Handle text search more comprehensively
        if (hasSearchTerm) {
          // First, check if search term is a license plate or part of one
          // This gives us a direct SQL search that's more efficient
          query = query.or(
            `agreement_number.ilike.%${searchTerm}%,
             notes.ilike.%${searchTerm}%,
             vehicles.license_plate.ilike.%${searchTerm}%,
             vehicles.vin.ilike.%${searchTerm}%,
             vehicles.make.ilike.%${searchTerm}%,
             vehicles.model.ilike.%${searchTerm}%,
             profiles.full_name.ilike.%${searchTerm}%`
          );
        }
        
        // Order and limit results for better performance
        query = query.order('created_at', { ascending: false }).limit(100);
        
        // Execute the query
        const { data: leaseData, error: leaseError } = await query;
        
        if (leaseError) {
          console.error("Error fetching agreements:", leaseError);
          setError(`Failed to load agreements: ${leaseError.message}`);
          toast.error(`Failed to load agreements: ${leaseError.message}`);
          return [];
        }
        
        if (!leaseData || leaseData.length === 0) {
          console.log('No agreements found in initial query');
          
          // If we have a number-only search term, try a more specific license plate search
          if (hasSearchTerm && /^\d+$/.test(searchTerm)) {
            console.log('Attempting numeric-only search for license plate or vehicle numbers...');
            
            // Build a query specifically for numeric searches
            const numericQuery = supabase.from('leases')
              .select(`
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
                notes,
                vehicles!leases_vehicle_id_fkey (
                  id, 
                  make, 
                  model, 
                  license_plate, 
                  year,
                  vin,
                  color
                ),
                profiles!leases_customer_id_fkey (
                  id,
                  full_name,
                  email,
                  phone_number
                )
              `)
              .or(`vehicles.license_plate.ilike.%${searchTerm}%,vehicles.license_plate.ilike.%${searchTerm.replace(/\D/g, '')}%`);
              
            // Apply the same filters as before
            if (searchParams.status && searchParams.status !== 'all') {
              numericQuery.eq('status', searchParams.status);
            }
            
            // Execute the numeric-focused query
            const { data: numericResults, error: numericError } = await numericQuery
              .order('created_at', { ascending: false })
              .limit(100);
              
            if (numericError) {
              console.error("Error in numeric search:", numericError);
            } else if (numericResults && numericResults.length > 0) {
              console.log(`Found ${numericResults.length} agreements in numeric license plate search`);
              return transformLeaseData(numericResults);
            }
          }
          
          return [];
        }
        
        return transformLeaseData(leaseData);
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
  
  // Helper function to transform lease data with nested relations into flat Agreement objects
  const transformLeaseData = (leaseData: any[]): Agreement[] => {
    return leaseData.map((lease): Agreement => ({
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
      customers: lease.profiles ? {
        id: lease.profiles.id,
        full_name: lease.profiles.full_name,
        email: lease.profiles.email,
        phone: lease.profiles.phone_number
      } : null,
      vehicles: lease.vehicles ? {
        id: lease.vehicles.id,
        make: lease.vehicles.make,
        model: lease.vehicles.model,
        license_plate: lease.vehicles.license_plate,
        image_url: lease.vehicles.image_url,
        year: lease.vehicles.year,
        color: lease.vehicles.color,
        vin: lease.vehicles.vin
      } : null
    }));
  };
  
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
      
      // Use join query to get related data in a single request
      const { data, error } = await supabase
        .from('leases')
        .select(`
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
          notes,
          vehicles!leases_vehicle_id_fkey (
            id, 
            make, 
            model, 
            license_plate, 
            image_url, 
            year, 
            color, 
            vin
          ),
          profiles!leases_customer_id_fkey (
            id, 
            full_name, 
            email, 
            phone_number
          )
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Error fetching agreement:", error);
        toast.error(`Failed to load agreement details: ${error.message}`);
        return null;
      }
      
      if (data) {
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
          customers: data.profiles ? {
            id: data.profiles.id,
            full_name: data.profiles.full_name,
            email: data.profiles.email,
            phone: data.profiles.phone_number
          } : null,
          vehicles: data.vehicles ? {
            id: data.vehicles.id,
            make: data.vehicles.make,
            model: data.vehicles.model,
            license_plate: data.vehicles.license_plate,
            image_url: data.vehicles.image_url,
            year: data.vehicles.year,
            color: data.vehicles.color,
            vin: data.vehicles.vin
          } : null
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
