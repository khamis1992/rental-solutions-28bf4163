-- Final Security Fixes
BEGIN;

-- Enable RLS on tables that might be missing it
ALTER TABLE IF EXISTS public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.word_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoice_templates ENABLE ROW LEVEL SECURITY;

-- Create secure policies for missing tables
CREATE POLICY "push_subscriptions_own" ON public.push_subscriptions
FOR ALL USING (user_id = (SELECT auth.uid()));

CREATE POLICY "api_keys_own" ON public.api_keys  
FOR ALL USING (user_id = (SELECT auth.uid()));

CREATE POLICY "templates_business_users" ON public.word_templates
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

CREATE POLICY "email_templates_business" ON public.email_templates
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

CREATE POLICY "invoice_templates_business" ON public.invoice_templates
FOR ALL USING (
  (SELECT auth.uid()) IS NOT NULL AND 
  ((SELECT auth.jwt()) ->> 'role') IN ('admin', 'manager', 'employee')
);

-- Remove public access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM public;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM public;

COMMIT; 