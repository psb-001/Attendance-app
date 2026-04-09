-- ==========================================
-- BATCH MIGRATION: Hardcoded → Database
-- ==========================================
-- Run this in Supabase SQL Editor BEFORE updating the app code.

-- 1. Create the batches table
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    value TEXT NOT NULL UNIQUE,        -- 'B1', 'B2', 'B3'
    name TEXT NOT NULL,                -- 'Batch B1'
    start_roll INTEGER NOT NULL,       -- First roll number in this batch
    end_roll INTEGER NOT NULL,         -- Last roll number (use 999 for "open-ended")
    icon TEXT DEFAULT 'account-group', -- MaterialCommunityIcons name
    color TEXT DEFAULT '#0984E3',      -- Accent hex color
    sort_order INTEGER DEFAULT 0,      -- Display order
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert the existing batch data (matches what was hardcoded)
INSERT INTO public.batches (value, name, start_roll, end_roll, icon, color, sort_order) VALUES
    ('B1', 'Batch B1', 1,  21,  'account-group', '#0984E3', 1),
    ('B2', 'Batch B2', 22, 42,  'account-group', '#00B894', 2),
    ('B3', 'Batch B3', 43, 999, 'account-group', '#00CEC9', 3)
ON CONFLICT (value) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- 4. Everyone can read batches (teachers need them for attendance, students for display)
CREATE POLICY "Authenticated users can view batches"
ON public.batches FOR SELECT
TO authenticated
USING (true);

-- 5. Only admins can manage batches
CREATE POLICY "Admins can insert batches"
ON public.batches FOR INSERT
WITH CHECK ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Admins can update batches"
ON public.batches FOR UPDATE
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

CREATE POLICY "Admins can delete batches"
ON public.batches FOR DELETE
USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
