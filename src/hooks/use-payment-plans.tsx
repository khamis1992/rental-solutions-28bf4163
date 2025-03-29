
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Improved interface with optional fields and better types
export interface PaymentPlan {
  id: string;
  name: string;
  installments: number;
  interestRate: number;
  minimumDeposit: number;
  description?: string;
  isActive?: boolean;
  processingFee?: number;
  availableForVehicleTypes?: string[];
}

interface CalculationOptions {
  customerRiskScore?: number;
  vehicleValue?: number;
  duration?: number;
}

export function usePaymentPlans(agreementId: string) {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);

  // Function to calculate late fee with better typing
  const calculateLateFee = async (daysLate: number, amount: number): Promise<number> => {
    if (daysLate <= 0 || amount <= 0) return 0;
    
    const baseRate = 0.1; // 10% base late fee
    const dailyRate = 0.01; // 1% additional per day
    return parseFloat((amount * (baseRate + (daysLate * dailyRate))).toFixed(2));
  };

  // Function to calculate dynamic deposit with better typing
  const calculateDynamicDeposit = async (
    vehicleValue: number, 
    customerScore: number
  ): Promise<number> => {
    if (vehicleValue <= 0) return 0;
    
    const baseRate = 0.2; // 20% base deposit
    // Higher score = lower deposit (normalize to 0-1 range)
    const riskAdjustment = Math.max(0, Math.min(1, (100 - customerScore) / 100));
    return parseFloat((vehicleValue * (baseRate + riskAdjustment)).toFixed(2));
  };
  
  // Generate installment schedule for a payment plan
  const generateInstallmentSchedule = (
    planId: string,
    totalAmount: number,
    startDate: Date = new Date()
  ) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return [];
    
    const installments = [];
    let remainingAmount = totalAmount;
    let currentDate = new Date(startDate);
    
    // Calculate base installment amount
    const baseAmount = totalAmount / plan.installments;
    
    // Add interest if applicable
    const monthlyInterestRate = plan.interestRate / 12 / 100;
    
    for (let i = 0; i < plan.installments; i++) {
      // Calculate this installment's amount with interest
      const installmentAmount = parseFloat(
        (baseAmount + (remainingAmount * monthlyInterestRate)).toFixed(2)
      );
      
      installments.push({
        number: i + 1,
        dueDate: new Date(currentDate),
        amount: installmentAmount,
        status: 'pending'
      });
      
      // Prepare for next installment
      remainingAmount -= baseAmount;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return installments;
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
            minimumDeposit: Number(plan.minimum_deposit) || 0,
            description: plan.description || undefined,
            isActive: plan.is_active !== false, // Default to true if not specified
            processingFee: plan.processing_fee || 0,
            availableForVehicleTypes: plan.available_vehicle_types || []
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
    error,
    selectedPlan,
    setSelectedPlan,
    calculateLateFee,
    calculateDynamicDeposit,
    generateInstallmentSchedule
  };
}
