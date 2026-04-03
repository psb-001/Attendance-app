-- ==========================================
-- APP CONFIG TABLE — Database-Driven Settings
-- ==========================================
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create the config table
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS and allow authenticated users to read
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read config" 
    ON public.app_config FOR SELECT TO authenticated USING (true);

-- 3. Insert the Google Script URL placeholder
-- (You will UPDATE this value after deploying google_script.js)
INSERT INTO public.app_config (key, value, description) VALUES 
    ('google_script_url', '', 'Google Apps Script Web App URL for attendance sync to Google Sheets')
ON CONFLICT (key) DO NOTHING;

-- Done! Now go deploy google_script.js in Google Sheets,
-- then update the value here with the deployed URL.
SELECT '✅ app_config table created! Deploy your Google Script and update the URL.' as status;
