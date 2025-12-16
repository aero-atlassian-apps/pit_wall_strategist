# Auth Map (User vs App Context)

This map defines when `asUser()` vs `asApp()` is used, following the principle of Least Privilege and user-consent.

| Feature | Required Auth | Justification | Doc Link |
|---------|---------------|---------------|----------|
| **JQL Search** | `asUser()` | Respects user's browse permissions. Users should not see issues they don't have access to. | [Jira Search API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-search/#api-rest-api-3-search-jql-post) |
| **Board Discovery** | `asUser()` | Users should only see boards they can access. | [Agile Board API](https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/#api-agile-1-0-board-get) |
| **Sprint Data** | `asUser()` | Sprints are part of boards; access should mirror board access. | [Agile Sprint API](https://developer.atlassian.com/cloud/jira/software/rest/api-group-sprint/) |
| **Board Config** | `asUser()` | Configuration access should check user permissions. | [Agile Board Config](https://developer.atlassian.com/cloud/jira/software/rest/api-group-board/#api-agile-1-0-board-boardid-configuration-get) |
| **Create Issue/Subtask** | `asUser()` | Issues must be created by the user (reporter/creator). | [Create Issue API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post) |
| **Update Issue (Assign/Priority)** | `asUser()` | Modification requires user permission check. | [Edit Issue API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issuekey-or-id-put) |
| **Add Comment** | `asUser()` | Comments should be attributed to the user invoking the action. | [Add Comment API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-comments/#api-rest-api-3-issue-issuekey-or-id-comment-post) |
| **Transition Issue** | `asUser()` | Workflow transitions obey user permissions/conditions. | [Transition API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issuekey-or-id-transitions-post) |
| **Issue Linking** | `asUser()` | Linking requires link issue permission for the user. | [Link Issues API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-links/#api-rest-api-3-issuelink-post) |

## Key Changes
- Shifted all data fetching (`JiraDataService`, `BoardDiscoveryService`) from `asApp()` to `asUser()` to prevent potential data leaks (showing data the user shouldn't see).
- `asApp()` is reserved strictly for background tasks or app-specific storage where no user context exists (none currently active in primary flows).
