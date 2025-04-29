import { useApiMutation } from './use-api';
import { FinancialTransaction } from './financials-types';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';

export function useFinancialMutations(refetchTransactions: () => void, refetchSummary: () => void) {
  const { toast } = useToast();

  const addTransaction = useApiMutation<
    FinancialTransaction,
    Omit<FinancialTransaction, 'id'>
  >(
    async (transactionData) => {
      const { data, error } = await supabase
        .from('unified_payments')
        .insert({
          payment_date: transactionData.date.toISOString(),
          amount: transactionData.amount,
          description: transactionData.description,
          type: transactionData.type === 'income' ? 'Income' : 'Expense',
          status: transactionData.status,
          reference: transactionData.reference,
          payment_method: transactionData.paymentMethod,
          vehicle_id: transactionData.vehicleId,
          customer_id: transactionData.customerId
        })
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        date: new Date(data.payment_date),
        amount: data.amount,
        description: data.description,
        type: data.type?.toLowerCase() === 'expense' ? 'expense' : 'income',
        category: data.type === 'Expense' ?
          data.description?.includes('Salary') ? 'Salary' :
          data.description?.includes('Rent') ? 'Rent' :
          data.description?.includes('Utility') ? 'Utilities' : 'Other' : 'Rental',
        status: data.status,
        reference: data.reference,
        paymentMethod: data.payment_method,
        vehicleId: data.vehicle_id,
        customerId: data.customer_id
      };
    },
    {
      onSuccess: () => {
        toast({ title: 'Transaction added', description: 'Financial transaction has been added successfully.' });
        refetchTransactions();
        refetchSummary();
      }
    }
  );

  const updateTransaction = useApiMutation<
    FinancialTransaction,
    { id: string; data: Partial<FinancialTransaction> }
  >(
    async ({ id, data }) => {
      const { data: updatedData, error } = await supabase
        .from('unified_payments')
        .update({
          payment_date: data.date?.toISOString(),
          amount: data.amount,
          description: data.description,
          type: data.type === 'income' ? 'Income' : 'Expense',
          status: data.status,
          reference: data.reference,
          payment_method: data.paymentMethod,
          vehicle_id: data.vehicleId,
          customer_id: data.customerId
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return {
        id: updatedData.id,
        date: new Date(updatedData.payment_date),
        amount: updatedData.amount,
        description: updatedData.description,
        type: updatedData.type?.toLowerCase() === 'expense' ? 'expense' : 'income',
        category: updatedData.type === 'Expense' ?
          updatedData.description?.includes('Salary') ? 'Salary' :
          updatedData.description?.includes('Rent') ? 'Rent' :
          updatedData.description?.includes('Utility') ? 'Utilities' : 'Other' : 'Rental',
        status: updatedData.status,
        reference: updatedData.reference,
        paymentMethod: updatedData.payment_method,
        vehicleId: updatedData.vehicle_id,
        customerId: updatedData.customer_id
      };
    },
    {
      onSuccess: () => {
        toast({ title: 'Transaction updated', description: 'Financial transaction has been updated successfully.' });
        refetchTransactions();
        refetchSummary();
      }
    }
  );

  const deleteTransaction = useApiMutation<string, string>(
    async (id) => {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    {
      onSuccess: () => {
        toast({ title: 'Transaction deleted', description: 'Financial transaction has been deleted successfully.' });
        refetchTransactions();
        refetchSummary();
      }
    }
  );

  return { addTransaction, updateTransaction, deleteTransaction };
}
