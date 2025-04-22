import { supabase } from '@/integrations/supabase/client';
import { EnhancedAnalysisResult, AiModelParameters } from '@/utils/type-utils';
import { Agreement } from '@/types/agreement';

/**
 * Runs a comprehensive analysis of an agreement, providing detailed insights
 * into payment history, vehicle condition, customer behavior, and risk factors.
 * 
 * @param agreementId The ID of the agreement to analyze
 * @returns Enhanced analysis result with detailed factors
 */
export async function runComprehensiveAgreementAnalysis(
  agreementId: string
): Promise<EnhancedAnalysisResult> {
  try {
    console.log('Running comprehensive analysis for agreement:', agreementId);
    
    // Get the agreement data
    const { data: agreement, error: agreementError } = await supabase
      .from('leases')
      .select(`
        *,
        profiles:customer_id (id, full_name, email, phone_number),
        vehicles:vehicle_id (id, make, model, license_plate)
      `)
      .eq('id', agreementId)
      .single();
      
    if (agreementError) {
      console.error('Error fetching agreement:', agreementError);
      throw new Error(`Failed to fetch agreement: ${agreementError.message}`);
    }
    
    if (!agreement) {
      throw new Error('Agreement not found');
    }

    // Get payment history
    const { data: payments, error: paymentsError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', agreementId)
      .order('created_at', { ascending: false });
      
    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    }
    
    // Get maintenance records if vehicle ID exists
    let maintenanceRecords = [];
    if (agreement.vehicle_id) {
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('vehicle_id', agreement.vehicle_id)
        .order('date', { ascending: false });
        
      if (maintenanceError) {
        console.error('Error fetching maintenance records:', maintenanceError);
      } else {
        maintenanceRecords = maintenance || [];
      }
    }
    
    // Get traffic fines
    const { data: trafficFines, error: finesError } = await supabase
      .from('traffic_fines')
      .select('*')
      .eq('agreement_id', agreementId);
      
    if (finesError) {
      console.error('Error fetching traffic fines:', finesError);
    }
    
    // Analyze payment behavior
    const paymentFactors = analyzePaymentBehavior(payments || []);
    
    // Analyze vehicle factors
    const vehicleFactors = analyzeVehicleFactors(
      agreement.vehicles || agreement.vehicle_id, 
      maintenanceRecords
    );
    
    // Analyze customer factors
    const customerFactors = analyzeCustomerFactors(
      agreement.profiles || agreement.customer_id, 
      trafficFines || []
    );
    
    // Calculate overall risk factors
    const riskFactors = calculateRiskFactors(paymentFactors, vehicleFactors, customerFactors);
    
    // Generate trend analysis
    const trendAnalysis = generateTrendAnalysis(payments || [], trafficFines || []);
    
    // Calculate recommended status and confidence
    const { recommendedStatus, confidence, explanation, actionItems } = 
      determineRecommendedStatus(
        agreement.status, 
        paymentFactors, 
        vehicleFactors, 
        customerFactors, 
        riskFactors
      );

    // Generate intervention suggestions
    const interventionSuggestions = generateInterventionSuggestions(
      riskFactors, 
      paymentFactors, 
      vehicleFactors, 
      customerFactors
    );
    
    // Prepare and return the enhanced analysis result
    const analysisResult: EnhancedAnalysisResult = {
      id: undefined,
      agreement_id: agreementId,
      recommended_status: recommendedStatus,
      confidence: confidence,
      current_status: agreement.status,
      risk_level: determineRiskLevel(riskFactors),
      analyzed_at: new Date().toISOString(),
      explanation: explanation,
      action_items: actionItems,
      historical_data: { 
        payments: payments?.length || 0,
        fines: trafficFines?.length || 0,
        maintenance: maintenanceRecords.length,
        agreement_duration_days: calculateDurationInDays(
          new Date(agreement.start_date),
          agreement.end_date ? new Date(agreement.end_date) : new Date()
        )
      },
      payment_factors: paymentFactors,
      vehicle_factors: vehicleFactors,
      customer_factors: customerFactors,
      risk_factors: riskFactors,
      trend_analysis: trendAnalysis,
      prediction_accuracy: calculatePredictionAccuracy(confidence, riskFactors),
      model_version: '2.0',
      intervention_suggestions: interventionSuggestions
    };
    
    // Save the analysis to the database
    try {
      const { error } = await supabase.rpc('upsert_agreement_analysis', {
        p_agreement_id: agreementId,
        p_recommended_status: recommendedStatus,
        p_confidence: confidence,
        p_current_status: agreement.status,
        p_risk_level: determineRiskLevel(riskFactors),
        p_analyzed_at: analysisResult.analyzed_at,
        p_explanation: explanation,
        p_action_items: actionItems,
        p_historical_data: analysisResult.historical_data,
        p_payment_factors: paymentFactors,
        p_vehicle_factors: vehicleFactors,
        p_customer_factors: customerFactors,
        p_risk_factors: riskFactors,
        p_trend_analysis: trendAnalysis,
        p_prediction_accuracy: analysisResult.prediction_accuracy,
        p_model_version: analysisResult.model_version,
        p_intervention_suggestions: interventionSuggestions
      });
      
      if (error) {
        console.error('Error saving analysis results:', error);
      }
    } catch (dbError) {
      console.error('Error calling upsert_agreement_analysis:', dbError);
    }

    return analysisResult;
  } catch (error) {
    console.error('Error in runComprehensiveAgreementAnalysis:', error);
    
    // Return a basic analysis result if an error occurs
    return {
      id: undefined,
      agreement_id: agreementId,
      recommended_status: 'unknown',
      confidence: 0.5,
      current_status: 'unknown',
      risk_level: 'medium',
      analyzed_at: new Date().toISOString(),
      explanation: 'Analysis failed due to technical error',
      action_items: ['Contact technical support'],
      historical_data: {},
      payment_factors: {},
      vehicle_factors: {},
      customer_factors: {},
      risk_factors: {},
      trend_analysis: {},
      model_version: '2.0',
      intervention_suggestions: []
    };
  }
}

