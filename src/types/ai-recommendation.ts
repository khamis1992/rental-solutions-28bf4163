
export interface AIRecommendation {
  id: string;
  customer_id: string;
  recommendation_type: string;
  content: {
    choices: Array<{
      message: {
        content: string;
      }
    }>;
  };
  created_at: string;
  preferred_attributes?: Record<string, any>;
  status: string;
}

export interface AIRecommendationRequest {
  customerId: string;
  analysisType: string;
  content?: Record<string, any>;
}
