
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
        const { data, error } = await supabase
          .from('payment_plans')
          .select('*')
          .eq('agreement_id', agreementId);
          
        if (error) throw error;
        setPlans(data);
      } catch (error) {
        console.error('Error fetching payment plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [agreementId]);

  return {
    plans,
    loading,
    calculateLateFee,
    calculateDynamicDeposit
  };
}
