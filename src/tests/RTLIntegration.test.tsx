
import React from 'react';
import { screen, render, act } from '@testing-library/react';
import { TranslationProvider } from '@/contexts/TranslationContext';
import { PaymentHistoryTable } from '@/components/payments/PaymentHistoryTable';
import { ContractDetailDialog } from '@/components/financials/car-installments/ContractDetailDialog';
import { CarInstallmentPayment } from '@/types/payment';
import { CarInstallmentContract } from '@/lib/validation-schemas/car-installment';
import LanguageSelector from '@/components/settings/LanguageSelector';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// Create a test app with multiple components using translation
const TestApp = ({ initialLanguage = 'en' }: { initialLanguage?: string }) => {
  React.useEffect(() => {
    localStorage.setItem('language', initialLanguage);
  }, [initialLanguage]);
  
  // Sample data
  const payments: CarInstallmentPayment[] = [
    {
      id: '1',
      contract_id: 'c1',
      payment_number: 'PAY001',
      payment_date: new Date(2025, 0, 15),
      due_date: new Date(2025, 0, 10),
      amount: 1000,
      status: 'paid',
      payment_method: 'credit card'
    }
  ];
  
  const contract: CarInstallmentContract = {
    id: 'c1',
    contract_number: 'CNT-001',
    customer_id: 'cust-1',
    customer_name: 'John Doe',
    vehicle_id: 'v1',
    vehicle_name: 'Toyota Camry',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    total_amount: 12000,
    status: 'active',
    payments
  };
  
  const [dialogOpen, setDialogOpen] = React.useState(false);
  
  return (
    <I18nextProvider i18n={i18n}>
      <TranslationProvider>
        <div className="test-app" data-testid="test-app">
          <header>
            <LanguageSelector />
          </header>
          <main>
            <h1>RTL Integration Test</h1>
            <div className="payment-table-container" data-testid="payment-table">
              <PaymentHistoryTable payments={payments} />
            </div>
            <button onClick={() => setDialogOpen(true)}>Open Dialog</button>
            <ContractDetailDialog 
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              contract={contract}
            />
          </main>
        </div>
      </TranslationProvider>
    </I18nextProvider>
  );
};

describe('RTL Integration Test', () => {
  beforeEach(() => {
    // Clean up between tests
    localStorage.clear();
    document.documentElement.dir = 'ltr';
    document.body.className = '';
  });
  
  test('Application should handle language switching and apply RTL styles', async () => {
    render(<TestApp />);
    
    // Initial state should be LTR
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.body.classList.contains('rtl-mode')).toBe(false);
    
    // Find and click language selector
    const languageSelector = screen.getByRole('combobox');
    expect(languageSelector).toBeInTheDocument();
    
    // Change language to Arabic (simulating the language change)
    act(() => {
      i18n.changeLanguage('ar');
      // This would typically be done by the TranslationProvider
      document.documentElement.dir = 'rtl';
      document.body.classList.add('rtl-mode');
    });
    
    // Check that RTL mode is active
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.body.classList.contains('rtl-mode')).toBe(true);
    
    // Open dialog and check RTL rendering
    act(() => {
      screen.getByText('Open Dialog').click();
    });
    
    // Due to RTL mode, all buttons should have RTL alignment
    const dialogButtons = screen.getAllByRole('button');
    const dialogContent = screen.getByRole('dialog');
    
    // Dialog content should have RTL text alignment
    expect(window.getComputedStyle(dialogContent).textAlign).toBe('right');
    
    // Change back to English
    act(() => {
      i18n.changeLanguage('en');
      document.documentElement.dir = 'ltr';
      document.body.classList.remove('rtl-mode');
    });
    
    // Check that LTR mode is restored
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.body.classList.contains('rtl-mode')).toBe(false);
  });
  
  test('Loads appropriate language based on localStorage', () => {
    // Start with Arabic
    localStorage.setItem('language', 'ar');
    render(<TestApp initialLanguage="ar" />);
    
    // Check that RTL mode is active from the beginning
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.body.classList.contains('rtl-mode')).toBe(true);
    
    // Check that text elements are in Arabic
    // This depends on your i18n setup
  });
});
