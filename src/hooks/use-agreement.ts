
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAgreementService } from './services/useAgreementService';
import type { Agreement, TableFilters } from '@/types/agreement';

export function useAgreement(agreementId?: string) {
  const {
    getAgreement,
    updateAgreement,
    deleteAgreement,
    calculateRemainingAmount,
  } = useAgreementService();

  const { data: agreement, isLoading, error } = useQuery({
    queryKey: ['agreement', agreementId],
    queryFn: () => getAgreement(agreementId!),
    enabled: !!agreementId,
  });

  const [filters, setFilters] = useState<TableFilters>({});

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
  };
}
