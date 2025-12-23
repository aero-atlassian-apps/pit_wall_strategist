## 2024-04-18 - Permission Bypass in Rovo Actions
**Vulnerability:** `src/resolvers/rovoActions.ts` was using `api.asApp()` for all Jira write operations (assignments, transitions, comments). This meant the app was acting as the system user, bypassing the actual user's permissions.
**Learning:** Developers often default to `api.asApp()` to avoid permission errors during development, but this breaks the security model in production.
**Prevention:** Strictly enforce `api.asUser()` for all mutations. Use `api.asApp()` ONLY for reading configuration or data the user *should* see but can't directly access (e.g., app-specific storage).
