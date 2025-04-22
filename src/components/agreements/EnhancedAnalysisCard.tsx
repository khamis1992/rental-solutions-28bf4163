import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ArrowRight, CheckCircle, ChevronDown, ChevronUp, CircleDashed, Cpu, Info, RefreshCcw } from "lucide-react";
import { EnhancedAnalysisResult, AiModelParameters } from '@/utils/type-utils';

interface EnhancedAnalysisCardProps {
  analysisResult: EnhancedAnalysisResult | null;
  modelInfo?: AiModelParameters;
  isLoading: boolean;
  onApplyRecommendation: () => void;
  onRefreshAnalysis: () => void;
}

const EnhancedAnalysisCard: React.FC<EnhancedAnalysisCardProps> = ({
  analysisResult,
  modelInfo,
  isLoading,
  onApplyRecommendation,
  onRefreshAnalysis
}) => {
  const [expandedSections, setExpandedSections] = useState<{
    paymentFactors: boolean;
    vehicleFactors: boolean;
    customerFactors: boolean;
    riskFactors: boolean;
    trendAnalysis: boolean;
    interventionSuggestions: boolean;
  }>({
    paymentFactors: false,
    vehicleFactors: false,
    customerFactors: false,
    riskFactors: false,
    trendAnalysis: false,
    interventionSuggestions: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!analysisResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agreement Analysis</CardTitle>
          <CardDescription>No analysis available.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Analysis results are not available for this agreement.</p>
        </CardContent>
      </Card>
    );
  }

  const riskLevelBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge className="bg-green-500 text-white">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">Medium Risk</Badge>;
      case 'high':
        return <Badge className="bg-red-500 text-white">High Risk</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Unknown Risk</Badge>;
    }
  };

  const confidenceDisplay = analysisResult.confidence ? (
    <div className="space-y-1">
      <p className="text-sm font-medium">Confidence Level</p>
      <Progress value={analysisResult.confidence * 100} />
      <p className="text-xs text-muted-foreground">
        {Math.round(analysisResult.confidence * 100)}% confident in the analysis
      </p>
    </div>
  ) : (
    <p>Confidence level not available.</p>
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agreement Analysis</CardTitle>
        <CardDescription>
          AI-driven insights and recommendations for this agreement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Risk Level</p>
            {riskLevelBadge(analysisResult.risk_level)}
          </div>
          {confidenceDisplay}
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Recommended Status</p>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{analysisResult.recommended_status}</Badge>
            {analysisResult.recommended_status !== analysisResult.current_status && (
              <Button variant="outline" size="sm" onClick={onApplyRecommendation} disabled={isLoading}>
                Apply Recommendation
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Current Status: {analysisResult.current_status}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Analysis Explanation</p>
          <p className="text-sm">{analysisResult.explanation}</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Key Action Items</p>
          <ul className="list-disc pl-5">
            {analysisResult.action_items.map((item, index) => (
              <li key={index} className="text-sm">{item}</li>
            ))}
          </ul>
        </div>

        <Separator />

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Factors</CardTitle>
                  <CardDescription>Insights into payment behavior</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Payment Consistency: {analysisResult.payment_factors?.payment_consistency_score}</p>
                  <p>Average Delay: {analysisResult.payment_factors?.average_delay_days} days</p>
                  <p>Late Payments: {analysisResult.payment_factors?.late_payments}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Factors</CardTitle>
                  <CardDescription>Insights into vehicle condition</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Maintenance Frequency: {analysisResult.vehicle_factors?.maintenance_frequency}</p>
                  <p>Major Issues: {analysisResult.vehicle_factors?.major_issues_count}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Factors</CardTitle>
                  <CardDescription>Insights into customer behavior</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Traffic Fines: {analysisResult.customer_factors?.traffic_fines_count}</p>
                  <p>Total Fine Amount: {analysisResult.customer_factors?.total_fine_amount}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Factors</CardTitle>
                  <CardDescription>Overall risk assessment</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Payment Risk: {analysisResult.risk_factors?.payment_risk_score}</p>
                  <p>Vehicle Risk: {analysisResult.risk_factors?.vehicle_risk_score}</p>
                  <p>Customer Risk: {analysisResult.risk_factors?.customer_risk_score}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection('paymentFactors')}
                >
                  <h3 className="text-lg font-semibold">Payment Factors</h3>
                  <Button variant="ghost" size="icon">
                    {expandedSections.paymentFactors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                {expandedSections.paymentFactors && (
                  <div className="mt-2">
                    <p>Total Payments: {analysisResult.payment_factors?.total_payments}</p>
                    <p>On-Time Payments: {analysisResult.payment_factors?.on_time_payments}</p>
                    <p>Late Payments: {analysisResult.payment_factors?.late_payments}</p>
                    <p>Payment Consistency Score: {analysisResult.payment_factors?.payment_consistency_score}</p>
                    <p>Average Delay Days: {analysisResult.payment_factors?.average_delay_days}</p>
                    <p>Recent Trend: {analysisResult.payment_factors?.recent_trend}</p>
                    <p>Last Payment Date: {analysisResult.payment_factors?.last_payment_date}</p>
                  </div>
                )}
              </div>

              <div className="border rounded-md p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection('vehicleFactors')}
                >
                  <h3 className="text-lg font-semibold">Vehicle Factors</h3>
                  <Button variant="ghost" size="icon">
                    {expandedSections.vehicleFactors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                {expandedSections.vehicleFactors && (
                  <div className="mt-2">
                    <p>Maintenance Frequency: {analysisResult.vehicle_factors?.maintenance_frequency}</p>
                    <p>Major Issues Count: {analysisResult.vehicle_factors?.major_issues_count}</p>
                    <p>Last Maintenance Date: {analysisResult.vehicle_factors?.last_maintenance_date}</p>
                    <p>Maintenance Score: {analysisResult.vehicle_factors?.maintenance_score}</p>
                    <p>Vehicle Age: {analysisResult.vehicle_factors?.vehicle_age}</p>
                    <p>Vehicle Make: {analysisResult.vehicle_factors?.vehicle_make}</p>
                    <p>Vehicle Model: {analysisResult.vehicle_factors?.vehicle_model}</p>
                  </div>
                )}
              </div>

              <div className="border rounded-md p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection('customerFactors')}
                >
                  <h3 className="text-lg font-semibold">Customer Factors</h3>
                  <Button variant="ghost" size="icon">
                    {expandedSections.customerFactors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                {expandedSections.customerFactors && (
                  <div className="mt-2">
                    <p>Traffic Fines Count: {analysisResult.customer_factors?.traffic_fines_count}</p>
                    <p>Total Fine Amount: {analysisResult.customer_factors?.total_fine_amount}</p>
                    <p>Customer Since: {analysisResult.customer_factors?.customer_since}</p>
                    <p>Previous Agreements Count: {analysisResult.customer_factors?.previous_agreements_count}</p>
                    <p>Payment Reliability Score: {analysisResult.customer_factors?.payment_reliability_score}</p>
                    <p>Customer Name: {analysisResult.customer_factors?.customer_name}</p>
                    <p>Customer Contact: {analysisResult.customer_factors?.customer_contact}</p>
                  </div>
                )}
              </div>

              <div className="border rounded-md p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection('riskFactors')}
                >
                  <h3 className="text-lg font-semibold">Risk Factors</h3>
                  <Button variant="ghost" size="icon">
                    {expandedSections.riskFactors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                {expandedSections.riskFactors && (
                  <div className="mt-2">
                    <p>Payment Risk Score: {analysisResult.risk_factors?.payment_risk_score}</p>
                    <p>Vehicle Risk Score: {analysisResult.risk_factors?.vehicle_risk_score}</p>
                    <p>Customer Risk Score: {analysisResult.risk_factors?.customer_risk_score}</p>
                    <p>Overall Risk Score: {analysisResult.risk_factors?.overall_risk_score}</p>
                    <p>Risk Factors: {analysisResult.risk_factors?.risk_factors?.join(', ') || 'None'}</p>
                  </div>
                )}
              </div>

              <div className="border rounded-md p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection('trendAnalysis')}
                >
                  <h3 className="text-lg font-semibold">Trend Analysis</h3>
                  <Button variant="ghost" size="icon">
                    {expandedSections.trendAnalysis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                {expandedSections.trendAnalysis && (
                  <div className="mt-2">
                    <p>Overall Direction: {analysisResult.trend_analysis?.overall_direction}</p>
                    <p>Data Points: {analysisResult.trend_analysis?.data_points}</p>
                    {analysisResult.trend_analysis?.monthly_trends && (
                      <ul className="list-disc pl-5">
                        {analysisResult.trend_analysis.monthly_trends.map((trend, index) => (
                          <li key={index}>
                            {trend.month}: Payments - {trend.payments}, On-Time - {trend.on_time}, Late - {trend.late}, Fines - {trend.fines}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="border rounded-md p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleSection('interventionSuggestions')}
                >
                  <h3 className="text-lg font-semibold">Intervention Suggestions</h3>
                  <Button variant="ghost" size="icon">
                    {expandedSections.interventionSuggestions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                {expandedSections.interventionSuggestions && (
                  <ul className="list-disc pl-5 mt-2">
                    {analysisResult.intervention_suggestions?.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Last Analyzed: {formatDate(analysisResult.analyzed_at)}
        </p>
        <Button variant="outline" size="sm" onClick={onRefreshAnalysis} disabled={isLoading} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          {isLoading ? "Analyzing..." : "Refresh Analysis"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EnhancedAnalysisCard;
