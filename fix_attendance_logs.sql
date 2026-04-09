-- ==========================================================
-- 🛠️ PATCH: FIX ATTENDANCE LOGS SCHEMA
-- ==========================================================
-- I noticed the UI expects attendance_logs to store individual 
-- student records (roll_no, status) instead of just session metadata.
-- This script fixes the table schema so the 'Submit' button works!

DROP TABLE IF EXISTS public.attendance_logs CASCADE;

CREATE TABLE public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch TEXT NOT NULL,
    subject TEXT NOT NULL,
    date DATE NOT NULL,
    batch TEXT,
    roll_no INTEGER NOT NULL,
    status INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- The critical UNIQUE constraint required for React Native Upsert
    UNIQUE NULLS NOT DISTINCT (branch, subject, date, batch, roll_no)
);

-- Re-apply simple security rules so anyone logged in can insert
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated reads" ON public.attendance_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow writes attendance" ON public.attendance_logs FOR ALL USING (auth.role() = 'authenticated');

-- Also, the UI was trying to log successes to a system_logs table
-- that we accidentally deleted. Let's safely recreate it so it stops complaining!
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT,
    action_name TEXT,
    message TEXT,
    user_id UUID,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow system logs writes" ON public.system_logs FOR ALL USING (auth.role() = 'authenticated');
