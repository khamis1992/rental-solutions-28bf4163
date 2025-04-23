
-- Create a stored procedure to safely upsert agreement analysis results
CREATE OR REPLACE FUNCTION upsert_agreement_analysis(
  p_agreement_id UUID,
  p_recommended_status TEXT,
  p_confidence NUMERIC,
  p_current_status TEXT,
  p_risk_level TEXT,
  p_analyzed_at TIMESTAMP WITH TIME ZONE,
  p_explanation TEXT,
  p_action_items TEXT[]
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
    action_items
  ) VALUES (
    p_agreement_id,
    p_recommended_status,
    p_confidence,
    p_current_status,
    p_risk_level,
    p_analyzed_at,
    p_explanation,
    p_action_items
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
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_agreement_analysis TO authenticated;
