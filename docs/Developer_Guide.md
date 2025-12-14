# Developer Guide

## Prereqs
- Node 18+ (Forge runtime uses `nodejs22.x`; local dev uses your Node).
- Atlassian Forge CLI (`@forge/cli`).
- Jira Cloud site with a project and board.

## Project Layout
- Backend (Forge): resolvers in `src/resolvers/*`, manifest in `manifest.yml`, scripts in root `package.json`.
- Frontend: React/Vite app in `static/frontend/src`; build output in `static/frontend/build`.
- Tests: `tests/unit`, `tests/integration`, Playwright e2e scaffold.

## Local UI Development (mocked)
1. `cd static/frontend`
2. `npm install`
3. `npm run dev:local`
4. Open `http://localhost:5173/`

Behavior: Forge bridge is disabled via alias; mocks supply telemetry, issues, timing, trends, and DevOps (`static/frontend/vite.config.ts`:12–14; `static/frontend/src/App.tsx`:54–63).

## Atlassian Mode Development
Backend:
1. `cd ..`
2. `npm install`
3. `npm run set:platform:atlassian`
4. `npm run deploy`
5. `npm run install:app`
6. `npm run tunnel` (optional for local inspection)

Frontend:
- Build for Forge static: `cd static/frontend && npm run build:atlassian`

## Environment Switches
- Backend: `PLATFORM` via Forge variables
  - `npm run set:platform:local` | `npm run set:platform:atlassian`
- Frontend: `VITE_PLATFORM` via `.env.local` / `.env.atlassian` and scripts.

## Resolver Endpoints
- Telemetry: `getTelemetryData`
- Issues: `getSprintIssues`
- Timing: `getTimingMetrics`
- Trends: `getTrendData`
- DevOps: `getDevOpsStatus`
- Diagnostics: `getPermissionsDiagnostics`
- Actions: `split-ticket`, `reassign-ticket`, `defer-ticket`

## Common Troubleshooting
- 401 or insufficient scope on Agile endpoints: JQL POST fallbacks handle this; ensure user has browse permissions. Frontend Notice surfaces diagnostics (`src/resolvers/telemetryUtils.ts`:101–110,207–236; `static/frontend/src/App.tsx`:116–121).
- No sprints found: future/openSprints/project JQL fallbacks engage; consider board selection when multiple boards exist (`src/resolvers/telemetryUtils.ts`:41–64,66–94,111–149,24–28).
- Styled-components blocked by CSP: CSP nonce handling in `index.tsx` (`static/frontend/src/index.tsx`:12–21).
- Action failures (permissions or workflow): check project permissions and issuetype availability; fall back to removing from sprint if no backlog transition (`src/resolvers/rovoActions.ts`:35–41).

## Testing
- Backend unit/integration: `npm run test:unit` and `npm run test:integration`
- e2e scaffold: `npm run test:e2e` (Playwright)
- Coverage: v8 text report (`vitest.config.ts`:3–9)

