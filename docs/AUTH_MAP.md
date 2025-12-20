# Auth Map (User vs App Context)

This map defines when `asUser()` vs `asApp()` is used using a **hybrid strategy**:
- **READ operations**: `asApp()` - Anyone with project access can view telemetry
- **WRITE operations**: `asUser()` - Respects user's Jira permissions

## Execution Context Table

| Feature | Context | Rationale | Doc Link |
|---------|---------|-----------|----------|
| **JQL Search** | `asApp()` | App-level read for telemetry dashboards | [Jira Search API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/) |
| **Board Discovery** | `asApp()` | Read-only visualization | [Agile Board API](https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/) |
| **Sprint Data** | `asApp()` | Read-only telemetry | [Agile Sprint API](https://developer.atlassian.com/cloud/jira/software/rest/api-group-sprint/) |
| **Board Config** | `asApp()` | Read configuration | [Agile Board Config](https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/) |
| **Create Issue/Subtask** | `asUser()` | Must respect user permissions | [Create Issue API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/) |
| **Update Issue** | `asUser()` | Must respect user permissions | [Edit Issue API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/) |
| **Add Comment** | `asUser()` | Attribution to user | [Add Comment API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-comments/) |
| **Transition Issue** | `asUser()` | Workflow permissions | [Transition API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/) |
| **Issue Linking** | `asUser()` | Link permissions | [Link Issues API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-links/) |

## Key Implementation Files
- `src/infrastructure/forge/JiraExecutionContextResolver.ts` - Central authority for context selection
- `src/infrastructure/forge/ForgePermissionScanner.ts` - Checks read (asApp) and write (asUser) permissions
- `src/domain/permissions/MetricExecutionPermissionGate.ts` - Enforces permissions with console.error for failures

