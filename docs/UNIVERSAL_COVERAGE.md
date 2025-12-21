# Pit Wall Strategist — Universal Coverage

> **Whatever your team. However you work. Pit Wall has you covered.**

---

## 🏁 The Universal Coverage Statement

This is not marketing. This is a promise backed by code.

| Your Team... | Your Setup... | Pit Wall... |
|--------------|---------------|-------------|
| Business team? | **Covered.** | Full process visibility without Agile leakage |
| Software team? | **Covered.** | Board-aware metrics with sprint intelligence |
| Scrum? | **Covered.** | Sprint-native velocity, burndown, health prediction |
| Kanban? | **Covered.** | Flow-native cycle time, throughput, WIP aging |
| No board at all? | **Covered.** | JQL + lifecycle metrics work without boards |
| Custom workflows? | **Fine.** | Status-category-based — we never assume status names |
| Custom statuses? | **Fine.** | Works with ANY status as long as Jira categories are set |
| Light mode? | **Covered.** | Native Forge theming |
| Dark mode? | **Covered.** | F1 "Night Race" aesthetic |
| Your language? | **Covered.** | EN, FR, ES, PT — frontend AND backend |
| Deterministic metrics? | **Covered.** | Velocity, WIP, Cycle Time, Throughput |
| AI-powered insight? | **Covered.** | Rovo Agent + Expert System |
| Actionability? | **Covered.** | Every insight leads to action or Rovo guidance |

---

## 📊 Support Matrix

This matrix is the **source of truth** for what Pit Wall supports. Judges, reviewers, and customers can reference this to understand our coverage.

### Project Types

| Dimension | Status | Implementation |
|-----------|--------|----------------|
| **Business Projects** | ✅ Fully Supported | `InternalContext.projectType = 'business'` — No Agile terminology forced |
| **Software Projects** | ✅ Fully Supported | `InternalContext.projectType = 'software'` — Full Agile capabilities |

### Board Strategies

| Dimension | Status | Implementation |
|-----------|--------|----------------|
| **Scrum Boards** | ✅ Sprint-Native | `InternalContext.boardStrategy = 'scrum'` — Sprint velocity, burndown, health |
| **Kanban Boards** | ✅ Flow-Native | `InternalContext.boardStrategy = 'kanban'` — Cycle time, throughput, WIP limits |
| **No Board** | ✅ JQL-Based | `InternalContext.boardStrategy = 'none'` — Works with lifecycle metrics |

### Workflow Flexibility

| Dimension | Status | Implementation |
|-----------|--------|----------------|
| **Custom Workflows** | ✅ Category-Based | Status categories (TODO/IN_PROGRESS/DONE) — not status names |
| **Custom Statuses** | ✅ No Assumptions | We map to `statusCategory`, never assume "In Progress" or "Done" text |
| **Issue Hierarchies** | ✅ Auto-Detected | Epics, Stories, Subtasks discovered via Context Engine |

### User Experience

| Dimension | Status | Implementation |
|-----------|--------|----------------|
| **Light Mode** | ✅ Native Forge | CSS variables adapt to Jira's theme |
| **Dark Mode** | ✅ F1 Night Race | Premium "Night Race" aesthetic with glow effects |
| **English** | ✅ Full i18n | All UI strings + Rovo prompts |
| **French** | ✅ Full i18n | Terminologie complète |
| **Spanish** | ✅ Full i18n | Terminología completa |
| **Portuguese** | ✅ Full i18n | Terminologia completa |

### Intelligence Layer

| Dimension | Status | Implementation |
|-----------|--------|----------------|
| **Deterministic Metrics** | ✅ Calculated | Velocity, WIP, Cycle Time, Throughput — always accurate |
| **Predictive Analytics** | ✅ Sprint Health | 0-100% completion probability with factor breakdown |
| **Pre-Stall Detection** | ✅ Proactive | Alerts BEFORE tickets stall (70% threshold warning) |
| **Rovo AI Agent** | ✅ Context-Aware | 10 strategic actions with F1 terminology |
| **Expert System Chat** | ✅ Embedded | Built-in analytics without external AI calls |

### Actionability

| Dimension | Status | Implementation |
|-----------|--------|----------------|
| **Insight → Action** | ✅ First-Class | Every metric leads to suggested actions |
| **Rovo Integration** | ✅ 10 Actions | THE UNDERCUT, TEAM ORDERS, RED FLAG, etc. |
| **Strategy Intelligence** | ✅ Context-Aware | Recommendations filtered by relevance level |

---

## 🎯 What This Means for You

### For Codegeist Judges

This isn't a prototype that only works with demo data. Pit Wall:
- Auto-detects your environment
- Adapts its vocabulary and metrics
- Never breaks on edge cases
- Works on Day 1, no configuration required

### For Enterprise Buyers

Your organization has:
- Multiple project types? ✅
- Custom workflows? ✅
- Teams in different countries? ✅
- Strict compliance requirements? ✅ (Runs on Atlassian certified)

### For Marketplace Customers

Install → Open → Done.

No configuration wizards. No "please set up your workflow mapping." No "this feature only works with Scrum."

---

## 🔗 Evidence Links

Every claim above is backed by code. Here's where to find the proof:

| Claim | Evidence File |
|-------|---------------|
| Project Type Detection | [`src/domain/types/Context.ts`](file:///d:/rouca/DVM/workPlace/pit_wall_strategist/pit_wall_strategist%20_forge_app/src/domain/types/Context.ts) |
| Board Strategy Support | [`src/domain/types/Context.ts`](file:///d:/rouca/DVM/workPlace/pit_wall_strategist/pit_wall_strategist%20_forge_app/src/domain/types/Context.ts) |
| i18n Implementation | [`static/frontend/src/i18n/index.ts`](file:///d:/rouca/DVM/workPlace/pit_wall_strategist/pit_wall_strategist%20_forge_app/static/frontend/src/i18n/index.ts) |
| Theme Variables | [`static/frontend/src/theme/variables.css`](file:///d:/rouca/DVM/workPlace/pit_wall_strategist/pit_wall_strategist%20_forge_app/static/frontend/src/theme/variables.css) |
| Rovo Agent Definition | [`manifest.yml`](file:///d:/rouca/DVM/workPlace/pit_wall_strategist/pit_wall_strategist%20_forge_app/manifest.yml) |
| Metric Validity System | [`src/domain/types/Context.ts#MetricValidity`](file:///d:/rouca/DVM/workPlace/pit_wall_strategist/pit_wall_strategist%20_forge_app/src/domain/types/Context.ts) |

---

## 🏆 The Bottom Line

> **"This is not a dashboard. This is a decision cockpit."**

Pit Wall doesn't show you data and leave you to figure it out. It:
1. **Detects** your context automatically
2. **Adapts** its vocabulary and metrics
3. **Analyzes** what matters for YOUR team
4. **Recommends** specific, executable actions
5. **Executes** via Rovo — from insight to action in seconds

**Pit Wall has you covered. 🏁**
