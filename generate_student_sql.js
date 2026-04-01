const fs = require('fs');
const path = require('path');

// Configuration
const inputPath = path.join(__dirname, 'students.json');
const outputPath = path.join(__dirname, 'insert_students.sql');

// Read JSON
if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found at ${inputPath}`);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const collegeData = data.MES_Mukunddas_Lohia_College_of_Engineering;

// 1. Initial SQL Setup
let sqlOutput = `-- ==========================================
-- COMPLETE SYSTEM-SIDE STUDENT DATA SYNC
-- ==========================================
-- This script handles EVERYTHING: Table creation, Data Population, and Profile Syncing.

-- 1. Setup the Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    branch TEXT NOT NULL,
    roll_no TEXT
);

-- 2. Setup the Attendance Logs Table (Crucial for submission)
DROP TABLE IF EXISTS public.attendance_logs CASCADE;
CREATE TABLE public.attendance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch TEXT NOT NULL,
    subject TEXT NOT NULL,
    date TEXT NOT NULL,
    roll_no TEXT NOT NULL,
    status INTEGER NOT NULL, -- 1 for present, 0 for absent
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(branch, subject, date, roll_no)
);

-- 3. Clear existing entries to avoid conflicts
TRUNCATE public.students CASCADE;

-- 4. Ensure profiles table has correct columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roll_no TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- ==========================================
-- POPULATING STUDENTS
-- ==========================================
\n`;

// 2. Iterate through data and generate INSERTS
Object.entries(collegeData.Departments).forEach(([branchKey, students]) => {
    // Correctly map branch name to match app/branch.js
    let branchName = branchKey.replace(/_/g, ' ');
    if (branchName === 'Computer Science and Engineering AIML') {
        branchName = 'AI / ML';
    }

    sqlOutput += `-- Branch: ${branchName}\n`;
    students.forEach((student, i) => {
        const name = student.Name ? student.Name.replace(/'/g, "''") : 'Unknown';
        const email = student.Email ? student.Email.replace(/'/g, "''") : 'unknown@domain.com';
        const rollNo = student.RollNo || (i + 1);
        
        sqlOutput += `INSERT INTO public.students (name, email, branch, roll_no) VALUES ('${name}', '${email}', '${branchName}', '${rollNo}');\n`;
    });
});

sqlOutput += `\n-- 4. FINAL STEP: Retro-Sync every student into their login profile right now
INSERT INTO public.profiles (id, full_name, role, branch, roll_no, email)
SELECT u.id, s.name, 'student', s.branch, s.roll_no, u.email
FROM auth.users u
JOIN public.students s ON LOWER(TRIM(u.email)) = LOWER(TRIM(s.email))
ON CONFLICT (id) DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    role = 'student',
    branch = EXCLUDED.branch,
    roll_no = EXCLUDED.roll_no,
    email = EXCLUDED.email;

-- SUCCESS MESSAGE
SELECT 'STUDENT DATA SYNC COMPLETE! PLEASE REFRESH YOUR APP.' as status;
\n`;

fs.writeFileSync(outputPath, sqlOutput);
console.log(`\n✅ Success! Generated ${outputPath}`);
console.log(`\nPlease run the entire content of ${outputPath} in the Supabase SQL Editor.`);
