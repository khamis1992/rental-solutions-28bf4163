import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Agreement, 
  BaseAgreement,
  DatabaseAgreementStatus,
  DB_AGREEMENT_STATUS,
  AgreementStatus,
  mapDBStatusToFrontend 
} from '@/lib/validation-schemas/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FlattenType, BreakTypeRecursion } from '@/utils/type-utils';

interface CustomerProfile {
  id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
}

interface VehicleData {
  id: string;
  make?: string;
  model?: string;
  license_plate?: string;
  image_url?: string;
  year?: number;
  color?: string;
  vin?: string;
}

interface AgreementData {
  id: string;
  customer_id?: string;
  vehicle_id?: string;
  start_date: string;
  end_date: string;
  status: string;
  agreement_number?: string;
  total_amount?: number;
  deposit_amount?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  profiles?: CustomerProfile;
  vehicles?: VehicleData;
  signature_url?: string;
}

export type SimpleAgreement = BaseAgreement & {
  agreement_number?: string;
  total_amount?: number;
  deposit_amount?: number;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
  customers?: {
    id: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
  };
  vehicles?: {
    id: string;
    make?: string;
    model?: string;
    license_plate?: string;
    image_url?: string;
    year?: number;
    color?: string;
    vin?: string;
  };
  signature_url?: string;
  rent_amount?: number;
  daily_late_fee?: number;
};

interface SearchParams {
  query?: string;
  status?: string;
  vehicle_id?: string;
  customer_id?: string;
}

export function useAgreements(filters = {}, page = 1, pageSize = 10) {
  const supabase = useSupabase();
  
  return useQuery({
    queryKey: ['agreements', filters, page, pageSize],
    queryFn: async () => {
      // Select only necessary fields to reduce data transfer
      let query = supabase
        .from('leases')
        .select(`
          id, 
          status, 
          start_date, 
          end_date, 
          total_amount,
          profiles(id, full_name),
          vehicles(id, make, model, license_plate)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);
      
      // Apply filters dynamically
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          query = query.eq(key, value);
        }
      });
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      return { agreements: data, totalCount: count };
    },
    keepPreviousData: true, // Keep previous data to avoid flicker during pagination
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
  });
}

const createAgreement = async (data: Partial<SimpleAgreement>) => {
  return {} as SimpleAgreement;
};

type UpdateAgreementParams = { 
  id: string; 
  data: Record<string, any> 
};

const updateAgreementMutation = useMutation<any, Error, {id: string; data: Record<string, any>}>({
  mutationFn: async (params: {id: string; data: Record<string, any>}) => {
    console.log("Update mutation called with:", params);
    return {};
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['agreements'] });
  },
});

const updateAgreement = updateAgreementMutation;

const deleteAgreement = useMutation({
  mutationFn: async (id: string) => {
    console.log(`Starting deletion process for agreement ${id}`);
    
    try {
      const { error: overduePaymentsDeleteError } = await supabase
        .from('overdue_payments')
        .delete()
        .eq('agreement_id', id);
        
      if (overduePaymentsDeleteError) {
        console.error(`Failed to delete related overdue payments for ${id}:`, overduePaymentsDeleteError);
      }
      
      const { error: paymentDeleteError } = await supabase
        .from('unified_payments')
        .delete()
        .eq('lease_id', id);
        
      if (paymentDeleteError) {
        console.error(`Failed to delete related payments for ${id}:`, paymentDeleteError);
      }
      
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

const { data: agreements, isLoading, error } = useQuery({
  queryKey: ['agreements', searchParams],
  queryFn: fetchAgreements,
  staleTime: 600000,
  gcTime: 900000,
});

return {
  agreements,
  isLoading,
  error,
  searchParams,
  setSearchParams,
  getAgreement,
  createAgreement,
  updateAgreement: updateAgreementMutation,
  deleteAgreement,
};
