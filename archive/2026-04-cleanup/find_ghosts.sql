-- 🔍 FIND GHOST PROFILES: profiles where email doesn't match their auth.users email
-- These are stale entries from admin email changes that block new sign-ins

SELECT p.id, p.email as profile_email, p.role, u.email as auth_email,
  CASE 
    WHEN u.email IS NULL THEN '🚨 AUTH USER DELETED'
    WHEN LOWER(p.email) != LOWER(u.email) THEN '🚨 EMAIL MISMATCH - GHOST!'
    ELSE '✅ OK'
  END as status
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY status DESC, p.email;
