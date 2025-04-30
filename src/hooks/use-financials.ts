import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApiQuery, useApiMutation } from '@/hooks/api/index';

export const useFinancials = () => {
  const queryClient = useQueryClient();

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const fetchFinancialData = async () => {
    let query = supabase
      .from('unified_payments')
      .select('*');

    if (startDate) {
      query = query.gte('payment_date', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('payment_date', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const { data: financialData, isLoading, error } = useApiQuery(
    ['financialData', startDate, endDate],
    fetchFinancialData
  );

  const createPayment = useApiMutation(
    async (payment: any) => {
      const { data, error } = await supabase
        .from('unified_payments')
        .insert([payment]);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('financialData');
      },
    }
  );

  return {
    financialData,
    isLoading,
    error,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    createPayment: createPayment.mutate,
    isCreatingPayment: createPayment.isLoading,
  };
};
