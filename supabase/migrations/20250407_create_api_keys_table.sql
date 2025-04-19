
-- Create API keys table
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

-- Add RLS policies to restrict access
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to select their own API keys
CREATE POLICY "Users can view own API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() = created_by OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- Only allow authenticated users to insert their own API keys
CREATE POLICY "Users can insert own API keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Only allow authenticated users to update their own API keys
CREATE POLICY "Users can update own API keys" ON public.api_keys
  FOR UPDATE USING (auth.uid() = created_by OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- Only allow authenticated users to delete their own API keys
CREATE POLICY "Users can delete own API keys" ON public.api_keys
  FOR DELETE USING (auth.uid() = created_by OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- Create API usage logging table
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

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_api_request_logs_api_key_id ON public.api_request_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_created_at ON public.api_request_logs(created_at);

-- Create API key management functions
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT AS $$
DECLARE
  key_value TEXT;
BEGIN
  key_value := encode(gen_random_bytes(32), 'hex');
  RETURN key_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new API key
CREATE OR REPLACE FUNCTION public.create_api_key(
  p_name TEXT,
  p_description TEXT,
  p_permissions TEXT[],
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) 
RETURNS JSONB AS $$
DECLARE
  v_key_value TEXT;
  v_result JSONB;
BEGIN
  -- Generate a secure API key
  v_key_value := public.generate_api_key();
  
  -- Insert the new API key
  INSERT INTO public.api_keys (
    name,
    description,
    key_value,
    permissions,
    created_by,
    expires_at
  ) VALUES (
    p_name,
    p_description,
    v_key_value,
    p_permissions,
    auth.uid(),
    p_expires_at
  )
  RETURNING jsonb_build_object(
    'id', id,
    'name', name,
    'key_value', key_value,
    'permissions', permissions,
    'created_at', created_at,
    'expires_at', expires_at
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke an API key
CREATE OR REPLACE FUNCTION public.revoke_api_key(p_key_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.api_keys
  SET is_active = false
  WHERE id = p_key_id
  AND (created_by = auth.uid() OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger function to automatically log API key usage
CREATE OR REPLACE FUNCTION public.log_api_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_used_at timestamp for the API key
  UPDATE public.api_keys
  SET last_used_at = NOW()
  WHERE id = NEW.api_key_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the API key's last used timestamp
CREATE TRIGGER api_request_log_trigger
AFTER INSERT ON public.api_request_logs
FOR EACH ROW
EXECUTE FUNCTION public.log_api_request();
