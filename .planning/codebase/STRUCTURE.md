# Codebase Structure

**Analysis Date:** 2026-04-09

## Directory Layout

```text
attendance app/
├── app/                    # Expo Router routes and screen orchestration
├── components/             # Reusable UI components used across routes
├── services/               # Client-side data/service helpers (storage, API, config, logging)
├── lib/                    # Backend client initialization (Supabase)
├── context/                # Cross-route React context providers
├── constants/              # Shared reference/config-like data helpers
├── utils/                  # Pure helper utilities for formatting and display logic
├── assets/                 # Static assets (icons, splash, images)
├── .planning/codebase/     # Architecture/stack/conventions mapping docs
├── legacy/                 # Historical migration/support scripts
├── package.json            # Dependency and script manifest
└── app.json                # Expo app configuration
```

## Directory Purposes

**`app/`:**
- Purpose: Route-level modules that combine UI, auth checks, data reads/writes, and navigation decisions.
- Contains: Screen files such as `app/index.js`, `app/admin-dashboard.js`, `app/student-dashboard.js`, `app/attendance.js`, `app/summary.js`, plus router scaffold in `app/_layout.js`.
- Key files: `app/_layout.js`, `app/index.js`, `app/admin-dashboard.js`, `app/student-dashboard.js`, `app/attendance.js`, `app/summary.js`.

**`components/`:**
- Purpose: Shared visual units and dashboard fragments that reduce duplication between role-specific screens.
- Contains: Header/navigation cards, tabs, empty states, and role-specific sections.
- Key files: `components/AppHeader.js`, `components/AppSidebar.js`, `components/ProfileTab.js`, `components/SubjectCard.js`, `components/TeacherReportsTab.js`.

**`services/`:**
- Purpose: Thin service wrappers for local cache, remote submission, config retrieval, and telemetry.
- Contains: Async helpers that are invoked by route files.
- Key files: `services/storage.js`, `services/api.js`, `services/config.js`, `services/logger.js`.

**`lib/`:**
- Purpose: Shared client bootstrap for backend connectivity.
- Contains: Supabase singleton setup with auth persistence.
- Key files: `lib/supabase.js`.

**`constants/`:**
- Purpose: Cached/fallback domain constants tied to attendance logic.
- Contains: Batch range loading and classification logic.
- Key files: `constants/batches.js`.

**`context/`:**
- Purpose: App-level shared state providers.
- Contains: Theme context and toggle behavior.
- Key files: `context/ThemeContext.js`.

**`utils/`:**
- Purpose: Stateless helper functions for dashboard formatting and display transformations.
- Contains: Date/greeting/initials helper modules.
- Key files: `utils/dashboardHelpers.js`.

## Key File Locations

**Entry Points:**
- `package.json`: Sets `main` to `expo-router/entry`.
- `app/_layout.js`: Root composition for providers, stack routes, auth bootstrap, and theme.

**Configuration:**
- `app.json`: Expo app metadata/runtime configuration.
- `eas.json`: EAS build/update profiles.
- `services/config.js`: Runtime app configuration lookup from database-backed `app_config`.

**Core Logic:**
- `lib/supabase.js`: Supabase client and auth storage behavior.
- `services/storage.js`: Attendance caching/submission-state synchronization behavior.
- `app/attendance.js`: Teacher attendance marking workflow.
- `app/summary.js`: Final submission/reset workflow and optional mirror sync.
- `app/admin-dashboard.js`: Administrative roster/curriculum/system operations.

**Testing:**
- Not detected in current repository (`*.test.*`, `*.spec.*`, or dedicated test directories are absent).

## Naming Conventions

**Files:**
- Route files are kebab/lowercase names mapped to URL paths (`app/student-dashboard.js`, `app/admin-dashboard.js`, `app/not-enrolled.js`).
- Component files are PascalCase (`components/AppHeader.js`, `components/ResourceCard.js`).
- Service and helper files are lowercase (`services/storage.js`, `services/api.js`, `utils/dashboardHelpers.js`).

**Directories:**
- Functional grouping by layer (`app`, `components`, `services`, `lib`, `constants`, `context`, `utils`) rather than domain-specific feature folders.

## Where to Add New Code

**New Feature:**
- Primary code: Add route orchestration in `app/` when feature is route-visible; add shared visual fragments in `components/`.
- Tests: Add under a new `__tests__/` directory or co-located `*.test.js` files near feature files (no existing pattern is currently enforced).

**New Component/Module:**
- Implementation: Place reusable UI in `components/`; avoid embedding reusable view logic directly in `app/*.js`.

**Utilities:**
- Shared helpers: Place pure utilities in `utils/`.
- Data/service helpers: Place persistence/integration helpers in `services/`.
- Backend client changes: Keep in `lib/supabase.js` and avoid duplicate client initialization elsewhere.

## Special Directories

**`legacy/`:**
- Purpose: Historical scripts and migration-era operational files.
- Generated: No.
- Committed: Yes.

**`.planning/codebase/`:**
- Purpose: AI-consumable project mapping documents for planning and execution agents.
- Generated: Yes (agent-maintained).
- Committed: Yes.

**`android/`:**
- Purpose: Native Android project created by Expo prebuild/run workflows.
- Generated: Yes.
- Committed: Yes.

---

*Structure analysis: 2026-04-09*
