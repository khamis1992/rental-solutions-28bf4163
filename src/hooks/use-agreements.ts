
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';
import { FlattenType } from '@/utils/type-utils';

// Define the SimpleAgreement interface that matches both the database structure and component expectations
export interface SimpleAgreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_amount: number;  // Primary field for amount
  deposit_amount: number;
  agreement_number: string;  // Primary field for agreement number
  notes: string;
  rent_amount?: number;
  daily_late_fee?: number;
  // Nested objects with consistent naming
  customer?: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
  };
  vehicle?: {  // Using 'vehicle' singular to match Supabase structure
    id: string;
    make?: string;
    model?: string;
    license_plate?: string;
    year?: number;
    color?: string;
  };
  payments?: Array<any>;
  // Aliases for compatibility
  customers?: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
  };
  vehicles?: {  // Adding 'vehicles' alias for backward compatibility
    id: string;
    make?: string;
    model?: string;
    license_plate?: string;
    year?: number;
    color?: string;
  };
  total_cost?: number; // Alias for total_amount for backward compatibility
}

// Define the search parameters interface
interface SearchParams {
  query?: string;
  status?: string;
  customerId?: string; // Camel case for API param
  vehicleId?: string;  // Camel case for API param
  startDate?: string;
  endDate?: string;
  // For backward compatibility
  customer_id?: string;
  vehicle_id?: string;
}

// Helper function to map database status to application status
const mapDatabaseStatus = (status: string): string => {
  // Map from lease_status (enum from DB) to AgreementStatus (used in UI)
  const statusMap: Record<string, string> = {
    'active': 'active',
    'pending_payment': 'pending',
    'pending_deposit': 'pending',
    'draft': 'draft',
    'expired': 'expired',
    'cancelled': 'cancelled',
    'closed': 'closed',
    'terminated': 'cancelled'
  };
  
  return statusMap[status.toLowerCase()] || status;
};

