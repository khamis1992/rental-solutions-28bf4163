
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PaymentDetails {
  rentAmount: number;
  lateFeeAmount: number;
  totalDue: number;
  agreementNumber: string | null;
  pendingPayments: PendingPayment[];
  allPayments: Payment[]; // Added to store all payments
  leaseId: string | null;
  contractAmount: number | null;
}

interface PendingPayment {
  id: string;
  amount: number;
  due_date: string | null;
  status: string;
  description: string | null;
  payment_date: string | null;
}

interface Payment extends PendingPayment {
  late_fine_amount?: number | null;
  type?: string | null;
  payment_method?: string | null;
  original_due_date?: string | null;
}

export function usePaymentDetails(carNumber: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaymentDetails | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPaymentDetails() {
      if (!carNumber?.trim()) {
        setData(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Get active lease for the vehicle
        const { data: lease, error: leaseError } = await supabase
          .from('leases')
          .select(`
            *,
            vehicles!inner(license_plate)
          `)
          .eq('vehicles.license_plate', carNumber)
          .eq('status', 'active')
          .single();

        if (leaseError) throw leaseError;
        if (!lease) {
          setError('No active agreement found for this vehicle');
          return;
        }

        // Calculate late fee if applicable
        let lateFee = 0;
        const today = new Date();
        const dueDay = lease.rent_due_day || 1;
        const currentDay = today.getDate();
        
        if (currentDay > dueDay) {
          const daysLate = currentDay - dueDay;
          lateFee = daysLate * (lease.daily_late_fee || 120); // Default to 120 if not set
        }

        // Fetch ALL payments for this lease, regardless of status
        const { data: allPayments, error: paymentError } = await supabase
          .from('unified_payments')
          .select('id, amount, due_date, status, description, payment_date, late_fine_amount, type, payment_method, original_due_date')
          .eq('lease_id', lease.id)
          .order('due_date', { ascending: true });

        if (paymentError) throw paymentError;

        // Filter pending payments for backward compatibility
        const pendingPayments = (allPayments || []).filter(payment => 
          ['pending', 'partially_paid'].includes(payment.status)
        );

        // Get the total contract amount
        const contractAmount = lease.total_amount || 0;

        setData({
          rentAmount: lease.rent_amount || 0,
          lateFeeAmount: lateFee,
          totalDue: (lease.rent_amount || 0) + lateFee,
          agreementNumber: lease.agreement_number,
          pendingPayments: pendingPayments || [],
          allPayments: allPayments || [], // Store all payments
          leaseId: lease.id,
          contractAmount: contractAmount
        });

      } catch (err) {
        console.error('Error fetching payment details:', err);
        const message = err instanceof Error ? err.message : 'Error fetching payment details';
        setError(message);
        toast({
          variant: "destructive",
          title: "Error",
          description: message
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchPaymentDetails();
  }, [carNumber, toast]);

  return { data, isLoading, error };
}
