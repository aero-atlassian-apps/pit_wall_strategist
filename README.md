# Pit Wall Strategist (Forge App)

Pit Wall Strategist brings an F1-inspired dashboard to Jira: live telemetry, cycle timing, trends, DevOps signals, and race-control style actions to help teams manage flow, reduce stalls, and finish work faster.

## Purpose
- Provide actionable, visual telemetry for a Jira board or sprint
- Detect stalled tickets with configurable thresholds per issuetype
- Map workflow and timing dynamically to your board columns (no hard-coded lanes)
- Offer guided strategy actions (split, reassign, defer) with a race-control UX
- Surface DevOps integration signals (e.g., “no commits” for work-in-progress)

## 🏁 Universal Coverage

> **Whatever your team. However you work. Pit Wall has you covered.**

| Your Setup | Status |
|------------|--------|
| Business team? | ✅ Covered |
| Software team? | ✅ Covered |
| Scrum? Kanban? No board? | ✅ All covered |
| Custom workflows? | ✅ Fine — we use status categories |
| Light/Dark mode? | ✅ Covered |
| Your language? | ✅ EN, FR, ES, PT |

**Zero configuration required.** → [Full Coverage Details](docs/UNIVERSAL_COVERAGE.md)

## Key Features
- Telemetry: WIP load, team burnout, velocity delta, stalled detection
- Timing: Cycle/sector times and average lap time by assignee
- Trends: WIP and velocity sparkline trends
- Board-aware sectors: Sectors reflect actual Jira board columns
- Per-issuetype thresholds: Different “stalled” hours per issuetype (Bug vs Story)
- Per-project status map: Status category mapping, with per-issuetype buckets
- Diagnostics: Permissions, fields, board filter, scopes, status map summary
- i18n: English, French, Spanish, Portuguese (auto-detect Jira user locale, per-user override)

## Architecture
- Atlassian Forge app with backend resolvers (TypeScript) and a React frontend (Vite)
- Backend uses Forge APIs for Jira Agile/Search, project statuses, fields, permissions
- Frontend renders panels (Telemetry, Timing, Trends, DevOps, Track/Circuit, Refresh, Health)
- Status Map: Cached per project; supports global and per-issuetype lookups
- Board Columns → Sectors: Changelog transitions are mapped to board columns for cycle timing
- Per-user Config: Stored in Forge storage (WIP, capacity, thresholds, locale)

## Technologies
- Platform: Atlassian Forge
- Backend: TypeScript, Forge `@forge/api`, resolvers in `src/resolvers`
- Frontend: React + Vite, styled-components, panels in `static/frontend/src/components`
- Tests: Vitest unit and integration tests
- i18n: Lightweight dictionary in `static/frontend/src/i18n/index.ts`

## Getting Started
- Prereqs: Node.js `20.x` or `22.x`, Forge CLI
- Install dependencies:
  - `npm install`
  - `cd static/frontend && npm install`
- Local build (frontend):
  - `cd static/frontend && npm run build:local`
- Deploy to development and upgrade on your site:
  - `npm run deploy:full`

## Development Commands
- Unit tests: `npm run test:unit`
- Integration tests: `npm run test:integration`
- Build frontend (Forge runtime): `cd static/frontend && npm run build:atlassian`
- Forge deploy: `forge deploy && forge install --upgrade`

## Configuration
User-specific telemetry configuration is stored per account in Forge storage:
- `wipLimit`, `assigneeCapacity`, `stalledThresholdHours`
- `stalledThresholdHoursByType` (e.g., `{ bug: 12, story: 36 }`)
- `locale` (UI language; auto-detected from Jira user; falls back to English)

The Settings panel lets you edit thresholds globally and per issuetype, choose language, and replay onboarding.

## Board-Aware Sectors
Cycle timing sectors match your Jira board columns. Time is aggregated per column based on issue changelog transitions. If transitions fall outside configured board columns, an `UNMAPPED` sector is added and flagged.

## Status Map
Project status mapping is cached and supports:
- Global mapping: `byId`, `byName`
- Per-issuetype buckets: `byIssueType[type].byId`, `byIssueType[type].byName`
Category lookups use Jira `statusCategory` first, then status-map resolution.

## Internationalization (i18n)
- Supported: `en`, `fr`, `es`, `pt`
- Auto-detected from Jira user locale (fallback to English)
- Per-user override in Settings; stored in Forge storage

## Actions (Race Control)
- Split Ticket (Undercut)
- Reassign Ticket (Team Orders)
- Defer Ticket (Retire Car)
Actions are guarded (e.g., defer selects a transition to a `new` category status; sprint removal is safe if sprint data is missing).

## Documentation
Additional documents, diagrams, and guides live in the `docs/` directory:
- [Architecture](docs/Architecture.md)
- [Developer Guide](docs/Developer_Guide.md)
- [Features and Rules](docs/FEATURES_AND_RULES.md)
- [Jira Integration](docs/JIRA_INTEGRATION.md)
- [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md)
- [Product Vision](docs/PRODUCT_VISION.md)
- [Project Story](docs/PROJECT_STORY.md)
- [Testing Scenarios](docs/TESTING_SCENARIOS.md)
- [Testing Overview](docs/Testing_Overview.md)
- [Diagrams: Architecture (Mermaid)](docs/diagrams/architecture.mmd)

Absolute reference requested:
- `/d:/rouca/DVM/workPlace/pit_wall_strategist/pit_wall_strategist _forge_app/docs/`

## Contributing
- Keep environment files, builds, caches, and logs out of version control (`.gitignore` provided)
- Follow existing patterns in resolvers and components; do not hard-code workflow specifics
- Do not commit secrets/keys

## License
Internal project; license details TBD.
