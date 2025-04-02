import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { doesLicensePlateMatch, isLicensePlatePattern } from '@/utils/searchUtils';
import { FlattenType } from '@/utils/type-utils';

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

// Valid database status values
const VALID_DB_STATUSES = [
  'active',
  'pending_payment',
  'pending_deposit',
  'cancelled',
  'completed',
  'terminated',
  'archived',
  'draft'
] as const;

type ValidDbStatus = typeof VALID_DB_STATUSES[number];

// Function to convert database status to AgreementStatus enum value
export const mapDBStatusToEnum = (dbStatus: string): typeof AgreementStatus[keyof typeof AgreementStatus] => {
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
    default:
      return AgreementStatus.DRAFT;
  }
};

// Map UI enum status to database status
const mapEnumToDBStatus = (uiStatus: string): ValidDbStatus | null => {
  switch(uiStatus) {
    case AgreementStatus.ACTIVE:
      return 'active';
    case AgreementStatus.PENDING:
      return 'pending_payment';
    case AgreementStatus.CANCELLED:
      return 'cancelled';
    case AgreementStatus.CLOSED:
      return 'completed';
    case AgreementStatus.EXPIRED:
      return 'archived';
    case AgreementStatus.DRAFT:
      return 'draft';
    default:
      return null;
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

export const useAgreements = (initialFilters: SearchParams = {}) => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    ...initialFilters,
    page: initialFilters.page || 0,
    pageSize: initialFilters.pageSize || 10
  });
  const queryClient = useQueryClient();

  // Get a single agreement by ID
  const getAgreement = async (id: string): Promise<SimpleAgreement | null> => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select('*')
        .eq('id', id)
        .maybeSingle();
        
      if (error || !data) return null;
      return data as SimpleAgreement;
    } catch (err) {
      console.error("Error fetching agreement:", err);
      return null;
    }
  };

  // Fetch agreements with server-side filtering
  const fetchAgreements = async (): Promise<SimpleAgreement[]> => {
    console.log("Fetching agreements with params:", searchParams);
    try {
      // Start building the query
      let query = supabase
        .from('leases')
        .select(`
          *,
          profiles:customer_id (id, full_name, email, phone_number),
          vehicles:vehicle_id (id, make, model, license_plate, image_url, year, color, vin)
        `);
        
      // Apply status filter if provided and not 'all'
      if (searchParams.status && searchParams.status !== 'all') {
        // Check if the status matches one of our enum values
        const dbStatus = mapEnumToDBStatus(searchParams.status);
        
        if (dbStatus) {
          // If we have a valid DB status from the enum mapping, use it
          query = query.eq('status', dbStatus);
        } else if (VALID_DB_STATUSES.includes(searchParams.status as ValidDbStatus)) {
          // Otherwise, if it's already a valid DB status, use it directly
          query = query.eq('status', searchParams.status as ValidDbStatus);
        } else {
          console.warn(`Invalid status filter value: ${searchParams.status}`);
        }
      }
      
      // Apply vehicle filter if provided
      if (searchParams.vehicle_id) {
        query = query.eq('vehicle_id', searchParams.vehicle_id);
      }
      
      // Apply customer filter if provided
      if (searchParams.customer_id) {
        query = query.eq('customer_id', searchParams.customer_id);
      }
      
      // Apply search query if provided (for license plate or agreement number)
      if (searchParams.query && searchParams.query.trim()) {
        const searchTerm = searchParams.query.trim();
        if (isLicensePlatePattern(searchTerm)) {
          // If it looks like a license plate, search by license plate through the join
          query = query.filter('vehicles.license_plate', 'ilike', `%${searchTerm}%`);
        } else {
          // Otherwise search by agreement number
          query = query.filter('agreement_number', 'ilike', `%${searchTerm}%`);
        }
      }
      
      // Apply sorting - default to newest first
      query = query.order('created_at', { ascending: false });
      
      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        console.error("Error in fetchAgreements:", error);
        throw error;
      }
      
      if (!data) return [];
      
      return data as SimpleAgreement[];
    } catch (err) {
      console.error("Error fetching agreements:", err);
      throw err;
    }
  };

  // Create a new agreement
  const createAgreement = async (data: Partial<SimpleAgreement>) => {
    return {} as SimpleAgreement;
  };

  // Update an existing agreement
  const updateAgreementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      console.log("Update mutation called with:", { id, data });
      return {} as Record<string, any>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
  });

  const updateAgreement = updateAgreementMutation;

  // Delete an agreement
  const deleteAgreement = useMutation({
    mutationFn: async (id: string): Promise<string> => {
      try {
        const { error } = await supabase
          .from('leases')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        return id;
      } catch (error) {
        console.error('Error in deleteAgreement:', error);
        throw error;
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

  // Main query to fetch agreements
  const { data: agreements, isLoading, error, refetch } = useQuery({
    queryKey: ['agreements', searchParams],
    queryFn: fetchAgreements,
    staleTime: 60000, // 1 minute - reduced to prevent stale data issues
    gcTime: 300000, // 5 minutes
    retry: 1, // Only retry once to prevent excessive calls on error
  });

  return {
    agreements,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    getAgreement,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    refetch
  };
};
