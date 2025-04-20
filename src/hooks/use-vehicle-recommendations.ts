
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AIRecommendation, AIRecommendationRequest } from '@/types/ai-recommendation';
import { FlattenType, SafeQueryResult } from '@/utils/type-utils';

export interface VehiclePreferences {
  size?: string;
  type?: string;
  priceRange?: string;
  features?: string[];
}

// Define a simplified type to avoid deep type instantiation
type SimpleAIRecommendation = {
  id: string;
  customer_id: string;
  recommendation_type: string;
  content: any;
  created_at: string;
  preferred_attributes?: Record<string, any>;
  status: string;
};

export const useVehicleRecommendations = (customerId?: string) => {
  const [isRequesting, setIsRequesting] = useState(false);

  const fetchRecommendations = async (): Promise<SafeQueryResult<SimpleAIRecommendation[]>> => {
    if (!customerId) return [];

    try {
      // Use 'recommendations' table instead of 'ai_recommendations'
      // This appears to be a table naming mismatch with the Supabase schema
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('customer_id', customerId)
        .eq('recommendation_type', 'vehicle')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicle recommendations:', error);
        throw error;
      }

      return data as SimpleAIRecommendation[];
    } catch (err) {
      console.error('Error in fetchRecommendations:', err);
      throw err;
    }
  };

  const recommendationsQuery = useQuery({
    queryKey: ['vehicle-recommendations', customerId],
    queryFn: fetchRecommendations,
    enabled: !!customerId
  });

  const requestRecommendation = async (params: {
    customerId: string;
    rentalDuration?: number;
    preferredAttributes?: VehiclePreferences;
  }) => {
    try {
      setIsRequesting(true);
      const { data, error } = await supabase.functions.invoke<SimpleAIRecommendation>('ai-vehicle-recommendation', {
        body: {
          customerId: params.customerId,
          rentalDuration: params.rentalDuration,
          preferredAttributes: params.preferredAttributes
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error requesting vehicle recommendations:', error);
      toast.error('Failed to get vehicle recommendations');
      throw error;
    } finally {
      setIsRequesting(false);
    }
  };

  const recommendationMutation = useMutation({
    mutationFn: requestRecommendation,
    onSuccess: () => {
      toast.success('Vehicle recommendations generated successfully');
      recommendationsQuery.refetch();
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate vehicle recommendations: ${error.message}`);
    }
  });

  return {
    recommendations: recommendationsQuery.data,
    isLoading: recommendationsQuery.isLoading,
    error: recommendationsQuery.error,
    requestRecommendation: recommendationMutation.mutate,
    isRequesting: recommendationMutation.isPending || isRequesting
  };
};
