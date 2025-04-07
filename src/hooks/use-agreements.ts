import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { doesLicensePlateMatch, isLicensePlatePattern } from '@/utils/searchUtils';
import { useQueryWithCache } from './use-query-with-cache';
import { Simplify } from '@/utils/type-utils';

// Define Agreement status enum
export enum AgreementStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  CLOSED = 'closed',
  DRAFT = 'draft'
}

// Define Agreement type
export interface Agreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date?: string | null;
  end_date?: string | null;
  agreement_type?: string;
  agreement_number?: string;
  status?: string;
  total_amount?: number;
  monthly_payment?: number;
  agreement_duration?: any;
  created_at?: string;
  updated_at?: string;
  signature_url?: string;
  deposit_amount?: number;
  notes?: string;
  customers?: any;
  vehicles?: any;
}

// Simplified type to avoid excessive deep instantiation
export type SimpleAgreement = {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date?: string | null;
  end_date?: string | null;
  agreement_type?: string;
  agreement_number?: string;
  status?: string;
  total_amount?: number;
  monthly_payment?: number;
  agreement_duration?: any;
  customer_name?: string;
  license_plate?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  created_at?: string;
  updated_at?: string;
  signature_url?: string;
  deposit_amount?: number;
  notes?: string;
  customers?: any;
  vehicles?: any;
};

// Function to convert database status to AgreementStatus enum value
export const mapDBStatusToEnum = (dbStatus: string): AgreementStatus => {
  switch(dbStatus) {
    case 'active':
      return AgreementStatus.ACTIVE;
    case 'pending_payment':
    case 'pending_deposit':
      return AgreementStatus.PENDING;
    case 'cancelled':
      return AgreementStatus.CANCELLED;
    case 'completed':
    case 'terminated':
      return AgreementStatus.CLOSED;
    case 'archived':
      return AgreementStatus.EXPIRED;
    case 'draft':
      return AgreementStatus.DRAFT;
    default:
      return AgreementStatus.DRAFT;
  }
};

interface SearchParams {
  query?: string;
  status?: string;
  vehicle_id?: string;
  customer_id?: string;
  page?: number;
  pageSize?: number;
}

