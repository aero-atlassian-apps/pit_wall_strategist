## Assessment
- Status handling today relies primarily on Jira `statusCategory` (robust across custom workflows) and name heuristics.
- Where this is used:
  - Telemetry categorization via `getStatusCategory(issue)` falling back to name patterns (`src/resolvers/telemetryUtils.ts`:186–193).
  - Cycle time categorization via `approximateCategoryFromStatus()` based on name patterns (`src/resolvers/timingMetrics.ts`:51).
  - Trends use JQL on `statusCategory = "In Progress"` and `resolutiondate` (robust) (`src/resolvers/trendMetrics.ts`:17, 23–34).
  - Stalled detection uses `statusCategory` and `updated` time (`src/resolvers/telemetryUtils.ts`:195–201).
- Gaps:
  - No dynamic project/workflow status map; cycle time and some fallbacks depend on name heuristics that may miss bespoke status names.
  - Actions (defer) detect backlog by transition name substrings; not mapped to categories.
  - UI labels assume generic categories; doesn’t expose actual status names per category.

## Goals
- Make telemetry, timing, stalled detection, and actions workflow‑agnostic for any Jira site/project/issuetype.
- Use Jira’s status metadata to drive category mapping rather than heuristics.
- Surface workflow diagnostics and adapt UI displays to the actual status set.

## Technical Plan
### 1) Build a project status map
- Fetch statuses per project/issuetype and categories:
  - `GET /rest/api/3/project/{projectKey}/statuses` or `GET /rest/api/3/status`.
- Construct `statusMap: Record<string, {category: 'new'|'indeterminate'|'done', name: string, id: string}>` keyed by status id and normalized name.
- Cache in Forge `storage` with TTL; refresh on version bump or explicit diagnostics refresh.
- API usage aligned with existing scopes (see `manifest.yml`:81–95).

### 2) Replace name heuristics with status map
- `getStatusCategory(issue)` in `telemetryUtils`:
  - Prefer `issue.fields.status.statusCategory.key`; if absent, lookup `statusMap[name]`.
  - Fallback to current heuristics only if map not available.
- `approximateCategoryFromStatus()` in `timingMetrics`:
  - Use `statusMap[name]` → category; fallback to heuristics.

### 3) Cycle time and telemetry computation
- For each changelog transition, resolve `toStatus` → category via map; accumulate durations per category (`src/resolvers/timingMetrics.ts`:29–49).
- Use project status map to compute per‑category counts and burnout.
- Keep trends on `statusCategory` JQL; add optional dynamic series by top statuses if desired.

### 4) Stalled detection
- Determine “in progress” via category mapping, not name patterns.
- Optionally introduce per‑issuetype or per‑status thresholds; store in `telemetryConfig`.

### 5) Actions hardening
- Defer action:
  - Identify transitions that lead to any status with category `new` using status map; prefer those instead of substring matching (`src/resolvers/rovoActions.ts`:37–41).
- Split/Reassign logic remains unaffected.

### 6) UI adaptations
- TrackMap and TelemetryPanel:
  - Display category totals, and optionally expose the most common statuses under each category.
- Diagnostics modal:
  - Show workflow status map per issuetype, flag statuses with ambiguous or unknown categories.

### 7) Scopes management
- Centralize scopes in `src/config/scopes.ts` and validate presence of essentials; already added and used in diagnostics.

### 8) Tests
- Unit tests for:
  - Status map creation (project statuses → categories).
  - `getStatusCategory` and `approximateCategoryFromStatus` using status map.
  - Cycle time categorization with bespoke status names.
- Integration tests to verify actions defer selects a valid backlog/category‑new transition.

### 9) Performance & resilience
- Cache status map; invalidate on diagnostics refresh or after TTL.
- Fallbacks remain in place to keep behavior when metadata fetch fails.

## Deliverables
- Status map module with caching, retrieval, and validation.
- Updated telemetry/timing/stalled/actions logic to consume the status map.
- Diagnostics additions for workflow visibility.
- Tests covering bespoke status scenarios.

## Notes
- Existing use of `statusCategory` and `resolutiondate` keeps many paths robust; this plan targets the remaining heuristic paths and makes behavior production‑ready across diverse workflows.

Confirm to proceed; I will implement status map, wire it into resolvers, adapt UI, and add tests.