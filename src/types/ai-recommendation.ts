
export interface AIRecommendation {
  id: string;
  customer_id: string;
  recommendation_type: string;
  content: AIRecommendationContent;
  created_at: string;
  preferred_attributes?: Record<string, any>;
  status: string;
}

export interface AIRecommendationContent {
  choices: Array<{
    message: {
      content: string;
    }
  }>;
}

export interface StatusRecommendation {
  recommendedStatus: string;
  confidence: number;
  reasoning: string;
  actionItems: string[];
}

export interface PaymentPrediction {
  paymentRiskLevel: 'low' | 'medium' | 'high';
  onTimePaymentProbability: number;
  nextPaymentAmount?: number;
  nextPaymentDate?: string;
  reasoning: string;
  recommendedActions: string[];
}

export interface RiskAssessment {
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  overallRiskScore: number;
  financialExposure?: number;
  keyRiskFactors: string[];
  mitigationRecommendations: string[];
}

export interface AgreementHealth {
  healthScore: number;
  compliance: boolean;
  issues?: string[];
  recommendations?: string[];
}

export interface AIRecommendationRequest {
  customerId: string;
  analysisType: string;
  content?: Record<string, any>;
}

