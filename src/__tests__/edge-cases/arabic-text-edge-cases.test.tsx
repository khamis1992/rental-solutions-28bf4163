import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { createMockCustomer } from '../setup';

describe('Arabic Text Edge Cases', () => {
  it('should handle mixed Arabic and English text correctly', () => {
    const customer = createMockCustomer({
      full_name: 'أحمد محمد Ahmed Mohammed',
      phone: '+974 5555 1234',
      email: 'ahmed@example.com'
    });

    render(<CustomerCard customer={customer} />);

    expect(screen.getByText('أحمد محمد Ahmed Mohammed')).toBeInTheDocument();
    expect(screen.getByText('+974 5555 1234')).toBeInTheDocument();
  });

  it('should handle Arabic text with special characters', () => {
    const customer = createMockCustomer({
      full_name: 'عبد الله بن محمد آل سعود',
      nationality: 'سعودي'
    });

    render(<CustomerCard customer={customer} />);

    expect(screen.getByText('عبد الله بن محمد آل سعود')).toBeInTheDocument();
    expect(screen.getByText('سعودي')).toBeInTheDocument();
  });

  it('should handle very long Arabic names', () => {
    const longName = 'عبد الرحمن بن عبد الله بن محمد بن عبد العزيز بن سعود آل سعود الفيصل';
    const customer = createMockCustomer({
      full_name: longName
    });

    render(<CustomerCard customer={customer} />);

    expect(screen.getByText(longName)).toBeInTheDocument();
  });

  it('should handle Arabic numerals vs English numerals', () => {
    const customer = createMockCustomer({
      phone: '+٩٧٤ ٥٥٥٥ ١٢٣٤',
      driver_license: 'DL١٢٣٤٥٦'
    });

    render(<CustomerCard customer={customer} />);

    expect(screen.getByText('+٩٧٤ ٥٥٥٥ ١٢٣٤')).toBeInTheDocument();
    expect(screen.getByText('DL١٢٣٤٥٦')).toBeInTheDocument();
  });

  it('should handle empty or null Arabic text gracefully', () => {
    const customer = createMockCustomer({
      full_name: '',
      nationality: null as any
    });

    render(<CustomerCard customer={customer} />);

    expect(screen.getByText(/غير محدد/)).toBeInTheDocument();
  });

  it('should maintain RTL direction for Arabic content', () => {
    const customer = createMockCustomer({
      full_name: 'محمد أحمد'
    });

    const { container } = render(<CustomerCard customer={customer} />);
    
    const customerCard = container.querySelector('[data-testid="customer-card"]');
    expect(customerCard).toHaveAttribute('dir', 'rtl');
  });
});
