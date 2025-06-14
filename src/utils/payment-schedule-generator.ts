
import { differenceInMonths, addMonths, startOfMonth, format } from 'date-fns';

export interface ScheduledPayment {
  id: string;
  dueDate: Date;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'overdue';
  type: 'rent' | 'deposit' | 'special';
  monthNumber?: number;
  isProjected: boolean;
}

export interface PaymentScheduleParams {
  startDate: Date;
  endDate: Date;
  rentAmount: number;
  paymentFrequency: 'monthly' | 'weekly' | 'daily';
  paymentDay?: number;
  includeDeposit?: boolean;
  depositAmount?: number;
}

export function generatePaymentSchedule(params: PaymentScheduleParams): ScheduledPayment[] {
  const {
    startDate,
    endDate,
    rentAmount,
    paymentFrequency,
    paymentDay = 1,
    includeDeposit = false,
    depositAmount = 0
  } = params;

  const payments: ScheduledPayment[] = [];

  // Add deposit payment if included
  if (includeDeposit && depositAmount > 0) {
    payments.push({
      id: `deposit-${startDate.getTime()}`,
      dueDate: startDate,
      amount: depositAmount,
      description: 'Security Deposit',
      status: 'pending',
      type: 'deposit',
      isProjected: true
    });
  }

  // Generate recurring payments based on frequency
  if (paymentFrequency === 'monthly') {
    const totalMonths = differenceInMonths(endDate, startDate);
    
    for (let i = 0; i <= totalMonths; i++) {
      const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, paymentDay);
      
      // Skip if due date is before start date or after end date
      if (dueDate < startDate || dueDate > endDate) continue;
      
      payments.push({
        id: `rent-${i}-${dueDate.getTime()}`,
        dueDate,
        amount: rentAmount,
        description: `Monthly Rent - ${format(dueDate, 'MMM yyyy')}`,
        status: 'pending',
        type: 'rent',
        monthNumber: i + 1,
        isProjected: true
      });
    }
  } else if (paymentFrequency === 'weekly') {
    // Weekly payment logic
    let currentDate = new Date(startDate);
    let weekNumber = 1;
    
    while (currentDate <= endDate) {
      payments.push({
        id: `rent-week-${weekNumber}-${currentDate.getTime()}`,
        dueDate: new Date(currentDate),
        amount: rentAmount,
        description: `Weekly Rent - Week ${weekNumber}`,
        status: 'pending',
        type: 'rent',
        isProjected: true
      });
      
      currentDate = addMonths(currentDate, 0);
      currentDate.setDate(currentDate.getDate() + 7);
      weekNumber++;
    }
  }

  return payments.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export function mergeActualWithScheduled(
  scheduledPayments: ScheduledPayment[],
  actualPayments: any[]
): ScheduledPayment[] {
  const merged = [...scheduledPayments];
  
  // Update scheduled payments with actual payment data
  actualPayments.forEach(payment => {
    const matchingIndex = merged.findIndex(scheduled => {
      const paymentDate = new Date(payment.payment_date || payment.due_date);
      const scheduledDate = scheduled.dueDate;
      
      // Match by month/year for monthly payments
      return paymentDate.getMonth() === scheduledDate.getMonth() &&
             paymentDate.getFullYear() === scheduledDate.getFullYear() &&
             scheduled.type === 'rent';
    });
    
    if (matchingIndex >= 0) {
      merged[matchingIndex] = {
        ...merged[matchingIndex],
        id: payment.id,
        status: payment.status === 'completed' ? 'completed' : 
                payment.status === 'pending' ? 'pending' : 'overdue',
        isProjected: false,
        amount: payment.amount || merged[matchingIndex].amount
      };
    } else {
      // Add actual payment that doesn't match any scheduled payment
      merged.push({
        id: payment.id,
        dueDate: new Date(payment.payment_date || payment.due_date),
        amount: payment.amount,
        description: payment.description || 'Payment',
        status: payment.status === 'completed' ? 'completed' : 
                payment.status === 'pending' ? 'pending' : 'overdue',
        type: payment.type || 'rent',
        isProjected: false
      });
    }
  });
  
  return merged.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}
