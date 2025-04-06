
import { useState, useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export interface MissingPayment {
  month: string;
  amount: number;
  daysOverdue: number;
  lateFee: number;
  totalDue: number;
}

export const useMissingPayments = (agreementId: string, isMounted: React.MutableRefObject<boolean>) => {
  const [missingPayments, setMissingPayments] = useState<MissingPayment[]>([]);

  useEffect(() => {
    const calculateMissingPayments = async () => {
      if (!isMounted.current) return;
      
      try {
        const { data: lease, error } = await supabase
          .from('leases')
          .select('start_date, rent_amount')
          .eq('id', agreementId)
          .single();
          
        if (error || !lease) {
          console.error("Error fetching lease details:", error);
          return;
        }
        
        const today = new Date();
        const startDate = new Date(lease.start_date);
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const { data: currentMonthPayment } = await supabase
          .from('unified_payments')
          .select('id')
          .eq('lease_id', agreementId)
          .gte('payment_date', new Date(currentYear, currentMonth, 1).toISOString())
          .lt('payment_date', new Date(currentYear, currentMonth + 1, 0).toISOString());
          
        if (currentMonthPayment && currentMonthPayment.length > 0) {
          if (isMounted.current) setMissingPayments([]);
          return;
        }
        
        const dueDate = new Date(currentYear, currentMonth, 1);
        const daysOverdue = differenceInDays(today, dueDate);
        const dailyLateFee = 120;
        const lateFee = Math.min(daysOverdue * dailyLateFee, 3000);
        
        if (daysOverdue > 0) {
          if (isMounted.current) {
            setMissingPayments([{
              month: today.toLocaleString('default', { month: 'long', year: 'numeric' }),
              amount: lease.rent_amount || 0,
              daysOverdue: daysOverdue,
              lateFee: lateFee,
              totalDue: (lease.rent_amount || 0) + lateFee
            }]);
          }
        } else if (isMounted.current) {
          setMissingPayments([]);
        }
      } catch (err) {
        console.error("Error calculating missing payments:", err);
      }
    };
    
    if (agreementId) {
      calculateMissingPayments();
    }
  }, [agreementId, isMounted]);

  return { missingPayments };
};
