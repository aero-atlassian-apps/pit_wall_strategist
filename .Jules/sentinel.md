## 2024-05-23 - Critical Policy Violation in Rovo Actions

**Vulnerability:** The entire `rovoActions.ts` file was using `api.asApp()` for write operations (assign, comment, transition), which bypassed the user's permission model. This allowed the app to perform actions the user might not be authorized to do (privilege escalation).

**Learning:** Despite the file header explicitly stating "MUST use `asUser()`", the implementation defaulted to `asApp()`. This highlights that comments are not code and strict static analysis or review is required.

**Prevention:** I have replaced all `asApp()` calls with `asUser()` in `rovoActions.ts`. Future prevention involves:
1.  Targeted tests that mock `api` and assert `asApp` is *not* called for write operations.
2.  Potential linting rules or git hooks to flag `asApp` usage in mutation resolvers.
