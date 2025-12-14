## Cache Tuning
- getCycleHints TTL cache
  - Add a lightweight cache (in-memory per runtime and optional Forge storage fallback) keyed by `projectKey:boardId`, with TTL (e.g., 10–15 minutes).
  - API: `getCycleHintsCache.get(key)` / `set(key, value, ttl)`; guard invalidation on board changes or sprint state changes.
  - Return cached hints when available; compute only when stale or missing.
- Memoize board columns config
  - In `timingMetrics.getBoardColumns(boardId)`, memoize responses per `boardId` with TTL (e.g., 30–60 minutes) to reduce configuration lookups.
  - Invalidation on board detection mismatch or when configuration fetch errors occur; fallback to fresh fetch when forced.

## Resilience
- Unmapped transitions UX
  - Make the unmapped warning dismissible (persist in `localStorage` per project/board), and add a link to open Diagnostics (existing modal), with a short description of how to map statuses to columns.
  - Show the warning only when new unmapped time is detected or when the dismissal expires.
- Explicit errors in `getCycleHints`
  - Distinguish permission errors, rate limiting, and data unavailability with clear messages.
  - Return structured error codes: `PERMISSION_DENIED`, `RATE_LIMITED`, `NO_DATA`, `UNKNOWN`; surface a user-facing banner in Settings hints section.
  - Add retries with backoff for common transient API errors (1–2 retries).

## i18n
- Sweep remaining strings
  - Translate badge text across F1Card usages (e.g., `CONTROLS`, `TEAM LOAD`, `ONLINE/LOCAL`), remaining tooltips, and minor labels.
  - Normalize dictionary structure by domains: `badges`, `tooltips`, `labels`, `messages`.
- Server-side i18n for feed messages
  - Use `getLocale` to select strings for generated feed entries on the backend; keep keys in a small server dictionary; fallback to English.
  - Ensure frontend and backend share language choice (use stored config and pass locale through invocations).

## Tests
- Functional tests: multi-column and mixed status
  - Add unit tests for `mapStatusToColumn` across custom statuses and multiple columns.
  - Add unit tests for `calculateCycleTime` with mixed mapped/unmapped transitions, asserting presence of `UNMAPPED` and correct averages.
  - Add unit tests for `getCycleHints` on permission/rate-limit paths and cache-hit vs compute.
- Performance tests
  - Create Vitest perf harness with mocked changelogs (100–300 issues) measuring `calculateCycleTime` and `getCycleHints` execution time; assert stays under a target budget.
- i18n tests
  - Snapshot key panels to ensure translated strings render and fallback logic holds.

## Quality Gates
- Install and build
  - `npm install` (root and `static/frontend`)
  - Build local and Forge variants: `npm run build:local` and `npm run build:atlassian`.
- Tests
  - Run unit and integration: `npm run test:unit` and `npm run test:integration`.
- Forge eligibility and lint
  - `forge eligibility` and fix any blockers.
  - `forge lint` until zero warnings; adjust scopes and manifest if needed.
- Security and secrets check
  - Confirm no secrets committed; environment files ignored via `.gitignore`.

## Deployment & Versioning
- Deploy
  - `npm run deploy:full` to build frontend, deploy, and upgrade app on target site.
- Version bump and changelog
  - Update version in `manifest` or package metadata; write a short changelog entry covering caching, resilience, i18n, tests.
- Commit and push
  - Commit all changes with a conventional message; push to `origin main`.

## Rollback & Monitoring
- Rollback plan
  - If issues arise, revert to previous commit and redeploy.
- Monitoring
  - Add simple logging around cache hits/misses and error codes; verify reduced hint resolver calls under typical usage.

## Acceptance Criteria
- Caches reduce repeated calls; unmapped warning dismissible; clear hint errors
- All i18n strings covered; server-side feed localized
- Tests green; perf budgets met; Forge lint zero; eligibility passes; full deploy succeeds
