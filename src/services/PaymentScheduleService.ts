
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { addMonths, differenceInMonths, format } from 'date-fns';

export interface PaymentScheduleItem {
  id: string;
  dueDate: Date;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'overdue';
  type: 'rent' | 'deposit' | 'special';
  isProjected: boolean;
}

export class PaymentScheduleService {
  /**
   * Generate payment schedule for an agreement
   */
  static generateSchedule(agreement: Agreement | null): PaymentScheduleItem[] {
    if (!agreement) {
      console.log('No agreement provided for schedule generation');
      return [];
    }

    try {
      const startDate = new Date(agreement.start_date);
      const endDate = new Date(agreement.end_date);
      const rentAmount = agreement.rent_amount || 0;
      const paymentDay = agreement.payment_day || 1;

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid dates in agreement:', {
          start_date: agreement.start_date,
          end_date: agreement.end_date
        });
        return [];
      }

      if (rentAmount <= 0) {
        console.error('Invalid rent amount:', rentAmount);
        return [];
      }

      console.log('Generating schedule for agreement:', {
        id: agreement.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        rentAmount,
        paymentDay
      });

      const schedule: PaymentScheduleItem[] = [];
      const totalMonths = differenceInMonths(endDate, startDate) + 1;

      for (let monthOffset = 0; monthOffset < totalMonths; monthOffset++) {
        const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + monthOffset, paymentDay);
        
        // Skip if due date is before start date or after end date
        if (dueDate < startDate || dueDate > endDate) continue;

        schedule.push({
          id: `scheduled-${agreement.id}-${monthOffset}`,
          dueDate,
          amount: rentAmount,
          description: `Monthly Rent - ${format(dueDate, 'MMM yyyy')}`,
          status: dueDate < new Date() ? 'overdue' : 'pending',
          type: 'rent',
          isProjected: true
        });
      }

      console.log(`Generated ${schedule.length} scheduled payments`);
      return schedule;
    } catch (error) {
      console.error('Error generating payment schedule:', error);
      return [];
    }
  }

  /**
   * Merge actual payments with scheduled payments
   */
  static mergeWithActualPayments(schedule: PaymentScheduleItem[], actualPayments: any[]): PaymentScheduleItem[] {
    const merged = [...schedule];
    
    actualPayments.forEach(payment => {
      if (!payment.payment_date && !payment.due_date) return;
      
      const paymentDate = new Date(payment.payment_date || payment.due_date);
      if (isNaN(paymentDate.getTime())) return;

      const matchingIndex = merged.findIndex(scheduled => {
        return paymentDate.getMonth() === scheduled.dueDate.getMonth() &&
               paymentDate.getFullYear() === scheduled.dueDate.getFullYear();
      });

      if (matchingIndex >= 0) {
        // Replace scheduled payment with actual payment
        merged[matchingIndex] = {
          id: payment.id,
          dueDate: paymentDate,
          amount: payment.amount || merged[matchingIndex].amount,
          description: payment.description || merged[matchingIndex].description,
          status: payment.status === 'completed' ? 'completed' : 
                  payment.status === 'pending' ? 'pending' : 'overdue',
          type: payment.type || 'rent',
          isProjected: false
        };
      } else {
        // Add actual payment that doesn't match any scheduled payment
        merged.push({
          id: payment.id,
          dueDate: paymentDate,
          amount: payment.amount || 0,
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
}