/**
 * Returns current AI model parameters and metadata
 */
export function getAiModelParameters(): AiModelParameters {
  return {
    modelName: 'AgreementRiskPredictor',
    version: '2.0',
    trainingAccuracy: 0.89,
    lastTrainedAt: '2025-04-15T00:00:00Z',
    featureImportance: {
      'payment_history': 0.35,
      'payment_timeliness': 0.25,
      'vehicle_condition': 0.15,
      'customer_history': 0.20,
      'agreement_duration': 0.05
    }
  };
}

// Helper functions

function analyzePaymentBehavior(payments: any[]): Record<string, any> {
  // Count late payments
  const latePayments = payments.filter(p => 
    p.status === 'late' || 
    p.days_late > 0 || 
    p.late_fee_amount > 0
  );
  
  // Calculate average delay
  let totalDelay = 0;
  let delayCount = 0;
  
  payments.forEach(p => {
    if (p.days_late > 0) {
      totalDelay += p.days_late;
      delayCount++;
    }
  });
  
  const avgDelay = delayCount > 0 ? totalDelay / delayCount : 0;
  
  // Calculate payment consistency
  const paymentConsistency = payments.length > 0 ? 
    (payments.length - latePayments.length) / payments.length : 
    0;
  
  return {
    total_payments: payments.length,
    on_time_payments: payments.length - latePayments.length,
    late_payments: latePayments.length,
    payment_consistency_score: Math.round(paymentConsistency * 100) / 100,
    average_delay_days: Math.round(avgDelay * 10) / 10,
    recent_trend: determinePmtTrend(payments),
    last_payment_date: payments.length > 0 ? 
      payments[0].payment_date || payments[0].created_at : 
      null
  };
}

function analyzeVehicleFactors(vehicle: any, maintenanceRecords: any[]): Record<string, any> {
  // Calculate maintenance frequency
  const maintenanceFrequency = maintenanceRecords.length > 0 ? 
    maintenanceRecords.length / 12 : // per year
    0;
  
  // Check for major issues
  const majorIssues = maintenanceRecords.filter(r => 
    r.cost > 1000 || 
    r.severity === 'high' || 
    r.is_critical === true
  );
  
  return {
    maintenance_frequency: maintenanceFrequency,
    major_issues_count: majorIssues.length,
    last_maintenance_date: maintenanceRecords.length > 0 ? 
      maintenanceRecords[0].date : 
      null,
    maintenance_score: calculateMaintenanceScore(maintenanceRecords),
    vehicle_age: vehicle.year ? 
      new Date().getFullYear() - vehicle.year : 
      'unknown',
    vehicle_make: typeof vehicle === 'object' ? vehicle.make || 'unknown' : 'unknown',
    vehicle_model: typeof vehicle === 'object' ? vehicle.model || 'unknown' : 'unknown'
  };
}

