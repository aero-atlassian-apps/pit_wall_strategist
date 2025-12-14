# MASTER PRODUCT REQUIREMENTS DOCUMENT (PRD) v2.0
**Project Name:** The Pit Wall Strategist (Codegeist 2025 Edition)
**Target Platform:** Atlassian Forge (Custom UI) + Rovo Agents
**Theme:** Williams Racing "System of Work"
**Output Goal:** Grand Prize Winner ($50,000)

---

## 1. EXECUTIVE SUMMARY
The Pit Wall Strategist is a Rovo-powered "Race Engineer" for Jira. It transforms the standard Jira experience into a high-fidelity Formula 1 Mission Control dashboard. It monitors sprint telemetry (velocity, blockers, burnout) in real-time and uses an Agentic AI to actively intervene via "Box Box" protocols when work stalls.

**Core Philosophy:**
- **Visuals:** High-contrast Dark Mode, F1-inspired gauges, "Mission Control" aesthetic.
- **Logic:** Proactive intervention (Agentic) vs. Passive reporting (Dashboard).
- **Metaphor:** The Sprint is the Race. The Scrum Master is the Race Engineer. The Developer is the Driver.

---

## 2. VISUAL DESIGN SYSTEM (STRICT ENFORCEMENT)
**Constraint:** The app must force a dedicated "Dark Mode" to maintain the immersive F1 Pit Wall aesthetic.

### 2.1 Color Palette
| Variable | Hex Code | Usage |
|----------|----------|-------|
| `--pit-bg-main` | `#0F172A` | Global Background (Slate 900) - The Asphalt |
| `--pit-bg-card` | `#1E293B` | Panel/Card Backgrounds (Slate 800) |
| `--pit-red-alert` | `#FF0033` | Box Box Buttons, Critical Blockers (Neon Red) |
| `--pit-green-optimal` | `#39FF14` | Good Velocity, On Track (Neon Green) |
| `--pit-yellow-flag` | `#F4D03F` | Warning, Slow Pace (Safety Car Yellow) |
| `--pit-purple-fast` | `#BF5AF2` | Velocity Lines, High Performance (Sector Purple) |
| `--pit-text-primary` | `#F8FAFC` | Main Data Values (White) |
| `--pit-text-muted` | `#94A3B8` | Labels, Axis Text (Slate 400) |

### 2.2 Typography
- **Data/Headers:** Monospace (Roboto Mono, JetBrains Mono, or Courier). All Caps. Letter-spacing: 1px.
- **Body Text:** Sans-Serif (Inter, Segoe UI).

---

## 3. TECHNICAL ARCHITECTURE

### 3.1 Stack
- **Platform:** Atlassian Forge (Custom UI).
- **Frontend:** React 18, styled-components, recharts.
- **Backend:** Forge Serverless Functions (Node.js 18).
- **AI:** Atlassian Rovo (Agent API).
- **Data Source:** Jira Cloud REST API v3 + DevOps API.

### 3.2 Directory Structure
```
src/
  resolvers/
    index.js               # Main Entry (Get Telemetry, Config)
    telemetryUtils.js      # Sprint calc, status grouping
    timingMetrics.js       # Lead/Cycle Time logic
    trendMetrics.js        # Sparkline history logic
    devOpsDetection.js     # No-commit alert logic
    rovoActions.js         # "Box Box" interventions
static/frontend/src/
  components/
    Common/                # F1Card, StatusLight, Sparkline
    Dashboard/
      DashboardLayout.jsx  # 3-Column Grid
      TelemetryPanel.jsx   # Left Col: Gauges & Metrics
      TimingMetrics.jsx    # Lap/Sector Times
      DevOpsPanel.jsx      # DevOps Status & Alerts
      TrackMap.jsx         # Center Col: Circuit View
      RaceControl.jsx      # Right Col: Feed & Button
    Modals/
      StrategyModal.jsx    # Rovo Intervention UI
    Settings/
      SettingsPanel.jsx    # Configuration UI
    Onboarding/
      TourOverlay.jsx      # Driver Briefing Tour
  context/
    TourContext.jsx        # Onboarding State
  styles/
    theme.js               # F1 Design Tokens
    GlobalStyles.js        # CSS Reset & Dark Mode
```

---

## 4. FEATURE SPECIFICATIONS

