
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
      // تصفية البيانات لإرسال الحقول الموجودة في جدول leases فقط
      const updateData: any = {};
      
      // إضافة الحقول الموجودة فقط إذا كانت محددة
      if (updates.agreement_number !== undefined) updateData.agreement_number = updates.agreement_number;
      if (updates.customer_id !== undefined) updateData.customer_id = updates.customer_id;
      if (updates.vehicle_id !== undefined) updateData.vehicle_id = updates.vehicle_id;
      if (updates.start_date !== undefined) updateData.start_date = updates.start_date;
      if (updates.end_date !== undefined) updateData.end_date = updates.end_date;
      if (updates.rent_amount !== undefined) updateData.rent_amount = updates.rent_amount;
      if (updates.deposit_amount !== undefined) updateData.deposit_amount = updates.deposit_amount;
      if (updates.down_payment !== undefined) updateData.down_payment = updates.down_payment;
      if (updates.daily_late_fee !== undefined) updateData.daily_late_fee = updates.daily_late_fee;
      if (updates.payment_frequency !== undefined) updateData.payment_frequency = updates.payment_frequency;
      if (updates.payment_day !== undefined) updateData.payment_day = updates.payment_day;
      if (updates.rent_due_day !== undefined) updateData.rent_due_day = updates.rent_due_day;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.agreement_type !== undefined) updateData.agreement_type = updates.agreement_type;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.confirmation_email_sent !== undefined) updateData.confirmation_email_sent = updates.confirmation_email_sent;
      
      // إضافة updated_at دائماً
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('leases')
        .update(updateData)
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