// Main hook for agreements
export const useAgreements = (initialParams?: SearchParams) => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState<SearchParams>(initialParams || {
    query: '',
    status: 'all'
  });
  
  // Query to fetch agreement data based on search parameters
  const useAgreementsList = () => {
    return useQuery({
      queryKey: ['agreements', searchParams],
      queryFn: async () => {
        let query = supabase
          .from('leases')  // Query the leases table
          .select(`
            *,
            customer:customer_id(id, full_name, email, phone),
            vehicle:vehicle_id(*)
          `)
          .order('created_at', { ascending: false });
          
        // Apply filters based on search parameters
        if (searchParams.query && searchParams.query.trim() !== '') {
          query = query.or(`
            customer.full_name.ilike.%${searchParams.query}%,
            customer.phone.ilike.%${searchParams.query}%,
            vehicle.license_plate.ilike.%${searchParams.query}%,
            agreement_number.ilike.%${searchParams.query}%
          `);
        }
        
        if (searchParams.status && searchParams.status !== 'all') {
          query = query.eq('status', searchParams.status);
        }
        
        // Support both camelCase and snake_case for backward compatibility
        if (searchParams.customerId || searchParams.customer_id) {
          query = query.eq('customer_id', searchParams.customerId || searchParams.customer_id);
        }
        
        if (searchParams.vehicleId || searchParams.vehicle_id) {
          query = query.eq('vehicle_id', searchParams.vehicleId || searchParams.vehicle_id);
        }
        
        // Date range filtering if provided
        if (searchParams.startDate) {
          query = query.gte('start_date', searchParams.startDate);
        }
        
        if (searchParams.endDate) {
          query = query.lte('end_date', searchParams.endDate);
        }
        
        const { data, error } = await query;
          
        if (error) {
          throw new Error(`Error fetching agreements: ${error.message}`);
        }
        
        // Transform the data to match the SimpleAgreement interface
        return (data || []).map(item => {
          const customerData = item.customer || {};
          
          // Ensure the data structure has all required fields
          const agreement: FlattenType<SimpleAgreement> = {
            ...item,
            // Map status to expected format
            status: mapDatabaseStatus(item.status || ''),
            // Ensure these fields exist with correct names
            total_amount: item.total_amount || 0,
            agreement_number: item.agreement_number || '',
            // Add aliases for compatibility
            customers: customerData,
            vehicles: item.vehicle,
            total_cost: item.total_amount || 0,
            customer: customerData
          };
          return agreement;
        });
      }
    });
  };
  
  // Get agreements using the query hook
  const agreementsQuery = useAgreementsList();
  
  // Mutation to create a new agreement
  const createAgreement = useMutation({
    mutationFn: async (agreementData: any) => {
      const { data, error } = await supabase
        .from('leases')  // Insert into leases table
        .insert(agreementData)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error creating agreement: ${error.message}`);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement created successfully');
    }
  });
  
  // Mutation to update an existing agreement
  const updateAgreement = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: updatedData, error } = await supabase
        .from('leases')  // Update in leases table
        .update(data)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error updating agreement: ${error.message}`);
      }
      
      return updatedData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.invalidateQueries({ queryKey: ['agreement', variables.id] });
      toast.success('Agreement updated successfully');
    }
  });
  
  // Mutation to delete an agreement
  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leases')  // Delete from leases table
        .delete()
        .eq('id', id);
        
      if (error) {
        throw new Error(`Error deleting agreement: ${error.message}`);
      }
      
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.removeQueries({ queryKey: ['agreement', id] });
      toast.success('Agreement deleted successfully');
    }
  });

  // Function to get a single agreement by ID
  const getAgreement = async (id: string) => {
    if (!id) return null;

    const { data, error } = await supabase
      .from('leases')  // Get from leases table
      .select(`
        *,
        customer:customer_id(id, full_name, email, phone),
        vehicle:vehicle_id(*),
        payments(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching agreement: ${error.message}`);
    }

    // Make sure the returned data conforms to SimpleAgreement structure
    const customerData = data.customer || {};
    
    const agreement: FlattenType<SimpleAgreement> = {
      ...data,
      // Map status to expected format
      status: mapDatabaseStatus(data.status || ''),
      // Ensure these fields exist with correct names
      total_amount: data.total_amount || 0,
      agreement_number: data.agreement_number || '',
      // Add aliases for compatibility
      customers: customerData,
      vehicles: data.vehicle,
      total_cost: data.total_amount || 0,
      customer: customerData
    };

    return agreement;
  };

  // Function to get all agreements
  const getAgreements = async (filters?: any) => {
    let query = supabase
      .from('leases')  // Get from leases table
      .select(`
        *,
        customer:customer_id(id, full_name, email, phone),
        vehicle:vehicle_id(*)
      `)
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (filters?.customerId || filters?.customer_id) {
      query = query.eq('customer_id', filters.customerId || filters.customer_id);
    }

    if (filters?.vehicleId || filters?.vehicle_id) {
      query = query.eq('vehicle_id', filters.vehicleId || filters.vehicle_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching agreements: ${error.message}`);
    }

    // Transform the data to match the SimpleAgreement interface
    return (data || []).map(item => {
      const customerData = item.customer || {};
      
      const agreement: FlattenType<SimpleAgreement> = {
        ...item,
        // Map status to expected format
        status: mapDatabaseStatus(item.status || ''),
        // Ensure these fields exist with correct names
        total_amount: item.total_amount || 0,
        agreement_number: item.agreement_number || '',
        // Add aliases for compatibility
        customers: customerData,
        vehicles: item.vehicle,
        total_cost: item.total_amount || 0,
        customer: customerData
      };
      return agreement;
    });
  };

  // Return an object with clear properties for agreements, isLoading, error etc.
  return {
    // Query result properties
    agreements: agreementsQuery.data,
    isLoading: agreementsQuery.isLoading,
    error: agreementsQuery.error,
    
    // Query functions
    useAgreementsList,
    
    // Direct methods
    getAgreement,
    getAgreements,
    
    // Mutations
    createAgreement,
    updateAgreement,
    deleteAgreement,
    
    // Search params state
    searchParams,
    setSearchParams,
  };
};
