-- ============================================
-- تشخيص مشكلة ملف المستخدم oosamaa644@gmail.com
-- Debug user profile issue for oosamaa644@gmail.com
-- ============================================

-- 1. التحقق من وجود المستخدم في auth.users
SELECT 
    'auth.users' as table_name,
    id,
    email,
    email_confirmed_at,
    last_sign_in_at,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'oosamaa644@gmail.com';

-- 2. التحقق من وجود المستخدم في public.profiles
SELECT 
    'public.profiles' as table_name,
    id,
    full_name,
    email,
    role,
    created_at,
    updated_at
FROM public.profiles 
WHERE email = 'oosamaa644@gmail.com' 
   OR id IN (
       SELECT id FROM auth.users WHERE email = 'oosamaa644@gmail.com'
   );

-- 3. عرض جميع المستخدمين في auth.users للمقارنة
SELECT 
    'All auth users' as info,
    COUNT(*) as total_users
FROM auth.users;

-- 4. عرض جميع الملفات في public.profiles للمقارنة
SELECT 
    'All profiles' as info,
    COUNT(*) as total_profiles
FROM public.profiles;

-- 5. البحث عن المستخدمين الذين لديهم auth لكن بدون profile
SELECT 
    'Users without profiles' as issue_type,
    au.id,
    au.email,
    au.created_at as auth_created,
    CASE 
        WHEN p.id IS NULL THEN 'Missing Profile' 
        ELSE 'Has Profile' 
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- 6. معلومات تفصيلية عن البنية لجدول profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position; 