
-- Fix RLS policies for API keys table

-- First ensure the table has RLS enabled
ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they're not working correctly
DROP POLICY IF EXISTS "Users can view own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON public.api_keys;

-- Create proper RLS policies
-- Allow users to view their own API keys
CREATE POLICY "Users can view own API keys" 
  ON public.api_keys
  FOR SELECT 
  USING (auth.uid() = created_by);

-- Allow users to insert API keys with their user ID
CREATE POLICY "Users can insert own API keys" 
  ON public.api_keys
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own API keys
CREATE POLICY "Users can update own API keys" 
  ON public.api_keys
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- Allow users to delete their own API keys
CREATE POLICY "Users can delete own API keys" 
  ON public.api_keys
  FOR DELETE 
  USING (auth.uid() = created_by);
