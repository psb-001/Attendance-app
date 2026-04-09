-- ==============================================
-- 🔧 FIX BATCH ASSIGNMENTS (All Branches)
-- ==============================================
-- B1: Roll 1–21 | B2: Roll 22–42 | B3: Roll 43+
-- Applies uniformly across every branch.

-- STEP 1: Set B1 (Roll 1 to 21)
UPDATE public.students_registry
SET batch = 'B1'
WHERE roll_no >= 1 AND roll_no <= 21;

-- STEP 2: Set B2 (Roll 22 to 42)
UPDATE public.students_registry
SET batch = 'B2'
WHERE roll_no >= 22 AND roll_no <= 42;

-- STEP 3: Set B3 (Roll 43 onward)
UPDATE public.students_registry
SET batch = 'B3'
WHERE roll_no >= 43;

-- ✅ VERIFY: Check the distribution
SELECT branch, batch, COUNT(*) as student_count
FROM public.students_registry
GROUP BY branch, batch
ORDER BY branch, batch;