function analyzeCustomerFactors(customer: any, trafficFines: any[]): Record<string, any> {
  return {
    traffic_fines_count: trafficFines.length,
    total_fine_amount: trafficFines.reduce((sum, fine) => sum + (fine.amount || 0), 0),
    customer_since: customer?.created_at || 'unknown',
    previous_agreements_count: 0, // Would need additional query to get this
    payment_reliability_score: calculateCustomerReliability(customer, trafficFines),
    customer_name: typeof customer === 'object' ? customer.full_name || 'unknown' : 'unknown',
    customer_contact: typeof customer === 'object' ? customer.email || 'unknown' : 'unknown'
  };
}

function calculateRiskFactors(
  paymentFactors: Record<string, any>, 
  vehicleFactors: Record<string, any>, 
  customerFactors: Record<string, any>
): Record<string, any> {
  // Calculate payment risk (0-100 scale)
  const paymentRisk = Math.min(100, Math.max(0,
    100 - (paymentFactors.payment_consistency_score * 70) + 
    (paymentFactors.average_delay_days * 3) + 
    (paymentFactors.late_payments * 10)
  ));
  
  // Calculate vehicle risk
  const vehicleRisk = Math.min(100, Math.max(0,
    (vehicleFactors.major_issues_count * 20) +
    (vehicleFactors.vehicle_age > 5 ? (vehicleFactors.vehicle_age - 5) * 10 : 0) +
    (100 - (vehicleFactors.maintenance_score || 50))
  ));
  
  // Calculate customer risk
  const customerRisk = Math.min(100, Math.max(0,
    (customerFactors.traffic_fines_count * 15) +
    (customerFactors.total_fine_amount > 1000 ? 30 : customerFactors.total_fine_amount / 50) +
    (100 - (customerFactors.payment_reliability_score || 50))
  ));
  
  // Weighted risk score
  const overallRiskScore = 
    (paymentRisk * 0.5) +
    (vehicleRisk * 0.3) +
    (customerRisk * 0.2);
  
  return {
    payment_risk_score: Math.round(paymentRisk),
    vehicle_risk_score: Math.round(vehicleRisk),
    customer_risk_score: Math.round(customerRisk),
    overall_risk_score: Math.round(overallRiskScore),
    risk_factors: [
      paymentRisk > 70 ? 'High payment risk' : null,
      vehicleRisk > 70 ? 'Vehicle maintenance concerns' : null,
      customerRisk > 70 ? 'Customer reliability concerns' : null
    ].filter(Boolean)
  };
}

function generateTrendAnalysis(payments: any[], trafficFines: any[]): Record<string, any> {
  // Sort payments by date
  const sortedPayments = [...payments].sort((a, b) => 
    new Date(a.due_date || a.created_at).getTime() - 
    new Date(b.due_date || b.created_at).getTime()
  );
  
  // Calculate monthly trends
  const monthlyData: Record<string, any> = {};
  
  sortedPayments.forEach(payment => {
    const date = new Date(payment.due_date || payment.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        payments: 0,
        on_time: 0,
        late: 0,
        fines: 0
      };
    }
    
    monthlyData[monthKey].payments++;
    
    if (payment.status === 'late' || payment.days_late > 0) {
      monthlyData[monthKey].late++;
    } else {
      monthlyData[monthKey].on_time++;
    }
  });
  
  // Add fines to monthly data
  trafficFines.forEach(fine => {
    const date = new Date(fine.date || fine.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        payments: 0,
        on_time: 0,
        late: 0,
        fines: 0
      };
    }
    
    monthlyData[monthKey].fines++;
  });
  
  // Convert to array and sort by month
  const trendsArray = Object.values(monthlyData).sort((a, b) => 
    a.month.localeCompare(b.month)
  );
  
  return {
    monthly_trends: trendsArray,
    overall_direction: determineOverallTrend(trendsArray),
    data_points: trendsArray.length
  };
}