// Track pagination state in this hook
export const useAgreements = (initialFilters: SearchParams = {}) => {
  const defaultPageSize = 10; // Default page size
  const [searchParams, setSearchParams] = useState<SearchParams>({
    page: 1,
    pageSize: defaultPageSize,
    ...initialFilters
  });
  const queryClient = useQueryClient();

  const getAgreement = async (id: string): Promise<SimpleAgreement | null> => {
    try {
      console.log(`Fetching agreement details for ID: ${id}`);

      if (!id || id.trim() === '') {
        console.error("Invalid agreement ID provided");
        toast.error("Invalid agreement ID");
        return null;
      }

      const { data, error } = await supabase
        .from('leases')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching agreement from Supabase:", error);
        toast.error(`Failed to load agreement details: ${error.message}`);
        return null;
      }

      if (!data) {
        console.error(`No lease data found for ID: ${id}`);
        return null;
      }

      console.log("Raw lease data from Supabase:", data);

      let customerData = null;
      let vehicleData = null;

      if (data.customer_id) {
        try {
          const { data: customer, error: customerError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone_number, driver_license, nationality, address')
            .eq('id', data.customer_id)
            .maybeSingle();

          if (customerError) {
            console.error("Error fetching customer:", customerError);
          } else if (customer) {
            console.log("Customer data fetched:", customer);
            customerData = customer;
          } else {
            console.log(`No customer found with ID: ${data.customer_id}`);
          }
        } catch (customerFetchError) {
          console.error("Error in customer data fetch:", customerFetchError);
        }
      }

      if (data.vehicle_id) {
        try {
          const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .select('id, make, model, license_plate, image_url, year, color, vin')
            .eq('id', data.vehicle_id)
            .maybeSingle();

          if (vehicleError) {
            console.error("Error fetching vehicle:", vehicleError);
          } else if (vehicle) {
            console.log("Vehicle data fetched:", vehicle);
            vehicleData = vehicle;
          } else {
            console.log(`No vehicle found with ID: ${data.vehicle_id}`);
          }
        } catch (vehicleFetchError) {
          console.error("Error in vehicle data fetch:", vehicleFetchError);
        }
      }

      // Use the helper function to map status
      const mappedStatus = mapDBStatusToEnum(data.status);

      const agreement: SimpleAgreement = {
        id: data.id,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        start_date: data.start_date,
        end_date: data.end_date,
        status: mappedStatus,
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_amount: data.total_amount || 0,
        deposit_amount: data.deposit_amount || 0, 
        agreement_number: data.agreement_number || '',
        notes: data.notes || '',
        customers: customerData,
        vehicles: vehicleData,
        signature_url: (data as any).signature_url
      };

      console.log("Transformed agreement data:", agreement);
      return agreement;
    } catch (err) {
      console.error("Unexpected error in getAgreement:", err);
      toast.error("An unexpected error occurred while loading agreement details");
      return null;
    }
  };

  const fetchAgreements = async (): Promise<{
    agreements: Agreement[],
    totalCount: number
  }> => {
    console.log("Fetching agreements with params:", searchParams);

    try {
      // Create count query to get total records for pagination
      const countQuery = supabase
        .from('leases')
        .select('id', { count: 'exact', head: true });
        
      // Apply filters to count query
      let filteredCountQuery = countQuery;
      
      if (searchParams.status && searchParams.status !== 'all') {
        switch(searchParams.status) {
          case AgreementStatus.ACTIVE:
            filteredCountQuery = filteredCountQuery.eq('status', 'active');
            break;
          case AgreementStatus.PENDING:
            filteredCountQuery = filteredCountQuery.or('status.eq.pending_payment,status.eq.pending_deposit');
            break;
          case AgreementStatus.CANCELLED:
            filteredCountQuery = filteredCountQuery.eq('status', 'cancelled');
            break;
          case AgreementStatus.CLOSED:
            filteredCountQuery = filteredCountQuery.or('status.eq.completed,status.eq.terminated');
            break;
          case AgreementStatus.EXPIRED:
            filteredCountQuery = filteredCountQuery.eq('status', 'archived');
            break;
          case AgreementStatus.DRAFT:
            filteredCountQuery = filteredCountQuery.filter('status', 'eq', 'draft');
            break;
          default:
            if (typeof searchParams.status === 'string') {
              filteredCountQuery = filteredCountQuery.filter('status', 'eq', searchParams.status);
            }
        }
      }
      
      if (searchParams.vehicle_id) {
        filteredCountQuery = filteredCountQuery.eq('vehicle_id', searchParams.vehicle_id);
      }

      if (searchParams.customer_id) {
        filteredCountQuery = filteredCountQuery.eq('customer_id', searchParams.customer_id);
      }

      // Get total count first
      const { count: totalCount, error: countError } = await filteredCountQuery;
      
      if (countError) {
        console.error("Error getting count of agreements:", countError);
        throw new Error(`Failed to get count: ${countError.message}`);
      }
      
      // Create data query with pagination
      let query = supabase
        .from('leases')
        .select(`
          *,
          profiles:customer_id (id, full_name, email, phone_number),
          vehicles:vehicle_id (id, make, model, license_plate, image_url, year, color, vin)
        `);

      // Apply the same filters to the data query
      if (searchParams.status && searchParams.status !== 'all') {
        switch(searchParams.status) {
          case AgreementStatus.ACTIVE:
            query = query.eq('status', 'active');
            break;
          case AgreementStatus.PENDING:
            query = query.or('status.eq.pending_payment,status.eq.pending_deposit');
            break;
          case AgreementStatus.CANCELLED:
            query = query.eq('status', 'cancelled');
            break;
          case AgreementStatus.CLOSED:
            query = query.or('status.eq.completed,status.eq.terminated');
            break;
          case AgreementStatus.EXPIRED:
            query = query.eq('status', 'archived');
            break;
          case AgreementStatus.DRAFT:
            query = query.filter('status', 'eq', 'draft');
            break;
          default:
            if (typeof searchParams.status === 'string') {
              query = query.filter('status', 'eq', searchParams.status);
            }
        }
      }

      if (searchParams.vehicle_id) {
        query = query.eq('vehicle_id', searchParams.vehicle_id);
      }

      if (searchParams.customer_id) {
        query = query.eq('customer_id', searchParams.customer_id);
      }

      // Add search functionality
      if (searchParams.query && searchParams.query.trim() !== '') {
        const searchQuery = searchParams.query.trim().toLowerCase();
        
        if (searchQuery) {
          // Get vehicle IDs that match the search
          const { data: vehicleIds, error: vehicleError } = await supabase
            .from('vehicles')
            .select('id')
            .ilike('license_plate', `%${searchQuery}%`);
          
          if (vehicleError) {
            console.error("Error searching vehicles:", vehicleError);
          } else if (vehicleIds && vehicleIds.length > 0) {
            // Filter by matching vehicle IDs
            const ids = vehicleIds.map(v => v.id);
            query = query.in('vehicle_id', ids);
          } else {
            // Otherwise try matching against customer names
            query = query.ilike('profiles.full_name', `%${searchQuery}%`);
          }
        }
      }

      // Add pagination
      const page = searchParams.page || 1;
      const pageSize = searchParams.pageSize || defaultPageSize;
      const startIndex = (page - 1) * pageSize;
      
      query = query
        .order('created_at', { ascending: false }) // Order by creation date
        .range(startIndex, startIndex + pageSize - 1); // Apply range for pagination

      console.log("Executing Supabase query with pagination...");
      const { data, error } = await query;

      if (error) {
        console.error("Error fetching agreements:", error);
        throw new Error(`Failed to fetch agreements: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log("No agreements found with the given filters");
        return { agreements: [], totalCount: totalCount || 0 };
      }

      console.log(`Found ${data.length} agreements (total: ${totalCount})`);

      const agreements: Agreement[] = data.map(item => {
        // Use the helper function to map status
        const mappedStatus = mapDBStatusToEnum(item.status);

        return {
          id: item.id,
          customer_id: item.customer_id,
          vehicle_id: item.vehicle_id,
          start_date: item.start_date,
          end_date: item.end_date,
          status: mappedStatus,
          created_at: item.created_at,
          updated_at: item.updated_at,
          total_amount: item.total_amount || 0,
          deposit_amount: item.deposit_amount || 0,
          agreement_number: item.agreement_number || '',
          notes: item.notes || '',
          customers: item.profiles,
          vehicles: item.vehicles,
          signature_url: (item as any).signature_url
        };
      });

      return { agreements, totalCount: totalCount || 0 };
    } catch (err) {
      console.error("Unexpected error in fetchAgreements:", err);
      throw err;
    }
  };

  const createAgreement = async (data: Partial<SimpleAgreement>) => {
    return {} as SimpleAgreement;
  };

  // Create mutation for updating agreements
  const updateAgreementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      console.log("Update mutation called with:", { id, data });
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
  });

  const updateAgreement = updateAgreementMutation;

  // Define the delete mutation with a simpler type to avoid excessive instantiation
  const deleteAgreementMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log(`Starting deletion process for agreement ${id}`);
      
      try {
        // Step 1: Delete related overdue_payments records first (foreign key constraint)
        const { error: overduePaymentsDeleteError } = await supabase
          .from('overdue_payments')
          .delete()
          .eq('agreement_id', id);
          
        if (overduePaymentsDeleteError) {
          console.error(`Failed to delete related overdue payments for ${id}:`, overduePaymentsDeleteError);
        }
        
        // Step 2: Delete related unified_payments records
        const { error: paymentDeleteError } = await supabase
          .from('unified_payments')
          .delete()
          .eq('lease_id', id);
          
        if (paymentDeleteError) {
          console.error(`Failed to delete related payments for ${id}:`, paymentDeleteError);
        }
        
        // Step 3: Delete related import revert records
        const { data: relatedReverts } = await supabase
          .from('agreement_import_reverts')
          .select('id')
          .eq('import_id', id);
          
        if (relatedReverts && relatedReverts.length > 0) {
          const { error: revertDeleteError } = await supabase
            .from('agreement_import_reverts')
            .delete()
            .eq('import_id', id);
            
          if (revertDeleteError) {
            console.error(`Failed to delete related revert records for ${id}:`, revertDeleteError);
          }
        }
        
        // Step 4: Check for any other potential related records
        const { data: trafficFines, error: trafficFinesError } = await supabase
          .from('traffic_fines')
          .select('id')
          .eq('agreement_id', id);
          
        if (!trafficFinesError && trafficFines && trafficFines.length > 0) {
          const { error: finesDeleteError } = await supabase
            .from('traffic_fines')
            .delete()
            .eq('agreement_id', id);
            
          if (finesDeleteError) {
            console.error(`Failed to delete related traffic fines for ${id}:`, finesDeleteError);
          }
        }
        
        // Finally: Delete the agreement itself
        const { error } = await supabase
          .from('leases')
          .delete()
          .eq('id', id);
          
        if (error) {
          console.error(`Failed to delete agreement ${id}:`, error);
          throw new Error(`Failed to delete agreement: ${error.message}`);
        }
        
        return id;
      } catch (error) {
        console.error('Error in deleteAgreement:', error);
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
    onSuccess: () => {
      toast.success('Agreement deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete agreement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Use our optimized query hook with caching
  const { data, isLoading, error } = useQueryWithCache<{
    agreements: Agreement[],
    totalCount: number
  }>(
    ['agreements', searchParams],
    fetchAgreements,
    {
      staleTime: 600000, // 10 minutes (increased from 5 minutes)
      gcTime: 900000, // 15 minutes (replaced cacheTime)
    }
  );

  const agreements = data?.agreements || [];
  const totalCount = data?.totalCount || 0;

  return {
    agreements,
    totalCount,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    getAgreement,
    createAgreement,
    updateAgreement,
    deleteAgreement: deleteAgreementMutation,
  };
};
