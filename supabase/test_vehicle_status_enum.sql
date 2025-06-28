-- Test script to verify vehicle_status enum and all possible values
-- Run this script to ensure all status values are properly configured

-- 1. Check current enum values
SELECT 
    enumlabel as status_value,
    enumsortorder as sort_order
FROM pg_enum 
WHERE enumtypid = 'vehicle_status'::regtype
ORDER BY enumsortorder;

-- 2. Test inserting a vehicle with each status
BEGIN;

-- Create a temporary test vehicle for each status
INSERT INTO vehicles (id, make, model, license_plate, status, vin) VALUES
    ('test-available', 'Test', 'Available', 'TEST-001', 'available', 'TEST001'),
    ('test-rented', 'Test', 'Rented', 'TEST-002', 'rented', 'TEST002'),
    ('test-reserved', 'Test', 'Reserved', 'TEST-003', 'reserved', 'TEST003'),
    ('test-maintenance', 'Test', 'Maintenance', 'TEST-004', 'maintenance', 'TEST004'),
    ('test-police', 'Test', 'Police', 'TEST-005', 'police_station', 'TEST005'),
    ('test-accident', 'Test', 'Accident', 'TEST-006', 'accident', 'TEST006'),
    ('test-stolen', 'Test', 'Stolen', 'TEST-007', 'stolen', 'TEST007'),
    ('test-retired', 'Test', 'Retired', 'TEST-008', 'retired', 'TEST008'),
    ('test-out-service', 'Test', 'OutService', 'TEST-009', 'out_of_service', 'TEST009');

-- 3. Verify all test vehicles were inserted
SELECT 
    id,
    make,
    model,
    status,
    created_at
FROM vehicles 
WHERE id LIKE 'test-%'
ORDER BY status;

-- 4. Test status updates
UPDATE vehicles SET status = 'maintenance' WHERE id = 'test-available';
UPDATE vehicles SET status = 'available' WHERE id = 'test-maintenance';

-- 5. Verify updates worked
SELECT 
    id,
    status,
    updated_at
FROM vehicles 
WHERE id IN ('test-available', 'test-maintenance');

-- 6. Clean up test data
DELETE FROM vehicles WHERE id LIKE 'test-%';

ROLLBACK; -- Use ROLLBACK to not persist test data

-- 7. Check for any existing vehicles with invalid statuses
SELECT 
    id,
    status,
    make,
    model,
    license_plate
FROM vehicles 
WHERE status NOT IN (
    'available', 'rented', 'reserved', 'maintenance', 
    'police_station', 'accident', 'stolen', 'retired', 'out_of_service'
)
OR status IS NULL;

-- 8. Count vehicles by status
SELECT 
    status,
    COUNT(*) as vehicle_count
FROM vehicles 
GROUP BY status
ORDER BY status;

-- 9. Verify index exists
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'vehicles' 
AND indexname = 'idx_vehicles_status';

-- Success message
SELECT 'vehicle_status enum verification completed successfully' as result; 