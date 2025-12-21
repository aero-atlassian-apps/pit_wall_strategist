# Developer Guide

## Prerequisites

- Node 18+ (Forge runtime uses `nodejs22.x`)
- Atlassian Forge CLI (`@forge/cli`)
- Jira Cloud site with a project

## Project Layout

```
pit_wall_strategist/
├── src/                          # Backend (Forge)
│   ├── domain/                   # Pure business logic
│   ├── application/              # Use cases
│   ├── infrastructure/           # Jira/Forge adapters
│   └── resolvers/                # Forge resolver handlers
├── static/frontend/              # React/Vite UI
│   ├── src/
│   └── build/                    # Production build
├── tests/                        # Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                         # Documentation
└── manifest.yml                  # Forge manifest
```

---

## Local UI Development (Mocked)

```bash
cd static/frontend
npm install
npm run dev:local
```

Opens `http://localhost:5173/` with mocked data. Forge bridge is disabled via Vite alias.

---

## Atlassian Mode Development

### Backend Deployment

```bash
npm install
npm run set:platform:atlassian
npm run deploy
npm run install:app
npm run tunnel  # Optional for local inspection
```

### Frontend Build

```bash
cd static/frontend
npm run build:atlassian
```

---

## Environment Switches

| Layer | Variable | Commands |
|-------|----------|----------|
| Backend | `PLATFORM` | `npm run set:platform:local` / `atlassian` |
| Frontend | `VITE_PLATFORM` | Via `.env.local` / `.env.atlassian` |

---

## Metric Definitions

The app tracks 10 core metrics, categorized as Sprint metrics (Scrum-only) and Flow metrics (universal).

### Sprint Metrics

| Metric | Formula | Source | Edge Cases |
|--------|---------|--------|------------|
| **Velocity** | `Σ(story_points) / n_sprints` | Agile API: `/sprint/{id}/issue` | Falls back to issue count if no story points |
| **Sprint Health** | `(actual_progress / expected_progress) × 100` | Sprint dates + completion | Hidden for Kanban/Business |
| **Sprint Progress** | `(done_issues / total_issues) × 100` | Current sprint | Hidden for Kanban/Business |
| **Scope Creep** | `(issues_added_mid_sprint / original_scope) × 100` | Sprint scope changes | Hidden for Kanban/Business |

### Flow Metrics (Universal)

| Metric | Formula | Source | Edge Cases |
|--------|---------|--------|------------|
| **WIP** | `count(indeterminate_status_issues)` | Board issues | Always valid |
| **WIP Consistency** | `std_dev(daily_wip) / avg(daily_wip)` | Changelog analysis | Requires history |
| **Cycle Time** | First `indeterminate` → `done` | Changelog `status` field | Falls back to resolution date |
| **Lead Time** | Issue `created` → `done` | Issue fields + changelog | Always calculable |
| **Throughput** | `done_issues / weeks` | JQL `resolutiondate` | Always valid |
| **Flow Efficiency** | `(active_wip / total_wip) × 100` | Stalled detection | 100% if no WIP |

### Metric Validity

Metrics are shown/hidden based on project context:

```typescript
// From contextEngine.ts - computeMetricValidity()
if (ctx.projectType === 'business' || ctx.boardStrategy === 'kanban') {
    v.velocity = 'hidden';
    v.sprintHealth = 'hidden';
    v.sprintProgress = 'hidden';
    v.scopeCreep = 'hidden';
}
// Flow metrics are ALWAYS valid
v.cycleTime = 'valid';
v.throughput = 'valid';
```

---

## Adding New Metrics (Clean Architecture Guide)

### Step 1: Create Domain Calculator

Add to `src/domain/metrics/`:

```typescript
// src/domain/metrics/NewMetricCalculator.ts
import { DomainIssue } from '../issue/DomainIssue';

export interface NewMetricResult {
    value: number;
    explanation: string;
}

export class NewMetricCalculator {
    public calculate(issues: DomainIssue[]): NewMetricResult {
        // Pure logic - NO Forge/Jira imports allowed
        return { value: 0, explanation: 'exp:newMetric' };
    }
}
```

### Step 2: Create Use Case (if needed)

Add to `src/application/usecases/`:

