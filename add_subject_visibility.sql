-- Add the 'is_hidden' column to the subjects table
-- By default, no subjects are hidden until the Admin explicitly hides them.
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;
