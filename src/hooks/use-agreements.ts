
import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { AgreementStatus, AgreementType } from '@/types/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { doesLicensePlateMatch, isLicensePlatePattern } from '@/utils/searchUtils';
import { FlattenType, BaseAgreement } from '@/utils/type-utils';

export type SimpleAgreement = FlattenType<BaseAgreement>;

interface SearchParams {
  query?: string;
  status?: string;
  vehicle_id?: string;
  customer_id?: string;
}

export const mapDBStatusToEnum = (dbStatus: string): typeof AgreementStatus[keyof typeof AgreementStatus] => {
  switch(dbStatus) {
    case 'active':
      return AgreementStatus.ACTIVE;
    case 'pending':
      return AgreementStatus.PENDING;
    case 'completed':
      return AgreementStatus.COMPLETED;
    case 'canceled':
      return AgreementStatus.CANCELED;
    case 'overdue':
      return AgreementStatus.OVERDUE;
    case 'reserved':
      return AgreementStatus.RESERVED;
    case 'maintenance':
      return AgreementStatus.MAINTENANCE;
    default:
      return AgreementStatus.UNKNOWN;
  }
};

export const useAgreements = (initialFilters: SearchParams = {}) => {
  const [searchParams, setSearchParams] = useState<SearchParams>(initialFilters);
  const queryClient = useQueryClient();

  // Fetch all agreements with customer and vehicle details
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['agreements', searchParams],
    queryFn: async () => {
      // Start with a query that joins the customer and vehicle tables
      let query = supabase
        .from('leases')
        .select(`
          *,
          customers:customer_id (*),
          vehicles:vehicle_id (*)
        `);

      // Apply filters based on searchParams
      if (searchParams.status && searchParams.status !== 'all') {
        // Use type assertion to handle the status filter
        query = query.eq('status', searchParams.status as any);
      }

      if (searchParams.vehicle_id) {
        query = query.eq('vehicle_id', searchParams.vehicle_id);
      }

      if (searchParams.customer_id) {
        query = query.eq('customer_id', searchParams.customer_id);
      }

      // Order by creation date, most recent first
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Filter results based on search query if present
      let filteredData = data;
      if (searchParams.query) {
        const query = searchParams.query.toLowerCase();
        filteredData = data.filter((agreement: any) => {
          const customerName = agreement.customers?.full_name?.toLowerCase() || '';
          const agreementNumber = agreement.agreement_number?.toLowerCase() || '';
          const licensePlate = agreement.vehicles?.license_plate?.toLowerCase() || '';
          
          // Support for license plate pattern search
          if (isLicensePlatePattern(query) && licensePlate) {
            return doesLicensePlateMatch(licensePlate, query);
          }
          
          return (
            customerName.includes(query) || 
            agreementNumber.includes(query) || 
            licensePlate.includes(query)
          );
        });
      }

      // Process the data to extract customer and vehicle information
      return filteredData.map((agreement: any) => {
        // Create a flattened version for easier consumption
        return {
          ...agreement,
          customer_name: agreement.customers?.full_name || 'Unknown Customer',
          license_plate: agreement.vehicles?.license_plate || 'Unknown',
          vehicle_make: agreement.vehicles?.make || '',
          vehicle_model: agreement.vehicles?.model || '',
          vehicle_year: agreement.vehicles?.year || '',
          // Include signature URL if available
          signature_url: agreement.signature_url || null,
        } as SimpleAgreement;
      });
    },
  });

  // Create a new agreement
  const createAgreement = useMutation({
    mutationFn: async (newAgreement: Omit<SimpleAgreement, 'id'>) => {
      // Extract only the fields that are expected by the leases table
      const { data, error } = await supabase
        .from('leases')
        .insert([{
          customer_id: newAgreement.customer_id,
          vehicle_id: newAgreement.vehicle_id,
          start_date: newAgreement.start_date,
          end_date: newAgreement.end_date,
          // Ensure agreement_type is properly typed
          agreement_type: newAgreement.agreement_type as "short_term" | "lease_to_own",
          // Ensure status is properly typed
          status: (newAgreement.status || 'pending') as any,
          total_amount: newAgreement.total_amount,
          monthly_payment: newAgreement.monthly_payment,
          agreement_duration: newAgreement.agreement_duration,
          notes: newAgreement.notes,
          deposit_amount: newAgreement.deposit_amount,
          rent_amount: newAgreement.rent_amount,
          daily_late_fee: newAgreement.daily_late_fee,
          signature_url: newAgreement.signature_url
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate the agreements query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement created successfully');
    },
    onError: (error) => {
      console.error('Error creating agreement:', error);
      toast.error('Failed to create agreement');
    },
  });

  // Update an existing agreement
  const updateAgreement = useMutation({
    mutationFn: async ({ id, ...updatedAgreement }: SimpleAgreement) => {
      const { data, error } = await supabase
        .from('leases')
        .update({
          customer_id: updatedAgreement.customer_id,
          vehicle_id: updatedAgreement.vehicle_id,
          start_date: updatedAgreement.start_date,
          end_date: updatedAgreement.end_date,
          // Type assertion for agreement_type
          agreement_type: updatedAgreement.agreement_type as "short_term" | "lease_to_own",
          // Type assertion for status
          status: updatedAgreement.status as any,
          total_amount: updatedAgreement.total_amount,
          monthly_payment: updatedAgreement.monthly_payment,
          agreement_duration: updatedAgreement.agreement_duration,
          notes: updatedAgreement.notes,
          deposit_amount: updatedAgreement.deposit_amount,
          rent_amount: updatedAgreement.rent_amount,
          daily_late_fee: updatedAgreement.daily_late_fee,
          signature_url: updatedAgreement.signature_url
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate the agreements query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement updated successfully');
    },
    onError: (error) => {
      console.error('Error updating agreement:', error);
      toast.error('Failed to update agreement');
    },
  });

  // Get a single agreement by ID
  const getAgreement = async (id: string): Promise<SimpleAgreement | null> => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:customer_id (*),
          vehicles:vehicle_id (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Create a flattened version for easier consumption
      const agreement = {
        ...data,
        customer_name: data.customers?.full_name || 'Unknown Customer',
        license_plate: data.vehicles?.license_plate || 'Unknown',
        vehicle_make: data.vehicles?.make || '',
        vehicle_model: data.vehicles?.model || '',
        vehicle_year: data.vehicles?.year || '',
        // Handle signature_url with optional chaining
        signature_url: data.signature_url || null,
      } as unknown as SimpleAgreement;
      
      return agreement;
    } catch (error) {
      console.error('Error fetching agreement:', error);
      return null;
    }
  };

  // Fetch a single agreement by ID (as a hook)
  const useAgreementDetail = (id: string) => {
    return useQuery({
      queryKey: ['agreement', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('leases')
          .select(`
            *,
            customers:customer_id (*),
            vehicles:vehicle_id (*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        
        // Create a flattened version for easier consumption
        const agreement = {
          ...data,
          customer_name: data.customers?.full_name || 'Unknown Customer',
          license_plate: data.vehicles?.license_plate || 'Unknown',
          vehicle_make: data.vehicles?.make || '',
          vehicle_model: data.vehicles?.model || '',
          vehicle_year: data.vehicles?.year || '',
          // Handle signature_url with optional chaining
          signature_url: data.signature_url || null,
        } as unknown as SimpleAgreement;
        
        return agreement;
      },
    });
  };

  // Delete an agreement
  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate the agreements query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting agreement:', error);
      toast.error('Failed to delete agreement');
    },
  });

  // Custom hook to check if a vehicle is available for the given date range
  const useVehicleAvailability = (vehicleId: string, startDate: string, endDate: string, currentAgreementId?: string) => {
    return useQuery({
      queryKey: ['vehicleAvailability', vehicleId, startDate, endDate, currentAgreementId],
      queryFn: async () => {
        // We need to check if there are any active agreements that overlap with the given date range
        let query = supabase
          .from('leases')
          .select('id')
          .eq('vehicle_id', vehicleId)
          .eq('status', 'active')
          .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

        // Exclude the current agreement (if editing)
        if (currentAgreementId) {
          query = query.neq('id', currentAgreementId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // If no overlapping active agreements are found, the vehicle is available
        return {
          isAvailable: data.length === 0,
          conflictingAgreements: data
        };
      },
      enabled: !!vehicleId && !!startDate && !!endDate
    });
  };

  return {
    agreements: data || [],
    isLoading,
    error,
    refetch,
    setSearchParams,
    searchParams,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    getAgreement,
    useAgreementDetail,
    useVehicleAvailability
  };
};