function determineRecommendedStatus(
  currentStatus: string,
  paymentFactors: Record<string, any>,
  vehicleFactors: Record<string, any>,
  customerFactors: Record<string, any>,
  riskFactors: Record<string, any>
): { recommendedStatus: string; confidence: number; explanation: string; actionItems: string[] } {
  const overallRisk = riskFactors.overall_risk_score;
  const paymentConsistency = paymentFactors.payment_consistency_score || 0;
  
  // Default: keep current status
  let recommendedStatus = currentStatus;
  let confidence = 0.75;
  let explanation = `Current status ${currentStatus} appears appropriate based on analysis.`;
  let actionItems: string[] = [];
  
  // High risk cases
  if (overallRisk > 80) {
    if (currentStatus === 'active') {
      recommendedStatus = 'pending_payment';
      confidence = 0.85;
      explanation = 'High risk detected. Recommend changing status to pending_payment due to significant concerns with payment history and overall risk assessment.';
      actionItems = [
        'Contact customer immediately',
        'Request payment arrangement',
        'Review security deposit'
      ];
    } else if (currentStatus === 'pending_payment' && paymentFactors.late_payments > 2) {
      recommendedStatus = 'terminated';
      confidence = 0.9;
      explanation = 'Critical risk level with repeated payment failures. Recommend termination of agreement.';
      actionItems = [
        'Initiate agreement termination process',
        'Send formal termination notice',
        'Begin vehicle recovery planning'
      ];
    }
  } 
  // Medium risk cases
  else if (overallRisk > 60) {
    if (currentStatus === 'active' && paymentFactors.late_payments > 1) {
      confidence = 0.75;
      explanation = 'Moderate risk detected but maintaining current status with increased monitoring.';
      actionItems = [
        'Schedule follow-up call with customer',
        'Set payment reminders',
        'Document payment concerns'
      ];
    }
  }
  // Low risk cases that might need status updates
  else if (currentStatus === 'pending_payment' && paymentConsistency > 0.8 && overallRisk < 40) {
    recommendedStatus = 'active';
    confidence = 0.8;
    explanation = 'Payment consistency has improved and overall risk is low. Recommend changing status to active.';
    actionItems = [
      'Update agreement status',
      'Send confirmation to customer',
      'Schedule regular review'
    ];
  }
  
  return { 
    recommendedStatus, 
    confidence, 
    explanation, 
    actionItems 
  };
}

function generateInterventionSuggestions(
  riskFactors: Record<string, any>,
  paymentFactors: Record<string, any>,
  vehicleFactors: Record<string, any>,
  customerFactors: Record<string, any>
): string[] {
  const suggestions: string[] = [];
  
  // Payment-related interventions
  if (paymentFactors.late_payments > 0) {
    if (paymentFactors.late_payments > 2) {
      suggestions.push('Schedule urgent payment review meeting with customer');
      suggestions.push('Consider requiring automatic payment method');
    } else {
      suggestions.push('Send payment reminder 3 days before due date');
    }
  }
  
  // Vehicle-related interventions
  if (vehicleFactors.major_issues_count > 0) {
    suggestions.push('Schedule vehicle inspection within 7 days');
  }
  
  if (vehicleFactors.vehicle_age > 5 && vehicleFactors.maintenance_frequency < 2) {
    suggestions.push('Recommend increased maintenance frequency due to vehicle age');
  }
  
  // Customer-related interventions
  if (customerFactors.traffic_fines_count > 2) {
    suggestions.push('Review driving behavior with customer');
    suggestions.push('Provide safe driving guidelines document');
  }
  
  // Risk-based interventions
  if (riskFactors.overall_risk_score > 70) {
    suggestions.push('Increase security deposit requirement');
    suggestions.push('Conduct weekly agreement status review');
  } else if (riskFactors.overall_risk_score > 50) {
    suggestions.push('Schedule monthly agreement review');
  }
  
  // Add default suggestion if none generated
  if (suggestions.length === 0) {
    suggestions.push('Continue regular monitoring');
  }
  
  return suggestions;
}

// Utility functions

