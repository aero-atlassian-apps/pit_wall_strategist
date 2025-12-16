# Scope Justification Table

| Scope | Purpose | Required API | Doc Link |
|-------|---------|--------------|----------|
| `read:project:jira` | Detect project type (Software vs Business) | `GET /rest/api/3/project/{projectKey}` | [Jira Platform Scopes](https://developer.atlassian.com/platform/forge/manifest-reference/scopes-product-jira/) |
| `read:board-scope:jira-software` | Discover Agile boards and read board issues | `GET /rest/agile/1.0/board` | [Jira Software Scopes](https://developer.atlassian.com/platform/forge/manifest-reference/scopes-product-jsw/) |
| `read:sprint:jira-software` | Read sprint data (Active, Future, Closed) | `GET /rest/agile/1.0/board/{boardId}/sprint` | [Jira Software Scopes](https://developer.atlassian.com/platform/forge/manifest-reference/scopes-product-jsw/) |
| `read:board-scope.admin:jira-software` | Read detailed board configuration (columns, estimation) | `GET /rest/agile/1.0/board/{boardId}/configuration` | [Jira Software Scopes](https://developer.atlassian.com/platform/forge/manifest-reference/scopes-product-jsw/) |
| `read:issue:jira` | Search issues (JQL) and read issue details | `POST /rest/api/3/search/jql`, `GET /rest/api/3/issue/{id}` | [Jira Platform Scopes](https://developer.atlassian.com/platform/forge/manifest-reference/scopes-product-jira/) |
| `write:issue:jira` | Create subtasks, update fields (assignee, priority), transition issues | `POST /rest/api/3/issue`, `PUT /rest/api/3/issue/{id}` | [Jira Platform Scopes](https://developer.atlassian.com/platform/forge/manifest-reference/scopes-product-jira/) |
| `write:comment:jira` | Add strategic comments (Rovo actions) | `POST /rest/api/3/issue/{id}/comment` | [Jira Platform Scopes](https://developer.atlassian.com/platform/forge/manifest-reference/scopes-product-jira/) |
| `read:user:jira` | Resolve user details for assignment | `GET /rest/api/3/user` | [Jira Platform Scopes](https://developer.atlassian.com/platform/forge/manifest-reference/scopes-product-jira/) |
| `storage:app` | Store app-specific settings/data | Forge Storage API | [Forge Scopes](https://developer.atlassian.com/platform/forge/manifest-reference/scopes-forge/) |

## Consolidated Changes
- Removed commented-out classic scopes (`read:jira-work`, etc.).
- Removed `read:issue-details:jira` (redundant/invalid).
- Removed `read:issue:jira-software` (replaced by `read:issue:jira` for platform data).
- Removed `read:filter:jira` (unused).
