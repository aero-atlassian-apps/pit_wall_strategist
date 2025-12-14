# FEATURES, RULES & CAPABILITIES GUIDE
**Project:** The Pit Wall Strategist
**Scope:** Business Logic & System Behavior

This document details the exact rules, calculations, and thresholds used by the system. It serves as the "Source of Truth" for QA testing and User acceptance.

---

## 1. CORE TELEMETRY METRICS

### 1.1 Fuel Load (Work In Progress)
*   **Definition:** The total number of issues currently in active development.
*   **Calculation Rule:**
    *   Find all issues in the current Sprint (Scrum) or Board (Kanban).
    *   Filter for `statusCategory == 'In Progress'` (key: `indeterminate`).
    *   Count total issues.
*   **Thresholds (Configurable):**
    *   **OPTIMAL (Green):** Count < User Config (Default: 8).
    *   **WARNING (Yellow):** Count >= 80% of Limit.
    *   **CRITICAL (Red):** Count >= Limit.

### 1.2 Tire Degradation (Team Burnout)
*   **Definition:** The workload intensity per individual team member.
*   **Calculation Rule:**
    *   Group "In Progress" issues by `fields.assignee.displayName`.
    *   Count issues per assignee.
*   **Thresholds (Configurable):**
    *   **OPTIMAL (Green):** Tickets < User Config (Default: 3).
    *   **WARNING (Yellow):** Tickets >= User Config.
    *   **CRITICAL (Red):** Tickets > User Config + 2 (Simulates extreme overload).

### 1.3 Velocity Delta (Pace)
*   **Definition:** Comparison of current completion rate vs historical average.
*   **Calculation Rule:**
    *   Current Velocity = Issues completed in current period (last 7 days).
    *   Historical Velocity = Average issues completed per week over last 4 weeks.
    *   Delta = `((Current - Historical) / Historical) * 100`.
*   **Display Rule:**
    *   Positive Delta: Green "▲ +X%".
    *   Negative Delta: Red "▼ -X%".

---

## 2. TIMING METRICS (ADVANCED)

### 2.1 Lead Time ("Lap Times")
*   **Definition:** Time elapsed from ticket creation to completion.
*   **Calculation Rule:**
    *   `ResolutionDate - CreatedDate` (in hours).
    *   If no resolution date, use `LastUpdated` if status is Done.
*   **Grouping:** Average lead time per Assignee ("Driver").
*   **Ranking:** Sorted by fastest average time (Asscending).

### 2.2 Cycle Time ("Sector Times")
*   **Definition:** Time spent in each Status Category (The "Sectors").
*   **Sectors:**
    *   **Sector 1:** `StatusCategory = 'To Do' (new)`.
    *   **Sector 2:** `StatusCategory = 'In Progress' (indeterminate)`.
    *   **Sector 3:** `StatusCategory = 'Done' (done)` (Time from done to closed/released).
*   **Calculation Rule:**
    *   Uses Jira Changelog API (`/rest/api/3/issue/{key}/changelog`).
    *   Sums duration between status transition timestamps.

---

## 3. INTELLIGENT ALERTS

### 3.1 Stalled Ticket Detection
*   **Rule:** A ticket is "Stalled" if:
    1.  Status is "In Progress".
    2.  `Time Now - Last Updated Time` > **Stalled Threshold** (Default: 24 hours).
*   **Visual Behavior:**
    *   **Track Map:** Dot gains a pulsing red halo.
    *   **Feed:** "CRITICAL: TICKET-123 STALLED > 24h".
    *   **Box Box Button:** Flashes Red.

### 3.2 DevOps "No Signal" Alert
*   **Rule:** A ticket invokes a "No Signal" warning if:
    1.  Status is "In Progress".
    2.  DevOps API returns 0 linked commits.
    3.  `Time Now - Last Updated` > 48 hours.
*   **Meaning:** Work is claimed to be "In Progress" but no code is being pushed.

---

## 4. ROVO AGENT ACTIONS ("BOX BOX")

### 4.1 Available Strategies (10 Total)

