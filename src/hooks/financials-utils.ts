// Utility functions for financial data
import { supabase } from '@/lib/supabase';
import { FinancialTransaction, TransactionType, TransactionStatusType } from './financials-types';

/**
 * Fetches payment and installment data from Supabase and formats as FinancialTransaction[]
 */
export async function fetchFinancialTransactions(filters: any): Promise<FinancialTransaction[]> {
  try {
    const { data: paymentData, error: paymentError } = await supabase
      .from('unified_payments')
      .select('*');
    if (paymentError) throw paymentError;

    const { data: installmentData, error: installmentError } = await supabase
      .from('car_installments')
      .select('*');
    if (installmentError) throw installmentError;

    const formatted: FinancialTransaction[] = [
      ...(paymentData || []).map(payment => ({
        id: payment.id,
        date: new Date(payment.payment_date),
        amount: payment.amount || 0,
        description: payment.description || 'Rental Payment',
        type: payment.type?.toLowerCase() === 'expense' ? 'expense' : 'income' as TransactionType,
        category: payment.type === 'Expense' ? 'Operational' : 'Rental',
        status: payment.status?.toLowerCase() as TransactionStatusType || 'completed',
        reference: payment.reference || '',
        paymentMethod: payment.payment_method || 'Unknown',
        vehicleId: payment.vehicle_id || '',
        customerId: payment.customer_id || ''
      })),
      ...(installmentData || []).map(installment => ({
        id: `inst-${installment.id}`,
        date: new Date(installment.payment_date || new Date()),
        amount: installment.payment_amount || 0,
        description: `Car Installment - ${installment.vehicle_description || 'Vehicle'}`,
        type: 'expense' as TransactionType,
        category: 'Installment',
        status: installment.payment_status?.toLowerCase() as TransactionStatusType || 'completed',
        reference: installment.reference || '',
        paymentMethod: installment.payment_method || 'Bank Transfer',
        vehicleId: installment.vehicle_id || ''
      }))
    ];

    // Filter transactions in-memory (can optimize by moving to DB query)
    let filtered = formatted;
    if (filters.transactionType && filters.transactionType !== 'all_types') {
      filtered = filtered.filter(t => t.type === filters.transactionType);
    }
    if (filters.category && filters.category !== 'all_categories') {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(t => t.date >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => t.date <= new Date(filters.dateTo));
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }
    return filtered;
  } catch (error) {
    // Log and rethrow for hook to handle
    console.error('Error fetching financial transactions:', error);
    throw error;
  }
}
