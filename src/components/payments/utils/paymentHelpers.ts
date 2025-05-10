
import { PaymentHistoryItem } from '@/types/payment-history.types';
import { formatDate } from '@/lib/date-utils';

/**
 * Determines if a payment was made late based on available data
 */
export function isLatePayment(payment: PaymentHistoryItem): boolean {
  // First check if days_overdue is available and greater than 0
  if (payment.days_overdue && payment.days_overdue > 0) {
    return true;
  }
  
  // If days_overdue is not available, check if there's late_fine_amount
  if (payment.late_fine_amount && payment.late_fine_amount > 0) {
    return true;
  }
  
  // If payment_date and due_date are available, compare them
  if (payment.payment_date && payment.due_date) {
    const paymentDate = new Date(payment.payment_date);
    const dueDate = new Date(payment.due_date);
    return paymentDate > dueDate;
  }
  
  // If payment_date and original_due_date are available, compare them
  if (payment.payment_date && payment.original_due_date) {
    const paymentDate = new Date(payment.payment_date);
    const originalDueDate = new Date(payment.original_due_date);
    return paymentDate > originalDueDate;
  }
  
  // Default to false if we can't determine
  return false;
}

/**
 * Formats payment data for export to PDF
 */
export function formatPaymentDataForExport(payments: PaymentHistoryItem[]) {
  return payments.map(payment => {
    return {
      description: payment.description || 'Payment',
      amount: payment.amount || 0,
      dueDate: payment.due_date ? formatDate(payment.due_date, 'MMM d, yyyy') : '',
      paymentDate: payment.payment_date ? formatDate(payment.payment_date, 'MMM d, yyyy') : '',
      status: payment.status || '',
      lateFee: payment.late_fine_amount || 0,
      total: (payment.amount || 0) + (payment.late_fine_amount || 0)
    };
  });
}

/**
 * Calculates summary statistics from payments array
 */
export function calculatePaymentStatistics(payments: PaymentHistoryItem[]) {
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const amountPaid = payments
    .filter(payment => payment.status === 'completed')
    .reduce((sum, payment) => sum + (payment.amount_paid || payment.amount || 0), 0);
  const balance = totalAmount - amountPaid;
  const lateFees = payments.reduce((sum, payment) => sum + (payment.late_fine_amount || 0), 0);
  
  const paidOnTime = payments.filter(p => 
    p.status === 'completed' && !isLatePayment(p)
  ).length;
  
  const paidLate = payments.filter(p => 
    p.status === 'completed' && isLatePayment(p)
  ).length;
  
  const unpaid = payments.filter(p => 
    p.status === 'pending' || p.status === 'overdue'
  ).length;
  
  return {
    totalAmount,
    amountPaid,
    balance,
    lateFees,
    paidOnTime,
    paidLate,
    unpaid
  };
}
