
import { useState, useCallback, useEffect, useRef } from 'react';
import { Payment } from '@/components/agreements/PaymentHistory';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const usePayments = (agreementId: string | undefined, rentAmount: number | null) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const fetchInProgress = useRef(false);
  const initialFetchCompleted = useRef(false);
  const errorCount = useRef(0);
  
  const fetchPayments = useCallback(async () => {
    if (!agreementId) {
      console.log("No agreement ID provided to usePayments");
      setIsLoadingPayments(false);
      return;
    }
    
    if (fetchInProgress.current) return;
    
    fetchInProgress.current = true;
    setIsLoadingPayments(true);
    
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
      
      console.log(`Raw payments data for ${agreementId}:`, unifiedPayments);
      
      if (!unifiedPayments || unifiedPayments.length === 0) {
        console.log(`No payments found for agreement ID: ${agreementId}`);
        setPayments([]);
        setIsLoadingPayments(false);
        fetchInProgress.current = false;
        initialFetchCompleted.current = true;
        return;
      }
      
      const formattedPayments = unifiedPayments.map(payment => {
        // Calculate days overdue for pending payments
        let daysOverdue = payment.days_overdue || 0;
        let lateFineAmount = payment.late_fine_amount || 0;
        
        // If payment is pending and has an original_due_date, calculate current overdue days
        if (payment.status === 'pending' && payment.original_due_date) {
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
          original_due_date: payment.original_due_date
        };
      });
      
      setPayments(formattedPayments);
      console.log(`Formatted payments set for ${agreementId}:`, formattedPayments);
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
    console.log(`usePayments hook initialized with agreementId: ${agreementId}, initialFetch: ${initialFetchCompleted.current}`);
    if (agreementId && !initialFetchCompleted.current) {
      fetchPayments();
    }
    
    return () => {
      fetchInProgress.current = false;
    };
  }, [agreementId, fetchPayments]);

  // If we have an agreement ID but no payments and initial fetch is completed, retry once
  useEffect(() => {
    if (agreementId && initialFetchCompleted.current && payments.length === 0 && errorCount.current < 2) {
      console.log(`Retrying payment fetch after initial empty result for ID: ${agreementId}`);
      const retryTimer = setTimeout(() => {
        fetchPayments();
      }, 2000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [agreementId, payments.length, fetchPayments]);

  return { payments, isLoadingPayments, fetchPayments };
};
