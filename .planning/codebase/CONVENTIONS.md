# Coding Conventions

**Analysis Date:** 2026-04-09

## Naming Patterns

**Files:**
- Route/screen files use lowercase and kebab-case under `app/` (examples: `app/admin-dashboard.js`, `app/student-dashboard.js`, `app/not-enrolled.js`).
- Reusable component files use PascalCase under `components/` (examples: `components/SubjectCard.js`, `components/AppHeader.js`, `components/ProfileTab.js`).
- Service and utility modules use lowercase camel-like names under `services/` and `utils/` (examples: `services/logger.js`, `services/config.js`, `utils/dashboardHelpers.js`).

**Functions:**
- Use `const` arrow functions for local handlers and async actions (examples: `saveSubject`, `runDiagnostics`, `onRefresh` in `app/admin-dashboard.js`; `handleLogout` in `app/student-dashboard.js`).
- Use verb-first camelCase function names for behavior (`submitAttendance` in `services/api.js`, `withLogging` in `services/logger.js`, `getConfig` in `services/config.js`).

**Variables:**
- Use camelCase for state and locals (`selectedSubjects`, `dbLatency`, `subjectAttendance` in `app/admin-dashboard.js` and `app/student-dashboard.js`).
- Use UPPER_SNAKE_CASE for module constants (`ICONS`, `COLORS` in `app/admin-dashboard.js`; `SUBJECT_META` import in `components/SubjectCard.js`).

**Types:**
- Not applicable in current app runtime code: no TypeScript source files detected in `app/`, `components/`, `services/`, `lib/`, or `utils/`.

## Code Style

**Formatting:**
- Tooling: Not detected (`.prettierrc*` and `biome.json` are not present in repository root).
- Practical style baseline from source: 4-space indentation, semicolons enabled, single quotes preferred, trailing commas commonly used in multiline objects/arrays (patterns visible in `app/_layout.js`, `app/admin-dashboard.js`, and `app/student-dashboard.js`).

**Linting:**
- Tooling: Not detected (`.eslintrc*` and `eslint.config.*` are not present in repository root).
- Current discipline is convention-driven and manual, not rule-enforced by CI or pre-commit automation.

## Import Organization

**Order:**
1. React and framework packages (`react`, `react-native`, `expo-router`, `react-native-paper`) at top of module.
2. Infrastructure and third-party clients (`../lib/supabase`, icons, helpers).
3. Local shared components and context (`../components/*`, `../context/ThemeContext`).

**Path Aliases:**
- Not detected; project uses relative imports (`../lib/supabase`, `../components/AppHeader`, `../utils/dashboardHelpers`).

## Error Handling

**Patterns:**
- Use `try/catch/finally` around async flows that affect auth, data loading, or persistence (examples: `init` in `app/_layout.js`, `app/admin-dashboard.js`, and `app/student-dashboard.js`; `submitAttendance` in `services/api.js`).
- Re-throw in service wrappers when caller must handle UI behavior (`services/api.js`, `services/logger.js`).
- Redirect to safe routes on auth/session failures (`router.replace('/login')` in `app/admin-dashboard.js` and `app/student-dashboard.js`).
- Use soft-fail null returns for configuration reads that should not crash UI (`getConfig` in `services/config.js`).

## Logging

**Framework:** `console` in development and Supabase table logging through `services/logger.js`.

**Patterns:**
- Gate verbose logs using `__DEV__` to reduce production noise (`app/_layout.js`, `app/student-dashboard.js`, `services/api.js`, `services/logger.js`, `services/config.js`).
- Persist operational events with action, message, user context, and latency in `system_logs` via `withLogging` and `logEvent` in `services/logger.js`.

## Comments

**When to Comment:**
- Comments are used to explain intent-heavy logic, especially auth flow decisions, realtime subscriptions, and registry/profile synchronization (examples in `app/admin-dashboard.js`, `app/student-dashboard.js`, `lib/supabase.js`).
- Keep comments explanatory for "why", not line-by-line narrations.

**JSDoc/TSDoc:**
- Limited JSDoc usage exists in service modules (`services/logger.js`, `services/config.js`).
- UI modules generally rely on readable naming rather than formal API docs.

## Function Design

**Size:** 
- Existing screens contain very large multi-responsibility functions/components (notably `app/admin-dashboard.js` and `app/student-dashboard.js`).
- For reliability and maintainability, new logic should be extracted into `services/` or `utils/` functions and smaller child components under `components/`.

**Parameters:**
- Common style: object payloads for DB writes and API calls (`payload` pattern in `app/admin-dashboard.js`; `{ ...data, action }` in `services/api.js`).
- Normalize user-provided identifiers before writes (email lowercasing/trim in `app/admin-dashboard.js`).

**Return Values:**
- Service functions either return parsed result data or throw (`submitAttendance` in `services/api.js`).
- Configuration and non-critical utility services may return nullable fallback values (`getConfig` in `services/config.js`).

## Module Design

**Exports:**
- Default exports for screen/component entry modules (`app/*`, `components/*`).
- Named exports for service helper modules (`services/api.js`, `services/logger.js`, `services/config.js`, `lib/supabase.js`).

**Barrel Files:**
- Not used; imports target direct file paths.

---

*Convention analysis: 2026-04-09*
