-- ==========================================
-- BRANCH MIGRATION: Hardcoded → Database
-- ==========================================
-- Run this in Supabase SQL Editor BEFORE updating the app code.

-- 1. Create the branches table
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    value TEXT NOT NULL UNIQUE,          -- 'AI / ML', 'Computer Engineering'
    label TEXT NOT NULL,                -- 'AI / ML', 'Computer\nEngineering'
    icon TEXT DEFAULT 'robot-outline',   -- MaterialCommunityIcons name
    color TEXT DEFAULT '#0984E3',        -- Accent color
    bg_light TEXT DEFAULT '#E3F2FD',     -- Light theme background
    bg_dark TEXT DEFAULT '#1a2228',      -- Dark theme surface (optional)
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert current branches
INSERT INTO public.branches (value, label, icon, color, bg_light, sort_order) VALUES
    ('AI / ML', 'AI / ML', 'robot-outline', '#0984E3', '#E3F2FD', 1),
    ('Computer Engineering', 'Computer\nEngineering', 'code-braces', '#00B894', '#E8F5E9', 2),
    ('Electronics and Telecommunication Engineering', 'E&TC', 'chip', '#00CEC9', '#E0F7FA', 3),
    ('Information Technology', 'Information\nTechnology', 'monitor', '#636E72', '#F5F5F5', 4)
ON CONFLICT (value) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- 4. Everyone can read branches
CREATE POLICY "Authenticated users can view branches"
ON public.branches FOR SELECT
TO authenticated
USING (true);

-- 5. Only admins can manage branches
CREATE POLICY "Admins can manage branches"
ON public.branches FOR ALL
TO authenticated
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
