
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentPlan {
  id: string;
  name: string;
  installments: number;
  interestRate: number;
  minimumDeposit: number;
}

export function usePaymentPlans(agreementId: string) {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateLateFee = async (daysLate: number, amount: number) => {
    const baseRate = 0.1; // 10% base late fee
    const dailyRate = 0.01; // 1% additional per day
    return amount * (baseRate + (daysLate * dailyRate));
  };

  const calculateDynamicDeposit = async (vehicleValue: number, customerScore: number) => {
    const baseRate = 0.2; // 20% base deposit
    const riskAdjustment = (100 - customerScore) / 100; // Higher score = lower deposit
    return vehicleValue * (baseRate + riskAdjustment);
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Using type assertion since the table might not be in the type definitions
        const { data, error: fetchError } = await supabase
          .from('payment_plans' as any)
          .select('*')
          .eq('agreement_id', agreementId);
          
        if (fetchError) throw fetchError;
        
        if (data) {
          // Transform the data to match our PaymentPlan interface
          const formattedPlans: PaymentPlan[] = data.map((plan: any) => ({
            id: plan.id || '',
            name: plan.name || '',
            installments: Number(plan.installments) || 0,
            interestRate: Number(plan.interest_rate) || 0,
            minimumDeposit: Number(plan.minimum_deposit) || 0
          }));
          
          setPlans(formattedPlans);
        } else {
          setPlans([]);
        }
      } catch (err) {
        console.error('Error fetching payment plans:', err);
        setError('Failed to fetch payment plans');
        toast.error('Error loading payment plans');
      } finally {
        setLoading(false);
      }
    };

    if (agreementId) {
      fetchPlans();
    } else {
      setPlans([]);
      setLoading(false);
    }
  }, [agreementId]);

  return {
    plans,
    loading,
    calculateLateFee,
    calculateDynamicDeposit,
    error
  };
}
