# Testing Patterns

**Analysis Date:** 2026-04-09

## Test Framework

**Runner:**
- Not detected for app runtime (`jest.config.*` and `vitest.config.*` not present).
- Config: Not applicable.

**Assertion Library:**
- Not applicable for app runtime because no automated unit/integration test harness is configured.

**Run Commands:**
```bash
npm run start            # Starts Expo dev server (manual verification)
npm run android          # Runs Android build/dev flow for manual checks
npm run web              # Runs web target for manual checks
```

## Test File Organization

**Location:**
- No co-located `*.test.*` or `*.spec.*` files detected in `app/`, `components/`, `services/`, `lib/`, `utils/`.
- Two ad hoc Node diagnostics exist at repository root: `test_db.js` and `test_identity.js`.

**Naming:**
- Current diagnostic script naming uses `test_*.js` at root, but files are not connected to a test runner.

**Structure:**
```
Manual UI/Auth verification via Expo app routes in `app/`
Ad hoc DB diagnostics via root scripts (`test_db.js`, `test_identity.js`)
```

## Test Structure

**Suite Organization:**
```typescript
// Not detected: no describe/it/test suites configured with Jest/Vitest.
```

**Patterns:**
- Setup pattern: manual session and role checks are embedded in route initializers (`init` in `app/admin-dashboard.js`, `app/student-dashboard.js`, `app/_layout.js`).
- Teardown pattern: realtime/channel cleanup exists in runtime code (`return () => { clearInterval(...); supabase.removeChannel(channel); }` in `app/admin-dashboard.js`), but not in automated test fixtures.
- Assertion pattern: behavioral checks rely on route redirects, guard clauses, and alerts instead of formal assertions.

## Mocking

**Framework:** Not detected.

**Patterns:**
```typescript
// Not detected: no standardized mocking layer for `supabase`, router, or timers.
```

**What to Mock:**
- For future unit tests, mock Supabase client calls from `lib/supabase.js` and route navigation from `expo-router`.

**What NOT to Mock:**
- Keep integration coverage against real schema contracts for role/profile transitions used by `app/admin-dashboard.js` and `app/student-dashboard.js`.

## Fixtures and Factories

**Test Data:**
```typescript
// Not detected: no fixture/factory utilities in current codebase.
```

**Location:**
- Not applicable currently.

## Coverage

**Requirements:** None enforced in repository configuration.

**View Coverage:**
```bash
Not applicable (coverage tooling not configured)
```

## Test Types

**Unit Tests:**
- Not used in current repository state.

**Integration Tests:**
- Informal integration checks occur through live Supabase interactions in app code (`app/admin-dashboard.js`, `app/student-dashboard.js`, `services/logger.js`, `services/config.js`), but they are not automated or repeatable in CI.

**E2E Tests:**
- Not used; no Detox/Playwright/Cypress/Appium configuration detected.

## Common Patterns

**Async Testing:**
```typescript
// Current operational pattern in code, not in test harness:
try {
    const { data, error } = await supabase.from('profiles').select('*').maybeSingle();
    if (error) throw error;
} catch (err) {
    router.replace('/login');
}
```

**Error Testing:**
```typescript
// Current operational pattern in services, not in test harness:
try {
    result = JSON.parse(text);
} catch (e) {
    throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
}
```

---

*Testing analysis: 2026-04-09*
