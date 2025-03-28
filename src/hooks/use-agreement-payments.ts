
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { differenceInMonths } from 'date-fns';
import { Payment } from '@/components/agreements/PaymentHistory';

interface UseAgreementPaymentsProps {
  agreementId: string;
  isInitialized: boolean;
  refreshTrigger: number;
}

export function useAgreementPayments({ 
  agreementId,
  isInitialized,
  refreshTrigger
}: UseAgreementPaymentsProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [rentAmount, setRentAmount] = useState<number | null>(null);
  const [contractAmount, setContractAmount] = useState<number | null>(null);

  // Fetch rent amount separately - no dependencies on other API calls
  const fetchRentAmount = useCallback(async () => {
    if (!agreementId) return;
    
    try {
      const { data, error } = await supabase
        .from("leases")
        .select("rent_amount, start_date, end_date")
        .eq("id", agreementId)
        .single();
      
      if (error) {
        console.error("Error fetching rent amount:", error);
        return;
      }
      
      if (data) {
        // Set the rent amount
        if (data.rent_amount) {
          setRentAmount(data.rent_amount);
          console.log("Fetched rent amount:", data.rent_amount);
        }
        
        // Calculate contract amount if we have dates
        if (data.rent_amount && data.start_date && data.end_date) {
          const durationMonths = differenceInMonths(
            new Date(data.end_date), 
            new Date(data.start_date)
          );
          const calculatedAmount = data.rent_amount * Math.max(durationMonths, 1);
          setContractAmount(calculatedAmount);
          console.log(`Contract duration: ${durationMonths} months, Contract amount: ${calculatedAmount}`);
        }
      }
    } catch (error) {
      console.error("Error fetching rent amount:", error);
    }
  }, [agreementId]);

  // Fetch payments - separate from other data fetching
  const fetchPayments = useCallback(async () => {
    if (!agreementId) return;
    
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
      console.log("Formatted payments set:", formattedPayments.length);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payment history");
    } finally {
      setIsLoadingPayments(false);
    }
  }, [agreementId]);

  // Main effect to fetch both rent amount and payments
  useEffect(() => {
    if (isInitialized && agreementId) {
      // First get the rent amount
      fetchRentAmount();
      
      // Then fetch the payments
      fetchPayments();
    }
  }, [agreementId, isInitialized, fetchRentAmount, fetchPayments, refreshTrigger]);

  return {
    payments,
    isLoadingPayments,
    rentAmount,
    contractAmount,
    fetchPayments
  };
}
