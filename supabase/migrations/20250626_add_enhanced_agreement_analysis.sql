
-- Create table with enhanced fields for AI analysis
ALTER TABLE IF EXISTS agreement_analysis_results 
  ADD COLUMN IF NOT EXISTS historical_data jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS payment_factors jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vehicle_factors jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS customer_factors jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS risk_factors jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trend_analysis jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS prediction_accuracy numeric,
  ADD COLUMN IF NOT EXISTS model_version text,
  ADD COLUMN IF NOT EXISTS intervention_suggestions text[] DEFAULT '{}';

-- Enhance the RPC function for upserting analysis results
CREATE OR REPLACE FUNCTION upsert_agreement_analysis(
  p_agreement_id UUID,
  p_recommended_status TEXT,
  p_confidence NUMERIC,
  p_current_status TEXT,
  p_risk_level TEXT,
  p_analyzed_at TIMESTAMP WITH TIME ZONE,
  p_explanation TEXT,
  p_action_items TEXT[],
  p_historical_data jsonb DEFAULT '{}',
  p_payment_factors jsonb DEFAULT '{}',
  p_vehicle_factors jsonb DEFAULT '{}',
  p_customer_factors jsonb DEFAULT '{}',
  p_risk_factors jsonb DEFAULT '{}',
  p_trend_analysis jsonb DEFAULT '{}',
  p_prediction_accuracy numeric DEFAULT NULL,
  p_model_version text DEFAULT NULL,
  p_intervention_suggestions text[] DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO agreement_analysis_results(
    agreement_id,
    recommended_status,
    confidence,
    current_status,
    risk_level,
    analyzed_at,
    explanation,
    action_items,
    historical_data,
    payment_factors,
    vehicle_factors,
    customer_factors,
    risk_factors,
    trend_analysis,
    prediction_accuracy,
    model_version,
    intervention_suggestions
  ) VALUES (
    p_agreement_id,
    p_recommended_status,
    p_confidence,
    p_current_status,
    p_risk_level,
    p_analyzed_at,
    p_explanation,
    p_action_items,
    p_historical_data,
    p_payment_factors,
    p_vehicle_factors,
    p_customer_factors,
    p_risk_factors,
    p_trend_analysis,
    p_prediction_accuracy,
    p_model_version,
    p_intervention_suggestions
  )
  ON CONFLICT (agreement_id) 
  DO UPDATE SET
    recommended_status = p_recommended_status,
    confidence = p_confidence,
    current_status = p_current_status,
    risk_level = p_risk_level,
    analyzed_at = p_analyzed_at,
    explanation = p_explanation,
    action_items = p_action_items,
    historical_data = p_historical_data,
    payment_factors = p_payment_factors,
    vehicle_factors = p_vehicle_factors,
    customer_factors = p_customer_factors,
    risk_factors = p_risk_factors,
    trend_analysis = p_trend_analysis,
    prediction_accuracy = p_prediction_accuracy,
    model_version = p_model_version,
    intervention_suggestions = p_intervention_suggestions,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_agreement_analysis TO authenticated;
