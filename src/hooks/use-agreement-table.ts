
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgreementService } from './services/useAgreementService';
import { SortingState } from '@tanstack/react-table';
import { toast } from 'sonner';

export function useAgreementTable() {
  const queryClient = useQueryClient();
  const {
    agreements,
    isLoading,
    error,
    updateAgreement: updateAgreementService,
    searchParams,
    setSearchParams,
  } = useAgreementService();

  // Table states
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Update agreement
  const updateAgreement = async (id: string, data: Record<string, any>) => {
    try {
      await updateAgreementService({ id, data });
      toast.success('Agreement updated successfully');
      return true;
    } catch (err: any) {
      toast.error(`Failed to update agreement: ${err.message || 'Unknown error'}`);
      return false;
    }
  };

  const handleFilterChange = (filters: any) => {
    setSearchParams(prev => ({ ...prev, ...filters }));
  };

  return {
    agreements,
    isLoading,
    error,
    updateAgreement,
    pagination,
    setPagination,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
    searchParams,
    handleFilterChange,
  };
}
