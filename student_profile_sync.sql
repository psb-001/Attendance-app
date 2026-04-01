-- ==========================================
-- SERVER-SIDE STUDENT PROFILE SYNC (ROBUST VERSION)
-- ==========================================
-- This script ensures the profiles table is perfectly synced 
-- even if there are case/space differences in emails.

-- 1. Ensure the profiles table HAS all necessary columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'student';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'branch') THEN
        ALTER TABLE public.profiles ADD COLUMN branch text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'roll_no') THEN
        ALTER TABLE public.profiles ADD COLUMN roll_no text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email text;
    END IF;
END $$;

-- 2. Create the ROBUST sync function
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    student_record RECORD;
BEGIN
    -- Look for a student with this email in public.students (CASE-INSENSITIVE)
    SELECT * INTO student_record 
    FROM public.students 
    WHERE TRIM(LOWER(email)) = TRIM(LOWER(NEW.email))
    LIMIT 1;

    -- If we found a matching student, create/update their profile row
    IF student_record IS NOT NULL THEN
        INSERT INTO public.profiles (id, full_name, role, branch, roll_no, email)
        VALUES (
            NEW.id, 
            student_record.name, 
            'student', 
            student_record.branch, 
            student_record.roll_no, 
            NEW.email
        )
        ON CONFLICT (id) DO UPDATE 
        SET 
            full_name = EXCLUDED.full_name,
            role = 'student',
            branch = EXCLUDED.branch,
            roll_no = EXCLUDED.roll_no,
            email = EXCLUDED.email;
    ELSE
        -- If it's a teacher (not in students table), ensure they have a profile
        INSERT INTO public.profiles (id, role, email)
        VALUES (NEW.id, 'teacher', NEW.email)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Reset/Recreate the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- 4. ULTRA-RETROACTIVE SYNC: Force-sync every student in the system right now
-- This handles users who already exist in auth.users and students table.
INSERT INTO public.profiles (id, full_name, role, branch, roll_no, email)
SELECT 
    u.id, 
    s.name, 
    'student', 
    s.branch, 
    s.roll_no, 
    u.email
FROM auth.users u
JOIN public.students s ON TRIM(LOWER(u.email)) = TRIM(LOWER(s.email))
ON CONFLICT (id) DO UPDATE 
SET 
    full_name = EXCLUDED.full_name,
    role = 'student',
    branch = EXCLUDED.branch,
    roll_no = EXCLUDED.roll_no,
    email = EXCLUDED.email;