### 4.1 Feature A: The Telemetry Dashboard (Custom UI)
**Layout:** Fixed 3-column grid `[25% | 50% | 25%]` spanning 100% height.

#### Panel 1: Car Health (Left Column)
**Goal:** Visualize technical health & pace.
1.  **Fuel Load (WIP Monitor):**
    *   **Logic:** Count of tickets in "In Progress" status category.
    *   **Visual:** Vertical Bar Gauge. Red if > User Config Limit (default 8).
2.  **Tire Deg (Burnout Monitor):**
    *   **Logic:** Tickets assigned per person.
    *   **Visual:** Progress bars per user. Red if > User Config Capacity (default 3).
3.  **Lap Times (Lead Time):**
    *   **Logic:** Average time from Created → Done.
    *   **Visual:** Driver leaderboard (Fastest "Lap").
4.  **Sector Times (Cycle Time):**
    *   **Logic:** Avg time in Status Groups (To Do / In Progress / Done).
    *   **Visual:** 3-grid sector view. Green/Yellow/Red based on pace.
5.  **Race History (Sparklines):**
    *   **Logic:** 7-day trend for WIP and Velocity.
    *   **Visual:** Mini bar charts showing up/down trends.

#### Panel 2: The Track Map (Center Column)
**Goal:** Visualize flow. Replace Kanban with "Circuit View".
*   **Visual:** Horizontal tracks (swimlanes) representing status categories.
    *   **Sector 1 (To Do):** Pit Lane exit.
    *   **Sector 2 (In Progress):** The Long Straight (Active work).
    *   **Sector 3 (Review):** The Chicane (QA/Code Review).
    *   **Finish Line (Done):** End of track.
*   **Interaction:** Tickets are dots (•).
    *   **Normal:** White dot.
    *   **Stalled:** Flashing Red Halo (if no update > Config Threshold).
    *   **Hover:** Tooltip with ticket details.

#### Panel 3: Race Control (Right Column)
**Goal:** Agent Interaction & Alerts.
1.  **The Feed:** Scrolling terminal-style log of sprint events.
    *   `> 10:42: SECTOR 2 CLEAR`
    *   `> 10:45: TICKET-123 STALLED (26h)`
2.  **DevOps Telemetry:**
    *   **Logic:** Checks linked commits/PRs via Jira DevOps API.
    *   **Visual:** "No Signal" alert if ticket is In Progress but has 0 commits > 48h.
3.  **The "BOX BOX" Button (Hero Element):**
    *   **Position:** Fixed at bottom.
    *   **State A (Calm):** Grey "RACE NORMAL".
    *   **State B (Alert):** Flashing Red "BOX BOX: INTERVENTION REQ".
    *   **Action:** Opens StrategyModal.

### 4.2 Feature B: The "Box Box" Protocol (Rovo Agent)
**Logic:** The "Stagnation Algorithm".
1.  Fetch "In Progress" issues.
2.  Trigger if `(Now - LastUpdated) > Config Threshold` OR `No Commits > 48h`.
3.  **Interaction:** User clicks "BOX BOX" -> StrategyModal opens.
4.  **Rovo Response:** Presents 3 AI-generated options:
    *   **Option 1: The Undercut** (Split Ticket into Subtasks).
    *   **Option 2: Team Orders** (Reassign to Senior Dev).
    *   **Option 3: Retire Car** (Move to Backlog).

### 4.3 Feature C: Race Configuration (Settings)
**Goal:** Flexibilty for any team.
*   **Access:** Gear icon in header.
*   **Configurable Parameters:**
    *   **WIP Limit (Fuel):** Default 8.
    *   **Assignee Capacity (Tires):** Default 3.
    *   **Stalled Threshold (Pit Window):** Default 24h.
*   **Board Detection:** Auto-detects Scrum vs Kanban.

### 4.4 Feature D: Driver Briefing (Onboarding)
**Goal:** Intro for new users.
*   **Mechanism:** Interactive spotlight tour (tour.js logic).
*   **Steps:** Welcome -> Telemetry -> Track -> Race Control -> Box Box -> Settings.
*   **Persistence:** Uses `localStorage` to show only once.
*   **Replay:** Available via Settings panel.

---

### 4.5 Feature E: Universal "Race Spec" Compatibility
**Goal:** Ensure the app works on ANY Jira project (Scrum, Kanban, Company-managed, Team-managed) without manual configuration.

