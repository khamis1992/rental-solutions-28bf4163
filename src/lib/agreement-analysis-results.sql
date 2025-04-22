
-- Create agreement_analysis_results table
CREATE TABLE IF NOT EXISTS agreement_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  recommended_status TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  current_status TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  explanation TEXT,
  action_items TEXT[] DEFAULT '{}',
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on agreement_id for faster lookups
CREATE INDEX IF NOT EXISTS agreement_analysis_results_agreement_id_idx ON agreement_analysis_results(agreement_id);

-- Enable Row Level Security
ALTER TABLE agreement_analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users full access" ON agreement_analysis_results
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
