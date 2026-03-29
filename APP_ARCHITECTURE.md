# Attendance Management System - Documentation

## 📌 Overview
A mobile application for professors at MES Mukunddas Lohia College of Engineering to manage student attendance. It integrates with Google Sheets as a backend for persistent storage and reporting.

---

## 🛠️ Tech Stack
- **Frontend**: React Native (Expo)
- **Navigation**: Expo Router (File-based routing)
- **UI Components**: React Native Paper
- **Backend/Database**: Google Apps Script & Google Sheets
- **Local Storage**: AsyncStorage (for offline support)

---

## 🏗️ Core Logic Breakdowns

### 1. API Submission (`services/api.js`)
The app sends data as a JSON payload to a specific Google Script URL.
```javascript
export const submitAttendance = async (url, data) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, action: data.action || 'submit' }),
    });
    const result = JSON.parse(await response.text());
    if (result.status !== 'success') throw new Error(result.message);
    return result;
};
```

### 2. Sheet Handling & Formula Injection (`google_script.js`)
The backend is responsible for maintaining the spreadsheet structure and calculating percentages automatically.
```javascript
// Creates/Updates formulas for Total & Percentage columns
if (totalColIndex > 3) { 
    const endColLetter = columnToLetter(totalColIndex - 1);
    const totalColLetter = columnToLetter(totalColIndex);
    
    rowsToUpdate.forEach(r => {
        const range = `C${r}:${endColLetter}${r}`;
        // Count '1's in the date range
        sheet.getRange(r, totalColIndex).setFormula(`=COUNTIF(${range}, 1)`);
        // Calculate % based on non-empty cells in the range
        sheet.getRange(r, percColIndex).setFormula(`=IFERROR((${totalColLetter}${r} / COUNTA(${range})) * 100, 0)`);
    });
}
```

### 3. Submission Payload Structure (`app/summary.js`)
When a professor hits "Submit", the app bundles the local attendance state into this format:
```javascript
const payload = {
    date,
    division,
    subject,
    studentStatuses: filteredStudents.map(s => ({
        rollNo: s.rollNo,
        name: s.name,
        status: (attendance[s.rollNo]) ? 1 : 0 // 1 = Present, 0 = Absent
    })),
    // ... stats
};
```

---

## 📂 File Structure

- `app/`: Contains the main screens (Index, Attendance, Summary, Division).
- `services/`:
  - `api.js`: Handles POST requests to the Google Script backend.
  - `storage.js`: Logic for persistent local data and submission status.
- `constants/config.js`: Maps subjects to their respective Google Apps Script deployment URLs.
- `data/students.json`: The source of truth for student names and roll numbers.
- `google_script.js`: The server-side code deployed on Google Apps Script. It handles sheet creation, column insertion for new dates, and formula-based percentage calculation.

---

## ☁️ Backend Logic (`google_script.js`)
The backend is a robust Google Apps Script that:
- **Ensures Sheet Existence**: Automatically creates a "Division X" sheet if it doesn't exist.
- **Dynamic Columns**: Inserts a new column for every date submitted.
- **Automatic Formulas**: Writes `=COUNTIF` and `=IFERROR` formulas into the "Total Lectures" and "Percentage" columns to keep them updated in real-time.
- **Data Integrity**: Uses `LockService` to prevent race conditions during simultaneous submissions.

---

## 🚀 Key Features
- **Offline Readiness**: Local storage ensures data isn't lost if the network drops.
- **Duplicate Prevention**: Prevents multiple submissions for the same date/subject/division.
- **Absent List Sharing**: Quick export of absent student names for department records.