|Strategy|Action Key|Description|
|---|---|---|
| **The Undercut** | `split-ticket` | Creates sub-tasks to break down complex work |
| **Team Orders** | `reassign-ticket` | Reassigns to a team member with capacity |
| **Retire Car** | `defer-ticket` | Moves to backlog & clears active sprint field |
| **Blue Flag** | `change-priority` | Escalates priority to clear blockers |
| **Push to Limit** | `transition-issue` | Transitions to next workflow status |
| **Red Flag** | `add-blocker-flag` | Sets "Impediment" flag & adds blocked label |
| **Slipstream** | `link-issues` | Links related issues for coordination |
| **Fuel Adjustment** | `update-estimate` | Updates Story Points (dynamic) or time |
| **Radio Message** | `add-radio-message` | Adds strategic comment to issue |
| **Pit Crew Task** | `create-subtask` | Creates targeted subtask |

### 4.2 Strategy Intelligence Engine

The app uses context-aware intelligence to recommend only relevant strategies:

**Context Factors Analyzed:**
*   **Board Type:** Scrum (sprint) vs Kanban (flow)
*   **Issue State:** Stalled, blocked, in-progress, done
*   **Issue Type:** Epic, Story, Bug, Subtask
*   **Priority:** Highest → Lowest
*   **Days in Status:** Time stuck in current state
*   **Story Points:** Large items (≥5) get different recommendations
*   **Sprint Status:** Days remaining, active/inactive
*   **WIP Levels:** Current vs configured limit

**Relevance Levels:**
| Level | Visual | Meaning |
|-------|--------|---------|
| 🔥 **Critical** | Red glow, "URGENT" badge | Must-do action |
| ✅ **Recommended** | Green glow, "SUGGESTED" badge | Good option |
| ◻️ **Available** | No highlight | Valid but not prioritized |
| ❌ **Hidden** | Not shown | Irrelevant for context |

**Example Rules:**
*   **Undercut → Critical** when: Large stalled ticket (≥5 SP) with no subtasks
*   **Red Flag → Critical** when: Stalled but not yet flagged as blocked
*   **Retire Car → Hidden** when: Issue is High/Highest priority
*   **Fuel Adjustment → Critical** when: Scrum issue with no story points

---

## 5. BOARD SUPPORT RULES

The app automatically adapts to the project type:

*   **Scrum Projects:**
    *   Status Badge: "SPRINT".
    *   Scope: Issues in the *Active Sprint* only.
    *   Key Metrics: Lead Time, Sprint Progress, Velocity Delta
*   **Kanban Projects:**
    *   Status Badge: "FLOW".
    *   Scope: Issues updated in the last 14 days (Rolling window).
    *   Key Metrics: Cycle Time, Throughput, WIP Trend

---

## 7. ADVANCED ANALYTICS (INTELLIGENCE ENGINE)

### 7.1 Sprint Health Predictor
*   **Purpose:** Predicts probability of successful sprint completion.
*   **Formula:** `Score = (VelocityFactor * 0.3) + (TimeFactor * 0.3) + (StalledFactor * 0.25) + (ScopeFactor * 0.15)`
*   **Factors:**
    *   **Velocity Factor:** `Current Points / Historical Velocity` (Capped at 1.5).
    *   **Time Factor:** `Actual Progress / Expected Progress` (Linear burn).
    *   **Stalled Factor:** `1 - (Stalled Issues / Total Issues)`.
    *   **Scope Factor:** `1 - (WIP / Total) * 0.5`.
*   **Output Levels:**
    *   🏁 **GREEN FLAG (≥80%):** "On track for podium finish."
    *   🟡 **YELLOW FLAG (50-79%):** "Pace dropping. Tire degradation detected."
    *   🔴 **RED FLAG (<50%):** "BOX BOX! Immediate intervention required."

### 7.2 Pre-Stall Warning System
*   **Purpose:** Proactive alert *before* a ticket becomes stalled.
*   **Trigger:** When time in status reaches **70%** of the Stalled Threshold (e.g., 16.8h of 24h).
*   **Risk Levels:**
    *   **WATCH:** 50-70% of threshold.
    *   **WARNING:** 70-85% of threshold.
    *   **CRITICAL:** >85% of threshold (Imminent stall).

### 7.3 WIP Aging Alert (Kanban)
*   **Purpose:** Identifies issues that violate "Flow" principles.
*   **Methdology:** Lean / Little's Law.
*   **Logic:**
    1.  Calculates **85th Percentile** cycle time from historical data.
    2.  Compares current issue's age against this P85 benchmark.
*   **Thresholds:**
    *   **Aging:** Age > P85.
    *   **Critical:** Age > 1.5x P85.

