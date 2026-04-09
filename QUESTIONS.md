# The "Presenly" Professional Blueprint 🏛️

This document contains all the architectural and feature-level decisions we need to make before executing the **Ironclad Stabilization (Deep Cleanup)**. Answering these ensures the app is stable, secure, and ready for production.

---

## 🏗️ Pillar 1: Architecture & Identity
These questions define the "Nervous System" of your database.

**1. Student Identity [ID]**
- **Option A**: Roll Number is the "Master Key." If a student changes their Email, their records stay safe under their Roll Number.
- **Option B**: Email is the "Master Key."
- *Recommendation*: Option A (Roll Number).

**2. Data Deletion [ARCHIVE]**
- When an Admin deletes a **Branch** (like CSE) or a **Batch** (2024), what happens to the history?
- **Option A**: Delete everything instantly.
- **Option B**: "Archived/Hide." The data stays in the DB but disappears from the app.
- *Recommendation*: Option B (Safer).

**3. Attendance Lockdown [TIME]**
- **Option A**: Lock at midnight. Teachers cannot edit yesterday's attendance.
- **Option B**: Manual always. Teachers can edit attendance for any date at any time.
- *Recommendation*: Option A (Prevents cheating/fraud).

**4. Registry Guard [GUARD]**
- What happens if a person logs in whose email is **not** in any Registry (Teacher/Admin/Student)?
- **Option A**: Show an "Access Denied / Not Enrolled" screen.
- **Option B**: Let them in as a "Guest" with no data.
- *Recommendation*: Option A (Security).

**5. Admin Hierarchy [ADMIN]**
- **Option A**: All Admins are equal (Any admin can delete another).
- **Option B**: "Super Admin" (You) is the only one who can manage other Admins.

---

## 📈 Pillar 2: Professional Features
These questions define the user experience.

**6. User Interface [UI]**
- **Option A**: Pure AMOLED Black only (Best for battery/style).
- **Option B**: Add a toggle for "Light Mode."

**7. Subject Colors [COLOR]**
- Should the Admin specify the color of each subject (Math = Blue, Science = Green), or should the app pick them automatically?

**8. Student Profile Control [PROFILE]**
- Can students edit their own **Name** or **Photo**, or is this "Locked" by the Admin?

**9. Attendance Visibility [PRIVACY]**
- Can a student see who else was present in their class, or only their own stats?

**10. Risk Cutoff [RISK]**
- What is the percentage for a "Red Alert"? (e.g., < 75% attendance turns red).

**11. Historical Cleanup [HISTORY]**
- After a long time (e.g., 1 year), should the app move old logs to a separate "Archive" to keep the main dashboard fast?

**12. Real-Time Sync [SYNC]**
- Do you want the app to update **instantly** (e.g., a student's phone blinks the second a teacher marks them present), or is "Refresh on Open" okay?

**13. Google Sheets Divorce [SHEETS]**
- **Option A**: Keep Google Sheets as a secondary backup (making the app slightly slower).
- **Option B**: Use Supabase as the **only** source of truth (making the app much faster).

---

## 📝 RESPONSE TEMPLATE
Please copy and paste this into our chat (or fill the file) with your choices:

```markdown
1.  [ID]: 
2.  [ARCHIVE]: 
3.  [TIME]: 
4.  [GUARD]: 
5.  [ADMIN]: 
6.  [UI]: 
7.  [COLOR]: 
8.  [PROFILE]: 
9.  [PRIVACY]: 
10. [RISK]: 
11. [HISTORY]: 
12. [SYNC]: 
13. [SHEETS]: 
14. [OTHER]: (Any extra notes or features you want)
```
---

## 📅 Pillar 3: Academic Cycle & Promotions
These questions solve the "Year-over-year" problem.

**14. Student Tracking [PROMOTION]**
- **Option A**: Automatic Calculation. We store their **Batch** (e.g., 2024-2028), and the app automatically shows them as 1st/2nd/3rd Year based on the current date.
- **Option B**: Manual Label. Admin manually changes every student from "1st Year" to "2nd Year" at the end of the year.
- *Recommendation*: Option A (Zero work for the Admin).

**15. Graduated Data [ALUMNI]**
- When a student finishes 4th year, what happens to their logs?
- **Option A**: Delete.
- **Option B**: Move to a separate `alumni_archive` table to keep the main DB light.
 Broadway: 100
