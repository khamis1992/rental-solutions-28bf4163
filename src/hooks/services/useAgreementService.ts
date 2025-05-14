
import { useState } from 'react';
import { useSupabaseQuery } from '../use-supabase-query';
import { agreementService } from '@/services/AgreementService';
import { AgreementFilters } from '@/types/filters';
import { Agreement } from '@/types/agreement';

export const useAgreementService = () => {
  const [searchParams, setSearchParams] = useState<AgreementFilters>({
    status: undefined,
    customer: undefined,
    dateRange: undefined,
    sortBy: 'created_at',
    sortDirection: 'desc',
    page: 1,
    pageSize: 10
  });

  const { data: agreements, isLoading, error, refetch } = useSupabaseQuery(
    ['agreements', searchParams],
    async () => {
      const result = await agreementService.findAgreements(searchParams);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data;
    }
  );

  const getAgreementDetails = async (id: string) => {
    const result = await agreementService.getAgreementById(id);
    if (result.error) {
      throw new Error(result.error.message);
    }
    return result.data;
  };

  const updateAgreement = async ({ id, data }: { id: string; data: any }) => {
    const result = await agreementService.save({
      ...data,
      id
    });
    if (result.error) {
      throw new Error(result.error.message);
    }
    await refetch();
    return result.data;
  };

  // Adding the missing createAgreement function
  const createAgreement = async (data: any) => {
    const result = await agreementService.save(data);
    if (result.error) {
      throw new Error(result.error.message);
    }
    await refetch();
    return result.data;
  };

  const deleteAgreement = async (id: string) => {
    const result = await agreementService.delete(id);
    if (result.error) {
      throw new Error(result.error.message);
    }
    await refetch();
    return true;
  };

  const calculateRemainingAmount = async (id: string) => {
    const result = await agreementService.calculateRemainingAmount(id);
    if (result.error) {
      throw new Error(result.error.message);
    }
    return result.data;
  };

  const isPending = {
    update: false,
    delete: false,
    create: false
  };

  return {
    agreements,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    getAgreementDetails,
    updateAgreement,
    createAgreement,
    deleteAgreement,
    calculateRemainingAmount,
    isPending
  };
};
