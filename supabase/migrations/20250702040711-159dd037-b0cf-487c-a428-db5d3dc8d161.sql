-- Recreate the missing payment records function with proper column qualification
CREATE OR REPLACE FUNCTION public.generate_missing_payment_records()
RETURNS SETOF leases_missing_payments
LANGUAGE plpgsql
AS $function$
DECLARE
    agreement_record RECORD;
    schedule_start DATE;
    schedule_end DATE;
    current_month DATE;
    month_diff INTEGER;
    dueDay INTEGER;
    i INTEGER;
    created_records INTEGER := 0;
    processed_leases INTEGER := 0;
    v_result leases_missing_payments;
    current_date_value DATE := CURRENT_DATE;
BEGIN
    -- Log start of function execution
    RAISE NOTICE 'Starting generate_missing_payment_records at %', NOW();
    
    -- Process each active agreement with explicit table qualifications
    FOR agreement_record IN 
        SELECT 
            leases.id,
            leases.agreement_number,
            leases.rent_amount,
            leases.daily_late_fee,
            leases.start_date,
            COALESCE(leases.rent_due_day, 1) AS rent_due_day
        FROM leases
        WHERE leases.status = 'active'
        AND leases.start_date IS NOT NULL
        AND leases.start_date <= current_date_value
    LOOP
        processed_leases := processed_leases + 1;
        
        -- Log processing of agreement
        RAISE NOTICE 'Processing agreement ID: %, Number: %, Start Date: %', 
            agreement_record.id, agreement_record.agreement_number, agreement_record.start_date;
        
        -- Calculate start and end dates with validation
        schedule_start := DATE_TRUNC('month', agreement_record.start_date::date);
        schedule_end := DATE_TRUNC('month', current_date_value) + INTERVAL '1 month';
        dueDay := COALESCE(agreement_record.rent_due_day, 1);
        
        -- Calculate number of months to process
        month_diff := EXTRACT(YEAR FROM schedule_end) * 12 + EXTRACT(MONTH FROM schedule_end) - 
                     (EXTRACT(YEAR FROM schedule_start) * 12 + EXTRACT(MONTH FROM schedule_start));
        
        -- Create payment schedules for each month if not exists
        FOR i IN 0..month_diff LOOP
            current_month := schedule_start + (i || ' months')::interval;
            
            -- Skip if a schedule already exists for this month
            IF NOT EXISTS (
                SELECT 1
                FROM payment_schedules ps
                WHERE ps.lease_id = agreement_record.id
                AND DATE_TRUNC('month', ps.due_date) = current_month
            ) THEN
                -- Create payment schedule record
                INSERT INTO payment_schedules (
                    lease_id,
                    amount,
                    due_date,
                    status,
                    description
                ) VALUES (
                    agreement_record.id,
                    agreement_record.rent_amount,
                    (current_month + ((dueDay-1) || ' days')::interval)::date,
                    'pending',
                    'Auto-generated payment schedule for ' || TO_CHAR(current_month, 'Month YYYY')
                );
                
                created_records := created_records + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    -- Log completion of processing
    RAISE NOTICE 'Completed processing % leases, created % records', processed_leases, created_records;
    
    -- Return records from the view to show status
    FOR v_result IN 
        SELECT * FROM leases_missing_payments
    LOOP
        RETURN NEXT v_result;
    END LOOP;
    
    RETURN;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in generate_missing_payment_records: %, SQLSTATE: %', SQLERRM, SQLSTATE;
END;
$function$;