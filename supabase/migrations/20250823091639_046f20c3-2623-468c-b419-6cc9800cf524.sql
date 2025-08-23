-- Step 1: Add the agreement_number column to unified_payments table
ALTER TABLE unified_payments ADD COLUMN agreement_number TEXT;

-- Step 2: Backfill existing data by copying agreement_number from leases table
UPDATE unified_payments 
SET agreement_number = leases.agreement_number
FROM leases 
WHERE unified_payments.lease_id = leases.id;

-- Step 3: Add indexes for performance optimization
CREATE INDEX idx_unified_payments_agreement_number ON unified_payments(agreement_number);
CREATE INDEX idx_unified_payments_agreement_lease ON unified_payments(agreement_number, lease_id);

-- Step 4: Create trigger function for automatic updates on INSERT
CREATE OR REPLACE FUNCTION update_payment_agreement_number()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT operations, get agreement_number from leases table
  IF TG_OP = 'INSERT' AND NEW.agreement_number IS NULL THEN
    SELECT agreement_number INTO NEW.agreement_number
    FROM leases 
    WHERE id = NEW.lease_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations on unified_payments
CREATE TRIGGER trigger_update_payment_agreement_number
  BEFORE INSERT ON unified_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_agreement_number();

-- Step 5: Create trigger function to update payments when lease agreement_number changes
CREATE OR REPLACE FUNCTION update_payments_on_lease_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all payments when lease agreement_number changes
  IF OLD.agreement_number IS DISTINCT FROM NEW.agreement_number THEN
    UPDATE unified_payments 
    SET agreement_number = NEW.agreement_number
    WHERE lease_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lease updates
CREATE TRIGGER trigger_update_payments_on_lease_change
  AFTER UPDATE ON leases
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_on_lease_change();