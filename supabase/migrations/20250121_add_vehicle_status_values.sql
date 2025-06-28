-- Add missing vehicle status values to existing enum
-- These commands must be run outside of a transaction block

-- Add police_station status
ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'police_station';

-- Add accident status  
ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'accident';

-- Add stolen status
ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'stolen';

-- Add retired status
ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'retired';

-- Create index for better performance if not exists
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- Add comments for documentation
COMMENT ON TYPE vehicle_status IS 'Vehicle operational status: available, rented, reserved, maintenance, police_station, accident, stolen, retired, out_of_service';
COMMENT ON COLUMN vehicles.status IS 'Current operational status of the vehicle - determines availability for rental'; 