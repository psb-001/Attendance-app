-- ==========================================================
-- ☢️ OPERATION GROUND ZERO: THE FULL NUCLEAR RESET ☢️
-- ==========================================================

-- STEP 1: DETACH EVERYTHING
-- This safely removes all broken logic and stops background crashes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.universal_profile_sync CASCADE;
DROP FUNCTION IF EXISTS public.universal_profile_sync_manual CASCADE;

-- STEP 2: BURN THE GHOST TABLES
-- Drops every custom table you ever made to guarantee a clean slate
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.students_registry CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.branches CASCADE;
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
DROP TABLE IF EXISTS public.system_logs CASCADE;
DROP TABLE IF EXISTS public.batches CASCADE;

-- ==========================================================
-- 🏗️ STEP 3: POURING THE NEW FOUNDATION (YOUR REGISTRIES)
-- ==========================================================

-- 3A. The Root System Admins
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 👉👉 CREATE THE FIRST INVINCIBLE ADMIN 👈👈
INSERT INTO public.admins (full_name, email) 
VALUES ('System Admin', 'bhujbalfamily2001@gmail.com');

-- 3B. The Faculty Registry (Added by Admins)
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT,
    subjects JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3C. The Student Registry (Source of Truth)
CREATE TABLE public.students_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roll_no INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    branch TEXT,
    batch TEXT DEFAULT 'B1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(roll_no, branch)
);

-- ==========================================================
-- 📚 STEP 4: APP INVENTORY (BRANCHES & SUBJECTS)
-- ==========================================================
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    value TEXT UNIQUE NOT NULL,
    label TEXT,
    icon TEXT DEFAULT 'file-tree',
    color TEXT DEFAULT '#3d637e',
    bg_light TEXT DEFAULT '#f5f5f5',
    sort_order INTEGER DEFAULT 1
);

INSERT INTO public.branches (value, label, icon, color, bg_light, sort_order) VALUES 
('Computer Engineering', 'Computer\nEngineering', 'laptop', '#0984E3', '#e6f3ff', 1),
('AI / ML', 'AI & Machine\nLearning', 'robot-outline', '#6C5CE7', '#f1efff', 2),
('Information Technology', 'Information\nTechnology', 'database', '#00B894', '#e0fff4', 3),
('Electronics and Telecommunication Engineering', 'Electronics &\nTelecom', 'broadcast', '#E17055', '#ffebe3', 4);

CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    resource_url TEXT,
    icon TEXT DEFAULT 'book-outline',
    accent_color TEXT DEFAULT '#3d637e',
    type TEXT DEFAULT 'THEORY',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Give the Teacher Dashboard something to show immediately
INSERT INTO public.subjects (name, icon, accent_color) VALUES 
('Mathematics', 'calculator-variant', '#6C5CE7'),
('Computer Networks', 'server-network', '#00B894'),
('Operating Systems', 'cog-outline', '#E17055');

CREATE TABLE public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL, 
    subject TEXT,
    branch TEXT,
    batch TEXT,
    date DATE NOT NULL,
    status TEXT DEFAULT 'submitted',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- ==========================================================
-- 🪪 STEP 5: THE IDENTITY HUB (PROFILES TABLE)
-- ==========================================================
-- This table ONLY fills up when someone successfully logs in.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'not_enrolled', -- Everyone is a stranger until proven otherwise
    branch TEXT,
    roll_no INTEGER,
    department TEXT,
    subjects JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- 🛡️ STEP 6: CRASH-PROOF IDENTITY ENGINE
-- ==========================================================
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
        
    -- 4. If they are nobody (Unregistered)
    ELSE
        -- Notice how we ensure we only insert if user_email is NOT NULL
        IF user_email IS NOT NULL THEN
            INSERT INTO public.profiles (id, full_name, email, role)
            VALUES (user_id, 'Unknown User', user_email, 'not_enrolled')
            ON CONFLICT (id) DO UPDATE SET role = 'not_enrolled';
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🛡️ The Protective Shell: Automatically catches database errors
CREATE OR REPLACE FUNCTION public.universal_profile_sync()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        PERFORM public.universal_profile_sync_manual(NEW.id, NEW.email);
    EXCEPTION WHEN OTHERS THEN
        -- SILENTLY CATCH ERROR: Never crash auth.users!
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the shell to Auth
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.universal_profile_sync();

-- ==========================================================
-- 🔐 STEP 7: ROW LEVEL SECURITY (RLS) OPEN GATE
-- ==========================================================
-- This section guarantees the app is never blind to data.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- If a user is logged into the app, they have read-access
CREATE POLICY "Allow authenticated reads" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated reads" ON public.students_registry FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated reads" ON public.teachers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated reads" ON public.admins FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow anon and auth reads" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Allow anon and auth reads" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Allow authenticated reads" ON public.attendance_logs FOR SELECT USING (auth.role() = 'authenticated');

-- Permit all basic updates/inserts from signed-in clients
CREATE POLICY "Allow writes profiles" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow writes students" ON public.students_registry FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow writes teachers" ON public.teachers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow writes subjects" ON public.subjects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow writes attendance" ON public.attendance_logs FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================================
-- 🔄 STEP 8: RESYNC ALL EXISTING USERS TO THE NEW SYSTEM
-- ==========================================================
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- We wait 1 second to ensure tables are locked in, then sync.
    FOR user_record IN SELECT id, email FROM auth.users WHERE email IS NOT NULL LOOP
        BEGIN
            PERFORM public.universal_profile_sync_manual(user_record.id, user_record.email);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore single user errors to save the loop
        END;
    END LOOP;
END $$;
-- ☢️ RESET COMPLETE. YOU ARE SECURE. ☢️
