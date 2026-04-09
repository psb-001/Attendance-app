-- Run this script in the Supabase SQL Editor

CREATE TABLE public.system_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type text NOT NULL CHECK (event_type IN ('SUCCESS', 'ERROR', 'WARN', 'INFO')),
    action_name text NOT NULL,
    message text,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    latency_ms integer,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security (RLS)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to INSERT logs
CREATE POLICY "Allow authenticated inserts into system_logs"
    ON public.system_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow only ADMINS to SELECT logs
CREATE POLICY "Allow admins to read system_logs"
    ON public.system_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Enable realtime support for the table
ALTER PUBLICATION supabase_realtime ADD TABLE system_logs;
