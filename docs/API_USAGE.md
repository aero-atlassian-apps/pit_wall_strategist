# API Usage Map

A comprehensive list of all Jira REST endpoints used in the application.

## Platform REST API v3
Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/

| Endpoint | Method | Purpose | Scopes | Error Codes Handled |
|----------|--------|---------|--------|---------------------|
| `/rest/api/3/project/{projectKey}` | GET | Detect project type | `read:project:jira` | 404 (Default to software) |
| `/rest/api/3/search/jql` | POST | Search issues | `read:issue:jira` | 400, 401, 403 |
| `/rest/api/3/issue/{issueIdOrKey}` | GET | Get issue details | `read:issue:jira` | 404 |
| `/rest/api/3/issue` | POST | Create issue/subtask | `write:issue:jira` | 400, 403 |
| `/rest/api/3/issue/{issueIdOrKey}` | PUT | Update fields (assignee, priority) | `write:issue:jira` | 400, 403 |
| `/rest/api/3/issue/{issueIdOrKey}/transitions` | GET | Get available transitions | `read:issue:jira` | 404 |
| `/rest/api/3/issue/{issueIdOrKey}/transitions` | POST | Execute transition | `write:issue:jira` | 400, 403 |
| `/rest/api/3/issue/{issueIdOrKey}/comment` | POST | Add comment | `write:comment:jira` | 400, 403 |
| `/rest/api/3/issueLink` | POST | Link issues | `write:issue:jira` | 400, 404 |
| `/rest/api/3/user` | GET | Get user details | `read:user:jira` | 404 |

## Jira Software Agile API v1.0
Docs: https://developer.atlassian.com/cloud/jira/software/rest/intro/

| Endpoint | Method | Purpose | Scopes | Error Codes Handled |
|----------|--------|---------|--------|---------------------|
| `/rest/agile/1.0/board` | GET | Discover boards | `read:board-scope:jira-software` | 404 |
| `/rest/agile/1.0/board/{boardId}/configuration` | GET | Get board columns/config | `read:board-scope.admin:jira-software` | 404 |
| `/rest/agile/1.0/board/{boardId}/sprint` | GET | Get sprints (Active, Future, Closed) | `read:sprint:jira-software` | 404 |
| `/rest/agile/1.0/board/{boardId}/issue` | GET | Get issues on board | `read:board-scope:jira-software` | 404 |
| `/rest/agile/1.0/sprint/{sprintId}/issue` | GET | Get issues in sprint | `read:sprint:jira-software` | 404 |

## Compliance Notes
- All endpoints verified against V3/Agile 1.0 specs.
- Auth updated to `asUser()` for all above endpoints.
- Scopes matched exactly to documentation requirements.