#### 1. "Rubber on the Road" (Status Categories)
*   **Problem:** Every team names statuses differently (`"To Do"`, `"Open"`, `"Backlog"`, `"Ready"`).
*   **Solution:** The app ignores raw status names and maps everything to Jira's 3 universal Status Categories:
    *   `new` (Grey) → Sector 1 (Padlock).
    *   `indeterminate` (Blue/Yellow) → Sector 2 (The Race Track).
    *   `done` (Green) → Sector 3 (Finish Line).

#### 2. "Fuel & Pacing" Discovery (Custom Fields)
*   **Dynamic Detection:** The app auto-scans the Jira instance to find the correct Custom Field IDs for:
    *   **Story Points:** Scans for fields named `Story Points`, `Story point estimate`, etc.
    *   **Sprints:** Scans for `Sprint` custom field to filter active work.
*   **Fallback:** If no fields found, defaults to Issue Count (WIP) and Rolling Date Window (Kanban).

#### 3. "Circuit Type" Detection (Scrum vs Kanban)
*   **Scrum Mode:**
    *   **Scope:** Issues in the *Active Sprint*.
    *   **Badge:** "SPRINT: ACTIVE".
    *   **Goal:** Finish all tickets before sprint end.
*   **Kanban Mode:**
    *   **Scope:** Issues updated in the last 14 days (Rolling Window).
    *   **Badge:** "FLOW: CONTINUOUS".
    *   **Goal:** Maintain WIP limits and consistent flow.
*   **Handle Kanban Gracefully:** Ensure gauges and track map function without Sprint Start/End dates.

#### 4. Component Retrofitting (Phase 11 Specifics)
*   **Update TrackMap:** Refactor `TrackMap.jsx` to use universal `statusCategory` instead of hardcoded column names.
*   **Settings Integration:** Integrate `SettingsPanel.jsx` into the main `App.jsx` header (Gear Icon) to allow real-time threshold configuration.
*   **Thresholds:** Add UI for WIP Limit, Assignee Capacity, and Stalled Hours.

---

## 5. JIRA API & SECURITY (SCOPES)

**Permissions Required (`manifest.yml`):**
*   `read:jira-work`: Fetch issues, boards, sprints.
*   `write:jira-work`: Rovo actions (assign, transition, comment).
*   `read:jira-user`: Identify assignees.
*   `read:dev-ops:jira`: Check commit status (DevOps functionality).

**API Endpoints Used:**
*   `/rest/api/3/search` (JQL for issues & trends).
*   `/rest/api/3/issue/{key}/changelog` (Timing metrics).
*   `/rest/dev-status/latest/issue/summary` (DevOps detection).
*   `/rest/agile/1.0/board/{id}/sprint` (Sprint detection).

---

## 6. MOCK DATA STRATEGY
**Goal:** Ensure Visceral Demo even in empty test projects.
*   **Trigger:** If `forge bridge` fails or returns empty data, load `mock-data.json`.
*   **Content:**
    *   Sprint Status: CRITICAL.
    *   1 Stalled Ticket (TICKET-422, "OAuth2 Backend").
    *   High Burnout for "Sarah".
    *   GitHub Integration: Connected but TICKET-422 has "No Signal".

---

## 7. USER STORY & DEMO FLOW
**Scene 1: The Friction**
*   Dashboard loads. "Driver Briefing" tour runs (skipped for speed).
*   **Visuals:** "Fuel Load" is Red. "Tire Deg" (Sarah) is Red. "BOX BOX" button flashes.

**Scene 2: The Data**
*   Hover over Red Dot on Track Map -> "TICKET-422: OAuth2 Backend".
*   Check DevOps Panel -> "TICKET-422: No Commits (52h)".
*   Check Sparkline -> Velocity trending down.

**Scene 3: The Intervention**
*   Click "BOX BOX".
*   **Rovo Agent:** "Driver stuck in Sector 2. No telemetry signal (commits). Suggest Option A: The Undercut."
*   User clicks "Execute Option A".

**Scene 4: The Flow**
*   Dashboard refreshes.
*   "Fuel Load" drops to Green.
*   TICKET-422 dot moves to "Done".
*   Feed updates: `14:05 | STRATEGY EXECUTED | PACE RESTORED`.
