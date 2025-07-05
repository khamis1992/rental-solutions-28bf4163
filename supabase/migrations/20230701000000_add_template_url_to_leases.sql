
-- Add template_url column to leases table
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS template_url TEXT;

-- Create storage bucket for agreement templates if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('agreements', 'Rental Agreement Templates', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policy to allow authenticated reads
CREATE POLICY "Agreement Templates are accessible to authenticated users"
ON storage.objects FOR SELECT
USING (bucket_id = 'agreements' AND auth.role() = 'authenticated');

-- Set up storage policy to allow authenticated uploads
CREATE POLICY "Agreement Templates can be uploaded by authenticated users"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agreements' AND auth.role() = 'authenticated');