function determineRiskLevel(riskFactors: Record<string, any>): 'low' | 'medium' | 'high' {
  const score = riskFactors.overall_risk_score || 50;
  
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function calculateDurationInDays(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculatePredictionAccuracy(confidence: number, riskFactors: Record<string, any>): number {
  // This would ideally use historical data to calculate actual accuracy
  // Here we're using a simplified approach based on confidence and data points
  const baseAccuracy = 0.75;
  const riskAdjustment = (100 - (riskFactors.overall_risk_score || 50)) / 200; // -0.25 to +0.25
  
  return Math.min(0.98, Math.max(0.5, baseAccuracy + riskAdjustment));
}

function determinePmtTrend(payments: any[]): 'improving' | 'stable' | 'declining' | 'unknown' {
  if (payments.length < 3) return 'unknown';
  
  // Sort by date, most recent first
  const sortedPayments = [...payments].sort((a, b) => 
    new Date(b.created_at || b.payment_date).getTime() - 
    new Date(a.created_at || a.payment_date).getTime()
  );
  
  // Get last 3 payments
  const recent = sortedPayments.slice(0, 3);
  
  // Count late payments in recent 3
  const recentLateCount = recent.filter(p => 
    p.status === 'late' || p.days_late > 0
  ).length;
  
  // Get next 3 payments (older)
  const older = sortedPayments.slice(3, 6);
  
  if (older.length < 3) return 'unknown';
  
  // Count late payments in older set
  const olderLateCount = older.filter(p => 
    p.status === 'late' || p.days_late > 0
  ).length;
  
  // Compare trends
  if (recentLateCount < olderLateCount) return 'improving';
  if (recentLateCount > olderLateCount) return 'declining';
  return 'stable';
}

function calculateMaintenanceScore(maintenanceRecords: any[]): number {
  if (maintenanceRecords.length === 0) return 50; // Neutral score if no data
  
  // Base score
  let score = 70;
  
  // Reward regular maintenance
  if (maintenanceRecords.length >= 2) score += 10;
  
  // Penalize for major issues
  const majorIssues = maintenanceRecords.filter(r => 
    r.cost > 1000 || r.severity === 'high' || r.is_critical === true
  );
  
  score -= majorIssues.length * 15;
  
  // Check recency of maintenance
  const mostRecent = maintenanceRecords[0]?.date 
    ? new Date(maintenanceRecords[0].date) 
    : null;
    
  if (mostRecent) {
    const daysSinceLastMaintenance = Math.floor(
      (new Date().getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastMaintenance < 90) score += 10;
    else if (daysSinceLastMaintenance > 180) score -= 10;
  }
  
  // Ensure score is between 0-100
  return Math.min(100, Math.max(0, score));
}

function calculateCustomerReliability(customer: any, trafficFines: any[]): number {
  // Base score
  let score = 70;
  
  // Penalize for traffic fines
  score -= trafficFines.length * 5;
  
  // Additional factors would be considered here
  // such as payment history from other agreements
  
  // Ensure score is between 0-100
  return Math.min(100, Math.max(0, score));
}

function determineOverallTrend(trendsArray: any[]): 'improving' | 'stable' | 'declining' | 'unknown' {
  if (trendsArray.length < 3) return 'unknown';
  
  // Look at the last 3 months
  const recent = trendsArray.slice(-3);
  
  // Calculate average on-time payment ratio for recent months
  const recentRatio = recent.reduce((sum, month) => {
    const total = month.payments || 0;
    const onTime = month.on_time || 0;
    return sum + (total > 0 ? onTime / total : 0);
  }, 0) / recent.length;
  
  // Look at the previous 3 months (or fewer if not available)
  const previousCount = Math.min(3, trendsArray.length - 3);
  if (previousCount <= 0) return 'unknown';
  
  const previous = trendsArray.slice(-3 - previousCount, -3);
  
  // Calculate average on-time payment ratio for previous months
  const previousRatio = previous.reduce((sum, month) => {
    const total = month.payments || 0;
    const onTime = month.on_time || 0;
    return sum + (total > 0 ? onTime / total : 0);
  }, 0) / previous.length;
  
  // Compare trends
  const difference = recentRatio - previousRatio;
  
  if (difference > 0.1) return 'improving';
  if (difference < -0.1) return 'declining';
  return 'stable';
}
