
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { SimpleAgreement } from '@/types/agreement';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export type AgreementStatus = 'active' | 'pending_payment' | 'pending_deposit' | 'completed' | 'cancelled' | 'closed' | 'terminated' | 'archived';

export interface AgreementFilters {
  status?: AgreementStatus;
  customer_id?: string;
  vehicle_id?: string; 
  search?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface UseAgreementsResult {
  agreements: SimpleAgreement[];
  loading: boolean;
  error: Error | null;
  filters: AgreementFilters;
  setFilters: React.Dispatch<React.SetStateAction<AgreementFilters>>;
  refetchAgreements: () => Promise<void>;
  clearFilters: () => void;
  deleteAgreement: any; // Using any temporarily to resolve TypeScript issues
}

export const useAgreements = (initialFilters: AgreementFilters = {}): UseAgreementsResult => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [agreements, setAgreements] = useState<SimpleAgreement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize filters from URL params or initial filters prop
  const [filters, setFilters] = useState<AgreementFilters>(() => {
    const urlStatus = searchParams.get('status');
    const urlCustomerId = searchParams.get('customer_id');
    const urlVehicleId = searchParams.get('vehicle_id');
    const urlSearch = searchParams.get('search');
    const urlStartDate = searchParams.get('start_date');
    const urlEndDate = searchParams.get('end_date');
    const urlSortBy = searchParams.get('sort_by');
    const urlSortOrder = searchParams.get('sort_order') as 'asc' | 'desc';
    
    return {
      status: urlStatus as AgreementStatus || initialFilters.status,
      customer_id: urlCustomerId || initialFilters.customer_id,
      vehicle_id: urlVehicleId || initialFilters.vehicle_id,
      search: urlSearch || initialFilters.search,
      start_date: urlStartDate || initialFilters.start_date,
      end_date: urlEndDate || initialFilters.end_date,
      sort_by: urlSortBy || initialFilters.sort_by || 'created_at',
      sort_order: urlSortOrder || initialFilters.sort_order || 'desc',
    };
  });

  const queryClient = useQueryClient();

  // Update URL params when filters change
  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    
    if (filters.status) newSearchParams.set('status', filters.status);
    if (filters.customer_id) newSearchParams.set('customer_id', filters.customer_id);
    if (filters.vehicle_id) newSearchParams.set('vehicle_id', filters.vehicle_id);
    if (filters.search) newSearchParams.set('search', filters.search);
    if (filters.start_date) newSearchParams.set('start_date', filters.start_date);
    if (filters.end_date) newSearchParams.set('end_date', filters.end_date);
    if (filters.sort_by) newSearchParams.set('sort_by', filters.sort_by);
    if (filters.sort_order) newSearchParams.set('sort_order', filters.sort_order);
    
    setSearchParams(newSearchParams);
  }, [filters, setSearchParams]);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('agreements')
        .select(`
          *,
          customer:customer_id(*),
          vehicle:vehicle_id(*)
        `);
      
      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }
      
      if (filters.vehicle_id) {
        query = query.eq('vehicle_id', filters.vehicle_id);
      }
      
      if (filters.search) {
        query = query.or(`
          agreement_number.ilike.%${filters.search}%,
          customer_id.ilike.%${filters.search}%,
          vehicle_id.ilike.%${filters.search}%
        `);
      }
      
      if (filters.start_date) {
        query = query.gte('start_date', filters.start_date);
      }
      
      if (filters.end_date) {
        query = query.lte('end_date', filters.end_date);
      }
      
      // Apply sorting
      if (filters.sort_by && filters.sort_order) {
        query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' });
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      // Transform the data to match the SimpleAgreement interface
      const transformedData: SimpleAgreement[] = data.map((agreement: any) => ({
        id: agreement.id,
        agreement_number: agreement.agreement_number,
        customer_id: agreement.customer_id,
        vehicle_id: agreement.vehicle_id,
        start_date: agreement.start_date,
        end_date: agreement.end_date,
        status: agreement.status,
        daily_rate: agreement.daily_rate || 0,
        signature_url: agreement.signature_url || null,
        created_at: agreement.created_at,
        updated_at: agreement.updated_at,
        total_amount: agreement.total_amount,
        deposit_amount: agreement.deposit_amount,
        notes: agreement.notes,
        rent_amount: agreement.rent_amount,
        daily_late_fee: agreement.daily_late_fee,
        customer: agreement.customer ? {
          id: agreement.customer.id,
          name: agreement.customer.full_name,
          email: agreement.customer.email,
          phone: agreement.customer.phone_number
        } : undefined,
        vehicle: agreement.vehicle ? {
          id: agreement.vehicle.id,
          make: agreement.vehicle.make,
          model: agreement.vehicle.model,
          year: agreement.vehicle.year,
          plate_number: agreement.vehicle.plate_number
        } : undefined
      }));

      setAgreements(transformedData);
    } catch (err) {
      console.error("Error fetching agreements:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch agreements when filters change
  useEffect(() => {
    fetchAgreements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.status,
    filters.customer_id,
    filters.vehicle_id,
    filters.search,
    filters.start_date,
    filters.end_date,
    filters.sort_by,
    filters.sort_order
  ]);

  // Mutation for deleting an agreement
  const deleteAgreementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agreements')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      
      return id;
    },
    onSuccess: (deletedId) => {
      // Update the agreements list
      setAgreements(prevAgreements => 
        prevAgreements.filter(agreement => agreement.id !== deletedId)
      );
      
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      
      toast.success('Agreement deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting agreement:', error);
      toast.error(`Failed to delete agreement: ${error.message}`);
    }
  });

  const clearFilters = () => {
    setFilters({
      sort_by: 'created_at',
      sort_order: 'desc'
    });
  };

  return {
    agreements,
    loading,
    error,
    filters,
    setFilters,
    refetchAgreements: fetchAgreements,
    clearFilters,
    deleteAgreement: deleteAgreementMutation,
    isLoading: loading,
    searchParams,
    setSearchParams
  };
};
