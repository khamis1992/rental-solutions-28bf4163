-- ============================================
-- إصلاح ملف المستخدم المفقود oosamaa644@gmail.com
-- Fix missing user profile for oosamaa644@gmail.com
-- ============================================

-- الخطوة 1: التحقق من المستخدم قبل الإصلاح
DO $$
DECLARE
    user_auth_id UUID;
    profile_exists BOOLEAN := FALSE;
    user_email TEXT := 'oosamaa644@gmail.com';
BEGIN
    -- البحث عن معرف المستخدم في auth.users
    SELECT id INTO user_auth_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_auth_id IS NULL THEN
        RAISE NOTICE 'خطأ: المستخدم % غير موجود في auth.users', user_email;
        RETURN;
    END IF;
    
    -- التحقق من وجود profile
    SELECT EXISTS(
        SELECT 1 FROM public.profiles WHERE id = user_auth_id
    ) INTO profile_exists;
    
    RAISE NOTICE '=== تقرير ما قبل الإصلاح ===';
    RAISE NOTICE 'User ID: %', user_auth_id;
    RAISE NOTICE 'Email: %', user_email;
    RAISE NOTICE 'Profile Exists: %', profile_exists;
    
    IF profile_exists THEN
        RAISE NOTICE 'المستخدم لديه profile موجود بالفعل';
        RETURN;
    END IF;
    
    -- إنشاء profile جديد
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        role,
        created_at,
        updated_at
    ) VALUES (
        user_auth_id,
        'مستخدم جديد', -- يمكن تحديثه لاحقاً
        user_email,
        'staff', -- الدور الافتراضي
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '=== تم إنشاء Profile بنجاح ===';
    RAISE NOTICE 'تم إنشاء ملف شخصي للمستخدم %', user_email;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'خطأ أثناء إنشاء Profile: %', SQLERRM;
END $$;

-- الخطوة 2: التحقق من النتيجة
SELECT 
    'النتيجة النهائية' as status,
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.created_at
FROM public.profiles p
WHERE p.email = 'oosamaa644@gmail.com'
   OR p.id IN (
       SELECT id FROM auth.users WHERE email = 'oosamaa644@gmail.com'
   );

-- الخطوة 3: إنشاء script إضافي لإصلاح جميع المستخدمين المفقودين
-- (اختياري - استخدم بحذر)

/*
-- إصلاح جميع المستخدمين الذين لديهم auth لكن بدون profile
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'مستخدم جديد') as full_name,
    'staff' as role,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
*/

-- الخطوة 4: التحقق النهائي
SELECT 
    'إحصائيات نهائية' as info,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.profiles p ON au.id = p.id WHERE p.id IS NULL) as missing_profiles; 