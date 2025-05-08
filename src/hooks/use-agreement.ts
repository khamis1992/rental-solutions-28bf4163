
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgreementService } from './services/useAgreementService';
import type { Agreement, TableFilters } from '@/types/agreement';
import { asStatusColumn, AgreementStatus } from '@/types/agreement-types';
import { SortingState } from '@tanstack/react-table';

export function useAgreement(agreementId?: string) {
  const queryClient = useQueryClient();
  const {
    getAgreementDetails,
    updateAgreement: updateAgreementService,
    deleteAgreement,
    calculateRemainingAmount,
  } = useAgreementService();

  const { data: agreement, isLoading, error } = useQuery({
    queryKey: ['agreement', agreementId],
    queryFn: () => getAgreementDetails(agreementId!),
    enabled: !!agreementId,
  });

  // Table states
  const [filters, setFilters] = useState<TableFilters>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Update agreement status
  const updateAgreement = async (agreementId: string, data: { status?: AgreementStatus, [key: string]: any }) => {
    const formattedData = { ...data };
    
    // Convert status to database format if provided
    if (data.status) {
      formattedData.status = asStatusColumn(data.status);
    }
    
    return updateAgreementService({ id: agreementId, data: formattedData });
  };

  const handleFilterChange = (newFilters: TableFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    agreement,
    isLoading,
    error,
    filters,
    handleFilterChange,
    updateAgreement,
    deleteAgreement,
    calculateRemainingAmount,
    pagination,
    setPagination,
    sorting,
    setSorting,
    globalFilter,
    setGlobalFilter,
  };
}
