
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PricingFactors {
  seasonalMultiplier: number;
  demandMultiplier: number;
  basePrice: number;
}

export function useDynamicPricing(vehicleId: string) {
  const [price, setPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updatePrice = async () => {
      try {
        setIsLoading(true);
        
        // Fetch vehicle rent_amount
        const { data: vehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .select('rent_amount')
          .eq('id', vehicleId)
          .single();

        if (vehicleError) throw vehicleError;

        if (!vehicle) {
          setPrice(0);
          setError('Vehicle not found');
          return;
        }

        // Calculate demand multiplier
        const { data: activeRentals, count: activeCount, error: rentalError } = await supabase
          .from('leases')
          .select('id', { count: 'exact' })
          .eq('status', 'active');

        if (rentalError) throw rentalError;

        const { count: totalVehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id', { count: 'exact' });

        if (vehiclesError) throw vehiclesError;

        const utilization = (activeCount || 0) / (totalVehicles || 1);
        const demandMultiplier = 1 + (utilization * 0.5); // Up to 50% increase based on demand

        // Get seasonal multiplier
        const seasonalMultiplier = getSeasonalMultiplier();

        // Calculate final price using rent_amount instead of base_price
        const basePrice = vehicle.rent_amount || 1000; // Fallback value if rent_amount is not set
        const finalPrice = basePrice * demandMultiplier * seasonalMultiplier;
        
        setPrice(Math.round(finalPrice));
      } catch (err) {
        console.error('Error calculating dynamic price:', err);
        setError('Failed to calculate dynamic price');
        toast.error('Error calculating dynamic price');
      } finally {
        setIsLoading(false);
      }
    };

    updatePrice();
    const interval = setInterval(updatePrice, 3600000); // Update hourly
    return () => clearInterval(interval);
  }, [vehicleId]);

  return { price, isLoading, error };
}

// Helper function to get seasonal multiplier
function getSeasonalMultiplier(): number {
  const month = new Date().getMonth();
  // Peak season multiplier (summer months)
  return [5, 6, 7, 8].includes(month) ? 1.3 : 1.0;
}
