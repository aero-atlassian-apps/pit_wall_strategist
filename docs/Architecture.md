# Pit Wall Strategist — Architecture Reference

## Overview
Pit Wall Strategist is an Atlassian Forge app with a React/Vite UI that monitors Jira sprint/flow telemetry, flags stalled work, and proposes actions (split, reassign, defer). It supports dual platform modes: Atlassian (real APIs) and Local (mocked).

## Platform Modes
- Backend `PLATFORM`: `local` bypasses Jira and returns mocks; `atlassian` calls Jira/Agile/DevStatus APIs (`src/resolvers/index.ts`:12,21,55,71,85).
- Frontend `VITE_PLATFORM`: switches between `@forge/bridge` and local mocks; Vite alias disables the bridge when not Atlassian (`static/frontend/vite.config.ts`:4,12–14).

## Backend Layers
- Resolver registry: registers endpoints and exports `handler` and `actionHandler` (`src/resolvers/index.ts`:11,156–157).
- Telemetry pipeline:
  - Custom fields discovery (Story Points/Sprint/Epic Link) with fallbacks (`src/resolvers/telemetryUtils.ts`:8–11).
  - Board detection (Scrum/Kanban) and selection (`src/resolvers/telemetryUtils.ts`:15–28).
  - Scrum sprint data with layered fallbacks preferring JQL POST to avoid Agile 401s (`src/resolvers/telemetryUtils.ts`:41–64,66–94,101–110,111–149).
  - Kanban data via board issues (`src/resolvers/telemetryUtils.ts`:157).
  - Telemetry metrics (WIP load, burnout, velocity delta, sprint status) (`src/resolvers/telemetryUtils.ts`:159–184).
  - Stalled detection and categorization (`src/resolvers/telemetryUtils.ts`:195–203).
- Timing metrics:
  - Lead time from `DONE` issues; by-assignee breakdown (`src/resolvers/timingMetrics.ts`:7–16).
  - Cycle time from changelog transitions; 3 sectors mapped to status categories (`src/resolvers/timingMetrics.ts`:18–27,29–49,51–53).
  - Sector performance evaluation (`src/resolvers/timingMetrics.ts`:55).
- Trend metrics:
  - WIP trend: daily in-progress counts (`src/resolvers/trendMetrics.ts`:6–15).
  - Velocity trend: daily resolution counts (`src/resolvers/trendMetrics.ts`:19–34).
- DevOps detection:
  - Project connectivity and source (Bitbucket/GitHub) (`src/resolvers/devOpsDetection.ts`:39–58).
  - Per-issue dev activity and “no commits/PRs” detection (`src/resolvers/devOpsDetection.ts`:17–37).
- Action handlers:
  - Split, Reassign, Defer with Jira mutations; mock results in local mode (`src/resolvers/rovoActions.ts`:3–7,5–21,23–31,33–41).

## Frontend Layers
- Bootstrap with CSP nonce handling for styled-components (`static/frontend/src/index.tsx`:12–21,23–35).
- App composition and data loading across telemetry/issues/timing/trends/devops with error diagnostics (`static/frontend/src/App.tsx`:51–63,64–97).
- Strategy modal and action invocation via resolver keys (`static/frontend/src/App.tsx`:99–101,135–140).
- UI components: Dashboard panels, TrackMap, RaceControl, DevOpsPanel, Settings; theme and global styles.
- Local shim for Forge bridge to enforce mocks (`static/frontend/src/shims/forge-bridge.ts`:1–3).

## Data Flow
1. Frontend determines mode via `VITE_PLATFORM` and either calls resolver endpoints using `@forge/bridge` or loads mocks (`static/frontend/src/App.tsx`:18–21,54–63).
2. `getTelemetryData` orchestrates board detection, sprint/kanban issue retrieval, telemetry calculation, stalled detection, and builds an F1-styled feed (`src/resolvers/index.ts`:18–33,138–151).
3. `getSprintIssues` categorizes issues and flags stalled (`src/resolvers/index.ts`:35–46).
4. `getTimingMetrics` produces lead time, cycle time, sector performance (`src/resolvers/index.ts`:52–67).
5. `getTrendData` returns WIP/velocity trends (`src/resolvers/index.ts`:69–80).
6. `getDevOpsStatus` checks DevOps connectivity and surface issues lacking recent activity (`src/resolvers/index.ts`:82–96).
7. User triggers actions via Strategy modal; backend executes Jira mutations (`src/resolvers/index.ts`:121–123; `src/resolvers/rovoActions.ts`:5–41).

## Error Handling & Resilience
- Prefer JQL POST as user for sprint and board queries to avoid Agile 401s; fall back to app when needed (`src/resolvers/telemetryUtils.ts`:101–110,207–236,237–255).
- Multi-layer fallbacks: active sprint → future sprint → openSprints JQL → board filter JQL → project JQL (`src/resolvers/telemetryUtils.ts`:41–64,66–94,111–149).
- Frontend displays Notice with permission diagnostics (`static/frontend/src/App.tsx`:116–121).

## Permissions & Manifest
- `jira:projectPage` and `rovo:agent` modules render UI and expose actions (`manifest.yml`:22–33,2–20,35–76,77–79).
- Scopes include board/sprint, issue read/write, storage (`manifest.yml`:81–95).
- CSP permits inline styles and external fonts/styles (`manifest.yml`:96–105).

## Testing Architecture
- Vitest node environment with v8 coverage targeting backend resolvers (`vitest.config.ts`:3–9).
- Integration tests verify resolver definitions and local mode behaviors; e2e scaffold with Playwright exists.

## Known Limitations
- Board selection defaults to first board when multiple exist (`src/resolvers/telemetryUtils.ts`:24–28).
- Cycle time sampling uses only first ten issues.
- Action handlers assume `Sub-task` issuetype and sufficient permissions.

y