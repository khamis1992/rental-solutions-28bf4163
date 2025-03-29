
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PricingFactors {
  seasonalMultiplier: number;
  demandMultiplier: number;
  basePrice: number;
}

export function useDynamicPricing(vehicleId: string) {
  const [price, setPrice] = useState<number>(0);

  const calculateDemandMultiplier = async () => {
    const { data: activeRentals, count: activeCount } = await supabase
      .from('agreements')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    const { count: totalVehicles } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact' });

    const utilization = (activeCount || 0) / (totalVehicles || 1);
    return 1 + (utilization * 0.5); // Up to 50% increase based on demand
  };

  const getSeasonalMultiplier = () => {
    const month = new Date().getMonth();
    // Peak season multiplier (summer months)
    return [5, 6, 7, 8].includes(month) ? 1.3 : 1.0;
  };

  useEffect(() => {
    const updatePrice = async () => {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('base_price')
        .eq('id', vehicleId)
        .single();

      if (vehicle) {
        const demandMultiplier = await calculateDemandMultiplier();
        const seasonalMultiplier = getSeasonalMultiplier();
        const finalPrice = vehicle.base_price * demandMultiplier * seasonalMultiplier;
        setPrice(Math.round(finalPrice));
      }
    };

    updatePrice();
    const interval = setInterval(updatePrice, 3600000); // Update hourly
    return () => clearInterval(interval);
  }, [vehicleId]);

  return { price };
}
