
-- Add indexes to improve query performance

-- Add index to traffic_fines table for agreement_id which is frequently queried
CREATE INDEX IF NOT EXISTS idx_traffic_fines_agreement_id ON public.traffic_fines(agreement_id);

-- Add index for license_plate which is frequently searched
CREATE INDEX IF NOT EXISTS idx_traffic_fines_license_plate ON public.traffic_fines(license_plate);

-- Add index to leases table for customer_id to speed up customer-related queries
CREATE INDEX IF NOT EXISTS idx_leases_customer_id ON public.leases(customer_id);

-- Add index to leases table for vehicle_id to speed up vehicle-related queries
CREATE INDEX IF NOT EXISTS idx_leases_vehicle_id ON public.leases(vehicle_id);

-- Add index to leases table for status which is frequently filtered
CREATE INDEX IF NOT EXISTS idx_leases_status ON public.leases(status);

-- Add index to unified_payments table for lease_id which is frequently queried
CREATE INDEX IF NOT EXISTS idx_unified_payments_lease_id ON public.unified_payments(lease_id);

-- Add index to unified_payments table for status which is frequently filtered
CREATE INDEX IF NOT EXISTS idx_unified_payments_status ON public.unified_payments(status);

-- Add index to unified_payments table for payment_date for date range queries
CREATE INDEX IF NOT EXISTS idx_unified_payments_payment_date ON public.unified_payments(payment_date);

-- Add index to unified_payments table for due_date for overdue calculations
CREATE INDEX IF NOT EXISTS idx_unified_payments_due_date ON public.unified_payments(due_date);

-- Add composite index for payment searches that combine multiple fields
CREATE INDEX IF NOT EXISTS idx_unified_payments_lease_status ON public.unified_payments(lease_id, status);

-- Add index to vehicles table for status which is frequently filtered
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);

-- Add index to profiles/customers table for full-text search
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles USING gin(to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_customers_full_name ON public.customers USING gin(to_tsvector('english', (first_name || ' ' || last_name)));

-- Add index to traffic_fines table for payment_status which is frequently filtered
CREATE INDEX IF NOT EXISTS idx_traffic_fines_payment_status ON public.traffic_fines(payment_status);

-- Add index for vehicle license_plate which is frequently searched
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON public.vehicles(license_plate);

-- Add index for case-insensitive searches on license plate
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate_lower ON public.vehicles(LOWER(license_plate));
