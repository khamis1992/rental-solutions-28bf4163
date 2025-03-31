
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SearchParams {
  query?: string;
  status?: string;
  vehicle_id?: string;
  customer_id?: string;
}

export const useAgreements = (initialFilters: SearchParams = {}) => {
  const [searchParams, setSearchParams] = useState<SearchParams>(initialFilters);
  const queryClient = useQueryClient();

  // Get agreement by ID
  const getAgreement = async (id: string): Promise<Agreement | null> => {
    try {
      console.log(`Fetching agreement details for ID: ${id}`);

      if (!id || id.trim() === '') {
        console.error("Invalid agreement ID provided");
        toast.error("Invalid agreement ID");
        return null;
      }

      // First, get the lease data
      const { data, error } = await supabase
        .from('leases')
        .select('*')
        .eq('id', id)
        .single();

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

      // If we have the lease data, get the related customer and vehicle data
      let customerData = null;
      let vehicleData = null;

      // Get customer data
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

      // Get vehicle data - optimized with error handling
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

      // Map database status to AgreementStatus type
      let mappedStatus: typeof AgreementStatus[keyof typeof AgreementStatus] = AgreementStatus.DRAFT;

      switch(data.status) {
        case 'active':
          mappedStatus = AgreementStatus.ACTIVE;
          break;
        case 'pending_payment':
        case 'pending_deposit':
          mappedStatus = AgreementStatus.PENDING;
          break;
        case 'cancelled':
          mappedStatus = AgreementStatus.CANCELLED;
          break;
        case 'completed':
        case 'terminated':
          mappedStatus = AgreementStatus.CLOSED;
          break;
        case 'archived':
          mappedStatus = AgreementStatus.EXPIRED;
          break;
        default:
          mappedStatus = AgreementStatus.DRAFT;
      }

      // Transform to Agreement type with safe property access and proper date handling
      const agreement: Agreement = {
        id: data.id,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        status: mappedStatus,
        created_at: data.created_at ? new Date(data.created_at) : undefined,
        updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
        total_amount: data.total_amount || 0,
        deposit_amount: data.deposit_amount || 0, 
        agreement_number: data.agreement_number || '',
        notes: data.notes || '',
        terms_accepted: true, // Default to true since the column doesn't exist in DB
        additional_drivers: [], // Default empty array as this may not exist in the database
        customers: customerData,
        vehicles: vehicleData,
        // Use type assertion with 'as' to tell TypeScript this property exists
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

  // Implementation for fetching all agreements with filtering
  const fetchAgreements = async (): Promise<Agreement[]> => {
    console.log("Fetching agreements with params:", searchParams);

    try {
      let query = supabase
        .from('leases')
        .select(`
          *,
          profiles:customer_id (id, full_name, email, phone_number),
          vehicles:vehicle_id (id, make, model, license_plate, image_url)
        `);

      // Apply filters
      if (searchParams.status && searchParams.status !== 'all') {
        // Handle the status filter based on the AgreementStatus enum
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
            // Using filter method instead of .eq('status', 'draft')
            query = query.filter('status', 'eq', 'draft');
            break;
          default:
            // If it's a direct database status value, use a different approach
            if (typeof searchParams.status === 'string') {
              // Use filter method instead of eq to avoid type issues
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

      // Improved search query handling
      if (searchParams.query && searchParams.query.trim() !== '') {
        const searchQuery = searchParams.query.trim().toLowerCase();
        
        // Try to determine if this is a license plate or numeric search
        const isNumericSearch = /^\d+$/.test(searchQuery);
        const isLicensePlateSearch = /^[A-Za-z0-9-]+$/.test(searchQuery);
        
        // Build a more robust OR filter for different search scenarios
        let orConditions = [];
        
        // Always search agreement number (most specific)
        orConditions.push(`agreement_number.ilike.%${searchQuery}%`);
        
        // For license plates, we need to be explicit about the table/column
        orConditions.push(`vehicles.license_plate.ilike.%${searchQuery}%`);
        
        // Customer name search
        orConditions.push(`profiles.full_name.ilike.%${searchQuery}%`);
        
        // If it looks like a number, also search for agreements ending with those digits
        if (isNumericSearch) {
          orConditions.push(`agreement_number.ilike.%${searchQuery}`);
          
          // For numeric searches, also try license plates ending with those digits
          if (searchQuery.length >= 2) {
            orConditions.push(`vehicles.license_plate.ilike.%${searchQuery}`);
          }
        }
        
        // Apply the combined OR conditions
        query = query.or(orConditions.join(','));
      }

      console.log("Executing Supabase query...");
      const { data, error } = await query;

      if (error) {
        console.error("Error fetching agreements:", error);
        throw new Error(`Failed to fetch agreements: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log("No agreements found with the given filters");
        return [];
      }

      console.log(`Found ${data.length} agreements`, data);

      // Transform to Agreement type with proper date handling
      const agreements: Agreement[] = data.map(item => {
        // Map database status to AgreementStatus type
        let mappedStatus: typeof AgreementStatus[keyof typeof AgreementStatus] = AgreementStatus.DRAFT;

        switch(item.status) {
          case 'active':
            mappedStatus = AgreementStatus.ACTIVE;
            break;
          case 'pending_payment':
          case 'pending_deposit':
            mappedStatus = AgreementStatus.PENDING;
            break;
          case 'cancelled':
            mappedStatus = AgreementStatus.CANCELLED;
            break;
          case 'completed':
          case 'terminated':
            mappedStatus = AgreementStatus.CLOSED;
            break;
          case 'archived':
            mappedStatus = AgreementStatus.EXPIRED;
            break;
          default:
            mappedStatus = AgreementStatus.DRAFT;
        }

        return {
          id: item.id,
          customer_id: item.customer_id,
          vehicle_id: item.vehicle_id,
          start_date: new Date(item.start_date),
          end_date: new Date(item.end_date),
          status: mappedStatus,
          created_at: item.created_at ? new Date(item.created_at) : undefined,
          updated_at: item.updated_at ? new Date(item.updated_at) : undefined,
          total_amount: item.total_amount || 0,
          deposit_amount: item.deposit_amount || 0,
          agreement_number: item.agreement_number || '',
          notes: item.notes || '',
          terms_accepted: true,
          additional_drivers: [], // Default empty array as this may not exist in the database
          customers: item.profiles,
          vehicles: item.vehicles,
          signature_url: (item as any).signature_url // Using type assertion to avoid TypeScript errors
        };
      });

      return agreements;
    } catch (err) {
      console.error("Unexpected error in fetchAgreements:", err);
      throw err;
    }
  };

  const createAgreement = async (data: Partial<Agreement>) => {
    // Implementation for creating an agreement
    return {} as Agreement;
  };

  const updateAgreement = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Agreement> }) => {
      // Implementation for updating an agreement
      return {} as Agreement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
  });

  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      // Implementation for deleting an agreement
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
  });

  const { data: agreements, isLoading, error } = useQuery({
    queryKey: ['agreements', searchParams],
    queryFn: fetchAgreements,
    staleTime: 30000, // Cache data for 30 seconds
    gcTime: 60000, // Keep unused data in cache for 1 minute
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
  };
};
