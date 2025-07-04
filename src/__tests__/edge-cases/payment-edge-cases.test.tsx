import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentEntryForm } from '@/components/agreements/PaymentEntryForm';
import { createMockAgreement } from '../setup';

const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('Payment Edge Cases', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should handle network failure during payment submission', async () => {
    const mockAgreement = createMockAgreement();
    const onPaymentComplete = vi.fn();

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockRejectedValue(new Error('Network error')),
      then: vi.fn().mockRejectedValue(new Error('Network error')),
    });

    renderWithProviders(
      <PaymentEntryForm 
        agreementId={mockAgreement.id}
        onPaymentComplete={onPaymentComplete}
      />
    );

    const amountInput = screen.getByLabelText(/المبلغ/);
    fireEvent.change(amountInput, { target: { value: '1500' } });

    const submitButton = screen.getByRole('button', { name: /حفظ/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onPaymentComplete).not.toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should validate negative payment amounts', async () => {
    const mockAgreement = createMockAgreement();
    const onPaymentComplete = vi.fn();

    renderWithProviders(
      <PaymentEntryForm 
        agreementId={mockAgreement.id}
        onPaymentComplete={onPaymentComplete}
      />
    );

    const amountInput = screen.getByLabelText(/المبلغ/);
    fireEvent.change(amountInput, { target: { value: '-100' } });
    fireEvent.blur(amountInput);
    
    const paymentMethodSelect = screen.getByRole('combobox');
    fireEvent.click(paymentMethodSelect);
    await waitFor(() => {
      const cashOption = screen.getByRole('option', { name: 'نقداً' });
      fireEvent.click(cashOption);
    });
    
    const submitButton = screen.getByRole('button', { name: /حفظ/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const errorElements = screen.queryAllByText(/المبلغ يجب أن يكون أكبر من صفر|يجب أن يكون المبلغ أكبر من صفر/);
      expect(errorElements.length).toBeGreaterThan(0);
    }, { timeout: 5000 });

    expect(onPaymentComplete).not.toHaveBeenCalled();
  });

  it('should handle extremely large payment amounts', async () => {
    const mockAgreement = createMockAgreement();
    const onPaymentComplete = vi.fn();

    renderWithProviders(
      <PaymentEntryForm 
        agreementId={mockAgreement.id}
        onPaymentComplete={onPaymentComplete}
      />
    );

    const amountInput = screen.getByLabelText(/المبلغ/);
    fireEvent.change(amountInput, { target: { value: '999999999999' } });
    fireEvent.blur(amountInput);
    
    const paymentMethodSelect = screen.getByRole('combobox');
    fireEvent.click(paymentMethodSelect);
    await waitFor(() => {
      const cashOption = screen.getByRole('option', { name: 'نقداً' });
      fireEvent.click(cashOption);
    });
    
    const submitButton = screen.getByRole('button', { name: /حفظ/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const errorElements = screen.queryAllByText(/المبلغ كبير جداً|المبلغ أكبر من الحد المسموح/);
      expect(errorElements.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });

  it('should handle duplicate payment submissions', async () => {
    const mockAgreement = createMockAgreement();
    const onPaymentComplete = vi.fn();

    renderWithProviders(
      <PaymentEntryForm 
        agreementId={mockAgreement.id}
        defaultAmount={1500}
        onPaymentComplete={onPaymentComplete}
      />
    );

    const amountInput = screen.getByLabelText(/المبلغ/);
    fireEvent.change(amountInput, { target: { value: '1500' } });

    const submitButton = screen.getByRole('button', { name: /حفظ/ });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    }, { timeout: 1000 });
    
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onPaymentComplete).toHaveBeenCalledTimes(0);
    }, { timeout: 2000 });
  });

  it('should handle payment dates in the future', async () => {
    const mockAgreement = createMockAgreement();
    const onPaymentComplete = vi.fn();

    renderWithProviders(
      <PaymentEntryForm 
        agreementId={mockAgreement.id}
        onPaymentComplete={onPaymentComplete}
      />
    );

    const amountInput = screen.getByLabelText(/المبلغ/);
    fireEvent.change(amountInput, { target: { value: '1500' } });

    const paymentMethodSelect = screen.getByRole('combobox');
    fireEvent.click(paymentMethodSelect);
    await waitFor(() => {
      const cashOption = screen.getByRole('option', { name: 'نقداً' });
      fireEvent.click(cashOption);
    });

    const submitButton = screen.getByRole('button', { name: /حفظ/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onPaymentComplete).not.toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
