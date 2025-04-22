
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Cpu, Clock, Check, ChevronUp, ChevronDown, AlertCircle, 
  BarChart2, Calendar, Heart, Car, CreditCard, User, TrendingUp
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { EnhancedAnalysisResult, AiModelParameters } from '@/utils/type-utils';

interface EnhancedAnalysisCardProps {
  analysisResult: EnhancedAnalysisResult | null;
  modelInfo?: AiModelParameters;
  isLoading?: boolean;
  onApplyRecommendation?: () => Promise<void>;
  onRefreshAnalysis?: () => Promise<void>;
}

const EnhancedAnalysisCard: React.FC<EnhancedAnalysisCardProps> = ({
  analysisResult,
  modelInfo,
  isLoading = false,
  onApplyRecommendation,
  onRefreshAnalysis
}) => {
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);
  
  if (!analysisResult) return null;
  
  const isStatusDifferent = analysisResult.recommended_status !== analysisResult.current_status;
  
  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    return level === 'high' ? 'text-red-500' : 
           level === 'medium' ? 'text-amber-500' : 
           'text-green-500';
  };
  
  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'vehicle':
        return <Car className="h-4 w-4" />;
      case 'customer':
        return <User className="h-4 w-4" />;
      case 'risk':
        return <AlertCircle className="h-4 w-4" />;
      case 'trends':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <BarChart2 className="h-4 w-4" />;
    }
  };
  
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const renderFactorSection = (title: string, sectionKey: string, data: Record<string, any>) => {
    if (!data) return null;
    
    const isExpanded = expandedSection === sectionKey;
    
    return (
      <div className="border rounded-md mb-3">
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50"
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="flex items-center gap-2">
            {getSectionIcon(sectionKey)}
            <span className="font-medium">{title}</span>
          </div>
          {isExpanded ? 
            <ChevronUp className="h-4 w-4 text-gray-500" /> : 
            <ChevronDown className="h-4 w-4 text-gray-500" />
          }
        </div>
        
        {isExpanded && (
          <div className="p-3 pt-0 border-t">
            {Object.entries(data).map(([key, value]) => {
              // Skip rendering arrays or objects directly
              if (Array.isArray(value) || typeof value === 'object') return null;
              
              // Format key from camelCase to sentence case
              const formattedKey = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase());
                
              // Format value based on type
              let formattedValue = value;
              if (typeof value === 'number') {
                if (key.includes('Rate') || key.includes('Percentage')) {
                  formattedValue = `${(value as number * 100).toFixed(1)}%`;
                } else if (key.includes('Score')) {
                  formattedValue = (
                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{Math.round(value as number)}/100</span>
                        <span className={getRiskColor(value < 33 ? 'low' : value < 66 ? 'medium' : 'high')}>
                          {value < 33 ? 'Low' : value < 66 ? 'Medium' : 'High'}
                        </span>
                      </div>
                      <Progress value={value as number} className="h-2" />
                    </div>
                  );
                } else {
                  formattedValue = Number.isInteger(value) ? value : (value as number).toFixed(2);
                }
              }
              
              return (
                <div key={key} className="flex justify-between items-center py-1 text-sm">
                  <span className="text-gray-600">{formattedKey}:</span>
                  <span>{formattedValue}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Card className="mt-6 border-dashed">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Enhanced AI Status Analysis</CardTitle>
          </div>
          <div className="flex gap-2 items-center">
            {modelInfo && (
              <Badge variant="outline" className="text-xs">
                Model v{modelInfo.version}
              </Badge>
            )}
            <Badge variant={isStatusDifferent ? "destructive" : "outline"}>
              {new Date(analysisResult.analyzed_at).toLocaleString()}
            </Badge>
          </div>
        </div>
        <CardDescription className="flex items-center justify-between">
          <span>Analyzed with {(analysisResult.confidence * 100).toFixed(0)}% confidence</span>
          {analysisResult.prediction_accuracy !== undefined && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
              Prediction accuracy: {(analysisResult.prediction_accuracy * 100).toFixed(0)}%
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Current Status</p>
              <Badge variant="outline" className="mt-1">
                {analysisResult.current_status}
              </Badge>
            </div>
            <div className="text-center">
              {isStatusDifferent && (
                <Clock className="mx-auto h-6 w-6 text-amber-500" />
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold">Recommended Status</p>
              <Badge variant={isStatusDifferent ? "destructive" : "outline"} className="mt-1">
                {analysisResult.recommended_status}
              </Badge>
            </div>
          </div>
          
          <div>
            <p className="font-semibold flex items-center gap-2">
              <span>Risk Level:</span> 
              <span className={getRiskColor(analysisResult.risk_level)}>
                {analysisResult.risk_level.charAt(0).toUpperCase() + analysisResult.risk_level.slice(1)}
              </span>
            </p>
          </div>
          
          <div>
            <p className="font-semibold">Analysis:</p>
            <p className="mt-1 text-sm text-muted-foreground">{analysisResult.explanation}</p>
          </div>
          
          {analysisResult.action_items.length > 0 && (
            <div>
              <p className="font-semibold">Recommended Actions:</p>
              <ul className="mt-1 text-sm space-y-1">
                {analysisResult.action_items.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Enhanced Analysis Sections */}
          <div className="pt-4">
            <h4 className="text-sm font-medium mb-2">Detailed Analysis Factors</h4>
            
            {renderFactorSection('Payment History', 'payment', analysisResult.payment_factors || {})}
            {renderFactorSection('Customer Profile', 'customer', analysisResult.customer_factors || {})}
            {renderFactorSection('Vehicle Information', 'vehicle', analysisResult.vehicle_factors || {})}
            {renderFactorSection('Risk Assessment', 'risk', analysisResult.risk_factors || {})}
            {renderFactorSection('Trend Analysis', 'trends', analysisResult.trend_analysis || {})}
          </div>
          
          {/* Intervention Suggestions */}
          {analysisResult.intervention_suggestions && analysisResult.intervention_suggestions.length > 0 && (
            <div className="pt-2">
              <p className="font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                <span>Intervention Suggestions:</span>
              </p>
              <ul className="mt-1 text-sm space-y-1">
                {analysisResult.intervention_suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="pt-4 flex gap-2">
            {isStatusDifferent && onApplyRecommendation && (
              <Button 
                onClick={onApplyRecommendation} 
                size="sm"
                variant="default"
                disabled={isLoading}
                className="w-full"
              >
                Apply Recommended Status
              </Button>
            )}
            
            {onRefreshAnalysis && (
              <Button 
                onClick={onRefreshAnalysis} 
                size="sm"
                variant="outline"
                disabled={isLoading}
                className={!isStatusDifferent && onApplyRecommendation ? "w-full" : ""}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh Analysis
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAnalysisCard;
