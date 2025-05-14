
import { useState, useMemo } from 'react';
import { AgreementService } from '@/services/AgreementService';
import { Agreement } from '@/types/agreement';
import { AgreementFilters } from '@/types/filters';

export interface SaveResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export function useAgreementService() {
  const service = useMemo(() => new AgreementService(), []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getAgreements = async (filters?: AgreementFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      return await service.findAgreements(filters);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get agreements'));
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getAgreementById = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const agreements = await service.findAgreements({ id });
      return agreements[0] || null;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get agreement'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAgreement = async (agreement: Agreement) => {
    setIsLoading(true);
    setError(null);
    try {
      return await service.save(agreement);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update agreement'));
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  };

  const createAgreement = async (agreement: Agreement) => {
    setIsLoading(true);
    setError(null);
    try {
      return await service.save(agreement);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create agreement'));
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAgreement = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await service.delete(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete agreement'));
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRemainingAmount = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await service.calculateRemainingAmount(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to calculate remaining amount'));
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error', amount: 0 };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getAgreements,
    getAgreementById,
    updateAgreement,
    createAgreement,
    deleteAgreement,
    calculateRemainingAmount,
    isLoading,
    error
  };
}
