# External Integrations

**Analysis Date:** 2026-04-09

## APIs & External Services

**Backend-as-a-Service:**
- Supabase - primary identity, database, and logging backend for the app
  - SDK/Client: `@supabase/supabase-js` (`package.json`)
  - Auth: Supabase OTP/session APIs used from `app/login.js`, `app/_layout.js`, `app/index.js`, `app/student-dashboard.js`
  - Integration surface: reads/writes across `profiles`, `teachers`, `students_registry`, `subjects`, `attendance_logs`, `branches`, `batches`, `system_logs`, `app_config` in `app/*.js`, `components/*.js`, `services/*.js`

**Secondary Reporting Endpoint:**
- Google Apps Script-style HTTP endpoint - attendance mirror sync path
  - SDK/Client: native `fetch` via `services/api.js`
  - Auth: URL lookup through Supabase `app_config` key `google_script_url` in `services/config.js` and `app/summary.js`
  - Coupling note: endpoint is optional at runtime but invoked for sync/reset flows in `app/summary.js`

**Fonts/CDN Assets:**
- Expo Google Fonts packages - remote font provisioning at runtime/build
  - SDK/Client: `@expo-google-fonts/inter`, `@expo-google-fonts/outfit`, `@expo-google-fonts/plus-jakarta-sans` (`package.json`)
  - Auth: Not applicable

## Data Storage

**Databases:**
- Supabase Postgres
  - Connection: currently embedded in `lib/supabase.js` (URL and anon key are not injected from env in app runtime path)
  - Client: `@supabase/supabase-js`

**File Storage:**
- Device-local media/export path through Expo modules (`expo-media-library`, `expo-print`, `expo-sharing`) used by `app/summary.js` and `components/TeacherReportsTab.js`

**Caching:**
- Local key-value cache via `@react-native-async-storage/async-storage` for attendance/session flags in `services/storage.js`
- In-memory config cache in `services/config.js`

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: email OTP (`signInWithOtp`, `verifyOtp`) in `app/login.js`; session checks and auth change listeners in `app/_layout.js`

## Monitoring & Observability

**Error Tracking:**
- No dedicated third-party error tracker detected (Sentry/Crashlytics not detected)

**Logs:**
- Application operational logs persisted to Supabase table `system_logs` via `services/logger.js` and direct inserts in `app/summary.js`, `app/admin-dashboard.js`
- Development-only console diagnostics guarded by `__DEV__`

## CI/CD & Deployment

**Hosting:**
- Mobile binaries built through EAS profiles (`eas.json`)
- OTA update endpoint configured through Expo Updates URL in `app.json`

**CI Pipeline:**
- External CI workflow config not detected in repository

## Environment Configuration

**Required env vars:**
- Runtime app path does not require env vars for Supabase because credentials are hardcoded in `lib/supabase.js`
- Optional script/tooling path expects `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `test_identity.js`

**Secrets location:**
- Supabase URL/key are currently stored in source (`lib/supabase.js`)
- Additional dynamic config values are pulled from Supabase `app_config` (`services/config.js`)

## Webhooks & Callbacks

**Incoming:**
- None detected in app code

**Outgoing:**
- HTTP POST to external endpoint via `submitAttendance` in `services/api.js`, called from `app/summary.js`
- Supabase realtime channel subscription in `app/admin-dashboard.js` for `system_logs` updates

---

*Integration audit: 2026-04-09*
