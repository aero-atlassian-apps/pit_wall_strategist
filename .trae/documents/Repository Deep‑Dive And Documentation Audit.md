## Goals
- Build a precise understanding of what the app does, how it’s structured, and why key choices were made.
- Produce developer‑friendly docs: Architecture Reference, Data/Permissions Map, Developer Guide, and Testing Overview.
- Identify gaps, risks, and opportunities to improve reliability, UX, and maintainability.

## Scope Of Analysis
1. Documentation and onboarding
- Read `README.md`, scripts, and envs; map Local vs Atlassian modes.
2. Backend (Forge resolvers)
- Entry points, data flow, fallbacks, error handling, caching; Jira/Agile/DevStatus usage.
3. Frontend (React/Vite)
- Module layout, state flow, styled‑components CSP handling, bridge/mocks split.
4. Configuration & permissions
- `manifest.yml` modules, scopes, runtime; environment switches (`PLATFORM`, `VITE_PLATFORM`).
5. Testing & QA
- Unit/integration/e2e coverage, test data sources, CI readiness.

## Deliverables
- Architecture Reference (layers, modules, call graph, env modes)
- Data & Permissions Map (APIs, scopes, fields, fallbacks)
- Developer Guide (setup, run, build, deploy, troubleshooting)
- Testing Overview (current tests, coverage, missing cases)
- Risk & Improvements list (prioritized, with concrete actions)

## Verification Approach
- Cross‑reference code citations (file_path:line_number) to back claims.
- Dry‑run flows in both modes (Local vs Atlassian) conceptually; confirm resolver endpoints and UI wiring.
- Validate permission and CSP strategies via config and bootstrap code.

## Proposed Next Steps (upon approval)
1. Author and commit the above docs to `docs/` and expand `README.md` with mode matrix and common errors.
2. Add lightweight integration tests around resolver fallbacks and action handlers.
3. Introduce a minimal Health/Dashboard resolver for ops diagnostics.
4. Optional: add diagrams (PlantUML/Mermaid) for data flow and module relationships.

## Effort & Sequencing
- Phase 1: Write docs from current codebase (2 passes: backend, frontend).
- Phase 2: Add tests and health diagnostics.
- Phase 3: Diagrams and polish.

Confirm to proceed with creating the documentation set and small test additions.