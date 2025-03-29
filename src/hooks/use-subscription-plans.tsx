
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*');
          
        if (error) throw error;
        
        // Transform data to match expected format if needed
        const formattedPlans = (data || []).map(plan => ({
          ...plan,
          features: plan.features || []
        }));
        
        setPlans(formattedPlans);
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
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
