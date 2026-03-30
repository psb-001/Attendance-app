# Attendance App Roadmap

This document tracks the current status and future milestones of the Attendance Management System.

## Current Status (March 30, 2026)
- **Student Dashboard**: Completed navigation overhaul with "Home", "Attendance", and "Resources" tabs.
- **Resource Tab**: Functional redirection to Google Drive folders via `ResourceCard`.
- **Auth Resilience**: Implementation of automatic session recovery and auto-logout on stale tokens to prevent app crashes.

## Future Milestones (Paused)

### 1. Superadmin Management HUB
A dedicated "God Mode" interface for administrators to manage the platform directly from the app.
- **Status**: Research & Conceptualized (Discussed).
- **Core Features**:
    - **User Directory**: Searchable list of all Students and Teachers.
    - **Profile Corrections**: Edit emails, names, and academic data (Branch, Roll Number) in-app.
    - **Role Management**: Promote/demote users between Student, Teacher, and Superadmin roles.
    - **Unified Stats**: High-level system overview (Total Users, Active Sessions).
- **Implementation Path**:
    - Build `app/management.js`.
    - Update `_layout.js` for role-based tab visibility.
    - Secure all operations via Supabase RLS.

### 2. Advanced Teacher Controls
- **Attendance History**: A detailed list of past roll calls for each subject.
- **Summary Exports**: Ability to export attendance data as CSV or PDF directly from the app.

---
> [!NOTE]
> Work on the **Superadmin Management HUB** is currently on hold at the user's request. All conceptual research and draft plans are saved here for quick resumption.
