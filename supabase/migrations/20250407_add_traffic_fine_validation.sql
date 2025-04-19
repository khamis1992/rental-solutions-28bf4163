
-- Add validation-related columns to traffic_fines table
ALTER TABLE IF EXISTS traffic_fines
ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS validation_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS validation_result jsonb,
ADD COLUMN IF NOT EXISTS last_check_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS validation_attempts integer DEFAULT 0;

-- Create table for validation history
CREATE TABLE IF NOT EXISTS traffic_fine_validations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fine_id uuid REFERENCES traffic_fines(id),
    validation_date timestamp with time zone DEFAULT now(),
    status text NOT NULL,
    result jsonb,
    error_message text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);
