
import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/use-api';
import { Payment, PaymentFormData } from '@/types/payment';

export const usePayments = () => {
  // Mock data for demonstration - replace with actual API calls
  const mockPayments: Payment[] = [
    {
      id: '1',
      agreement_id: '123',
      amount: 1500,
      payment_date: '2023-05-15',
      due_date: '2023-05-10',
      status: 'paid',
      payment_method: 'credit_card',
      transaction_id: 'txn_123456',
      notes: 'Monthly rental payment',
      created_at: '2023-05-15T10:30:00Z',
      updated_at: '2023-05-15T10:30:00Z'
    },
    {
      id: '2',
      agreement_id: '124',
      amount: 2000,
      payment_date: '',
      due_date: '2023-06-10',
      status: 'pending',
      created_at: '2023-05-15T10:30:00Z',
      updated_at: '2023-05-15T10:30:00Z'
    }
  ];

  // List payments
  const useList = (agreementId?: string) => {
    return useApiQuery(
      ['payments', agreementId || 'all'], 
      async () => {
        // This would be an API call in a real implementation
        return agreementId 
          ? mockPayments.filter(p => p.agreement_id === agreementId)
          : mockPayments;
      }
    );
  };

  // Get single payment
  const useItem = (id: string) => {
    return useApiQuery(
      ['payments', id], 
      async () => {
        // This would be an API call in a real implementation
        return mockPayments.find(p => p.id === id) as Payment;
      }
    );
  };

  // Create payment
  const useCreate = () => 
    useApiMutation(
      async (data: PaymentFormData) => {
        // This would be an API call in a real implementation
        console.log('Creating payment:', data);
        return { id: 'new-id', ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Payment;
      }
    );

  // Update payment
  const useUpdate = () => 
    useApiMutation(
      async ({ id, data }: { id: string, data: Partial<PaymentFormData> }) => {
        // This would be an API call in a real implementation
        console.log(`Updating payment ${id}:`, data);
        return { id, ...data, updated_at: new Date().toISOString() } as Payment;
      }
    );

  // Delete payment
  const useDelete = () => 
    useApiMutation(
      async (id: string) => {
        // This would be an API call in a real implementation
        console.log(`Deleting payment ${id}`);
        return id;
      }
    );

  return {
    useList,
    useItem,
    useCreate,
    useUpdate,
    useDelete
  };
};
