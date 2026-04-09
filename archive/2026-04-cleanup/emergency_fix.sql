-- 🔧 FIX GHOST PROFILES: Reset email to match auth.users, then re-sync

-- Step 1: Fix ALL profiles where email doesn't match auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
AND LOWER(p.email) != LOWER(u.email);

-- Step 2: Re-sync ALL users through the trigger function
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, email FROM auth.users WHERE email IS NOT NULL LOOP
        BEGIN
            PERFORM public.universal_profile_sync_manual(user_record.id, user_record.email);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error for %: %', user_record.email, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 3: Verify - show all profiles
SELECT p.email, p.role, u.email as auth_email,
  CASE WHEN LOWER(p.email) = LOWER(u.email) THEN '✅' ELSE '🚨' END as status
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.role, p.email;
