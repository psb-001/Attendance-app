# Codebase Concerns

**Analysis Date:** 2026-04-09  
**Production Readiness Lens:** Operational resilience, security posture, data integrity guarantees, performance under growth, and maintainability risk.

## Severity Scale

- **Critical:** High likelihood + high impact; can cause unauthorized access, data loss/corruption, or prolonged outage.
- **High:** Significant user/business impact; likely to cause recurring incidents or unsafe operations.
- **Medium:** Noticeable degradation or elevated incident probability; manageable short-term but should be planned.
- **Low:** Limited impact today; monitor and address during routine hardening.

## Top Production Risks (Prioritized)

### 1) Client-side privileged data access model
- Severity: **Critical**
- Category: Security, Data Integrity
- Issue: Core write operations for registry, profile, teacher, subject, and attendance data are executed directly from client screens.
- Files: `app/admin-dashboard.js`, `app/summary.js`, `app/attendance.js`, `app/not-enrolled.js`
- Impact: If RLS/policies are misconfigured or broadened, mobile/web clients can perform destructive updates/deletes directly. Blast radius includes role escalation, unauthorized enrollment changes, and attendance tampering.
- Rationale: The app performs direct `.insert()/.update()/.delete()` calls from UI code across high-value tables.
- Fix approach: Move privileged mutations to server-side endpoints or Supabase RPC functions with strict authorization checks; keep client writes minimal and scoped.

### 2) Supabase project URL and anon key hardcoded in source
- Severity: **Critical**
- Category: Security, Operations
- Issue: Supabase connection credentials are committed in code instead of runtime environment configuration.
- Files: `lib/supabase.js`, `test_db.js`
- Impact: Key rotation is harder, accidental project reuse risk increases, and leaked binaries/source guarantee permanent credential exposure.
- Rationale: Credentials are static constants in tracked files and used by all app clients.
- Fix approach: Load from environment (`EXPO_PUBLIC_*`) with per-environment configs; rotate current keys; remove credential literals from repository history where possible.

### 3) Over-permissive authenticated RLS policies in reset SQL
- Severity: **High**
- Category: Security, Data Integrity
- Issue: SQL reset scripts define broad "authenticated can do all actions" policies on multiple tables.
- Files: `database_master_reset.sql`, `nuclear_reset.sql`, `fix_attendance_logs.sql`
- Impact: Any authenticated account may gain write/delete capability if these scripts are applied as-is in production.
- Rationale: Policy definitions grant FOR ALL access based only on `auth.role() = 'authenticated'`.
- Fix approach: Replace broad policies with role- and row-scoped policies (admin/teacher/student separation, branch/subject ownership constraints).

### 4) Multi-step cross-table updates are non-transactional
- Severity: **High**
- Category: Data Integrity, Operations
- Issue: Registry and profile synchronization runs as separate client calls without transaction boundaries.
- Files: `app/admin-dashboard.js`, `app/not-enrolled.js`
- Impact: Partial failures create identity drift (registry updated but profile not updated, or downgraded old email with failed new-email upgrade), causing authorization anomalies and support load.
- Rationale: Several flows update `teachers`/`students_registry` then `profiles` in separate network requests.
- Fix approach: Consolidate into atomic database functions (RPC) with explicit rollback behavior and audit logging.

### 5) Destructive maintenance SQL scripts in repo root
- Severity: **High**
- Category: Operations, Data Integrity, Maintainability
- Issue: Numerous high-risk scripts (DROP/TRUNCATE/reset/fix) exist at top level with production-like table names.
- Files: `database_master_reset.sql`, `nuclear_reset.sql`, `restore_253_students.sql`, `fix_attendance_logs.sql`, `emergency_fix.sql`
- Impact: Operator error can wipe or mutate production data; no guardrails enforce environment or confirmation checks.
- Rationale: Scripts include `DROP TABLE ... CASCADE`, `TRUNCATE`, and schema mutations.
- Fix approach: Move into `db/migrations` and `db/ops` with naming conventions, environment guards, dry-run docs, and restricted execution pipeline.

### 6) High-frequency polling and broad selects in interactive screens
- Severity: **Medium**
- Category: Performance, Operations
- Issue: Frequent intervals and `select('*')` queries run on admin and enrollment flows.
- Files: `app/admin-dashboard.js`, `app/not-enrolled.js`, `app/attendance.js`, `app/index.js`, `app/student-dashboard.js`
- Impact: Increased DB load, battery/network overhead, degraded responsiveness at scale.
- Rationale: 5-second polling loops plus broad row fetches in high-traffic screens.
- Fix approach: Replace polling with targeted realtime subscriptions or exponential backoff; project only required columns and add pagination/limits.

### 7) Inconsistent source-of-truth and offline reconciliation gaps
- Severity: **Medium**
- Category: Data Integrity, Operations
- Issue: Attendance state is cached locally and reconciled with server, but reset/submit flows can leave local and remote states diverged under intermittent failure.
- Files: `services/storage.js`, `app/summary.js`, `app/attendance.js`
- Impact: Users may see submitted/not-submitted mismatch or stale attendance after partial remote failure.
- Rationale: Local flags (`true`/`reset`) and remote checks mix with best-effort deletion and non-blocking secondary sync.
- Fix approach: Introduce explicit sync state machine, durable retry queue, and conflict-resolution rules with server authoritative versioning.

### 8) Minimal automated test safety net
- Severity: **Medium**
- Category: Maintainability, Reliability
- Issue: No detected unit/integration test suite for critical auth/attendance/admin mutation paths.
- Files: `package.json`, `app/admin-dashboard.js`, `app/summary.js`, `app/attendance.js`, `app/not-enrolled.js`
- Impact: Regression risk is high for security and data flows; production incidents are more likely after feature changes.
- Rationale: No test runner scripts/config or `*.test.*`/`*.spec.*` files detected.
- Fix approach: Add baseline integration tests for role access, enrollment sync, attendance submit/reset, and RLS policy contract tests.

## Additional Concerns

### Logging and observability are best-effort only
- Severity: **Medium**
- Category: Operations, Maintainability
- Issue: Logging writes are fire-and-forget in some paths and errors are swallowed.
- Files: `services/logger.js`, `app/summary.js`
- Impact: Incident triage is difficult; root causes become hard to reconstruct.
- Fix approach: Standardize structured logs, include request correlation IDs, and alert on log-write failures.

### Runtime behavior coupled to large UI modules
- Severity: **Medium**
- Category: Maintainability, Performance
- Issue: Complex business logic, diagnostics, and admin mutations are concentrated in large screen files.
- Files: `app/admin-dashboard.js`, `app/summary.js`
- Impact: Higher change risk, slower onboarding, and fragile refactors.
- Fix approach: Extract domain services/hooks and keep view components focused on presentation.

## Production-Readiness Recommendation Order

1. Lock down RLS to least privilege and remove broad authenticated write policies.
2. Move privileged writes to server-side/RPC transactional boundaries.
3. Rotate and externalize Supabase credentials from source.
4. Add guardrailed database operations workflow for destructive scripts.
5. Reduce polling/select-star patterns and add focused query strategy.
6. Implement core integration tests and policy contract tests.
7. Improve observability and reconciliation semantics for offline/partial failures.

---

*Concerns audit: 2026-04-09*
