
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAIAnalysis } from '@/hooks/use-ai-analysis';
import { Loader2, Brain, AlertCircle, BarChart3, Car, Calendar } from 'lucide-react';
import { AIBadge } from '@/components/ui/ai-badge';
import { format } from 'date-fns';

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

  const [activeTab, setActiveTab] = useState<string>('status');

  const handleRequestAnalysis = (analysisType: string) => {
    requestAnalysis({
      agreementId,
      analysisType: analysisType as any
    });
  };

  const renderAnalysisContent = (type: string) => {
    const relevantAnalysis = analysis?.filter(a => a.analysis_type === type);
    
    if (!relevantAnalysis || relevantAnalysis.length === 0) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No analysis available</p>
          <Button 
            onClick={() => handleRequestAnalysis(type)}
            disabled={isAnalyzing}
            className="mt-4"
            variant="secondary"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running analysis...
              </>
            ) : (
              'Request Analysis'
            )}
          </Button>
        </div>
      );
    }

    // Sort by date, most recent first
    const sortedAnalysis = [...relevantAnalysis].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const latestAnalysis = sortedAnalysis[0];
    let content;
    
    try {
      if (latestAnalysis.content?.choices?.[0]?.message?.content) {
        const rawContent = latestAnalysis.content.choices[0].message.content;
        
        try {
          // First try to parse as JSON
          const jsonContent = JSON.parse(rawContent);
          
          // Render differently based on analysis type
          switch (type) {
            case 'status_recommendation':
              content = (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(jsonContent.recommendedStatus)}`}>
                      {jsonContent.recommendedStatus}
                    </div>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {Math.round(jsonContent.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm">{jsonContent.reasoning}</p>
                  {jsonContent.actionItems && jsonContent.actionItems.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Recommended Actions:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {jsonContent.actionItems.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
              break;
              
            case 'payment_prediction':
              content = (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getPaymentRiskColor(jsonContent.paymentRiskLevel)}`}>
                      {jsonContent.paymentRiskLevel.toUpperCase()} RISK
                    </div>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {Math.round(jsonContent.onTimePaymentProbability * 100)}% on-time probability
                    </span>
                  </div>
                  <p className="text-sm">{jsonContent.reasoning}</p>
                  {jsonContent.recommendedActions && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Recommended Actions:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {jsonContent.recommendedActions.map((item: string, i: number) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
              break;
              
            case 'risk_assessment':
              content = (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getRiskLevelColor(jsonContent.riskLevel)}`}>
                      {jsonContent.riskLevel.toUpperCase()}
                    </div>
                    <span className="ml-2 text-sm text-muted-foreground">
                      Risk Score: {jsonContent.overallRiskScore}/100
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Risk Factors:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {jsonContent.keyRiskFactors.map((factor: string, i: number) => (
                        <li key={i}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2">Mitigation Recommendations:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {jsonContent.mitigationRecommendations.map((rec: string, i: number) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
              break;
              
            case 'agreement_health':
              content = (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getHealthScoreColor(jsonContent.healthScore)}`}>
                      Health Score: {jsonContent.healthScore}/100
                    </div>
                    <span className="ml-2 text-sm font-medium">
                      {jsonContent.compliance ? '✅ Compliant' : '❌ Non-compliant'}
                    </span>
                  </div>
                  
                  {jsonContent.issues && jsonContent.issues.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Issues Found:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {jsonContent.issues.map((issue: string, i: number) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {jsonContent.recommendations && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Recommendations:</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {jsonContent.recommendations.map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
              break;
              
            default:
              // Fallback for any other type or if JSON structure doesn't match expectations
              content = <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-60 bg-gray-50 p-2 rounded">{JSON.stringify(jsonContent, null, 2)}</pre>;
          }
        } catch (e) {
          // If not valid JSON, just show as formatted text
          content = <p className="text-sm whitespace-pre-line">{rawContent}</p>;
        }
      } else {
        content = <p className="text-sm text-muted-foreground">No content available</p>;
      }
    } catch (e) {
      content = <p className="text-sm text-muted-foreground">Error displaying analysis</p>;
    }
    
    return (
      <div className="space-y-4">
        {content}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-2 border-t">
          <div>
            Analysis from {format(new Date(latestAnalysis.created_at), 'MMM d, yyyy h:mm a')}
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleRequestAnalysis(type)}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh'}
          </Button>
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    status = status.toLowerCase();
    if (status.includes('active')) return 'bg-green-600';
    if (status.includes('pending')) return 'bg-yellow-600';
    if (status.includes('closed')) return 'bg-blue-600';
    if (status.includes('cancelled') || status.includes('terminate')) return 'bg-red-600';
    return 'bg-gray-600';
  };

  const getPaymentRiskColor = (risk: string) => {
    risk = risk.toLowerCase();
    if (risk === 'low') return 'bg-green-600';
    if (risk === 'medium') return 'bg-yellow-600';
    if (risk === 'high') return 'bg-red-600';
    return 'bg-gray-600';
  };

  const getRiskLevelColor = (risk: string) => {
    risk = risk.toLowerCase();
    if (risk === 'low') return 'bg-green-600';
    if (risk === 'moderate') return 'bg-yellow-600';
    if (risk === 'high') return 'bg-orange-600';
    if (risk === 'critical') return 'bg-red-600';
    return 'bg-gray-600';
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    if (score >= 40) return 'bg-orange-600';
    return 'bg-red-600';
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg font-medium">
            AI Insights
            <AIBadge className="ml-2" />
          </CardTitle>
          <CardDescription>DeepSeek powered analysis and recommendations</CardDescription>
        </div>
        <Brain className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="status">
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Status</span>
            </TabsTrigger>
            <TabsTrigger value="payment">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Payment</span>
            </TabsTrigger>
            <TabsTrigger value="risk">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Risk</span>
            </TabsTrigger>
            <TabsTrigger value="health">
              <Car className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="mt-0">
            {renderAnalysisContent('status_recommendation')}
          </TabsContent>
          
          <TabsContent value="payment" className="mt-0">
            {renderAnalysisContent('payment_prediction')}
          </TabsContent>
          
          <TabsContent value="risk" className="mt-0">
            {renderAnalysisContent('risk_assessment')}
          </TabsContent>
          
          <TabsContent value="health" className="mt-0">
            {renderAnalysisContent('agreement_health')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
