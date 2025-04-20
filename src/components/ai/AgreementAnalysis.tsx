
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAIAnalysis } from '@/hooks/use-ai-analysis';
import { Loader2, Brain } from 'lucide-react';

interface AgreementAnalysisProps {
  agreementId: string;
}

export const AgreementAnalysis = ({ agreementId }: AgreementAnalysisProps) => {
  const { 
    analysis, 
    isLoading, 
    requestAnalysis, 
    isAnalyzing 
  } = useAIAnalysis(agreementId);

  const handleRequestAnalysis = () => {
    requestAnalysis({
      agreementId,
      analysisType: 'status_recommendation'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">AI Analysis</CardTitle>
        <Brain className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {analysis && analysis.length > 0 ? (
          <div className="space-y-4">
            {analysis.map((item) => (
              <div key={item.id} className="space-y-2">
                <h4 className="font-medium">{item.analysis_type}</h4>
                <p className="text-sm text-muted-foreground">
                  {JSON.stringify(item.content.choices[0].message.content)}
                </p>
                <div className="text-xs text-muted-foreground">
                  Confidence: {(item.confidence_score * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No analysis available for this agreement
            </p>
          </div>
        )}
        <Button
          onClick={handleRequestAnalysis}
          disabled={isAnalyzing}
          className="w-full mt-4"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Request New Analysis'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
