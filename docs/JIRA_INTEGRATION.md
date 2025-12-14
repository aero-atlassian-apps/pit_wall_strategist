# JIRA API INTEGRATION & SECURITY GUIDE
**Project:** The Pit Wall Strategist
**Type:** API Reference Definition

This document defines how "The Pit Wall Strategist" interacts with Atlassian's ecosystem, ensuring security compliance and API efficiency.

---

## 1. AUTHENTICATION & SECURITY

### 1.1 Authentication Mechanism
*   **Method:** Managed OAuth 2.0 (via `@forge/api`).
*   **Token Handling:** Tokens are automatically rotated and managed by the Forge Runtime. The app code never accesses raw tokens, only an authenticated `requestJira` client.
*   **User Context:** Code runs `asApp()` for high-level queries and `asUser()` for actions requiring user attribution (comments, transitions).

### 1.2 Permission Scopes (`manifest.yml`)
The app operates on the Principle of Least Privilege.

| Scope | Justification | Usage in App |
|-------|---------------|--------------|
| `read:jira-work` | Core function. Reading issues and board configuration. | Fetching sprint issues, status categories, assignee data. |
| `write:jira-work` | Required for Rovo Interventions. | "Split Ticket", "Reassign", "Defer" actions. |
| `read:jira-user` | Required for Team Burnout metrics. | Calculating "Tire Deg" (issues per person). |
| `read:dev-ops:jira`| Required for "No Signal" alerts. | Checking if issues have linked commits/branches. |

---

## 2. API ENDPOINTS & USAGE

### 2.1 Sprint & Board Discovery (Auto-Detection)
**Goal:** Determine if user is on a Scrum or Kanban board.

*   **Endpoint:** `/rest/agile/1.0/board/{boardId}`
    *   **Check:** `type` ("scrum" vs "kanban").

*   **Endpoint:** `/rest/agile/1.0/board/{boardId}/sprint?state=active`
    *   **Usage:** Gets the current active sprint ID for filtering issues.

### 2.2 Telemetry Data Fetching (The Main Loop)
**Goal:** High-efficiency data retrieval. Uses JQL to minimize payload.

*   **Endpoint:** `/rest/api/3/search`
*   **JQL Query:**
    ```jql
    sprint in openSprints() AND statusCategory in ("To Do", "In Progress", "Done")
    ```
*   **Fields Requested:** `summary, status, assignee, priority, created, updated, resolutiondate`.
*   **Optimization:** Fetches minimal fields to reduce latency.

### 2.3 Timing Metrics (Heavy Lift)
**Goal:** Calculate Lap Times (Lead Time) and Sectors (Cycle Time).

*   **Endpoint:** `/rest/api/3/issue/{issueIdOrKey}/changelog`
*   **Logic:**
    *   Iterates through history.
    *   Sums time diff between `status` field changes.
    *   **Note:** This is an expensive call. In Production, this should be cached or calculated async (future roadmap). Currently real-time.

### 2.4 DevOps Integration
**Goal:** Detect "No Signal" (Issues with no code).

*   **Endpoint:** `/rest/dev-status/latest/issue/detail?issueId={id}&applicationType=fecru&dataType=repository`
*   **Logic:** Checks `detail[0].repositories[0].commits`. If empty array, flags as No Signal.

### 2.5 Strategy Intelligence Data (P0 Features)
**Goal:** Predictive analytics for Sprint Health and Stalls.

*   **Resolver:** `getAdvancedAnalytics`
*   **Data Source:** Aggregates data from `fetchSprintData`.
*   **Logic:** Pure calculation layer (CPU bound). Does not require additional external API calls, ensuring speed.
*   **Outputs:**
    *   `sprintHealth` (0-100 Score)
    *   `preStallWarnings` (Array of risky issues)
    *   `bottleneck` (Workflow constraint analysis)

### 2.6 Action Execution (Rovo & Pit Wall)
**Goal:** Physically update issues via REST API (No "comment-only" actions).

*   **Endpoint:** `PUT /rest/api/3/issue/{key}`
    *   **Usage:** Updates Priority, Assignee, Estimates, and Flags.
    *   **Field Discovery:** Uses `GET /rest/api/3/field` to dynamically find ID for `Story Points` (e.g., `customfield_10016`) and `Flagged` (e.g., `customfield_10021`).
*   **Endpoint:** `POST /rest/api/3/issue/{key}/transitions`
    *   **Usage:** "Push to Limit" (Move status) and "Retire Car" (Move to backlog/To Do).
*   **Endpoint:** `POST /rest/api/3/issueLink`
    *   **Usage:** "Slipstream" (Link issues).

---

## 3. ERROR HANDLING & FALLBACKS

### 3.1 The "Pit Stop" Fallback
If the Forge Bridge fails to connect or returns 403 (Unauthorized):
1.  App catches the error in `App.jsx`.
2.  Triggers `mockData` loading.
3.  **User Benefit:** Ensures the Dashboard never crashes, instead showing a "Simulation Mode" (Demo Data).

### 3.2 Rate Limiting
*   The app respects Atlassian's API Rate Limits.
*   Heavy calculations (like Cycle Time) are done on the Backend (Node.js Resolver) to offload the client.
