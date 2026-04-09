-- =====================================================
-- 🛡️ FIX: Stop trigger from downgrading existing users
-- =====================================================
-- ROOT CAUSE: When admin changes a student's registry email,
-- the trigger re-fires on auth events and sees no match
-- for the OLD Google email → resets role to 'not_enrolled'.
--
-- FIX: If a user already has a valid role (student/teacher/admin),
-- the trigger will NOT downgrade them to 'not_enrolled'.
-- =====================================================

CREATE OR REPLACE FUNCTION public.universal_profile_sync_manual(user_id UUID, user_email TEXT)
RETURNS VOID AS $$
BEGIN
    -- 1. Check if they are a registered Student
    IF EXISTS (SELECT 1 FROM public.students_registry WHERE LOWER(email) = LOWER(user_email)) THEN
        INSERT INTO public.profiles (id, full_name, email, role, branch, roll_no)
        VALUES (
            user_id, 
            (SELECT full_name FROM public.students_registry WHERE LOWER(email) = LOWER(user_email) LIMIT 1), 
            user_email, 
            'student',
            (SELECT branch FROM public.students_registry WHERE LOWER(email) = LOWER(user_email) LIMIT 1),
            (SELECT roll_no FROM public.students_registry WHERE LOWER(email) = LOWER(user_email) LIMIT 1)
        )
        ON CONFLICT (id) DO UPDATE SET 
            role = 'student', full_name = excluded.full_name, branch = excluded.branch, roll_no = excluded.roll_no;
    
    -- 2. Check if they are a registered Teacher
    ELSIF EXISTS (SELECT 1 FROM public.teachers WHERE LOWER(email) = LOWER(user_email)) THEN
        INSERT INTO public.profiles (id, full_name, email, role, department, subjects)
        VALUES (
            user_id, 
            (SELECT full_name FROM public.teachers WHERE LOWER(email) = LOWER(user_email) LIMIT 1), 
            user_email, 
            'teacher',
            (SELECT department FROM public.teachers WHERE LOWER(email) = LOWER(user_email) LIMIT 1),
            (SELECT subjects FROM public.teachers WHERE LOWER(email) = LOWER(user_email) LIMIT 1)
        )
        ON CONFLICT (id) DO UPDATE SET 
            role = 'teacher', full_name = excluded.full_name, department = excluded.department, subjects = excluded.subjects;

    -- 3. Check if they are a System Admin
    ELSIF EXISTS (SELECT 1 FROM public.admins WHERE LOWER(email) = LOWER(user_email)) THEN
        INSERT INTO public.profiles (id, full_name, email, role)
        VALUES (
            user_id, 
            (SELECT full_name FROM public.admins WHERE LOWER(email) = LOWER(user_email) LIMIT 1), 
            user_email, 
            'admin'
        )
        ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = excluded.full_name;
        
    -- 4. SAFE FALLBACK: Only set 'not_enrolled' if they DON'T already have a valid role
    ELSE
        IF user_email IS NOT NULL THEN
            INSERT INTO public.profiles (id, full_name, email, role)
            VALUES (user_id, 'Unknown User', user_email, 'not_enrolled')
            ON CONFLICT (id) DO UPDATE SET 
                role = CASE 
                    WHEN public.profiles.role IN ('student', 'teacher', 'admin') 
                    THEN public.profiles.role  -- KEEP existing valid role, don't downgrade!
                    ELSE 'not_enrolled' 
                END;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
