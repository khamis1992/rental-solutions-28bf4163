
-- Update the payment_status type to include all possible values
DO $$
BEGIN
  -- Add new status values to payment_status enum if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type
                JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
                WHERE pg_type.typname = 'payment_status'
                  AND pg_enum.enumlabel = 'paid') THEN
    ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'paid';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type
                JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
                WHERE pg_type.typname = 'payment_status'
                  AND pg_enum.enumlabel = 'completed') THEN
    ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'completed';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type
                JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
                WHERE pg_type.typname = 'payment_status'
                  AND pg_enum.enumlabel = 'partial') THEN
    ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'partial';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type
                JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
                WHERE pg_type.typname = 'payment_status'
                  AND pg_enum.enumlabel = 'overdue') THEN
    ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'overdue';
  END IF;
END$$;

-- Add missing columns to the unified_payments table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'unified_payments' 
                AND column_name = 'schedule_id') THEN
    ALTER TABLE unified_payments ADD COLUMN schedule_id UUID REFERENCES payment_schedules(id) NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'unified_payments' 
                AND column_name = 'payment_reference') THEN
    ALTER TABLE unified_payments ADD COLUMN payment_reference UUID NULL;
  END IF;

  -- Create index on lease_id for better query performance
  CREATE INDEX IF NOT EXISTS unified_payments_lease_id_idx ON unified_payments(lease_id);
  
  -- Create index on payment date for better filtering
  CREATE INDEX IF NOT EXISTS unified_payments_payment_date_idx ON unified_payments(payment_date);
END$$;
