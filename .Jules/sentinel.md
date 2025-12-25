## 2024-05-23 - Privilege Escalation via `asApp`
**Vulnerability:** The Rovo Action handlers (`src/resolvers/rovoActions.ts`) were performing write operations (like `reassignTicket`, `splitTicket`) using `api.asApp()`.
**Learning:** This is a classic "Confused Deputy" problem in Forge. Using `asApp()` allows the app to perform actions that the triggering user might not have permission to do, effectively bypassing Jira's permission system.
**Prevention:** All user-initiated write actions MUST use `api.asUser()`. This ensures the action is performed with the user's context and permissions. I also added `InputValidation` to sanitize inputs before they hit the API, as a second layer of defense.
