## 2024-05-24 - Accessible Icon Buttons & Tabs
**Learning:** The `IconButton` component relied solely on `title` for accessibility, which is not ideal. Explicit `aria-label` support was needed. Also, tab implementations were non-semantic `div`s.
**Action:** Always verify `aria-label` support in reusable button components. For tabs, ensure `role="tablist"`, `role="tab"`, and `role="tabpanel"` are used with correct ARIA attributes (`aria-selected`, `aria-controls`, `aria-labelledby`).
