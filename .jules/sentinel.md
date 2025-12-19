## 2024-05-23 - Initial Security Assessment
**Vulnerability:** Unsanitized JQL Injection in CalculateVelocityUseCase
**Learning:** The `CalculateVelocityUseCase` constructs a JQL query by directly interpolating the `projectKey` without validation or sanitization. If `projectKey` comes from an untrusted source (which it does, via the resolver payload), an attacker could inject malicious JQL clauses. Although the Forge `asUser()` context provides some protection, injection is still possible within the user's viewable scope.
**Prevention:** Implement strict input validation for `projectKey` to ensure it only contains alphanumeric characters and standard delimiters (e.g., `-`).

**Vulnerability:** Potential XSS in `manifest.yml` CSP
**Learning:** The `manifest.yml` includes `'unsafe-inline'` in the Content Security Policy for styles. While common in React apps, it weakens security.
**Prevention:** Remove `'unsafe-inline'` if possible, or document why it's strictly necessary and ensure strict code review for any inline style generation.

**Vulnerability:** Missing Input Validation in `getSprintHealth` Resolver
**Learning:** The `getSprintHealth` resolver accepts an `issues` array directly from the client. There is no validation of the structure or content of these issue objects before processing.
**Prevention:** Validate the schema of the `issues` array using a library like Zod or manual checks before passing it to the domain logic.
