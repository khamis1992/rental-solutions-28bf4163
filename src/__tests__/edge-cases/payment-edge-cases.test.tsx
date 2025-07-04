import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentEntryForm } from '@/components/agreements/PaymentEntryForm';
import { createMockAgreement, createMockPayment } from '../setup';

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
    const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));

    renderWithProviders(
      <PaymentEntryForm 
        agreementId={mockAgreement.id}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />
    );

    const amountInput = screen.getByLabelText(/المبلغ/);
    fireEvent.change(amountInput, { target: { value: '1500' } });

    const submitButton = screen.getByRole('button', { name: /حفظ/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/حدث خطأ في الشبكة/)).toBeInTheDocument();
    });
  });

  it('should validate negative payment amounts', async () => {
    const mockAgreement = createMockAgreement();
    const onSubmit = vi.fn();

    renderWithProviders(
      <PaymentEntryForm 
        agreementId={mockAgreement.id}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />
    );

    const amountInput = screen.getByLabelText(/المبلغ/);
    fireEvent.change(amountInput, { target: { value: '-100' } });

    const submitButton = screen.getByRole('button', { name: /حفظ/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/المبلغ يجب أن يكون أكبر من صفر/)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should handle extremely large payment amounts', async () => {
    const mockAgreement = createMockAgreement();
    const onSubmit = vi.fn();

    renderWithProviders(
      <PaymentEntryForm 
        agreementId={mockAgreement.id}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />
    );

    const amountInput = screen.getByLabelText(/المبلغ/);
    fireEvent.change(amountInput, { target: { value: '999999999999' } });

    const submitButton = screen.getByRole('button', { name: /حفظ/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/المبلغ كبير جداً/)).toBeInTheDocument();
    });
  });

  it('should handle duplicate payment submissions', async () => {
    const mockAgreement = createMockAgreement();
    const onSubmit = vi.fn().mockResolvedValue({ success: true });

    renderWithProviders(
      <PaymentEntryForm 
        agreementId={mockAgreement.id}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />
    );

    const amountInput = screen.getByLabelText(/المبلغ/);
    fireEvent.change(amountInput, { target: { value: '1500' } });

    const submitButton = screen.getByRole('button', { name: /حفظ/ });
    
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle payment dates in the future', async () => {
    const mockAgreement = createMockAgreement();
    const onSubmit = vi.fn();

    renderWithProviders(
      <PaymentEntryForm 
        agreementId={mockAgreement.id}
        onSubmit={onSubmit}
        onCancel={() => {}}
      />
    );

    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const dateInput = screen.getByLabelText(/تاريخ الدفع/);
    fireEvent.change(dateInput, { 
      target: { value: futureDate.toISOString().split('T')[0] } 
    });

    const submitButton = screen.getByRole('button', { name: /حفظ/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/لا يمكن أن يكون تاريخ الدفع في المستقبل/)).toBeInTheDocument();
    });
  });
});
