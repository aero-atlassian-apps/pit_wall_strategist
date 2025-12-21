## 2024-05-23 - Prevent Sensitive Information Leakage in Logs
**Vulnerability:** The application was logging the full response body of Jira API errors, which could contain sensitive information (PII, internal configuration, custom field data).
**Learning:** `console.log` and `console.warn` in backend resolvers are captured by Forge logs. Logging raw error responses from external APIs is a common source of data leakage.
**Prevention:** Always truncate or sanitize error responses before logging them. Only log the status code and a brief summary or a truncated version of the body (e.g., first 200 chars) for debugging purposes.
