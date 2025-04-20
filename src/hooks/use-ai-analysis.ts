
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FlattenType } from '@/utils/type-utils';

export interface AIAnalysis {
  id: string;
  agreement_id: string;
  analysis_type: string;
  content: any;
  created_at: string;
  confidence_score: number;
  status: string;
}

// Flatten the type to avoid deep instantiation issues
type SimpleAIAnalysis = FlattenType<AIAnalysis>;

export const useAIAnalysis = (agreementId?: string) => {
  const fetchAnalysis = async (): Promise<SimpleAIAnalysis[] | null> => {
    if (!agreementId) return null;

    try {
      const { data, error } = await supabase
        .from('ai_analysis' as any)
        .select('*')
        .eq('agreement_id', agreementId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching AI analysis:', error);
        throw error;
      }

      return data as SimpleAIAnalysis[];
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