### 7.4 Bottleneck Detector (Theory of Constraints)
*   **Purpose:** Finds the "limiting factor" in the workflow.
*   **Logic:** Identifies the status column with the highest **Issue Count** OR highest **Average Time**.
*   **Impact Score:** `% of Total WIP` in that column.
*   **F1 Metaphors:**
    *   **Code Review:** "Pit lane congestion! Add pit crew."
    *   **QA/Testing:** "Scrutineering delay!"
    *   **Blocked:** "Safety Car on track!"

### 7.5 Scope Creep Detector
*   **Purpose:** Detects work added after sprint start.
*   **Logic:** Count issues where `CreatedDate > SprintStartDate`.
*   **Alert:** Triggered if >2 issues or >5 story points added mid-sprint.

---

---

## 5. BOARD SUPPORT RULES

The app automatically adapts to the project type:

*   **Scrum Projects:**
    *   Status Badge: "SPRINT".
    *   Scope: Issues in the *Active Sprint* only.
    *   Key Metrics: Lead Time, Sprint Progress, Velocity Delta
*   **Kanban Projects:**
    *   Status Badge: "FLOW".
    *   Scope: Issues updated in the last 14 days (Rolling window).
    *   Key Metrics: Cycle Time, Throughput, WIP Trend

---

## 6. ADVANCED ANALYTICS (INTELLIGENCE ENGINE)

### 6.1 Sprint Health Predictor
*   **Purpose:** Predicts probability of successful sprint completion.
*   **Formula:** `Score = (VelocityFactor * 0.3) + (TimeFactor * 0.3) + (StalledFactor * 0.25) + (ScopeFactor * 0.15)`
*   **Factors:**
    *   **Velocity Factor:** `Current Points / Historical Velocity` (Capped at 1.5).
    *   **Time Factor:** `Actual Progress / Expected Progress` (Linear burn).
    *   **Stalled Factor:** `1 - (Stalled Issues / Total Issues)`.
    *   **Scope Factor:** `1 - (WIP / Total) * 0.5`.
*   **Output Levels:**
    *   🏁 **GREEN FLAG (≥80%):** "On track for podium finish."
    *   🟡 **YELLOW FLAG (50-79%):** "Pace dropping. Tire degradation detected."
    *   🔴 **RED FLAG (<50%):** "BOX BOX! Immediate intervention required."

### 6.2 Pre-Stall Warning System
*   **Purpose:** Proactive alert *before* a ticket becomes stalled.
*   **Trigger:** When time in status reaches **70%** of the Stalled Threshold (e.g., 16.8h of 24h).
*   **Risk Levels:**
    *   **WATCH:** 50-70% of threshold.
    *   **WARNING:** 70-85% of threshold.
    *   **CRITICAL:** >85% of threshold (Imminent stall).

### 6.3 WIP Aging Alert (Kanban)
*   **Purpose:** Identifies issues that violate "Flow" principles.
*   **Methodology:** Lean / Little's Law.
*   **Logic:**
    1.  Calculates **85th Percentile** cycle time from historical data.
    2.  Compares current issue's age against this P85 benchmark.
*   **Thresholds:**
    *   **Aging:** Age > P85.
    *   **Critical:** Age > 1.5x P85.

### 6.4 Bottleneck Detector (Theory of Constraints)
*   **Purpose:** Finds the "limiting factor" in the workflow.
*   **Logic:** Identifies the status column with the highest **Issue Count** OR highest **Average Time**.
*   **Impact Score:** `% of Total WIP` in that column.
*   **F1 Metaphors:**
    *   **Code Review:** "Pit lane congestion! Add pit crew."
    *   **QA/Testing:** "Scrutineering delay!"
    *   **Blocked:** "Safety Car on track!"

### 6.5 Scope Creep Detector
*   **Purpose:** Detects work added after sprint start.
*   **Logic:** Count issues where `CreatedDate > SprintStartDate`.
*   **Alert:** Triggered if >2 issues or >5 story points added mid-sprint.

---

## 7. RUNS ON ATLASSIAN COMPLIANCE

### 7.1 Requirements Met
*   ✅ **Forge Native** - No external backend
*   ✅ **No Data Egress** - All resources bundled
*   ✅ **Self-Hosted Fonts** - @fontsource packages

### 6.2 Bundled Dependencies
*   `@fontsource/inter` - UI font
*   `@fontsource/roboto-mono` - Technical mono font
*   `@fontsource/jetbrains-mono` - Code font

