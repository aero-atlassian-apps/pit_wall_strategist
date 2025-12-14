# Testing Overview

## Tooling
- Vitest for unit/integration tests (Node environment), v8 coverage (`vitest.config.ts`:3–9).
- Playwright for e2e (currently scaffolded and can be expanded).

## Current Coverage Focus
- Telemetry fallbacks and status calculations.
- Timing metrics (lead time / sector averages) — sampling logic.
- Local-vs-Atlassian mode behaviors for resolvers and actions.
- Permissions diagnostics endpoint.

## Suggested Additions
- Board selection when multiple boards exist.
- Action handlers under limited permissions/workflow edge cases.
- DevOps detection path where project has no issues or DevStatus disabled.
- Trend computations for date boundaries.

## Running Tests
- Unit (with coverage): `npm run test:unit`
- Integration: `npm run test:integration`
- E2E: `npm run test:e2e`

## Patterns
- Module mocks for `@forge/api` to simulate user/app responses and status codes.
- Environment toggling via `process.env.PLATFORM` for local mode assertions.

