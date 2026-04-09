-- ==============================================
-- 🔬 FULL DATABASE AUTOPSY: Run in Supabase SQL Editor
-- ==============================================

-- 1. SHOW ALL RLS POLICIES ON PROFILES TABLE
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 2. SHOW ALL RLS POLICIES ON STUDENTS_REGISTRY
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'students_registry';

-- 3. IS RLS ENABLED ON PROFILES?
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'profiles';

-- 4. SHOW ALL TRIGGERS ON AUTH.USERS
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- 5. SHOW THE TRIGGER FUNCTION CODE
SELECT prosrc
FROM pg_proc
WHERE proname = 'universal_profile_sync';

-- 6. ALL STUCK PROFILES (not_enrolled)
SELECT id, email, role, full_name, updated_at
FROM public.profiles
WHERE role = 'not_enrolled';

-- 7. ALL EMAILS IN STUDENTS_REGISTRY (for comparison)
SELECT id, email, full_name, roll_no, branch
FROM public.students_registry
WHERE email IS NOT NULL
ORDER BY email;

-- 8. TRY A MANUAL FIX ON FIRST STUCK USER AND SEE THE EXACT ERROR
DO $$
DECLARE
    stuck_id UUID;
    stuck_email TEXT;
    reg_match RECORD;
BEGIN
    SELECT id, email INTO stuck_id, stuck_email
    FROM public.profiles WHERE role = 'not_enrolled' LIMIT 1;

    IF stuck_id IS NULL THEN
        RAISE NOTICE '✅ No stuck users found.';
        RETURN;
    END IF;

    RAISE NOTICE '🔍 Testing fix for: % (ID: %)', stuck_email, stuck_id;

    SELECT * INTO reg_match
    FROM public.students_registry
    WHERE LOWER(email) = LOWER(stuck_email) LIMIT 1;

    IF reg_match IS NULL THEN
        RAISE NOTICE '❌ Email "%" is NOT in students_registry.', stuck_email;

        SELECT * INTO reg_match
        FROM public.teachers
        WHERE LOWER(email) = LOWER(stuck_email) LIMIT 1;

        IF reg_match IS NULL THEN
            RAISE NOTICE '❌ Email "%" is also NOT in teachers table.', stuck_email;
            RAISE NOTICE '👉 ROOT CAUSE: This email was never added to any registry.';
        ELSE
            RAISE NOTICE '✅ Found in teachers: %', reg_match.full_name;
            UPDATE public.profiles SET role = 'teacher', full_name = reg_match.full_name WHERE id = stuck_id;
            RAISE NOTICE '✅ FIXED: Set role to teacher for %', stuck_email;
        END IF;
    ELSE
        RAISE NOTICE '✅ Found in registry: % (Roll: %)', reg_match.full_name, reg_match.roll_no;
        UPDATE public.profiles SET role = 'student', full_name = reg_match.full_name, branch = reg_match.branch, roll_no = reg_match.roll_no WHERE id = stuck_id;
        RAISE NOTICE '✅ FIXED: Set role to student for %', stuck_email;
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '🚨 UPDATE FAILED WITH ERROR: %', SQLERRM;
    RAISE NOTICE '👉 This is the EXACT database error blocking users.';
END $$;
