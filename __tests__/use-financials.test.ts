import { FinancialTransaction } from '../../src/hooks/financials-types';
import { renderHook, act } from '@testing-library/react';
import { useFinancials } from '../../src/hooks/use-financials';

jest.mock('../../src/hooks/financials-utils', () => ({
  fetchFinancialTransactions: jest.fn(async () => [
    {
      id: '1',
      date: new Date('2023-01-01'),
      amount: 100,
      description: 'Rental Payment',
      type: 'income',
      category: 'Rental',
      status: 'completed',
      paymentMethod: 'Cash',
      vehicleId: 'V1',
      customerId: 'C1',
    },
  ]),
}));

describe('useFinancials', () => {
  it('fetches transactions and exposes them', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useFinancials());
    await waitForNextUpdate();
    expect(result.current.transactions).toBeDefined();
    expect(result.current.transactions.length).toBeGreaterThan(0);
  });

  it('handles error in fetchFinancialTransactions', async () => {
    const { fetchFinancialTransactions } = require('../../src/hooks/financials-utils');
    fetchFinancialTransactions.mockImplementationOnce(async () => { throw new Error('Test error'); });
    const { result, waitForNextUpdate } = renderHook(() => useFinancials());
    await waitForNextUpdate();
    expect(result.current.transactions).toEqual([]);
  });
});
