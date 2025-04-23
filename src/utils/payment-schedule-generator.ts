
import { addMonths, isAfter } from 'date-fns';

interface PaymentScheduleParams {
  startDate: Date;
  endDate?: Date | null;
  rentAmount: number;
  totalAmount: number;
}

interface PaymentScheduleItem {
  dueDate: Date;
  amount: number;
}

export const generatePaymentSchedule = ({
  startDate, 
  endDate, 
  rentAmount, 
  totalAmount
}: PaymentScheduleParams): PaymentScheduleItem[] => {
  const payments: PaymentScheduleItem[] = [];
  let currentDate = startDate;
  let remainingTotal = totalAmount;

  // Determine the number of months based on total amount and rent amount
  const estimatedMonths = Math.ceil(totalAmount / rentAmount);
  const maxMonths = endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)) : estimatedMonths;

  for (let i = 0; i < Math.min(estimatedMonths, maxMonths); i++) {
    const paymentAmount = Math.min(rentAmount, remainingTotal);
    
    payments.push({
      dueDate: currentDate,
      amount: paymentAmount
    });

    remainingTotal -= paymentAmount;
    
    // Break if no more amount remains
    if (remainingTotal <= 0) break;

    // Move to next month
    currentDate = addMonths(currentDate, 1);

    // Stop if we've exceeded the end date
    if (endDate && isAfter(currentDate, endDate)) break;
  }

  return payments;
};
