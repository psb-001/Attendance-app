# Architecture

**Analysis Date:** 2026-04-09

## Pattern Overview

**Overall:** Route-centric client architecture (Expo Router) with direct Backend-as-a-Service access (Supabase) and thin service helpers.

**Key Characteristics:**
- UI screens in `app/` own orchestration, data fetching, authorization guards, and interaction state.
- Shared visual composition is extracted to `components/`, while persistence helpers stay in `services/` and `constants/`.
- Domain boundaries are role-driven (teacher, student, admin) but not enforced as separate feature modules, so cross-role coupling is possible.

## Layers

**Navigation & Screen Layer:**
- Purpose: Define routes and execute page-level workflows.
- Location: `app/`
- Contains: Route files such as `app/index.js`, `app/admin-dashboard.js`, `app/student-dashboard.js`, `app/attendance.js`, `app/summary.js`, `app/_layout.js`.
- Depends on: `lib/supabase.js`, `services/storage.js`, `services/config.js`, `constants/batches.js`, `components/*`, `context/ThemeContext.js`.
- Used by: Expo Router entry configured by `package.json` (`expo-router/entry`).

**Presentation Component Layer:**
- Purpose: Reusable UI building blocks and shared dashboard sections.
- Location: `components/`
- Contains: Components such as `components/AppHeader.js`, `components/AppSidebar.js`, `components/SubjectCard.js`, `components/TeacherReportsTab.js`, `components/ProfileTab.js`.
- Depends on: React Native / React Native Paper primitives and utility helpers (`utils/dashboardHelpers.js`).
- Used by: Route screens in `app/`.

**Client Service Layer:**
- Purpose: Encapsulate storage, remote submission transport, app config fetch, and telemetry wrappers.
- Location: `services/`
- Contains: `services/storage.js`, `services/api.js`, `services/config.js`, `services/logger.js`.
- Depends on: `lib/supabase.js`, `@react-native-async-storage/async-storage`, Fetch API.
- Used by: Screens in `app/`, mainly attendance flow in `app/attendance.js` and `app/summary.js`.

**Data Access Layer:**
- Purpose: Initialize and expose Supabase client and auth/session persistence behavior.
- Location: `lib/supabase.js`
- Contains: `createClient(...)` initialization and auth storage configuration.
- Depends on: `@supabase/supabase-js`, `@react-native-async-storage/async-storage`.
- Used by: Nearly all routes/services/components that need backend access.

**State/Context Layer:**
- Purpose: Global UI theming state.
- Location: `context/ThemeContext.js`
- Contains: `ThemeContext`, `ThemeProvider`, `isDark` and `toggleTheme`.
- Depends on: `useColorScheme`.
- Used by: `app/_layout.js` and UI across `app/` and `components/`.

## Data Flow

**Authentication & Route Gate Flow:**

1. App bootstraps in `app/_layout.js`, initializes fonts/theme, then gets auth session via `supabase.auth.getSession()`.
2. Route screens (for example `app/index.js`, `app/admin-dashboard.js`, `app/student-dashboard.js`) re-check session and fetch profile records from `profiles`.
3. Screen logic decides role route transitions (`/admin-dashboard`, `/student-dashboard`, `/not-enrolled`, etc.) and loads role-specific data.

**Attendance Capture & Submission Flow:**

1. Teacher navigates from `app/index.js` to `app/branch.js` / `app/batch.js` and then `app/attendance.js`.
2. Student roster is fetched from Supabase (`students_registry`) and merged with local cached attendance in `services/storage.js`.
3. Final confirmation and submission occurs in `app/summary.js`, which upserts attendance to `attendance_logs` and marks submission state in local storage.
4. Optional secondary sync posts to Google Apps Script URL through `services/api.js` when `services/config.js` returns `google_script_url`.

**State Management:**
- State is local-first via React hooks inside route files.
- Cross-screen shared state is minimal and limited to theming in `context/ThemeContext.js`.
- Persistence state mixes local device cache (`AsyncStorage`) and remote truth (`attendance_logs`) in `services/storage.js`.

## Key Abstractions

**Role-based Dashboard Segmentation:**
- Purpose: Keep student, teacher, and admin behavior logically separated by route.
- Examples: `app/index.js` (teacher), `app/student-dashboard.js`, `app/admin-dashboard.js`.
- Pattern: Role checks are implemented inline in each route via profile/session queries.

**Reusable Dashboard Shell Components:**
- Purpose: Reduce UI duplication across role dashboards.
- Examples: `components/AppHeader.js`, `components/AppSidebar.js`, `components/ProfileTab.js`, `components/InfoSections.js`.
- Pattern: Screen-level composition with prop-driven rendering.

**Attendance Local-Remote Synchronization Helper:**
- Purpose: Maintain offline/editability while reconciling with server state.
- Examples: `services/storage.js`, usage in `app/attendance.js` and `app/summary.js`.
- Pattern: Key-based local caching + periodic/explicit Supabase verification.

## Entry Points

**Router Entry:**
- Location: `package.json` (`main: "expo-router/entry"`).
- Triggers: App startup on native/web.
- Responsibilities: Mount file-based router and route tree.

**Root Layout Entry:**
- Location: `app/_layout.js`.
- Triggers: Initial route tree render.
- Responsibilities: App-wide providers, splash/font readiness, auth session bootstrap, route stack configuration.

**Feature Flow Entries:**
- Location: `app/index.js`, `app/admin-dashboard.js`, `app/student-dashboard.js`.
- Triggers: Role-directed navigation after auth/profile lookup.
- Responsibilities: Data fetch orchestration, role UX, action handoff to attendance path.

## Error Handling

**Strategy:** UI-level try/catch and guard-redirect approach with fallback alerts/logs, without centralized error middleware.

**Patterns:**
- Guard clauses redirect unauthorized users in route files (`app/index.js`, `app/admin-dashboard.js`, `app/student-dashboard.js`, `app/branch.js`, `app/batch.js`).
- Operational failures show `Alert` or console warnings in-place (`app/attendance.js`, `app/summary.js`, `services/*`).
- Root UI boundary exists in `app/_layout.js` (`ErrorBoundary`) for render-time failures.

## Cross-Cutting Concerns

**Logging:** Mixed strategy: `console.*` in dev and optional persisted telemetry into `system_logs` via `services/logger.js` and direct inserts in `app/summary.js` / `app/admin-dashboard.js`.

**Validation:** Input/state checks are mostly inline and procedural in route handlers (`app/admin-dashboard.js`, `app/summary.js`, `app/attendance.js`), with limited shared validation abstraction.

**Authentication:** Supabase auth session checks are repeated per route (`supabase.auth.getSession()`), then profile-role checks are performed against `profiles`.

---

*Architecture analysis: 2026-04-09*
