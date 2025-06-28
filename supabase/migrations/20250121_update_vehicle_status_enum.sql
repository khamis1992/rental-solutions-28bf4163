-- Migration to update vehicle_status enum with all required statuses
-- Created: 2025-01-21
-- Purpose: Add missing vehicle statuses to support full vehicle management

BEGIN;

-- Check if vehicle_status enum exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vehicle_status') THEN
        CREATE TYPE vehicle_status AS ENUM (
            'available',
            'rented',
            'reserved',
            'maintenance',
            'police_station',
            'accident',
            'stolen',
            'retired',
            'out_of_service'
        );
        RAISE NOTICE 'Created vehicle_status enum with all statuses';
    ELSE
        -- If enum exists, add missing values
        RAISE NOTICE 'vehicle_status enum already exists, adding missing values...';
        
        -- Add missing enum values if they don't exist
        -- Note: PostgreSQL doesn't allow adding enum values in a transaction block,
        -- so we need to check and add them individually
        
        -- Try to add each missing value
        BEGIN
            ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'police_station';
            RAISE NOTICE 'Added police_station to vehicle_status enum';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'police_station already exists or could not be added';
        END;
        
        BEGIN
            ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'accident';
            RAISE NOTICE 'Added accident to vehicle_status enum';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'accident already exists or could not be added';
        END;
        
        BEGIN
            ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'stolen';
            RAISE NOTICE 'Added stolen to vehicle_status enum';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'stolen already exists or could not be added';
        END;
        
        BEGIN
            ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'retired';
            RAISE NOTICE 'Added retired to vehicle_status enum';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'retired already exists or could not be added';
        END;
        
        BEGIN
            ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'reserved';
            RAISE NOTICE 'Added reserved to vehicle_status enum';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'reserved already exists or could not be added';
        END;
    END IF;
END $$;

-- Ensure vehicles table uses the correct enum type
DO $$
BEGIN
    -- Check if vehicles table exists and has status column
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'vehicles'
    ) THEN
        -- Check if status column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'vehicles' 
            AND column_name = 'status'
        ) THEN
            -- Update column to use the enum type if it's not already
            BEGIN
                ALTER TABLE vehicles 
                ALTER COLUMN status TYPE vehicle_status 
                USING status::vehicle_status;
                RAISE NOTICE 'Updated vehicles.status column to use vehicle_status enum';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'vehicles.status column type could not be updated or is already correct';
            END;
        ELSE
            -- Add status column if it doesn't exist
            ALTER TABLE vehicles 
            ADD COLUMN status vehicle_status DEFAULT 'available';
            RAISE NOTICE 'Added status column to vehicles table';
        END IF;
    ELSE
        RAISE NOTICE 'vehicles table does not exist';
    END IF;
END $$;

-- Create or update a function to validate vehicle status changes
CREATE OR REPLACE FUNCTION validate_vehicle_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        RAISE NOTICE 'Vehicle % status changed from % to %', NEW.id, OLD.status, NEW.status;
        
        -- Update the updated_at timestamp
        NEW.updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status change validation (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'vehicle_status_change_trigger'
    ) THEN
        CREATE TRIGGER vehicle_status_change_trigger
            BEFORE UPDATE ON vehicles
            FOR EACH ROW
            EXECUTE FUNCTION validate_vehicle_status_change();
        RAISE NOTICE 'Created vehicle status change trigger';
    END IF;
END $$;

-- Update any existing invalid statuses to 'available'
UPDATE vehicles 
SET status = 'available'::vehicle_status
WHERE status IS NULL 
   OR status NOT IN (
       'available', 'rented', 'reserved', 'maintenance', 
       'police_station', 'accident', 'stolen', 'retired', 'out_of_service'
   );

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- Add helpful comment
COMMENT ON TYPE vehicle_status IS 'Vehicle status enum: available, rented, reserved, maintenance, police_station, accident, stolen, retired, out_of_service';
COMMENT ON COLUMN vehicles.status IS 'Current operational status of the vehicle';

COMMIT;

-- Display final enum values for verification
DO $$
DECLARE
    enum_values text;
BEGIN
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder) INTO enum_values
    FROM pg_enum 
    WHERE enumtypid = 'vehicle_status'::regtype;
    
    RAISE NOTICE 'vehicle_status enum now contains: %', enum_values;
END $$; 