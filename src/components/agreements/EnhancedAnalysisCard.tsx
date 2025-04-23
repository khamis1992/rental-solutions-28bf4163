import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EnhancedAnalysisResult, AiModelParameters } from '@/utils/type-utils';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Cpu, 
  LineChart, 
  ArrowRight, 
  ChevronRight, 
  Clock, 
  Calendar,
  RefreshCcw as RefreshIcon,
  DollarSign,
  Car,
  Users,
  BarChart,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface EnhancedAnalysisCardProps {
  analysisResult: EnhancedAnalysisResult | null;
  modelInfo?: AiModelParameters;
  isLoading: boolean;
  onApplyRecommendation: () => void;
  onRefreshAnalysis: () => void;
}

const EnhancedAnalysisCard = ({
  analysisResult,
  modelInfo,
  isLoading,
  onApplyRecommendation,
  onRefreshAnalysis
}: EnhancedAnalysisCardProps) => {
  if (!analysisResult) {
    return null;
  }

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="bg-muted/30">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Enhanced AI Agreement Analysis</CardTitle>
            </div>
            <CardDescription>AI-powered risk analysis and recommendations</CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getRiskBadgeColor(analysisResult.risk_level)}>
              {analysisResult.risk_level.toUpperCase()} RISK
            </Badge>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefreshAnalysis}
              disabled={isLoading}
            >
              <RefreshIcon className="h-4 w-4 mr-1" />
              {isLoading ? "Analyzing..." : "Refresh Analysis"}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Tabs defaultValue="summary">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Risk Factors</TabsTrigger>
            <TabsTrigger value="payments">Payment Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Status Analysis</h3>
                  <div className="bg-muted rounded-md p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Current Status</p>
                        <p className="text-sm text-muted-foreground">{analysisResult.current_status}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Recommended Status</p>
                        <p className="text-sm text-muted-foreground">{analysisResult.recommended_status}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-sm font-medium mb-1">Analysis Confidence</p>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={analysisResult.confidence} 
                          className={getConfidenceColor(analysisResult.confidence)}
                        />
                        <span className="text-sm">{analysisResult.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Analysis Summary</h3>
                  <p className="text-sm">{analysisResult.explanation}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Model Information</h3>
                  <div className="bg-muted rounded-md p-4 space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm text-muted-foreground">Model</p>
                      <p className="text-sm">{modelInfo?.modelName || 'AgreementAnalyzer'}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm text-muted-foreground">Version</p>
                      <p className="text-sm">{modelInfo?.version || analysisResult.model_version || '1.0'}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm text-muted-foreground">Last Analysis</p>
                      <p className="text-sm">{formatDate(analysisResult.analyzed_at)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-sm text-muted-foreground">Prediction Accuracy</p>
                      <p className="text-sm">{analysisResult.prediction_accuracy ? `${analysisResult.prediction_accuracy}%` : 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Action Items</h3>
                  {analysisResult.action_items && analysisResult.action_items.length > 0 ? (
                    <ul className="space-y-1">
                      {analysisResult.action_items.map((item, i) => (
                        <li key={i} className="text-sm flex">
                          <ArrowRight className="h-4 w-4 mr-1 mt-1 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No action items recommended</p>
                  )}
                </div>
              </div>
            </div>

            {analysisResult.current_status !== analysisResult.recommended_status && (
              <div className="mt-4 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Status change recommended</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      The AI suggests changing the agreement status from <strong>{analysisResult.current_status}</strong> to <strong>{analysisResult.recommended_status}</strong>
                    </p>
                    <Button size="sm" onClick={onApplyRecommendation}>
                      Apply Recommended Status
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="details" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Customer Factors
                </h3>
                <div className="bg-muted rounded-md p-4">
                  <ScrollArea className="h-[200px]">
                    {analysisResult.customer_factors && Object.keys(analysisResult.customer_factors).length > 0 ? (
                      <dl className="space-y-2">
                        {Object.entries(analysisResult.customer_factors).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-2">
                            <dt className="text-sm text-muted-foreground">{key.replace(/_/g, ' ')}</dt>
                            <dd className="text-sm font-medium">{typeof value === 'object' ? JSON.stringify(value) : value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-sm text-muted-foreground">No customer factors available</p>
                    )}
                  </ScrollArea>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Car className="h-4 w-4 mr-1" />
                  Vehicle Factors
                </h3>
                <div className="bg-muted rounded-md p-4">
                  <ScrollArea className="h-[200px]">
                    {analysisResult.vehicle_factors && Object.keys(analysisResult.vehicle_factors).length > 0 ? (
                      <dl className="space-y-2">
                        {Object.entries(analysisResult.vehicle_factors).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-2">
                            <dt className="text-sm text-muted-foreground">{key.replace(/_/g, ' ')}</dt>
                            <dd className="text-sm font-medium">{typeof value === 'object' ? JSON.stringify(value) : value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-sm text-muted-foreground">No vehicle factors available</p>
                    )}
                  </ScrollArea>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <LineChart className="h-4 w-4 mr-1" />
                  Trend Analysis
                </h3>
                <div className="bg-muted rounded-md p-4">
                  <ScrollArea className="h-[200px]">
                    {analysisResult.trend_analysis && Object.keys(analysisResult.trend_analysis).length > 0 ? (
                      <dl className="space-y-2">
                        {Object.entries(analysisResult.trend_analysis).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-2">
                            <dt className="text-sm text-muted-foreground">{key.replace(/_/g, ' ')}</dt>
                            <dd className="text-sm font-medium">{typeof value === 'object' ? JSON.stringify(value) : value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-sm text-muted-foreground">No trend analysis available</p>
                    )}
                  </ScrollArea>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Risk Factors
                </h3>
                <div className="bg-muted rounded-md p-4">
                  <ScrollArea className="h-[200px]">
                    {analysisResult.risk_factors && Object.keys(analysisResult.risk_factors).length > 0 ? (
                      <dl className="space-y-2">
                        {Object.entries(analysisResult.risk_factors).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-2">
                            <dt className="text-sm text-muted-foreground">{key.replace(/_/g, ' ')}</dt>
                            <dd className="text-sm font-medium">{typeof value === 'object' ? JSON.stringify(value) : value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-sm text-muted-foreground">No risk factors available</p>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="payments" className="mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Payment Analysis
              </h3>
              
              <div className="bg-muted rounded-md p-4">
                <ScrollArea className="h-[300px]">
                  {analysisResult.payment_factors && Object.keys(analysisResult.payment_factors).length > 0 ? (
                    <dl className="space-y-4">
                      {Object.entries(analysisResult.payment_factors).map(([key, value]) => (
                        <div key={key} className="border-b pb-3 last:border-0 last:pb-0">
                          <dt className="text-sm font-medium mb-1">{key.replace(/_/g, ' ')}</dt>
                          <dd className="text-sm">{typeof value === 'object' ? JSON.stringify(value) : value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-muted-foreground">No payment analysis available</p>
                  )}
                </ScrollArea>
              </div>
              
              <div className="bg-blue-50 rounded-md p-4 border border-blue-100">
                <h4 className="text-sm font-medium flex items-center">
                  <Info className="h-4 w-4 mr-1 text-blue-500" />
                  Historical Payment Data
                </h4>
                <div className="mt-2">
                  {analysisResult.historical_data && Object.keys(analysisResult.historical_data).length > 0 ? (
                    <dl className="space-y-2">
                      {Object.entries(analysisResult.historical_data).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2">
                          <dt className="text-sm text-muted-foreground">{key.replace(/_/g, ' ')}</dt>
                          <dd className="text-sm font-medium">{typeof value === 'object' ? JSON.stringify(value) : value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-muted-foreground">No historical payment data available</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="mt-4">
            <div className="space-y-4">
              {analysisResult.intervention_suggestions && analysisResult.intervention_suggestions.length > 0 ? (
                <>
                  <h3 className="text-sm font-medium">Recommended Interventions</h3>
                  <ul className="space-y-3">
                    {analysisResult.intervention_suggestions.map((suggestion, i) => (
                      <li key={i} className="bg-muted rounded-md p-4">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="text-sm">{suggestion}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="bg-muted rounded-md p-4 text-center">
                  <Info className="h-5 w-5 mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No specific interventions recommended at this time</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center">
          <Cpu className="h-3 w-3 mr-1" />
          <span>AI Analysis {analysisResult.model_version || 'v1.0'}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>Analyzed: {formatDate(analysisResult.analyzed_at)}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default EnhancedAnalysisCard;
