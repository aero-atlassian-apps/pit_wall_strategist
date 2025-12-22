# Sentinel Journal

This journal tracks critical security learnings, vulnerability patterns, and architectural gaps identified during security reviews.

## 2024-05-22 - [Privilege Escalation in Rovo Actions]
**Vulnerability:** `src/resolvers/rovoActions.ts` was using `api.asApp()` for write operations (e.g., `reassignTicket`, `addComment`), effectively bypassing user-level permissions.
**Learning:** Even with explicit comments stating "MUST use asUser()", code can drift or be copied incorrectly. `asApp` usage should be strictly audited, especially for write operations.
**Prevention:** Enforce `asUser()` for all mutation resolvers. Added specific check or lint rule (conceptually) to prevent `asApp` in action handlers.
