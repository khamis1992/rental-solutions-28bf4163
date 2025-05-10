
// Hook for managing car installment contracts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CarInstallmentContract, ContractFilters } from '@/types/car-installment';
import { toast } from 'sonner';
import { UseCarInstallmentContractsResult } from './types';

export function useCarInstallmentContracts(): UseCarInstallmentContractsResult {
  const queryClient = useQueryClient();
  const [contractFilters, setContractFilters] = useState<ContractFilters>({ search: '', status: '' });

  // Query contracts
  const {
    data: contracts = [],
    isLoading: isLoadingContracts,
    error
  } = useQuery({
    queryKey: ['car-installment-contracts', contractFilters],
    queryFn: async () => {
      let query = supabase.from('car_installment_contracts').select('*');

      if (contractFilters.status) {
        query = query.eq('status', contractFilters.status);
      }
      
      if (contractFilters.search) {
        query = query.ilike('car_type', `%${contractFilters.search}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  });

  // Create contract mutation
  const createContract = useMutation({
    mutationFn: async (newContract: Omit<CarInstallmentContract, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('car_installment_contracts')
        .insert([newContract])
        .select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-installment-contracts'] });
      queryClient.invalidateQueries({ queryKey: ['car-installment-summary'] });
      toast.success('Contract created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create contract: ${error.message}`);
    }
  });

  // Force a refresh of contracts data
  const fetchContracts = () => {
    queryClient.invalidateQueries({ queryKey: ['car-installment-contracts'] });
  };

  return {
    contracts,
    isLoadingContracts,
    contractFilters,
    setContractFilters,
    fetchContracts,
    createContract: createContract.mutate,
    error
  };
}
