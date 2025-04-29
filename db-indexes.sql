-- Recommended indexes for performance on frequently filtered/sorted columns
CREATE INDEX IF NOT EXISTS idx_leases_vehicle_id ON leases(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status);
CREATE INDEX IF NOT EXISTS idx_leases_customer_id ON leases(customer_id);
CREATE INDEX IF NOT EXISTS idx_leases_start_date ON leases(start_date);
CREATE INDEX IF NOT EXISTS idx_leases_end_date ON leases(end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_type_id ON vehicles(vehicle_type_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles(location);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON maintenance(scheduled_date);
