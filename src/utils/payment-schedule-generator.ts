import { differenceInMonths, addMonths, startOfMonth, format } from 'date-fns';

export interface ScheduledPayment {
  id: string;
  dueDate: Date;
  amount: number;
  description: string;
  status: 'معلق' | 'مكتمل' | 'متأخر';
  type: 'إيجار' | 'تأمين' | 'خاص';
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
      description: 'تأمين الضمان',
      status: 'معلق',
      type: 'تأمين',
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
        description: `إيجار شهري - ${format(dueDate, 'MMM yyyy')}`,
        status: 'معلق',
        type: 'إيجار',
        monthNumber: i + 1,
        isProjected: true
      });
    }
  } else if (paymentFrequency === 'weekly') {
    // Weekly payment logic - fixed
    let currentDate = new Date(startDate);
    let weekNumber = 1;
    
    while (currentDate <= endDate) {
      payments.push({
        id: `rent-week-${weekNumber}-${currentDate.getTime()}`,
        dueDate: new Date(currentDate),
        amount: rentAmount,
        description: `إيجار أسبوعي - الأسبوع ${weekNumber}`,
        status: 'معلق',
        type: 'إيجار',
        isProjected: true
      });
      
      // Add 7 days to current date for next payment
      currentDate.setDate(currentDate.getDate() + 7);
      weekNumber++;
    }
  } else if (paymentFrequency === 'daily') {
    // Daily payment logic
    let currentDate = new Date(startDate);
    let dayNumber = 1;
    
    while (currentDate <= endDate) {
      payments.push({
        id: `rent-day-${dayNumber}-${currentDate.getTime()}`,
        dueDate: new Date(currentDate),
        amount: rentAmount,
        description: `إيجار يومي - اليوم ${dayNumber}`,
        status: 'معلق',
        type: 'إيجار',
        isProjected: true
      });
      
      // Add 1 day to current date for next payment
      currentDate.setDate(currentDate.getDate() + 1);
      dayNumber++;
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
             scheduled.type === 'إيجار';
    });
    
    if (matchingIndex >= 0) {
      merged[matchingIndex] = {
        ...merged[matchingIndex],
        id: payment.id,
        status: payment.status === 'completed' ? 'مكتمل' : 
                payment.status === 'pending' ? 'معلق' : 'متأخر',
        isProjected: false,
        amount: payment.amount || merged[matchingIndex].amount
      };
    } else {
      // Add actual payment that doesn't match any scheduled payment
      merged.push({
        id: payment.id,
        dueDate: new Date(payment.payment_date || payment.due_date),
        amount: payment.amount,
        description: payment.description || 'دفعة',
        status: payment.status === 'completed' ? 'مكتمل' : 
                payment.status === 'pending' ? 'معلق' : 'متأخر',
        type: payment.type || 'إيجار',
        isProjected: false
      });
    }
  });
  
  return merged.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}
