
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Vehicle } from '@/types/vehicle';

interface PricingModel {
  id: string;
  name: string;
  baseMultiplier: number;
  seasonalAdjustment: number;
  demandAdjustment: number;
  description?: string;
}

export function usePricingModels() {
  const [models, setModels] = useState<PricingModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate price based on a vehicle and pricing model
  const calculateAdjustedPrice = (vehicle: Vehicle, modelId: string): number => {
    const model = models.find(m => m.id === modelId);
    if (!model || !vehicle.rent_amount) return 0;
    
    // Calculate demand multiplier (could be fetched from real-time data)
    const demandMultiplier = 1 + (model.demandAdjustment * 0.1);
    
    // Get seasonal multiplier
    const month = new Date().getMonth();
    const seasonalMultiplier = 1 + ([5, 6, 7, 8].includes(month) ? model.seasonalAdjustment : 0);
    
    // Apply all multipliers to base price
    const adjustedPrice = vehicle.rent_amount * model.baseMultiplier * demandMultiplier * seasonalMultiplier;
    
    return Math.round(adjustedPrice);
  };

  useEffect(() => {
    const loadPricingModels = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('pricing_models')
          .select('*')
          .eq('is_active', true);
          
        if (error) throw error;
        
        if (data) {
          // Transform the data to match our frontend model
          const formattedModels: PricingModel[] = data.map((model: any) => ({
            id: model.id,
            name: model.name || 'Standard Model',
            baseMultiplier: Number(model.base_multiplier) || 1,
            seasonalAdjustment: Number(model.seasonal_adjustment) || 0.3,
            demandAdjustment: Number(model.demand_adjustment) || 0.5,
            description: model.description
          }));
          
          setModels(formattedModels);
        } else {
          // If no pricing models, create a default one
          setModels([{
            id: 'default',
            name: 'Standard Pricing',
            baseMultiplier: 1,
            seasonalAdjustment: 0.3,
            demandAdjustment: 0.5,
            description: 'Default pricing model'
          }]);
        }
      } catch (err) {
        console.error('Error fetching pricing models:', err);
        setError('Failed to load pricing models');
        toast.error('Error loading pricing models');
        
        // Set default model in case of error
        setModels([{
          id: 'default',
          name: 'Standard Pricing',
          baseMultiplier: 1,
          seasonalAdjustment: 0.3,
          demandAdjustment: 0.5,
          description: 'Default pricing model'
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPricingModels();
  }, []);

  return {
    models,
    isLoading,
    error,
    calculateAdjustedPrice
  };
}
