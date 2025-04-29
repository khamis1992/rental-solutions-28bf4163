import { useApiMutation } from './use-api';
import { FinancialTransaction } from './financials-types';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';

export function useExpenseMutations(refetchExpenses: () => void, refetchSummary: () => void) {
  const { toast } = useToast();

  const addExpense = useApiMutation<
    FinancialTransaction,
    Omit<FinancialTransaction, 'id'>
  >(
    async (expenseData) => {
      const nextPaymentDate = expenseData.nextPaymentDate ? expenseData.nextPaymentDate.toISOString() : null;
      const { data, error } = await supabase
        .from('unified_payments')
        .insert({
          payment_date: expenseData.date.toISOString(),
          amount: expenseData.amount,
          description: expenseData.description,
          type: 'Expense',
          status: expenseData.status,
          reference: expenseData.reference,
          payment_method: expenseData.paymentMethod,
          is_recurring: expenseData.isRecurring || false,
          recurring_interval: expenseData.recurringInterval,
          next_payment_date: nextPaymentDate
        })
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        date: new Date(data.payment_date),
        amount: data.amount,
        description: data.description,
        type: 'expense',
        category: data.description?.includes('Salary') ? 'Salary' :
          expenseData.description?.includes('Rent') ? 'Rent' :
          expenseData.description?.includes('Utility') ? 'Utilities' : 'Other',
        status: data.status,
        reference: data.reference,
        paymentMethod: data.payment_method,
        isRecurring: data.is_recurring || false,
        recurringInterval: data.recurring_interval,
        nextPaymentDate: data.next_payment_date ? new Date(data.next_payment_date) : undefined
      };
    },
    {
      onSuccess: () => {
        toast({ title: 'Expense added', description: 'Expense has been added successfully.' });
        refetchExpenses();
        refetchSummary();
      }
    }
  );

  const updateExpense = useApiMutation<
    FinancialTransaction,
    { id: string; data: Partial<FinancialTransaction> }
  >(
    async ({ id, data }) => {
      const updateData: any = {};
      if (data.date) updateData.payment_date = data.date.toISOString();
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.description) updateData.description = data.description;
      if (data.status) updateData.status = data.status;
      if (data.reference !== undefined) updateData.reference = data.reference;
      if (data.paymentMethod) updateData.payment_method = data.paymentMethod;
      if (data.isRecurring !== undefined) updateData.is_recurring = data.isRecurring;
      if (data.recurringInterval) updateData.recurring_interval = data.recurringInterval;
      if (data.nextPaymentDate) updateData.next_payment_date = data.nextPaymentDate.toISOString();
      if (data.isRecurring === false) {
        updateData.recurring_interval = null;
        updateData.next_payment_date = null;
      }
      const { data: updatedData, error } = await supabase
        .from('unified_payments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return {
        id: updatedData.id,
        date: new Date(updatedData.payment_date),
        amount: updatedData.amount,
        description: updatedData.description,
        type: 'expense',
        category: updatedData.description?.includes('Salary') ? 'Salary' :
          updatedData.description?.includes('Rent') ? 'Rent' :
          updatedData.description?.includes('Utility') ? 'Utilities' : 'Other',
        status: updatedData.status,
        reference: updatedData.reference,
        paymentMethod: updatedData.payment_method,
        isRecurring: updatedData.is_recurring || false,
        recurringInterval: updatedData.recurring_interval,
        nextPaymentDate: updatedData.next_payment_date ? new Date(updatedData.next_payment_date) : undefined
      };
    },
    {
      onSuccess: () => {
        toast({ title: 'Expense updated', description: 'Expense has been updated successfully.' });
        refetchExpenses();
        refetchSummary();
      }
    }
  );

  const deleteExpense = useApiMutation<string, string>(
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
        toast({ title: 'Expense deleted', description: 'Expense has been deleted successfully.' });
        refetchExpenses();
        refetchSummary();
      }
    }
  );

  return { addExpense, updateExpense, deleteExpense };
}
