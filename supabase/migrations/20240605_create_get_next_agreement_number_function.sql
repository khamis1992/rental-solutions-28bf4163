-- Migration: Create get_next_agreement_number function for atomic agreement number generation

CREATE OR REPLACE FUNCTION get_next_agreement_number()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_number text;
BEGIN
  LOCK TABLE leases IN EXCLUSIVE MODE;
  SELECT COALESCE(MAX(CAST(SUBSTRING(agreement_number, 6, 2) AS INTEGER)), 0) + 1 INTO next_num
  FROM leases WHERE agreement_number LIKE 'LT0RO%';
  new_number := 'LT0RO' || LPAD(next_num::text, 2, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql; 