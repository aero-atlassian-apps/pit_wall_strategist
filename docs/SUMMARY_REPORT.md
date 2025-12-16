# Summary Report: Architecture & Security Improvements

## Executive Summary
This update strictly aligns the "Pit Wall Strategist" app with Atlassian's official documentation for Permissions, Scopes, and API usage. The primary focus was transitioning from over-privileged App-only access (`asApp()`) to user-consent based access (`asUser()`), ensuring data security and adherence to the Principle of Least Privilege.

## Key Changes

### 1. Manifest & Scopes
- **Consolidation:** Removed all deprecated and commented-out scopes.
- **Verification:** Validated every scope against [Jira Cloud Platform Scopes](https://developer.atlassian.com/platform/forge/manifest-reference/scopes-product-jira/) and [Jira Software Scopes](https://developer.atlassian.com/platform/forge/manifest-reference/scopes-product-jsw/).
- **Documentation:** Added inline comments in `manifest.yml` linking to the official source for each scope.

### 2. Authentication Policy
- **Shift to `asUser()`:**
    - **Why:** Previously, the app fetched data (boards, sprints, issues) using `asApp()`. This bypasses user permissions, potentially exposing data the user shouldn't see.
    - **Fix:** All data fetching logic in `JiraDataService` and `BoardDiscoveryService` now uses `asUser()`. This ensures the app respects Jira's permission schemes (Browse Projects, View Issues).
    - **Write Operations:** All write actions (Rovo agents) explicitly use `asUser()`, ensuring that actions like "Comment" or "Reassign" are correctly attributed to the user and checked against their permissions.

### 3. API Compliance
- **Endpoint Verification:** Audited all REST API calls against the V3 spec.
- **Documentation:** Added JSDoc comments to every API service method with:
    - The official Atlassian Doc URL.
    - The required Scope.
    - The Authentication context used (`asUser`).

## Artifacts Produced
- `docs/SCOPE_JUSTIFICATION.md`: Detailed audit of every scope used.
- `docs/AUTH_MAP.md`: Security map defining when to use User vs App context.
- `docs/API_USAGE.md`: Technical reference of all endpoints and their requirements.

## Justification
These changes eliminate "guessing" about permissions and ensure the app is robust, secure, and compliant with Atlassian's rigorous app security standards.
