import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAIAnalysis } from '@/hooks/use-ai-analysis';
import { Loader2, Brain, AlertCircle, BarChart3, Car, Calendar } from 'lucide-react';
import { AIBadge } from '@/components/ui/ai-badge';
import { format } from 'date-fns';
import {
  StatusRecommendation,
  PaymentPrediction,
  RiskAssessment,
  AgreementHealth
} from '@/types/ai-recommendation';

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

  const formatQAR = (amount: number) => {
    return new Intl.NumberFormat('en-QA', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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

    const latestAnalysis = [...relevantAnalysis].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    let content = null;
    
    try {
      if (latestAnalysis.content?.choices?.[0]?.message?.content) {
        const rawContent = latestAnalysis.content.choices[0].message.content;
        const jsonContent = JSON.parse(rawContent);
        
        switch (type) {
          case 'status_recommendation':
            const statusData = jsonContent as StatusRecommendation;
            content = (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
                  <div className="flex items-center gap-2">
                    <div className={`px-4 py-2 rounded-full text-white font-medium ${getStatusColor(statusData.recommendedStatus)}`}>
                      {statusData.recommendedStatus}
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(statusData.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <h4 className="font-medium mb-2">Analysis</h4>
                  <p className="text-sm text-muted-foreground">{statusData.reasoning}</p>
                </div>

                {statusData.actionItems && statusData.actionItems.length > 0 && (
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="font-medium mb-2">Recommended Actions</h4>
                    <ul className="space-y-2">
                      {statusData.actionItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
            break;
            
          case 'payment_prediction':
            const paymentData = jsonContent as PaymentPrediction;
            content = (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="text-sm font-medium mb-2">Payment Risk Level</h4>
                    <div className={`inline-flex px-3 py-1 rounded-full text-white text-sm font-medium ${getPaymentRiskColor(paymentData.paymentRiskLevel)}`}>
                      {paymentData.paymentRiskLevel.toUpperCase()} RISK
                    </div>
                  </div>
                  
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="text-sm font-medium mb-2">Payment Reliability</h4>
                    <div className="text-2xl font-bold">
                      {Math.round(paymentData.onTimePaymentProbability * 100)}%
                    </div>
                  </div>
                </div>

                {paymentData.nextPaymentAmount && (
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="font-medium mb-2">Next Payment</h4>
                    <div className="text-2xl font-bold text-primary">
                      {formatQAR(paymentData.nextPaymentAmount)}
                    </div>
                    {paymentData.nextPaymentDate && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Due on {format(new Date(paymentData.nextPaymentDate), 'MMMM d, yyyy')}
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 bg-card rounded-lg border">
                  <h4 className="font-medium mb-2">Analysis</h4>
                  <p className="text-sm text-muted-foreground">{paymentData.reasoning}</p>
                </div>

                {paymentData.recommendedActions && (
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="font-medium mb-2">Recommended Actions</h4>
                    <ul className="space-y-2">
                      {paymentData.recommendedActions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
            break;
            
          case 'risk_assessment':
            const riskData = jsonContent as RiskAssessment;
            content = (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="text-sm font-medium mb-2">Risk Level</h4>
                    <div className={`inline-flex px-3 py-1 rounded-full text-white text-sm font-medium ${getRiskLevelColor(riskData.riskLevel)}`}>
                      {riskData.riskLevel.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="text-sm font-medium mb-2">Risk Score</h4>
                    <div className="text-2xl font-bold">{riskData.overallRiskScore}/100</div>
                  </div>
                </div>

                {riskData.financialExposure && (
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="font-medium mb-2">Financial Exposure</h4>
                    <div className="text-2xl font-bold text-primary">
                      {formatQAR(riskData.financialExposure)}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-card rounded-lg border">
                  <h4 className="font-medium mb-2">Key Risk Factors</h4>
                  <ul className="space-y-2">
                    {riskData.keyRiskFactors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-card rounded-lg border">
                  <h4 className="font-medium mb-2">Mitigation Recommendations</h4>
                  <ul className="space-y-2">
                    {riskData.mitigationRecommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
            break;
            
          case 'agreement_health':
            const healthData = jsonContent as AgreementHealth;
            content = (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="text-sm font-medium mb-2">Health Score</h4>
                    <div className={`inline-flex px-3 py-1 rounded-full text-white text-sm font-medium ${getHealthScoreColor(healthData.healthScore)}`}>
                      {healthData.healthScore}/100
                    </div>
                  </div>
                  
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="text-sm font-medium mb-2">Compliance Status</h4>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      healthData.compliance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {healthData.compliance ? '✓ Compliant' : '✗ Non-compliant'}
                    </div>
                  </div>
                </div>

                {healthData.issues && healthData.issues.length > 0 && (
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="font-medium mb-2">Issues Found</h4>
                    <ul className="space-y-2">
                      {healthData.issues.map((issue, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {healthData.recommendations && (
                  <div className="p-4 bg-card rounded-lg border">
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-2">
                      {healthData.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
            break;
        }
      }
    } catch (e) {
      console.error('Error parsing analysis content:', e);
      content = (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-red-800 font-medium mb-2">Error</h4>
          <p className="text-sm text-red-600">Failed to parse analysis content</p>
        </div>
      );
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
