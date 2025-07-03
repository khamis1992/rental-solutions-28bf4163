-- ============================================
-- تحسين استعلامات الـ JOIN المعقدة
-- Optimize Complex JOIN Queries
-- ============================================

-- دالة محسنة للبحث في العقود مع البيانات المرتبطة
CREATE OR REPLACE FUNCTION get_agreements_with_relations(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_status TEXT DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_vehicle_id UUID DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  agreement_number VARCHAR,
  status VARCHAR,
  start_date DATE,
  end_date DATE,
  rent_amount NUMERIC,
  deposit_amount NUMERIC,
  customer_id UUID,
  vehicle_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_license_plate TEXT,
  vehicle_year INTEGER,
  total_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_leases AS (
    SELECT 
      l.*,
      COUNT(*) OVER() as total_count
    FROM public.leases l
    WHERE 
      (p_status IS NULL OR l.status = p_status) AND
      (p_customer_id IS NULL OR l.customer_id = p_customer_id) AND
      (p_vehicle_id IS NULL OR l.vehicle_id = p_vehicle_id) AND
      (p_start_date IS NULL OR l.start_date >= p_start_date) AND
      (p_end_date IS NULL OR l.end_date <= p_end_date) AND
      (p_search_term IS NULL OR 
       LOWER(l.agreement_number) LIKE LOWER('%' || p_search_term || '%'))
    ORDER BY l.created_at DESC
    LIMIT p_limit OFFSET p_offset
  )
  SELECT 
    fl.id,
    fl.agreement_number,
    fl.status,
    fl.start_date,
    fl.end_date,
    fl.rent_amount,
    fl.deposit_amount,
    fl.customer_id,
    fl.vehicle_id,
    fl.created_at,
    c.full_name as customer_name,
    c.email as customer_email,
    c.phone_number as customer_phone,
    v.make as vehicle_make,
    v.model as vehicle_model,
    v.license_plate as vehicle_license_plate,
    v.year as vehicle_year,
    fl.total_count
  FROM filtered_leases fl
  LEFT JOIN public.profiles c ON fl.customer_id = c.id
  LEFT JOIN public.vehicles v ON fl.vehicle_id = v.id;
END;
$$;

-- دالة البحث المحسنة للعقود
CREATE OR REPLACE FUNCTION search_agreements_optimized(
  p_search_term TEXT,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  agreement_number VARCHAR,
  status VARCHAR,
  customer_name TEXT,
  vehicle_info TEXT,
  rent_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  match_type TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  search_lower TEXT := LOWER(p_search_term);
BEGIN
  RETURN QUERY
  WITH all_matches AS (
    -- البحث برقم العقد
    SELECT 
      l.id, l.agreement_number, l.status, l.rent_amount, l.created_at,
      c.full_name as customer_name,
      CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as vehicle_info,
      'agreement_number'::TEXT as match_type,
      1 as priority
    FROM public.leases l
    LEFT JOIN public.profiles c ON l.customer_id = c.id
    LEFT JOIN public.vehicles v ON l.vehicle_id = v.id
    WHERE LOWER(l.agreement_number) LIKE '%' || search_lower || '%'

    UNION ALL

    -- البحث باسم العميل
    SELECT 
      l.id, l.agreement_number, l.status, l.rent_amount, l.created_at,
      c.full_name as customer_name,
      CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as vehicle_info,
      'customer_name'::TEXT as match_type,
      2 as priority
    FROM public.leases l
    INNER JOIN public.profiles c ON l.customer_id = c.id
    LEFT JOIN public.vehicles v ON l.vehicle_id = v.id
    WHERE LOWER(c.full_name) LIKE '%' || search_lower || '%'

    UNION ALL

    -- البحث برقم لوحة المركبة
    SELECT 
      l.id, l.agreement_number, l.status, l.rent_amount, l.created_at,
      c.full_name as customer_name,
      CONCAT(v.make, ' ', v.model, ' (', v.license_plate, ')') as vehicle_info,
      'license_plate'::TEXT as match_type,
      3 as priority
    FROM public.leases l
    LEFT JOIN public.profiles c ON l.customer_id = c.id
    INNER JOIN public.vehicles v ON l.vehicle_id = v.id
    WHERE LOWER(v.license_plate) LIKE '%' || search_lower || '%'
  ),
  ranked_matches AS (
    SELECT 
      *,
      ROW_NUMBER() OVER (PARTITION BY id ORDER BY priority) as rn,
      COUNT(*) OVER() as total_count
    FROM all_matches
  )
  SELECT 
    rm.id,
    rm.agreement_number,
    rm.status,
    rm.customer_name,
    rm.vehicle_info,
    rm.rent_amount,
    rm.created_at,
    rm.match_type,
    rm.total_count
  FROM ranked_matches rm
  WHERE rm.rn = 1
  ORDER BY rm.priority, rm.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- دالة لإحصائيات العقود المحسنة
CREATE OR REPLACE FUNCTION get_agreement_statistics()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  active_count INTEGER;
  expired_count INTEGER;
  pending_count INTEGER;
  total_revenue NUMERIC;
  avg_rent NUMERIC;
  overdue_payments INTEGER;
BEGIN
  -- عد العقود النشطة
  SELECT COUNT(*) INTO active_count
  FROM public.leases 
  WHERE status = 'active';

  -- عد العقود المنتهية
  SELECT COUNT(*) INTO expired_count
  FROM public.leases 
  WHERE status = 'expired' OR end_date < CURRENT_DATE;

  -- عد العقود المعلقة
  SELECT COUNT(*) INTO pending_count
  FROM public.leases 
  WHERE status = 'pending';

  -- حساب إجمالي الإيرادات
  SELECT COALESCE(SUM(rent_amount), 0) INTO total_revenue
  FROM public.leases 
  WHERE status = 'active';

  -- متوسط الإيجار
  SELECT COALESCE(AVG(rent_amount), 0) INTO avg_rent
  FROM public.leases 
  WHERE status = 'active';

  -- الدفعات المتأخرة
  SELECT COUNT(*) INTO overdue_payments
  FROM public.payment_schedules 
  WHERE status = 'overdue' AND due_date < CURRENT_DATE;

  -- بناء JSON النتيجة
  result := json_build_object(
    'active_agreements', active_count,
    'expired_agreements', expired_count,
    'pending_agreements', pending_count,
    'total_revenue', total_revenue,
    'average_rent', avg_rent,
    'overdue_payments', overdue_payments,
    'last_updated', NOW()
  );

  RETURN result;
END;
$$;

-- View للعقود مع البيانات الكاملة
CREATE OR REPLACE VIEW agreements_full_view AS
SELECT 
  l.id,
  l.agreement_number,
  l.status,
  l.start_date,
  l.end_date,
  l.rent_amount,
  l.deposit_amount,
  l.daily_late_fee,
  l.agreement_type,
  l.notes,
  l.created_at,
  l.updated_at,
  c.id as customer_id,
  c.full_name as customer_name,
  c.email as customer_email,
  c.phone_number as customer_phone,
  v.id as vehicle_id,
  v.make as vehicle_make,
  v.model as vehicle_model,
  v.license_plate as vehicle_license_plate,
  v.year as vehicle_year,
  v.color as vehicle_color,
  v.vin as vehicle_vin,
  -- إحصائيات الدفعات
  COALESCE(ps.total_payments, 0) as total_payments,
  COALESCE(ps.paid_amount, 0) as paid_amount,
  COALESCE(ps.overdue_count, 0) as overdue_payments
FROM public.leases l
LEFT JOIN public.profiles c ON l.customer_id = c.id
LEFT JOIN public.vehicles v ON l.vehicle_id = v.id
LEFT JOIN (
  SELECT 
    lease_id,
    COUNT(*) as total_payments,
    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
  FROM public.unified_payments
  GROUP BY lease_id
) ps ON l.id = ps.lease_id;

-- View للإحصائيات السريعة
CREATE OR REPLACE VIEW dashboard_statistics AS
SELECT 
  'agreements' as metric_type,
  json_build_object(
    'total', (SELECT COUNT(*) FROM public.leases),
    'active', (SELECT COUNT(*) FROM public.leases WHERE status = 'active'),
    'expired', (SELECT COUNT(*) FROM public.leases WHERE status = 'expired'),
    'pending', (SELECT COUNT(*) FROM public.leases WHERE status = 'pending')
  ) as data,
  NOW() as last_updated
UNION ALL
SELECT 
  'payments' as metric_type,
  json_build_object(
    'total_amount', (SELECT COALESCE(SUM(amount), 0) FROM public.unified_payments WHERE status = 'paid'),
    'overdue_count', (SELECT COUNT(*) FROM public.payment_schedules WHERE status = 'overdue'),
    'this_month', (SELECT COALESCE(SUM(amount), 0) FROM public.unified_payments 
                   WHERE status = 'paid' AND DATE_TRUNC('month', payment_date) = DATE_TRUNC('month', CURRENT_DATE))
  ) as data,
  NOW() as last_updated
UNION ALL
SELECT 
  'vehicles' as metric_type,
  json_build_object(
    'total', (SELECT COUNT(*) FROM public.vehicles),
    'available', (SELECT COUNT(*) FROM public.vehicles WHERE status = 'available'),
    'rented', (SELECT COUNT(*) FROM public.vehicles WHERE status = 'rented'),
    'maintenance', (SELECT COUNT(*) FROM public.vehicles WHERE status = 'maintenance')
  ) as data,
  NOW() as last_updated;

-- التعليقات
COMMENT ON FUNCTION get_agreements_with_relations IS 'استعلام محسن للحصول على العقود مع البيانات المرتبطة';
COMMENT ON FUNCTION search_agreements_optimized IS 'بحث محسن في العقود باستخدام فهارس متقدمة';
COMMENT ON FUNCTION get_agreement_statistics IS 'حساب إحصائيات العقود بشكل محسن';
COMMENT ON VIEW agreements_full_view IS 'عرض شامل للعقود مع جميع البيانات المرتبطة';
COMMENT ON VIEW dashboard_statistics IS 'إحصائيات سريعة للوحة التحكم'; 