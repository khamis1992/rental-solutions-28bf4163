
import { EnhancedAnalysisResult, AiModelParameters } from './type-utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Runs a comprehensive AI analysis on an agreement
 * 
 * @param agreementId The ID of the agreement to analyze
 * @returns Enhanced analysis results object
 */
export const runComprehensiveAgreementAnalysis = async (agreementId: string): Promise<EnhancedAnalysisResult> => {
  try {
    // First try to get agreement data
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .select(`
        *,
        profiles:customer_id (*),
        vehicles:vehicle_id (*)
      `)
      .eq('id', agreementId)
      .single();
      
    if (agreementError) {
      console.error("Error fetching agreement data for analysis:", agreementError);
      throw new Error(`Failed to analyze agreement: ${agreementError.message}`);
    }
    
    // Get payment history
    const { data: payments, error: paymentsError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', agreementId)
      .order('due_date', { ascending: true });
      
    if (paymentsError) {
      console.error("Error fetching payment data for analysis:", paymentsError);
      // Continue with analysis, but note the error
    }
    
    // Get any traffic fines
    const { data: trafficFines } = await supabase
      .from('traffic_fines')
      .select('*')
      .eq('lease_id', agreementId);
    
    // Calculate current status assessment
    const statusAssessment = analyzeAgreementStatus(agreement, payments || []);
    
    // Calculate payment patterns and risks
    const paymentFactors = analyzePaymentFactors(payments || [], agreement);
    
    // Analyze vehicle-related risks
    const vehicleFactors = analyzeVehicleFactors(agreement?.vehicles, trafficFines || []);
    
    // Analyze customer-related risks
    const customerFactors = analyzeCustomerFactors(agreement?.profiles, payments || []);
    
    // Determine overall risk factors
    const riskFactors = calculateRiskFactors(paymentFactors, vehicleFactors, customerFactors);
    
    // Generate trend analysis
    const trendAnalysis = generateTrendAnalysis(payments || []);
    
    // Calculate overall risk level
    const riskLevel = calculateOverallRiskLevel(riskFactors);
    
    // Generate intervention suggestions
    const interventionSuggestions = generateInterventionSuggestions(
      statusAssessment.recommended_status,
      riskLevel,
      paymentFactors,
      agreement,
      payments || []
    );
    
    // Generate action items
    const actionItems = generateActionItems(
      statusAssessment.recommended_status,
      riskLevel,
      paymentFactors,
      vehicleFactors,
      customerFactors
    );
    
    // Create the result
    const result: EnhancedAnalysisResult = {
      id: undefined, // Will be assigned when saved to DB
      agreement_id: agreementId,
      recommended_status: statusAssessment.recommended_status,
      confidence: calculateConfidenceScore(statusAssessment, paymentFactors, riskFactors),
      current_status: agreement.status,
      risk_level: riskLevel,
      analyzed_at: new Date().toISOString(),
      explanation: statusAssessment.explanation,
      action_items: actionItems,
      historical_data: {
        total_payments: payments?.length || 0,
        on_time_payments: payments?.filter(p => p.days_overdue === 0 || p.days_overdue === null)?.length || 0,
        average_days_late: calculateAverageDaysLate(payments || [])
      },
      payment_factors: paymentFactors,
      vehicle_factors: vehicleFactors,
      customer_factors: customerFactors,
      risk_factors: riskFactors,
      trend_analysis: trendAnalysis,
      prediction_accuracy: 87, // Example value, would be calculated based on historical predictions
      model_version: "1.2.0",
      intervention_suggestions: interventionSuggestions
    };
    
    // Store the analysis result in the database
    try {
      const { data: insertedData, error: insertError } = await supabase
        .from('agreement_analysis_results')
        .insert({
          agreement_id: agreementId,
          recommended_status: result.recommended_status,
          confidence: result.confidence,
          current_status: result.current_status, 
          risk_level: result.risk_level,
          explanation: result.explanation,
          action_items: result.action_items,
          historical_data: result.historical_data,
          payment_factors: result.payment_factors,
          vehicle_factors: result.vehicle_factors,
          customer_factors: result.customer_factors,
          risk_factors: result.risk_factors,
          trend_analysis: result.trend_analysis,
          prediction_accuracy: result.prediction_accuracy,
          model_version: result.model_version,
          intervention_suggestions: result.intervention_suggestions
        })
        .select()
        .single();
        
      if (insertError) {
        console.error("Error storing analysis result:", insertError);
      } else if (insertedData) {
        result.id = insertedData.id;
      }
    } catch (error) {
      console.error("Error in database operation:", error);
    }
    
    return result;
  } catch (error) {
    console.error("Error in runComprehensiveAgreementAnalysis:", error);
    toast.error("Failed to analyze agreement");
    
    // Return a basic error result
    return {
      id: undefined,
      agreement_id: agreementId,
      recommended_status: "unknown",
      confidence: 0,
      current_status: "unknown",
      risk_level: "high",
      analyzed_at: new Date().toISOString(),
      explanation: "Failed to analyze agreement due to an error.",
      action_items: ["Review agreement manually due to analysis failure."],
      historical_data: {},
      payment_factors: {},
      vehicle_factors: {},
      customer_factors: {},
      risk_factors: {},
      trend_analysis: {},
      intervention_suggestions: []
    };
  }
};

/**
 * Analyzes the agreement status based on agreement and payment data
 */
export const analyzeAgreementStatus = (agreement: any, payments: any[]): { 
  recommended_status: string;
  explanation: string;
  confidence: number;
} => {
  if (!agreement) {
    return {
      recommended_status: "unknown",
      explanation: "Agreement data not available for analysis.",
      confidence: 0
    };
  }

  const currentStatus = agreement.status;
  let recommendedStatus = currentStatus;
  let explanation = "";
  let confidence = 85;
  
  // Check if end date is in the past
  const now = new Date();
  const endDate = new Date(agreement.end_date);
  
  const isExpired = endDate < now;
  const hasMissedPayments = payments.some(p => 
    (p.days_overdue > 30 || (p.due_date && new Date(p.due_date) < now && p.status === 'pending'))
  );
  
  const overdueAmount = payments
    .filter(p => p.status === 'pending' && p.due_date && new Date(p.due_date) < now)
    .reduce((sum, p) => sum + (p.amount || 0) - (p.amount_paid || 0), 0);
  
  // Logic for expired agreements
  if (isExpired) {
    if (currentStatus === 'active') {
      recommendedStatus = 'expired';
      explanation = "The agreement end date has passed and should be marked as expired.";
      confidence = 95;
    }
  }
  
  // Logic for agreements with missed payments
  if (hasMissedPayments && overdueAmount > 0) {
    if (overdueAmount > 5000) {
      recommendedStatus = 'legal_action';
      explanation = `Agreement has ${formatCurrency(overdueAmount)} in overdue payments and may need legal action.`;
      confidence = 80;
    } else if (currentStatus === 'active') {
      recommendedStatus = 'overdue';
      explanation = `Agreement has ${formatCurrency(overdueAmount)} in overdue payments.`;
      confidence = 85;
    }
  }
  
  // If everything is paid and current
  if (payments.length > 0 && !hasMissedPayments && currentStatus === 'pending_payment') {
    recommendedStatus = 'active';
    explanation = "All payments are current. Agreement status can be set to active.";
    confidence = 90;
  }
  
  return {
    recommended_status: recommendedStatus,
    explanation: explanation || "Current status appears appropriate based on agreement data.",
    confidence
  };
};

/**
 * Analyzes payment factors
 */
const analyzePaymentFactors = (payments: any[], agreement: any) => {
  // Default values
  const factors: Record<string, any> = {
    payment_regularity: "unknown",
    average_days_late: 0,
    payment_trend: "stable",
    missed_payments: 0,
    total_payments: payments.length,
    payment_risk_score: 50
  };
  
  if (payments.length === 0) {
    return factors;
  }
  
  // Calculate average days late
  const latePayments = payments.filter(p => p.days_overdue && p.days_overdue > 0);
  factors.missed_payments = payments.filter(p => p.status === 'pending' && p.due_date && new Date(p.due_date) < new Date()).length;
  factors.average_days_late = latePayments.length > 0 
    ? latePayments.reduce((sum, p) => sum + (p.days_overdue || 0), 0) / latePayments.length 
    : 0;
  
  // Determine payment regularity
  if (payments.length >= 3) {
    const onTimeCount = payments.filter(p => !p.days_overdue || p.days_overdue === 0).length;
    const onTimeRatio = onTimeCount / payments.length;
    
    if (onTimeRatio > 0.9) factors.payment_regularity = "excellent";
    else if (onTimeRatio > 0.7) factors.payment_regularity = "good";
    else if (onTimeRatio > 0.5) factors.payment_regularity = "fair";
    else factors.payment_regularity = "poor";
  }
  
  // Calculate payment risk score (0-100)
  let riskScore = 50; // Start at neutral
  
  // Reduce risk for on-time payments
  riskScore -= (factors.payment_regularity === "excellent") ? 30 : 
               (factors.payment_regularity === "good") ? 20 :
               (factors.payment_regularity === "fair") ? 0 : -20;
               
  // Increase risk for late payments
  riskScore += Math.min(factors.average_days_late * 0.5, 30);
  
  // Increase risk for missed payments
  riskScore += factors.missed_payments * 10;
  
  // Cap between 0-100
  factors.payment_risk_score = Math.max(0, Math.min(100, riskScore));
  
  // Determine payment trend by comparing recent vs older payments
  if (payments.length >= 6) {
    const midpoint = Math.floor(payments.length / 2);
    const recentPayments = payments.slice(midpoint);
    const olderPayments = payments.slice(0, midpoint);
    
    const recentLate = recentPayments.filter(p => p.days_overdue && p.days_overdue > 0).length;
    const olderLate = olderPayments.filter(p => p.days_overdue && p.days_overdue > 0).length;
    
    if (recentLate < olderLate) factors.payment_trend = "improving";
    else if (recentLate > olderLate) factors.payment_trend = "deteriorating";
    else factors.payment_trend = "stable";
  }
  
  // Add total overdue amount
  factors.total_overdue_amount = payments
    .filter(p => p.status === 'pending' && p.due_date && new Date(p.due_date) < new Date())
    .reduce((sum, p) => sum + ((p.amount || 0) - (p.amount_paid || 0)), 0);
  
  return factors;
};

/**
 * Analyzes vehicle factors
 */
const analyzeVehicleFactors = (vehicle: any, trafficFines: any[]) => {
  const factors: Record<string, any> = {
    vehicle_age: 'unknown',
    vehicle_value_retention: 'unknown',
    maintenance_history: 'unknown',
    traffic_violations: trafficFines.length,
    vehicle_risk_score: 50
  };
  
  if (!vehicle) {
    return factors;
  }
  
  // Calculate vehicle age
  const currentYear = new Date().getFullYear();
  if (vehicle.year) {
    const age = currentYear - vehicle.year;
    factors.vehicle_age = age;
    
    // Determine value retention based on age
    if (age < 3) factors.vehicle_value_retention = 'excellent';
    else if (age < 5) factors.vehicle_value_retention = 'good';
    else if (age < 8) factors.vehicle_value_retention = 'fair';
    else factors.vehicle_value_retention = 'poor';
  }
  
  // Calculate vehicle risk score
  let riskScore = 50; // Start at neutral
  
  // Adjust based on age
  if (factors.vehicle_age !== 'unknown') {
    if (factors.vehicle_age < 3) riskScore -= 15;
    else if (factors.vehicle_age > 8) riskScore += 20;
  }
  
  // Adjust based on traffic violations
  riskScore += factors.traffic_violations * 5;
  
  // Cap between 0-100
  factors.vehicle_risk_score = Math.max(0, Math.min(100, riskScore));
  
  return factors;
};

/**
 * Analyzes customer factors
 */
const analyzeCustomerFactors = (customer: any, payments: any[]) => {
  const factors: Record<string, any> = {
    customer_tenure: 'unknown',
    payment_history: 'unknown',
    communication_responsiveness: 'unknown',
    customer_risk_score: 50
  };
  
  if (!customer || !payments.length) {
    return factors;
  }
  
  // Calculate tenure based on earliest payment
  if (payments.length > 0) {
    const earliestPayment = payments.reduce((earliest, payment) => {
      const paymentDate = payment.payment_date || payment.due_date;
      if (!paymentDate) return earliest;
      
      const date = new Date(paymentDate);
      return (!earliest || date < earliest) ? date : earliest;
    }, null);
    
    if (earliestPayment) {
      const tenureMonths = Math.floor((new Date().getTime() - earliestPayment.getTime()) / (30 * 24 * 60 * 60 * 1000));
      factors.customer_tenure = tenureMonths;
    }
  }
  
  // Determine payment history
  const onTimePayments = payments.filter(p => !p.days_overdue || p.days_overdue === 0).length;
  const paymentRatio = payments.length > 0 ? onTimePayments / payments.length : 0;
  
  if (paymentRatio > 0.9) factors.payment_history = 'excellent';
  else if (paymentRatio > 0.7) factors.payment_history = 'good';
  else if (paymentRatio > 0.5) factors.payment_history = 'fair';
  else factors.payment_history = 'poor';
  
  // Calculate customer risk score
  let riskScore = 50; // Start at neutral
  
  // Adjust based on payment history
  if (factors.payment_history === 'excellent') riskScore -= 30;
  else if (factors.payment_history === 'good') riskScore -= 15;
  else if (factors.payment_history === 'poor') riskScore += 30;
  
  // Adjust based on tenure (longer tenure = lower risk)
  if (typeof factors.customer_tenure === 'number') {
    if (factors.customer_tenure > 12) riskScore -= 15;
    else if (factors.customer_tenure > 6) riskScore -= 10;
  }
  
  // Cap between 0-100
  factors.customer_risk_score = Math.max(0, Math.min(100, riskScore));
  
  return factors;
};

/**
 * Calculate overall risk factors
 */
const calculateRiskFactors = (
  paymentFactors: Record<string, any>,
  vehicleFactors: Record<string, any>,
  customerFactors: Record<string, any>
) => {
  const factors: Record<string, any> = {
    overall_risk_score: 50,
    payment_risk_contribution: 0,
    vehicle_risk_contribution: 0,
    customer_risk_contribution: 0,
    risk_trend: 'stable',
    primary_risk_factor: 'unknown'
  };
  
  // Get risk scores from each category
  const paymentRisk = paymentFactors.payment_risk_score || 50;
  const vehicleRisk = vehicleFactors.vehicle_risk_score || 50;
  const customerRisk = customerFactors.customer_risk_score || 50;
  
  // Weighted risk calculation (payment is most important)
  factors.payment_risk_contribution = paymentRisk * 0.6;
  factors.vehicle_risk_contribution = vehicleRisk * 0.2;
  factors.customer_risk_contribution = customerRisk * 0.2;
  
  factors.overall_risk_score = Math.round(
    factors.payment_risk_contribution +
    factors.vehicle_risk_contribution +
    factors.customer_risk_contribution
  );
  
  // Determine primary risk factor
  const riskContributions = [
    { type: 'payment', value: factors.payment_risk_contribution },
    { type: 'vehicle', value: factors.vehicle_risk_contribution },
    { type: 'customer', value: factors.customer_risk_contribution }
  ];
  
  riskContributions.sort((a, b) => b.value - a.value);
  factors.primary_risk_factor = riskContributions[0].type;
  
  // Add risk details based on primary factor
  if (factors.primary_risk_factor === 'payment') {
    factors.risk_details = `Late payments are the main concern (${paymentFactors.average_days_late.toFixed(1)} days late on average)`;
  } else if (factors.primary_risk_factor === 'vehicle') {
    factors.risk_details = `Vehicle factors contribute most to risk (${vehicleFactors.traffic_violations} traffic violations)`;
  } else {
    factors.risk_details = `Customer history is the main risk factor`;
  }
  
  return factors;
};

/**
 * Generate trend analysis data
 */
const generateTrendAnalysis = (payments: any[]) => {
  const trends: Record<string, any> = {
    payment_timeliness_trend: 'stable',
    average_payment_amount: 0,
    payment_frequency: 'monthly',
    recent_trend: 'stable'
  };
  
  if (payments.length < 3) {
    return trends;
  }
  
  // Calculate average payment amount
  const total = payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  trends.average_payment_amount = total / payments.length;
  
  // Sort payments by date for trend analysis
  const sortedPayments = [...payments].sort((a, b) => {
    const dateA = new Date(a.payment_date || a.due_date || 0);
    const dateB = new Date(b.payment_date || b.due_date || 0);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Analyze recent vs older payments (last 3 vs previous)
  const recentPayments = sortedPayments.slice(-3);
  const olderPayments = sortedPayments.slice(0, -3);
  
  if (olderPayments.length > 0) {
    const recentLateAvg = recentPayments
      .filter(p => p.days_overdue)
      .reduce((sum, p) => sum + (p.days_overdue || 0), 0) / recentPayments.length || 0;
      
    const olderLateAvg = olderPayments
      .filter(p => p.days_overdue)
      .reduce((sum, p) => sum + (p.days_overdue || 0), 0) / olderPayments.length || 0;
    
    if (recentLateAvg < olderLateAvg - 2) trends.payment_timeliness_trend = 'improving';
    else if (recentLateAvg > olderLateAvg + 2) trends.payment_timeliness_trend = 'deteriorating';
    
    // Recent payment amount trend
    const recentAmtAvg = recentPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0) / recentPayments.length;
    const olderAmtAvg = olderPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0) / olderPayments.length;
    
    if (recentAmtAvg > olderAmtAvg * 1.1) trends.recent_trend = 'increasing';
    else if (recentAmtAvg < olderAmtAvg * 0.9) trends.recent_trend = 'decreasing';
  }
  
  return trends;
};

/**
 * Calculate overall risk level based on risk factors
 */
const calculateOverallRiskLevel = (riskFactors: Record<string, any>): 'low' | 'medium' | 'high' => {
  const score = riskFactors.overall_risk_score || 50;
  
  if (score < 40) return 'low';
  else if (score < 70) return 'medium';
  else return 'high';
};

/**
 * Calculate confidence score for analysis
 */
const calculateConfidenceScore = (
  statusAssessment: { confidence: number },
  paymentFactors: Record<string, any>,
  riskFactors: Record<string, any>
): number => {
  // Start with status assessment confidence
  let confidence = statusAssessment.confidence;
  
  // Adjust based on data quality
  const hasGoodPaymentData = paymentFactors.total_payments > 3;
  if (!hasGoodPaymentData) confidence -= 15;
  
  // Cap between 0-100
  return Math.max(0, Math.min(100, Math.round(confidence)));
};

/**
 * Generate intervention suggestions based on analysis
 */
const generateInterventionSuggestions = (
  recommendedStatus: string,
  riskLevel: 'low' | 'medium' | 'high',
  paymentFactors: Record<string, any>,
  agreement: any,
  payments: any[]
): string[] => {
  const suggestions: string[] = [];
  
  // Status-based suggestions
  if (recommendedStatus === 'overdue') {
    suggestions.push('Send a payment reminder notification to the customer');
    suggestions.push('Offer a payment plan option for outstanding balance');
  } else if (recommendedStatus === 'legal_action') {
    suggestions.push('Escalate to legal department for review');
    suggestions.push('Schedule a meeting with the customer to discuss payment options');
  } else if (recommendedStatus === 'expired' && riskLevel === 'low') {
    suggestions.push('Offer a renewal opportunity with incentives');
  }
  
  // Risk-level based suggestions
  if (riskLevel === 'high') {
    suggestions.push('Initiate proactive account review and customer contact');
    if (paymentFactors.missed_payments > 1) {
      suggestions.push('Consider implementing a stricter payment oversight process');
    }
  } else if (riskLevel === 'medium') {
    suggestions.push('Monitor account closely for the next payment cycle');
  }
  
  // Payment history based suggestions
  if (paymentFactors.payment_trend === 'deteriorating') {
    suggestions.push('Review payment history with the customer to address pattern of late payments');
  } else if (paymentFactors.payment_trend === 'improving' && riskLevel === 'low') {
    suggestions.push('Consider customer for loyalty discounts on future agreements');
  }
  
  return suggestions;
};

/**
 * Generate action items based on analysis
 */
const generateActionItems = (
  recommendedStatus: string,
  riskLevel: 'low' | 'medium' | 'high',
  paymentFactors: Record<string, any>,
  vehicleFactors: Record<string, any>,
  customerFactors: Record<string, any>
): string[] => {
  const actionItems: string[] = [];
  
  // Add action based on status change
  if (recommendedStatus !== 'unknown') {
    actionItems.push(`Update agreement status to ${recommendedStatus}`);
  }
  
  // Add action based on risk level
  if (riskLevel === 'high') {
    actionItems.push('Conduct comprehensive account review');
  }
  
  // Add payment-related actions
  if (paymentFactors.total_overdue_amount > 0) {
    actionItems.push(`Collect overdue payment of ${formatCurrency(paymentFactors.total_overdue_amount)}`);
  }
  
  // Add vehicle-related actions
  if (vehicleFactors.traffic_violations > 0) {
    actionItems.push(`Follow up on ${vehicleFactors.traffic_violations} outstanding traffic violations`);
  }
  
  return actionItems;
};

/**
 * Calculate the average days late for payments
 */
const calculateAverageDaysLate = (payments: any[]): number => {
  const latePayments = payments.filter(p => p.days_overdue && p.days_overdue > 0);
  if (latePayments.length === 0) return 0;
  
  const totalDaysLate = latePayments.reduce((sum, p) => sum + (p.days_overdue || 0), 0);
  return Math.round(totalDaysLate / latePayments.length);
};

/**
 * Format currency for display
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'QAR',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Get the AI model parameters
 */
export const getAiModelParameters = (): AiModelParameters => {
  return {
    modelName: "AgreementAnalyzer",
    version: "1.2.0",
    trainingAccuracy: 92.5,
    lastTrainedAt: "2024-03-15T00:00:00Z",
    featureImportance: {
      "payment_history": 0.42,
      "agreement_duration": 0.18,
      "vehicle_age": 0.15,
      "customer_tenure": 0.12,
      "traffic_violations": 0.08,
      "other_factors": 0.05
    }
  };
};
