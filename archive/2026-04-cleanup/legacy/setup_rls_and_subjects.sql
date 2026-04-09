-- ROW LEVEL SECURITY (RLS) & DYNAMIC SUBJECTS

-- 1. Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT CHECK (type IN ('THEORY', 'PRACTICAL', 'OTHER')),
    icon TEXT DEFAULT 'book-outline',
    accent_color TEXT DEFAULT '#3d637e',
    resource_url TEXT
);

-- 2. Insert Default Subjects
INSERT INTO public.subjects (name, type, icon, accent_color, resource_url) VALUES
('Mathematical 2', 'THEORY', 'calculator-variant', '#6C5CE7', 'https://drive.google.com/drive/folders/placeholder_m2'),
('Chemistry', 'THEORY', 'flask-outline', '#00B894', 'https://drive.google.com/drive/folders/placeholder_chemistry'),
('Engineering mechanics', 'THEORY', 'cog-outline', '#E17055', 'https://drive.google.com/drive/folders/placeholder_em'),
('PPS', 'THEORY', 'code-tags', '#0984E3', 'https://drive.google.com/drive/folders/placeholder_pps'),
('Communication skills', 'THEORY', 'microphone-outline', '#FDCB6E', 'https://drive.google.com/drive/folders/placeholder_cs'),
('Engineering mechanics lab', 'PRACTICAL', 'cog-outline', '#E17055', 'https://drive.google.com/drive/folders/placeholder_em_lab'),
('Communication skills lab', 'PRACTICAL', 'microphone-variant', '#FDCB6E', 'https://drive.google.com/drive/folders/placeholder_cs_lab'),
('Chemistry lab', 'PRACTICAL', 'flask', '#00B894', 'https://drive.google.com/drive/folders/placeholder_chemistry_lab'),
('Mathematical 2 lab', 'PRACTICAL', 'calculator-variant', '#6C5CE7', 'https://drive.google.com/drive/folders/placeholder_m2_lab'),
('PPS lab', 'PRACTICAL', 'code-tags-check', '#0984E3', 'https://drive.google.com/drive/folders/placeholder_pps_lab'),
('workshop lab', 'PRACTICAL', 'hammer-wrench', '#E84393', 'https://drive.google.com/drive/folders/placeholder_workshop_lab')
ON CONFLICT (name) DO NOTHING;

-- 3. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 4. Create Security Policies
-- PROFILES: Users can read and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- SUBJECTS: All logged-in users can read
CREATE POLICY "Authenticated users can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);

-- STUDENTS: All logged-in users can read
CREATE POLICY "Authenticated users can view students" ON public.students FOR SELECT TO authenticated USING (true);

-- ATTENDANCE LOGS: All logged-in users can read. Logged-in users can insert/update.
CREATE POLICY "Authenticated users can view attendance" ON public.attendance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert attendance" ON public.attendance_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update attendance" ON public.attendance_logs FOR UPDATE TO authenticated USING (true);
