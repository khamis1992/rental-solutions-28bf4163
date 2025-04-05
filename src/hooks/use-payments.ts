
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Payment {
  id: string;
  amount: number;
  payment_date: string | null;
  payment_method?: string;
  reference_number?: string | null;
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number;
  days_overdue?: number;
  lease_id?: string;
  original_due_date?: string | null;
  amount_paid?: number;
  balance?: number;
  daily_late_fee?: number;
}

export const usePayments = (agreementId: string | undefined, rentAmount: number | null) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const fetchInProgress = useRef(false);
  const initialFetchCompleted = useRef(false);
  const errorCount = useRef(0);
  const lastFetchTime = useRef<number>(0);
  
  const fetchPayments = useCallback(async (force = false) => {
    if (!agreementId) {
      console.log("No agreement ID provided to usePayments");
      setIsLoadingPayments(false);
      return;
    }
    
    // Implement debounce to prevent multiple fetches in short succession
    const now = Date.now();
    if (!force && now - lastFetchTime.current < 500) {
      console.log("Skipping fetch due to debounce (too soon since last fetch)");
      return;
    }
    
    if (fetchInProgress.current) {
      console.log("Fetch already in progress, skipping duplicate request");
      return;
    }
    
    fetchInProgress.current = true;
    lastFetchTime.current = now;
    
    // Only show loading indicator on initial fetch to prevent UI flicker
    if (!initialFetchCompleted.current) {
      setIsLoadingPayments(true);
    }
    
    try {
      console.log(`Fetching payments for agreement: ${agreementId}`);
      
      const { data: unifiedPayments, error: unifiedError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .order('payment_date', { ascending: false });
      
      if (unifiedError) {
        console.error("Error fetching unified payments:", unifiedError);
        errorCount.current += 1;
        
        if (errorCount.current > 3) {
          toast.error("Unable to load payment history");
        }
        return;
      }
      
      // Only update state if this component is still mounted and we have data
      if (unifiedPayments) {
        console.log(`Fetched ${unifiedPayments.length} payments for agreement ID: ${agreementId}`);
        
        const formattedPayments = unifiedPayments.map(payment => {
          // Calculate days overdue for pending payments
          let daysOverdue = payment.days_overdue || 0;
          let lateFineAmount = payment.late_fine_amount || 0;
          
          // If payment is pending and has an original_due_date, calculate current overdue days
          if ((payment.status === 'pending' || payment.status === 'partially_paid') && payment.original_due_date) {
            const dueDate = new Date(payment.original_due_date);
            const today = new Date();
            
            if (today > dueDate) {
              // Calculate days difference (excluding time)
              const todayNoTime = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const dueDateNoTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
              
              const diffTime = todayNoTime.getTime() - dueDateNoTime.getTime();
              const currentDaysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              // Update days overdue if current calculation is greater
              daysOverdue = Math.max(daysOverdue, currentDaysOverdue);
              
              // Calculate current late fine (120 QAR per day, capped at 3000 QAR)
              const dailyLateFee = payment.daily_late_fee || 120;
              lateFineAmount = Math.min(daysOverdue * dailyLateFee, 3000);
            }
          }
          
          return {
            id: payment.id,
            amount: payment.amount,
            payment_date: payment.payment_date,
            payment_method: payment.payment_method || 'cash',
            reference_number: payment.transaction_id,
            notes: payment.description,
            type: payment.type,
            status: payment.status,
            late_fine_amount: lateFineAmount,
            days_overdue: daysOverdue,
            lease_id: payment.lease_id,
            original_due_date: payment.original_due_date,
            amount_paid: payment.amount_paid,
            balance: payment.balance,
            daily_late_fee: payment.daily_late_fee
          };
        });
        
        setPayments(formattedPayments);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      errorCount.current += 1;
      
      if (errorCount.current > 3) {
        toast.error("Failed to load payment history");
      }
    } finally {
      setIsLoadingPayments(false);
      fetchInProgress.current = false;
      initialFetchCompleted.current = true;
    }
  }, [agreementId]);

  useEffect(() => {
    // Only fetch on initial render and when agreement ID changes
    if (agreementId && !initialFetchCompleted.current) {
      console.log("Initial payment fetch for agreement:", agreementId);
      fetchPayments(true);
    }
    
    return () => {
      // Clean up
      fetchInProgress.current = false;
    };
  }, [agreementId, fetchPayments]);

  return { payments, isLoadingPayments, fetchPayments };
};
