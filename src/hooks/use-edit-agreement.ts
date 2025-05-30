
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { SimpleAgreement } from './use-agreements';
import { toast } from 'sonner';

export function useEditAgreement(agreementId: string) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: agreement, isLoading, error } = useQuery({
    queryKey: ['agreement', agreementId],
    queryFn: async (): Promise<SimpleAgreement | null> => {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:customer_id (
            id,
            full_name,
            email,
            phone_number,
            address,
            city,
            state,
            zip_code,
            role,
            created_at,
            updated_at
          ),
          vehicles:vehicle_id (
            id,
            make,
            model,
            license_plate,
            year,
            vin,
            color,
            status
          )
        `)
        .eq('id', agreementId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!agreementId,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Agreement>) => {
      const { data, error } = await supabase
        .from('leases')
        .update(updates)
        .eq('id', agreementId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Agreement updated successfully');
      queryClient.invalidateQueries({ queryKey: ['agreement', agreementId] });
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
    },
    onError: (error) => {
      toast.error(`Failed to update agreement: ${error.message}`);
    }
  });

  const updateAgreement = async (updates: Partial<Agreement>) => {
    setIsSubmitting(true);
    try {
      await updateMutation.mutateAsync(updates);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fixed: Use 'customers' instead of 'profiles'
  const customerName = agreement?.customers?.full_name || 'Unknown Customer';
  const customerEmail = agreement?.customers?.email || '';

  return {
    agreement,
    isLoading,
    error,
    isSubmitting,
    updateAgreement,
    customerName,
    customerEmail
  };
}
