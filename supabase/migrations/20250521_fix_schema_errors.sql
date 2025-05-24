ALTER TABLE public.leases 
ADD COLUMN IF NOT EXISTS confirmation_email_sent BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID
);

CREATE INDEX IF NOT EXISTS idx_leases_vehicle_id ON public.leases(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_leases_customer_id ON public.leases(customer_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_traffic_fines_vehicle_id ON public.traffic_fines(vehicle_id);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view error logs"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (true);
