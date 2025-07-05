-- ============================================
-- إنشاء Trigger لإنشاء Profile تلقائياً
-- Create trigger for automatic profile creation
-- ============================================

-- 1. إنشاء دالة لإنشاء profile تلقائياً
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- إنشاء profile جديد للمستخدم
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    NEW.email,
    'staff', -- الدور الافتراضي
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- في حالة حدوث خطأ، نسجل المشكلة ونكمل
    RAISE LOG 'خطأ في إنشاء profile للمستخدم %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. إنشاء Trigger على جدول auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. التحقق من وجود الدالة والـ trigger
SELECT 
    'Functions' as type,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'handle_new_user';

SELECT 
    'Triggers' as type,
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'on_auth_user_created';

-- 4. رسالة تأكيد
SELECT 'تم إنشاء Trigger بنجاح - سيتم إنشاء profile تلقائياً للمستخدمين الجدد' as result; 