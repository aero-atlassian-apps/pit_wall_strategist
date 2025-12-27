## 2024-02-14 - [CRITICAL] Privilege Escalation in Rovo Actions
**Vulnerability:** The `src/resolvers/rovoActions.ts` module was performing all write operations (creating subtasks, reassigning, commenting) using `api.asApp()`. This bypassed user-level permissions, allowing any user with access to the app to perform actions they might not be authorized to do in Jira (e.g., restricted projects, transition limits). This directly violated the documented authentication policy in the file header.

**Learning:** "Code comments are not code." The file explicitly stated "AUTH POLICY: MUST use asUser()", but the implementation completely ignored it. Security policies must be enforced by linters or automated tests, not just comments. Additionally, unit tests were mocking `api` loosely or running in `local` mode, masking the issue.

**Prevention:**
1.  Implemented `api.asUser()` for all write operations in `rovoActions.ts`.
2.  Added `tests/unit/rovoActionsSecurity.test.ts` which mocks `api.asApp()` to throw a security violation error, ensuring future regressions are caught immediately.
3.  Future work: Consider a custom ESLint rule to flag `api.asApp()` usage in resolver files known to handle user-initiated actions.
