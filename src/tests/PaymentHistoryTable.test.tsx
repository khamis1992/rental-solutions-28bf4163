
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { PaymentHistoryTable } from '@/components/payments/PaymentHistoryTable';
import { renderWithTranslation, rtlTestHelpers } from './rtl-test-utils';
import { CarInstallmentPayment } from '@/types/payment';

describe('PaymentHistoryTable RTL Support', () => {
  // Sample payments data for testing
  const samplePayments: CarInstallmentPayment[] = [
    {
      id: '1',
      contract_id: 'contract-1',
      payment_number: 'PAY-001',
      payment_date: new Date(2025, 0, 15),
      due_date: new Date(2025, 0, 10),
      amount: 500,
      status: 'paid',
      payment_method: 'card',
      reference: 'REF-001'
    },
    {
      id: '2',
      contract_id: 'contract-1',
      payment_number: 'PAY-002',
      payment_date: new Date(2025, 1, 15),
      due_date: new Date(2025, 1, 10),
      amount: 500,
      status: 'pending',
      payment_method: 'cash',
      reference: 'REF-002'
    }
  ];

  test('renders correctly in LTR mode (English)', async () => {
    renderWithTranslation(<PaymentHistoryTable payments={samplePayments} />, 'en');
    
    // Check that table headers are in English
    expect(screen.getByText('Payment Number')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Due Date')).toBeInTheDocument();
    
    // Check LTR alignment
    const table = screen.getByRole('table');
    expect(table.classList.contains('rtl-direction')).toBe(false);
    
    // Check payment status translation
    const paidBadge = screen.getByText('Paid');
    expect(paidBadge).toBeInTheDocument();
  });

  test('renders correctly in RTL mode (Arabic)', async () => {
    renderWithTranslation(<PaymentHistoryTable payments={samplePayments} />, 'ar');
    
    await waitFor(() => {
      // Table should have RTL class
      const table = screen.getByRole('table');
      expect(rtlTestHelpers.checkRtlStyling(table)).toBe(true);
      
      // Check that payment status is translated to Arabic
      const headings = screen.getAllByRole('columnheader');
      const textContent = headings.map(h => h.textContent);
      
      // Check that elements contain Arabic text
      const tableElements = screen.getAllByRole('cell');
      const languageCheck = rtlTestHelpers.checkLanguageContent(tableElements, 'ar');
      expect(languageCheck.pass).toBe(true);
    });
  });

  test('formats dates according to the locale', () => {
    renderWithTranslation(<PaymentHistoryTable payments={samplePayments} />, 'en');
    
    // Check English date format
    expect(screen.getByText('Jan 15, 2025')).toBeInTheDocument();
    
    // Change to Arabic and check date format
    renderWithTranslation(<PaymentHistoryTable payments={samplePayments} />, 'ar');
    
    // We should see the date formatted according to Arabic locale
    // This depends on the formatDate implementation
    const cells = screen.getAllByRole('cell');
    const dateTexts = cells.map(cell => cell.textContent);
    
    // Check one of the cells contains the Arabic date format
    // This is a simplified check since the actual format depends on implementation
    expect(dateTexts.some(text => text && /٢٠٢٥/.test(text))).toBe(true);
  });
});
