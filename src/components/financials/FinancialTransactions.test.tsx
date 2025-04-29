import React from 'react';
import { render, screen } from '@testing-library/react';
import FinancialTransactions from './FinancialTransactions';

const mockTransactions = [
  {
    id: '1',
    type: 'income',
    date: '2025-04-01',
    description: 'Test Income',
    category: 'Salary',
    amount: 1000,
    status: 'completed',
  },
  {
    id: '2',
    type: 'expense',
    date: '2025-04-02',
    description: 'Test Expense',
    category: 'Food',
    amount: 200,
    status: 'pending',
  },
];

describe('FinancialTransactions', () => {
  it('renders transaction rows', () => {
    render(
      <FinancialTransactions
        transactions={mockTransactions}
        isLoading={false}
        filters={{ transactionType: '', category: '', dateFrom: '', dateTo: '', searchQuery: '' }}
        setFilters={jest.fn()}
      />
    );
    expect(screen.getByText('Test Income')).toBeInTheDocument();
    expect(screen.getByText('Test Expense')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <FinancialTransactions
        transactions={[]}
        isLoading={true}
        filters={{ transactionType: '', category: '', dateFrom: '', dateTo: '', searchQuery: '' }}
        setFilters={jest.fn()}
      />
    );
    expect(screen.getByText(/Loading transactions/i)).toBeInTheDocument();
  });
});
