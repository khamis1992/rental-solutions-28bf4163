
-- Add "IF NOT EXISTS" to avoid errors if the table already exists
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  key_value TEXT UNIQUE NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  rate_limit INTEGER DEFAULT 100,
  ip_restrictions TEXT[]
);

-- Update RLS policies to restrict access
-- Only create if they don't exist
DO $$
BEGIN
    -- Add RLS policies if they don't already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'api_keys' AND policyname = 'Users can view own API keys'
    ) THEN
        ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
        
        -- Only allow authenticated users to select their own API keys or if they're an admin
        CREATE POLICY "Users can view own API keys" ON public.api_keys
          FOR SELECT USING (auth.uid() = created_by OR auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
          ));
        
        -- Only allow authenticated users to insert their own API keys
        CREATE POLICY "Users can insert own API keys" ON public.api_keys
          FOR INSERT WITH CHECK (auth.uid() = created_by);
        
        -- Only allow authenticated users to update their own API keys or if they're an admin
        CREATE POLICY "Users can update own API keys" ON public.api_keys
          FOR UPDATE USING (auth.uid() = created_by OR auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
          ));
        
        -- Only allow authenticated users to delete their own API keys or if they're an admin
        CREATE POLICY "Users can delete own API keys" ON public.api_keys
          FOR DELETE USING (auth.uid() = created_by OR auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
          ));
    END IF;
END$$;

-- Create API request logs table if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.api_request_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID REFERENCES public.api_keys(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  request_body JSONB,
  response_body JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add indexes for faster queries if they don't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'api_request_logs' AND indexname = 'idx_api_request_logs_api_key_id'
    ) THEN
        CREATE INDEX idx_api_request_logs_api_key_id ON public.api_request_logs(api_key_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'api_request_logs' AND indexname = 'idx_api_request_logs_created_at'
    ) THEN
        CREATE INDEX idx_api_request_logs_created_at ON public.api_request_logs(created_at);
    END IF;
END$$;