```typescript
// src/application/usecases/GetNewMetricUseCase.ts
import { NewMetricCalculator } from '../../domain/metrics/NewMetricCalculator';

export class GetNewMetricUseCase {
    private calculator = new NewMetricCalculator();
    
    async execute(issues: DomainIssue[]) {
        return this.calculator.calculate(issues);
    }
}
```

### Step 3: Add Resolver

Add to appropriate resolver module in `src/resolvers/`:

```typescript
resolver.define('getNewMetric', async ({ payload }) => {
    const useCase = new GetNewMetricUseCase();
    const issues = await fetchIssues(payload.projectKey);
    return useCase.execute(issues);
});
```

### Architecture Rules

> [!IMPORTANT]
> **Domain layer must NEVER import from Forge or Jira SDK.**
> 
> If your calculator needs Jira data, pass it as a parameter from the infrastructure layer.

---

## Extending Rovo Actions

### Add New Action

1. **Define in manifest.yml**:

```yaml
- key: new-action
  name: New Strategy
  function: action-handler
  actionVerb: UPDATE
  inputs:
    issueKey:
      type: string
      required: true
```

2. **Implement handler** in `src/resolvers/rovoActions.ts`:

```typescript
export async function newAction({ issueKey }: { issueKey: string }) {
    if (PLATFORM === 'local') return mockActionResult('new');
    
    // ALWAYS use asUser() for write operations
    await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
        method: 'PUT',
        // ...
    });
    
    await addComment(issueKey, '🏎️ *PIT WALL STRATEGY: NEW*\n...');
    return { success: true, message: 'Action completed' };
}
```

3. **Add to router** in `handleAction()`:

```typescript
case 'new-action': return newAction(payload)
```

---

## Maintaining Config-Agnosticism

### Status Handling

**DO NOT** assume status names. Use status categories:

```typescript
// ❌ Wrong
if (status.name === 'In Progress') { ... }

// ✅ Correct
if (status.statusCategory.key === 'indeterminate') { ... }
```

### Field Discovery

**DO NOT** hardcode custom field IDs:

```typescript
// ❌ Wrong
const storyPoints = issue.fields['customfield_10016'];

// ✅ Correct
const fields = await fieldDiscoveryService.discoverCustomFields();
const storyPoints = fields.storyPoints 
    ? issue.fields[fields.storyPoints] 
    : null;
```

### Issue Type Discovery

**DO NOT** assume issue type names:

```typescript
// ❌ Wrong
issuetype: { name: 'Sub-task' }

// ✅ Correct
const context = await getProjectContext(projectKey);
const subtaskType = context.issueTypes.find(t => t.subtask);
issuetype: { name: subtaskType?.name || 'Sub-task' }
```

---

## Resolver Endpoints

| Endpoint | Module | Purpose |
|----------|--------|---------|
| `getTelemetryData` | telemetry | Dashboard metrics |
| `getSprintIssues` | telemetry | Categorized issues |
| `getBoardInfo` | telemetry | Board type detection |
| `getTimingMetrics` | timing | Lead/cycle time |
| `getTrendData` | trends | WIP/velocity trends |
| `getAdvancedAnalytics` | analytics | Sprint health, bottlenecks |
| `getFlowMetrics` | analytics | SAFe flow distribution |
| `getPermissionsDiagnostics` | diagnostics | Permission checks |
| `rovoChat` | rovo | AI chat responses |

---

## Common Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 on Agile endpoints | User lacks board access | JQL fallbacks engage automatically |
| No sprints found | Empty or misconfigured board | Falls back to board issues or project JQL |
| CSP blocks styles | Inline style policy | CSP nonce handling in `index.tsx` |
| Action failures | Workflow restrictions | Check transitions, falls back gracefully |

---

## Testing

| Command | Coverage |
|---------|----------|
| `npm run test:unit` | Domain logic, utilities |
| `npm run test:integration` | Resolver handlers, fallbacks |
| `npm run test:e2e` | End-to-end Playwright tests |

### Test Architecture

- **Domain tests**: Pure function tests, no mocks needed
- **Infrastructure tests**: Mock Forge API responses
- **Integration tests**: Verify resolver → repository → service chain
