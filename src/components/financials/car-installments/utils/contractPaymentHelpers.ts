
import { CarInstallmentContract, CarInstallmentPayment } from '@/types/car-installment';

export const createExportTemplate = (contract: CarInstallmentContract): void => {
  // Create CSV template for download
  const headers = ['cheque_number', 'drawee_bank', 'amount', 'payment_date', 'notes'];
  const csv = [
    headers.join(','),
    '12345,Bank Name,5000,2025-03-01,Sample payment'
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${contract.car_type}_payments_template.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
