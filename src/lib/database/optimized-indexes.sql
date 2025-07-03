-- ============================================
-- فهارس محسنة للاستعلامات الشائعة
-- Optimized Indexes for Common Queries
-- ============================================

-- فهارس للجدول الرئيسي: leases (العقود)
CREATE INDEX IF NOT EXISTS idx_leases_status_created_at ON public.leases(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leases_customer_status ON public.leases(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_leases_vehicle_status ON public.leases(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_leases_agreement_number_lower ON public.leases(LOWER(agreement_number));
CREATE INDEX IF NOT EXISTS idx_leases_date_range ON public.leases(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leases_rent_amount ON public.leases(rent_amount) WHERE rent_amount > 0;

-- فهارس للعملاء: profiles (customers)
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_gin ON public.profiles USING gin(to_tsvector('arabic', full_name));
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_lower ON public.profiles(LOWER(full_name));
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_role_created_at ON public.profiles(role, created_at DESC);

-- فهارس للمركبات: vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate_lower ON public.vehicles(LOWER(license_plate));
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON public.vehicles(make, model);
CREATE INDEX IF NOT EXISTS idx_vehicles_status_year ON public.vehicles(status, year DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin_unique ON public.vehicles(vin) WHERE vin IS NOT NULL;

-- فهارس للدفعات: unified_payments
CREATE INDEX IF NOT EXISTS idx_payments_lease_status ON public.unified_payments(lease_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_date_status ON public.unified_payments(payment_date, status);
CREATE INDEX IF NOT EXISTS idx_payments_amount_date ON public.unified_payments(amount, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payments_customer_date ON public.unified_payments(customer_id, payment_date DESC);

-- فهارس للجدولة: payment_schedules
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due_status ON public.payment_schedules(due_date, status);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_lease_due ON public.payment_schedules(lease_id, due_date);

-- فهارس للصيانة: maintenance
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_date ON public.maintenance(vehicle_id, maintenance_date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_type_status ON public.maintenance(maintenance_type, status);

-- فهارس للوثائق: documents
CREATE INDEX IF NOT EXISTS idx_documents_entity_type ON public.documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_type_date ON public.documents(document_type, created_at DESC);

-- فهارس للسجلات: system_logs (تحسين الموجودة)
CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp_desc ON public.system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level_timestamp ON public.system_logs(level, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_entity_composite ON public.system_logs(entity_type, entity_id, timestamp DESC);

-- تحديث إحصائيات الجداول
ANALYZE public.leases;
ANALYZE public.profiles;
ANALYZE public.vehicles;
ANALYZE public.unified_payments;
ANALYZE public.payment_schedules;
ANALYZE public.maintenance;
ANALYZE public.documents; 