
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { castDbId } from '@/utils/supabase-type-helpers';

interface PaymentDetails {
  rentAmount: number;
  lateFeeAmount: number;
  totalDue: number;
  agreementNumber: string | null;
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
        console.log("Fetching payment details for car number:", carNumber);
        
        // Get active lease for the vehicle
        const { data: lease, error: leaseError } = await supabase
          .from('leases')
          .select(`
            id,
            agreement_number,
            rent_amount,
            rent_due_day,
            daily_late_fee,
            status,
            vehicles!inner(license_plate)
          `)
          .eq('vehicles.license_plate', carNumber)
          .eq('status', 'active')
          .single();

        if (leaseError) {
          console.error("Lease error:", leaseError);
          throw new Error(leaseError.message);
        }
        
        if (!lease) {
          setError('No active agreement found for this vehicle');
          setIsLoading(false);
          return;
        }

        console.log("Found lease:", lease);

        // Calculate late fee if applicable
        let lateFee = 0;
        const today = new Date();
        const dueDay = lease.rent_due_day || 1;
        const currentDay = today.getDate();
        
        if (currentDay > dueDay) {
          const daysLate = currentDay - dueDay;
          lateFee = daysLate * (lease.daily_late_fee || 120); // Default to 120 if not set
        }

        setData({
          rentAmount: lease.rent_amount || 0,
          lateFeeAmount: lateFee,
          totalDue: (lease.rent_amount || 0) + lateFee,
          agreementNumber: lease.agreement_number
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
