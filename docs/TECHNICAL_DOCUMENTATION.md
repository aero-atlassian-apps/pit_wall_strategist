# Pit Wall Strategist - Complete Technical Documentation

## Version 2.0 - Codegeist 2025 Edition

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Modules](#core-modules)
4. [Context Engine](#context-engine)
5. [Rovo Actions](#rovo-actions)
6. [Frontend Components](#frontend-components)
7. [API Reference](#api-reference)
8. [Configuration](#configuration)
9. [Permissions](#permissions)
10. [Deployment](#deployment)

---

## Overview

Pit Wall Strategist is an AI-powered sprint management tool built on Atlassian Forge. It brings Formula 1 race strategy concepts to Agile project management, providing teams with:

- **Real-time telemetry** - Sprint health metrics at a glance
- **Context-aware AI** - Adapts to Scrum/Kanban boards automatically
- **10 Strategic Actions** - Execute complex workflows with F1 flair
- **Dual AI Modes** - LLM Agent + Expert System

### Tech Stack
- **Frontend**: React 18 + Vite + TypeScript + Styled Components
- **Backend**: Forge Resolvers (Node.js)
- **AI**: Rovo Agent (LLM) + Custom Expert System
- **APIs**: Jira Cloud REST + Agile APIs

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     JIRA PROJECT PAGE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              CUSTOM UI (React SPA)                   │   │
│  │  ┌─────────────┐ ┌───────────┐ ┌────────────────┐  │   │
│  │  │TelemetryDeck│ │  TrackMap │ │PitWallEngineer │  │   │
│  │  └──────┬──────┘ └─────┬─────┘ └───────┬────────┘  │   │
│  │         │              │               │            │   │
│  │         └──────────────┼───────────────┘            │   │
│  │                        │                            │   │
│  │              invoke('resolverName')                 │   │
│  └────────────────────────┼────────────────────────────┘   │
│                           │                                 │
│  ┌────────────────────────▼────────────────────────────┐   │
│  │              FORGE RESOLVERS                         │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ index.ts (Main Handler)                      │    │   │
│  │  │  ├── getTelemetryData                        │    │   │
│  │  │  ├── getSprintIssues                         │    │   │
│  │  │  ├── getTimingMetrics                        │    │   │
│  │  │  ├── getTrendData                            │    │   │
│  │  │  ├── getContext ← NEW                        │    │   │
│  │  │  ├── chatWithRovo                            │    │   │
│  │  │  └── [10 Rovo Actions]                       │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                                      │   │
│  │  ┌─────────────┐ ┌──────────────┐ ┌─────────────┐   │   │
│  │  │contextEngine│ │telemetryUtils│ │ rovoActions │   │   │
│  │  └─────────────┘ └──────────────┘ └─────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                 │
│                    @forge/api                               │
│                           │                                 │
│  ┌────────────────────────▼────────────────────────────┐   │
│  │              JIRA CLOUD PLATFORM                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐  │   │
│  │  │REST API │ │Agile API│ │Users API│ │Rovo Agent│  │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └──────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
pit_wall_strategist/
├── manifest.yml              # Forge app definition
├── package.json              # Root dependencies
├── src/
│   ├── resolvers/
│   │   ├── index.ts          # Main resolver handler
│   │   ├── contextEngine.ts  # Board/workflow discovery
│   │   ├── telemetryUtils.ts # Sprint calculations
│   │   ├── rovoActions.ts    # 10 strategic actions
│   │   ├── timingMetrics.ts  # Lead/cycle time
│   │   ├── trendMetrics.ts   # Velocity trends
│   │   ├── statusMap.ts      # Status category mapping
│   │   └── mocks.ts          # Local development mocks
│   ├── config/
│   │   └── scopes.ts         # Permission definitions
│   └── types/
│       └── telemetry.ts      # TypeScript interfaces
├── static/frontend/
│   ├── src/
│   │   ├── App.tsx           # Main application
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   ├── TelemetryDeck.tsx
│   │   │   │   ├── TrackMap.tsx
│   │   │   │   └── PitWallEngineer.tsx
│   │   │   ├── Common/
│   │   │   └── Modals/
│   │   ├── styles/
│   │   └── i18n/
│   └── package.json
└── docs/
    ├── DEMO_SCRIPT.md
    ├── PITCH_DECK.md
    ├── INFOGRAPHICS.md
    └── TECHNICAL_DOCUMENTATION.md
```

---

## Core Modules

### Context Engine (`contextEngine.ts`)

Discovers and caches project context for adaptive behavior.

**Exports**:
```typescript
interface ProjectContext {
  projectKey: string
  projectName: string
  boardId: number | null
  boardType: 'scrum' | 'kanban' | 'unknown'
  sprintId: number | null
  sprintName: string | null
  sprintState: string | null
  columns: BoardColumn[]
  doneColumn: string | null
  statuses: WorkflowStatus[]
  issueTypes: IssueTypeInfo[]
  issueHierarchy: {
    epics: string[]
    standard: string[]
    subtasks: string[]
  }
}

function getProjectContext(projectKey: string): Promise<ProjectContext>
function getContextSummary(ctx: ProjectContext): string
function clearContextCache(projectKey?: string): void
```

**Features**:
- Auto-detects board type (Scrum vs Kanban)
- Maps all workflow statuses to categories (TODO, IN_PROGRESS, DONE)
- Discovers issue type hierarchy
- **New:** Discovers custom field IDs for 'Sprint', 'Story Points', and 'Flagged'
- 5-minute TTL cache for performance

### Telemetry Utils (`telemetryUtils.ts`)

Calculates sprint health metrics.

**Key Functions**:
- `fetchSprintData()` - Get active sprint issues
- `calculateTelemetry()` - Compute WIP, burnout, etc.
- `detectStalledTickets()` - Find blocked/stalled work
- `detectBoardType()` - Identify Scrum vs Kanban

### Timing Metrics (`timingMetrics.ts`)

Time-based analytics.

**Metrics**:
- Lead Time (creation → done)
- Cycle Time (in-progress → done)
- Sector Performance (by status category)

### Advanced Analytics Engine (`advancedAnalytics.ts`)

**Strategy Intelligence Engine (P0 Features)**:
- `calculateSprintHealth()` - 0-100% success probability
- `detectPreStallWarnings()` - Early detection of risky tickets
- `analyzeWIPAging()` - P85 cycle time analysis (Little's Law)
- `detectBottleneck()` - Theory of Constraints detector
- `detectScopeCreep()` - Mid-sprint addition tracking

### Rovo Actions (`rovoActions.ts`)

10 strategic actions for the AI agent.

---

## Rovo Actions Reference

| Action Key | F1 Name | Description | Required Inputs |
|------------|---------|-------------|-----------------|
| `split-ticket` | The Undercut | Creates subtasks | `issueKey` |
| `reassign-ticket` | Team Orders | Changes assignee | `issueKey`, `newAssignee` |
| `defer-ticket` | Retire Car | Moves to backlog, clears Sprint field | `issueKey` |
| `change-priority` | Blue Flag | Updates priority | `issueKey`, `priority` |
| `transition-issue` | Push to Limit | Transitions status | `issueKey`, `transitionName?` |
| `add-blocker-flag` | Red Flag | Sets "Impediment" flag & label | `issueKey`, `reason?` |
| `link-issues` | Slipstream | Links two issues | `issueKey`, `linkedIssueKey`, `linkType?` |
| `update-estimate` | Fuel Adjustment | Dyn. Updates Story Points/Time | `issueKey`, `storyPoints?`, `timeEstimate?` |
| `add-radio-message` | Radio Message | Adds comment | `issueKey`, `message` |
| `create-subtask` | Pit Crew Task | Creates subtask | `issueKey`, `summary`, `assignee?` |

---

## Frontend Components

### TelemetryDeck

**Props**:
```typescript
interface Props {
  telemetryData: any
  timingMetrics: any
  trendData: any
  boardType?: 'scrum' | 'kanban' | 'unknown'
  projectContext?: any
  onRefresh: () => void
}
```

**Adaptive Behavior**:
- Scrum: Shows Lead Time + Sprint Progress
- Kanban: Shows Cycle Time + Throughput

### PitWallEngineer

**Props**:
```typescript
interface Props {
  feed: Array<{ time: string; msg: string; type: any }>
  alertActive: boolean
  onBoxBox: () => void
  onRefresh?: () => void
  boardType?: 'scrum' | 'kanban' | 'unknown'
  projectContext?: any
}
```

**Features**:
- AI chat with Expert System
- Adaptive quick actions based on board type
- Integration with backend resolvers

### SprintHealthGauge

**Features:**
- Visual Gauge meter with 0-100% score
- Animated F1 Flag status (Green/Yellow/Red)
- Breakdown of 4 factors: Velocity, Time, Stalled, Scope

### PredictiveAlertsPanel

**Features:**
- List of Pre-Stall Warnings (Watch/Warning/Critical)
- Bottleneck Detection with F1 metaphors
- Scope Creep alerts

---

## API Reference

### Resolvers

| Resolver | Method | Description |
|----------|--------|-------------|
| `getTelemetryData` | GET | Sprint health metrics |
| `getSprintIssues` | GET | Issues with categorization |
| `getTimingMetrics` | GET | Lead/cycle time data |
| `getTrendData` | GET | WIP and velocity trends |
| `getContext` | GET | Project context (board type, etc.) |
| `chatWithRovo` | POST | AI chat responses |
| `getHealth` | GET | System diagnostics |
| `getConfig` | GET | User configuration |
| `setConfig` | POST | Update configuration |

### Action Resolvers

All 10 action resolvers accept `{ payload }` with action-specific inputs.

---

## Configuration

### User Settings

Stored in Forge Storage per user:

```typescript
interface TelemetryConfig {
  wipLimit: number        // Default: 8
  assigneeCapacity: number // Default: 3
  stalledThresholdHours: number // Default: 24
  locale: string          // Default: 'en'
}
```

### Manifest Configuration

Key manifest.yml sections:

```yaml
app:
  runtime:
    name: nodejs22.x
    memoryMB: 256
    architecture: arm64

permissions:
  scopes:
    - read:jira-work
    - write:jira-work
    - read:jira-user
    - storage:app
```

---

## Permissions

| Scope | Usage |
|-------|-------|
| `read:jira-work` | Read issues, sprints, boards |
| `write:jira-work` | Create/update issues, add comments |
| `read:jira-user` | Get assignable users |
| `manage:jira-project` | Access project settings |
| `storage:app` | Store user preferences |

---

## Deployment

### Commands

```bash
# Build frontend and deploy
npm run deploy:full

# Deploy backend only
npm run deploy

# Check eligibility for Runs on Atlassian
npm run eligibility:check

# Local development
npm run dev
```

### Environment Detection

```typescript
// Backend
const PLATFORM = process.env.PLATFORM || 'atlassian'

// Frontend
const platform = import.meta.env?.VITE_PLATFORM || 'local'
```

---

## Runs on Atlassian Compliance

### Current Status ✅

The app is now **fully compliant** with Runs on Atlassian requirements:

- ✅ **Forge Native App** - Built entirely on Atlassian Forge
- ✅ **No External Egress** - All resources bundled locally
- ✅ **Self-Hosted Fonts** - Using @fontsource packages

### Fonts Bundling Solution

Previously, the app used external Google Fonts which caused egress warnings. This has been resolved:

```typescript
// index.tsx - Bundled fonts
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/roboto-mono/400.css'
import '@fontsource/roboto-mono/600.css'
import '@fontsource/roboto-mono/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'
```

External references removed from `manifest.yml`:
```yaml
# REMOVED - was causing egress
# permissions:
#   external:
#     fonts:
#       - 'https://fonts.gstatic.com/'
#     styles:
#       - 'https://fonts.googleapis.com/css2'
```

---

## Strategy Intelligence Engine

### Overview

The Strategy Intelligence Engine is a context-aware recommendation system that analyzes the current situation and suggests only the most relevant pit strategies.

### Location

`static/frontend/src/utils/strategyIntelligence.ts`

### Context Analysis

The engine considers:

| Factor | Analysis |
|--------|----------|
| **Board Type** | Scrum (sprint-focused) vs Kanban (flow-focused) |
| **Issue State** | Stalled, blocked, in-progress, done |
| **Issue Type** | Epic, Story, Bug, Subtask |
| **Priority** | Highest → Lowest |
| **Days in Status** | How long stuck in current state |
| **Story Points** | Large items get different recommendations |
| **Sprint Status** | Days remaining, active/inactive |
| **WIP Levels** | Current vs limit |

### Interfaces

```typescript
interface IssueContext {
  key: string
  summary: string
  status: string
  statusCategory: 'new' | 'indeterminate' | 'done'
  issueType: string
  isStalled: boolean
  isBlocked: boolean
  hasSubtasks: boolean
  storyPoints?: number
  assignee?: string
  priority: string
  daysInStatus: number
  linkedIssues?: number
}

interface BoardContext {
  boardType: 'scrum' | 'kanban' | 'unknown'
  sprintActive: boolean
  sprintDaysRemaining?: number
  wipLimit?: number
  wipCurrent?: number
}

interface ActionRecommendation {
  id: string
  name: string
  description: string
  icon: string
  action: string
  relevance: 'critical' | 'recommended' | 'available' | 'hidden'
  reason?: string
}
```

### Key Functions

```typescript
// Get prioritized actions for current context
function getRecommendedActions(
  issue: IssueContext,
  board: BoardContext,
  alertType?: 'stalled' | 'overdue' | 'blocked' | 'capacity' | 'general'
): ActionRecommendation[]

// Get F1-style situation analysis
function getSituationAnalysis(
  issue: IssueContext,
  board: BoardContext
): string
```

### Relevance Levels

| Level | Visual | Description |
|-------|--------|-------------|
| `critical` | 🔥 Red glow, "URGENT" badge | Must-do action for the situation |
| `recommended` | ✅ Green glow, "SUGGESTED" badge | Good option for improvement |
| `available` | No highlight | Valid but not prioritized |
| `hidden` | Not shown | Irrelevant for context |

### Example Rules

```typescript
// The Undercut (Split) is CRITICAL when:
// - Issue is stalled AND has no subtasks AND story points >= 5
if (isStalled && !hasSubtasks && (storyPoints || 0) >= 5) {
  return { relevance: 'critical', reason: 'Large stalled ticket - break it down!' }
}

// Retire Car (Defer) is HIDDEN when:
// - Issue is high priority (never suggest deferring critical work)
if (priority === 'High' || priority === 'Highest') {
  return { relevance: 'hidden' }
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1 | Dec 2024 | Strategy Intelligence Engine, bundled fonts, improved diagnostics |
| 2.0 | Dec 2024 | Context Engine, 10 Rovo Actions, Adaptive UI |
| 1.0 | Nov 2024 | Initial release |

