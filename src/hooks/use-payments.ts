
import { useState, useCallback, useEffect, useRef } from 'react';
import { Payment } from '@/components/agreements/PaymentHistory';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export const usePayments = (agreementId: string | undefined, rentAmount: number | null) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const fetchInProgress = useRef(false);
  const isInitialFetch = useRef(true);
  
  const fetchPayments = useCallback(async () => {
    if (!agreementId || fetchInProgress.current) return;
    
    fetchInProgress.current = true;
    setIsLoadingPayments(true);
    
    try {
      console.log("Fetching payments for agreement:", agreementId);
      
      const { data: unifiedPayments, error: unifiedError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreementId)
        .order('payment_date', { ascending: false });
      
      if (unifiedError) {
        console.error("Error fetching unified payments:", unifiedError);
        throw unifiedError;
      }
      
      console.log("Raw payments data:", unifiedPayments);
      
      const formattedPayments = (unifiedPayments || []).map(payment => ({
        id: payment.id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method || 'cash',
        reference_number: payment.transaction_id,
        notes: payment.description,
        type: payment.type,
        status: payment.status,
        late_fine_amount: payment.late_fine_amount,
        days_overdue: payment.days_overdue,
        lease_id: payment.lease_id
      }));
      
      setPayments(formattedPayments);
      console.log("Formatted payments set:", formattedPayments);
      
      if (formattedPayments.length > 0 && rentAmount) {
        const incorrectPayments = formattedPayments.filter(p => 
          p.amount > (rentAmount || 0) * 5 && 
          p.notes && 
          p.notes.includes("Monthly rent payment")
        );
        
        if (incorrectPayments.length > 0) {
          console.warn(`Found ${incorrectPayments.length} payments with potentially incorrect amounts:`, 
            incorrectPayments.map(p => ({ id: p.id, amount: p.amount, notes: p.notes }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payment history");
    } finally {
      setIsLoadingPayments(false);
      fetchInProgress.current = false;
      isInitialFetch.current = false;
    }
  }, [agreementId, rentAmount]);

  useEffect(() => {
    // Only fetch if we have an agreement ID and either it's the initial fetch or manually triggered
    if (agreementId && (isInitialFetch.current || !fetchInProgress.current)) {
      fetchPayments();
    }
    
    return () => {
      fetchInProgress.current = false;
    };
  }, [agreementId, fetchPayments]);

  return { payments, isLoadingPayments, fetchPayments };
};
