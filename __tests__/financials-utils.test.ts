import { fetchFinancialTransactions } from '../src/hooks/financials-utils';
import { TransactionType } from '../src/hooks/financials-types';

// Mock supabase for isolated unit tests
globalThis.supabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      data: [
        { id: '1', payment_date: '2023-01-01', amount: 100, type: 'Income', status: 'completed', description: 'Rental Payment', payment_method: 'Cash', vehicle_id: 'V1', customer_id: 'C1' },
        { id: '2', payment_date: '2023-01-02', amount: 50, type: 'Expense', status: 'pending', description: 'Maintenance', payment_method: 'Card', vehicle_id: 'V2', customer_id: 'C2' },
      ],
      error: null,
    })),
  })),
};

describe('fetchFinancialTransactions', () => {
  it('returns all transactions when no filters are applied', async () => {
    const filters = {};
    const transactions = await fetchFinancialTransactions(filters);
    expect(transactions.length).toBeGreaterThan(0);
    expect(transactions[0].id).toBe('1');
    expect(transactions[1].type).toBe('expense');
  });

  it('filters by transactionType', async () => {
    const filters = { transactionType: 'income' as TransactionType };
    const transactions = await fetchFinancialTransactions(filters);
    expect(transactions.every(t => t.type === 'income')).toBe(true);
  });

  it('filters by category', async () => {
    const filters = { category: 'Operational' };
    const transactions = await fetchFinancialTransactions(filters);
    expect(transactions.every(t => t.category === 'Operational')).toBe(true);
  });

  it('handles empty data gracefully', async () => {
    globalThis.supabase.from = jest.fn(() => ({ select: jest.fn(() => ({ data: [], error: null })) }));
    const filters = {};
    const transactions = await fetchFinancialTransactions(filters);
    expect(transactions).toEqual([]);
  });

  it('throws and logs error if supabase fails', async () => {
    const error = new Error('Supabase error');
    globalThis.supabase.from = jest.fn(() => ({ select: jest.fn(() => ({ data: null, error })) }));
    const filters = {};
    await expect(fetchFinancialTransactions(filters)).rejects.toThrow('Supabase error');
  });
});
