
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Use a type assertion since subscription_plans might not be in the type definitions
        const { data, error } = await supabase
          .from('subscription_plans' as any)
          .select('*');
          
        if (error) throw error;
        
        // Validate and transform the data to match our expected interface
        if (data) {
          const formattedPlans: SubscriptionPlan[] = data.map((plan: any) => ({
            id: plan.id || '',
            name: plan.name || '',
            price: Number(plan.price) || 0,
            features: Array.isArray(plan.features) ? plan.features : []
          }));
          
          setPlans(formattedPlans);
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        toast.error('Failed to load subscription plans');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const selectPlan = (planId: string) => {
    const plan = plans.find(p => p.id === planId) || null;
    setSelectedPlan(plan);
  };

  return {
    plans,
    selectedPlan,
    selectPlan,
    isLoading
  };
}
