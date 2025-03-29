
import { useState, useCallback, useEffect, useRef } from 'react';
import { format, addMonths, isBefore, isAfter, startOfMonth, endOfMonth, eachMonthOfInterval, differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Payment {
  id: string;
  amount: number;
  payment_date: string | Date;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  type?: string;
  status?: string;
  late_fine_amount?: number | null;
  days_overdue?: number | null;
  lease_id?: string;
}

export interface MissingPayment {
  month: Date;
  formattedDate: string;
  daysOverdue: number;
  lateFineAmount: number;
}

interface UseUnifiedPaymentsOptions {
  agreementId?: string;
  rentAmount?: number | null;
  leaseStartDate?: string | Date;
  leaseEndDate?: string | Date;
  dailyLateFee?: number;
  maxLateFee?: number;
}

export function useUnifiedPayments({
  agreementId,
  rentAmount,
  leaseStartDate,
  leaseEndDate,
  dailyLateFee = 120.0,
  maxLateFee = 3000.0
}: UseUnifiedPaymentsOptions) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchInProgress = useRef(false);
  const initialFetchCompleted = useRef(false);
  const errorCount = useRef(0);
  
  // Calculate missing payments based on lease terms and actual payments
  const missingPayments = useCallback((): MissingPayment[] => {
    if (!leaseStartDate || !leaseEndDate || !rentAmount) return [];
    
    const startDate = new Date(leaseStartDate);
    const endDate = new Date(leaseEndDate);
    const currentDate = new Date();
    const effectiveEndDate = isBefore(endDate, currentDate) ? endDate : currentDate;
    
    const allMonths = eachMonthOfInterval({ 
      start: startOfMonth(startDate), 
      end: endOfMonth(effectiveEndDate) 
    });
    
    const paidMonths = new Set<string>();
    payments.forEach(payment => {
      if (payment.type === 'rent' && payment.status !== 'cancelled') {
        const paymentDate = new Date(payment.payment_date);
        paidMonths.add(`${paymentDate.getMonth()}-${paymentDate.getFullYear()}`);
      }
    });
    
    return allMonths.filter(month => {
      const monthKey = `${month.getMonth()}-${month.getFullYear()}`;
      return !paidMonths.has(monthKey);
    }).map(month => {
      const dueDate = new Date(month);
      const daysOverdue = differenceInDays(currentDate, dueDate);
      const lateFineAmount = daysOverdue > 0 ? Math.min(daysOverdue * dailyLateFee, maxLateFee) : 0;
      
      return {
        month,
        formattedDate: format(month, "MMMM yyyy"),
        daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
        lateFineAmount: lateFineAmount
      };
    });
  }, [payments, leaseStartDate, leaseEndDate, rentAmount, dailyLateFee, maxLateFee]);

  // Fetch payments from the database
  const fetchPayments = useCallback(async () => {
    if (!agreementId) {
      console.log("No agreement ID provided to useUnifiedPayments");
      setIsLoading(false);
      return;
    }
    
    if (fetchInProgress.current) return;
    
    fetchInProgress.current = true;
    setIsLoading(true);
    
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
          setError("Failed to load payment history");
        }
        return;
      }
      
      console.log(`Raw payments data for ${agreementId}:`, unifiedPayments);
      
      if (!unifiedPayments || unifiedPayments.length === 0) {
        console.log(`No payments found for agreement ID: ${agreementId}`);
        setPayments([]);
        setIsLoading(false);
        fetchInProgress.current = false;
        initialFetchCompleted.current = true;
        return;
      }
      
      const formattedPayments = unifiedPayments.map(payment => ({
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
      console.log(`Formatted payments set for ${agreementId}:`, formattedPayments);
      
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
      errorCount.current += 1;
      
      if (errorCount.current > 3) {
        toast.error("Failed to load payment history");
        setError("Failed to load payment history");
      }
    } finally {
      setIsLoading(false);
      fetchInProgress.current = false;
      initialFetchCompleted.current = true;
    }
  }, [agreementId, rentAmount]);

  // Handle payment deletion
  const deletePayment = async (paymentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('unified_payments')
        .delete()
        .eq('id', paymentId);

      if (error) {
        console.error("Error deleting payment:", error);
        toast.error("Failed to delete payment");
        return false;
      }

      toast.success("Payment deleted successfully");
      // Refresh payments list
      await fetchPayments();
      return true;
    } catch (error) {
      console.error("Error in payment deletion:", error);
      toast.error("An unexpected error occurred");
      return false;
    }
  };

  // Calculate pending payment total
  const calculatePendingAmount = useCallback(() => {
    if (!rentAmount) return 0;
    
    const pendingPayments = payments.filter(
      payment => payment.type === "rent" && payment.status === "pending"
    );
    
    return pendingPayments.reduce((total, payment) => total + payment.amount, 0);
  }, [payments, rentAmount]);

  // Initial fetch on mount
  useEffect(() => {
    console.log(`useUnifiedPayments hook initialized with agreementId: ${agreementId}, initialFetch: ${initialFetchCompleted.current}`);
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

  // Return consolidated payment data and operations
  return { 
    payments, 
    isLoading, 
    error,
    fetchPayments,
    deletePayment,
    missingPayments: missingPayments(),
    pendingAmount: calculatePendingAmount()
  };
}
