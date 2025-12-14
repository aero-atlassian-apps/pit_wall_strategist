# Data & Permissions Map

## Jira/Agile/DevStatus APIs
- Fields discovery: `GET /rest/api/3/field` (user) (`src/resolvers/index.ts`:23; `src/resolvers/telemetryUtils.ts`:8–11).
- Boards: `GET /rest/agile/1.0/board?projectKeyOrId={projectKey}` (app) (`src/resolvers/telemetryUtils.ts`:15–28).
- Sprints:
  - Active/future: `GET /rest/agile/1.0/board/{boardId}/sprint?state=active|future` (app) (`src/resolvers/telemetryUtils.ts`:41–64).
  - Issues via JQL POST: `POST /rest/api/3/search/jql` (user preferred) (`src/resolvers/telemetryUtils.ts`:101–110,237–255).
  - Board config: `GET /rest/agile/1.0/board/{boardId}/configuration` (app) (`src/resolvers/telemetryUtils.ts`:115–121).
- Kanban issues: `GET /rest/agile/1.0/board/{boardId}/issue` (user/app) (`src/resolvers/telemetryUtils.ts`:157).
- Trends:
  - WIP count: `GET /rest/api/3/search?jql=...&maxResults=0` (app) (`src/resolvers/trendMetrics.ts`:17).
  - Velocity count: `GET /rest/api/3/search?jql=...&maxResults=0` (app) (`src/resolvers/trendMetrics.ts`:23–34).
- DevStatus:
  - Issue ID: `GET /rest/api/3/issue/{key}?fields=id` (user/app fallback) (`src/resolvers/devOpsDetection.ts`:4–15).
  - DevStatus detail/summary: `GET /rest/dev-status/latest/issue/detail|summary` (app) (`src/resolvers/devOpsDetection.ts`:9–13,17–19).
- Actions:
  - Create sub-task: `POST /rest/api/3/issue` (user) (`src/resolvers/rovoActions.ts`:16).
  - Update assignee: `PUT /rest/api/3/issue/{key}` (user) (`src/resolvers/rovoActions.ts`:25–26).
  - Transitions: `GET/POST /rest/api/3/issue/{key}/transitions` (user) (`src/resolvers/rovoActions.ts`:35–41).
  - Comments: `POST /rest/api/3/issue/{key}/comment` (user) (`src/resolvers/rovoActions.ts`:44).

## Scopes Required (manifest.yml)
- Core: `read:jira-work`, `write:jira-work`, `read:jira-user`, `read:issue:jira`, `read:issue:jira-software`, `manage:jira-project`, `storage:app` (`manifest.yml`:81–95).
- Agile: `read:board-scope:jira-software`, `read:board-scope.admin:jira-software`, `read:sprint:jira-software` (`manifest.yml`:88–90).
- Filters: `read:filter:jira` (`manifest.yml`:93).

## Field Usage
- Story Points: discovered by name patterns; fallback to `customfield_10016` (`src/resolvers/telemetryUtils.ts`:8–11).
- Sprint: discovered; fallback to `customfield_10020` used when removing from sprint (`src/resolvers/telemetryUtils.ts`:8–11; `src/resolvers/rovoActions.ts`:45).
- Epic Link (optional): discovered for future features (`src/resolvers/telemetryUtils.ts`:8–11).

## Auth Strategy & Fallbacks
- Prefer `asUser()` for JQL POST to respect user permissions; fallback to `asApp()` on 401 or scope errors (`src/resolvers/telemetryUtils.ts`:207–236,237–255).
- Requester selection in timing/devops uses user when `context.accountId` is present; otherwise app (`src/resolvers/telemetryUtils.ts`:101–104; `src/resolvers/timingMetrics.ts`:31–33; `src/resolvers/devOpsDetection.ts`:42–44).

## Data Contracts
- TelemetryData: WIP load/limit/current, teamBurnout, velocityDelta, sprintStatus, issuesByStatus, sprintName, feed, stalledTickets (`src/resolvers/index.ts`:26–33,138–147).
- CategorizedIssue: normalized key/summary/status/statusCategory/assignee/priority/updated/isStalled (`src/resolvers/telemetryUtils.ts`:203).
- SectorTimes and LeadTimeResult: sector averages and lap aggregates (`src/resolvers/timingMetrics.ts`:26–27,7–16).
- TrendData: day-series with direction/change summaries (`src/resolvers/trendMetrics.ts`:10–15,19–21).
- DevOpsStatus: `enabled`, `source`, `noCommitIssues` (`src/resolvers/index.ts`:82–96).

## Diagnostics
- Permissions diagnostics endpoint checks user/app browse permission and presence of Sprint field (`src/resolvers/index.ts`:98–114).
- Frontend surfaces errors with helpful hints and raw flags (`static/frontend/src/App.tsx`:116–121).

