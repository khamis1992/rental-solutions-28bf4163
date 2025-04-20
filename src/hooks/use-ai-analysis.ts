
import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DatabaseRecord, SafeSupabaseQuery } from '@/utils/type-utils';

// Simplified interface to avoid deep type instantiation
export interface AIAnalysis {
  id: string;
  agreement_id: string;
  analysis_type: string;
  content: any;
  created_at: string;
  confidence_score: number;
  status: string;
}

export const useAIAnalysis = (agreementId?: string) => {
  const fetchAnalysis = async (): Promise<AIAnalysis[] | null> => {
    if (!agreementId) return null;

    try {
      // Use type assertion to work around TypeScript table definition limitations
      const { data, error } = await (supabase
        .from('ai_analysis' as any) // Use type assertion to bypass TypeScript check
        .select('*')
        .eq('agreement_id', agreementId)
        .order('created_at', { ascending: false })) as SafeSupabaseQuery<{
          data: AIAnalysis[] | null;
          error: any;
        }>;

      if (error) {
        console.error('Error fetching AI analysis:', error);
        throw error;
      }

      return data as AIAnalysis[];
    } catch (err) {
      console.error('Error in fetchAnalysis:', err);
      throw err;
    }
  };

  const requestNewAnalysis = async (params: {
    agreementId: string;
    analysisType: string;
    content?: Record<string, any>;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-analysis', {
        body: {
          agreementId: params.agreementId,
          analysisType: params.analysisType,
          content: params.content
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error requesting AI analysis:', error);
      toast.error('Failed to request AI analysis');
      throw error;
    }
  };

  const analysisQuery = useQuery({
    queryKey: ['ai-analysis', agreementId],
    queryFn: fetchAnalysis,
    enabled: !!agreementId
  });

  const analysisMutation = useMutation({
    mutationFn: requestNewAnalysis,
    onSuccess: () => {
      toast.success('AI analysis completed successfully');
      analysisQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to complete AI analysis: ${error.message}`);
    }
  });

  return {
    analysis: analysisQuery.data,
    isLoading: analysisQuery.isLoading,
    error: analysisQuery.error,
    requestAnalysis: analysisMutation.mutate,
    isAnalyzing: analysisMutation.isPending
  };
};
