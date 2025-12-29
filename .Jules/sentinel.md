## 2024-05-23 - [Privilege Escalation in Rovo Actions]
**Vulnerability:** The `rovoActions.ts` resolver was using `api.asApp()` for all write operations (creating issues, comments, transitions) instead of `api.asUser()`. This allowed the app to perform actions on behalf of users even if the user lacked the necessary permissions in Jira, effectively bypassing Jira's permission model.
**Learning:** Even with clear comments stating "All write operations MUST use `asUser()`", copy-paste errors or lack of enforcement can lead to widespread use of `asApp()`. The existing tests masked this by running in "local" mode or not checking the auth context.
**Prevention:**
1.  Enforce `asUser()` for all user-initiated actions.
2.  Add specific security tests (like `rovoActionsSecurity.test.ts`) that run in non-local mode and mock `@forge/api` to verify which authentication context is used.
3.  Avoid `asApp()` unless strictly necessary for system-level operations that *must* bypass user permissions (which is rare for user-facing actions).
