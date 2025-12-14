# Project Story: Pit Wall Strategist

## 💡 Inspiration

The spark for **Pit Wall Strategist** came from a frustrating observation: software teams were losing sprints the same way F1 teams lose races—not from a single catastrophic failure, but from a thousand small inefficiencies that compound over time.

I watched development teams struggle with:
- **Hidden blockers** that silently kill velocity for days before anyone notices
- **WIP overload** that burns out the best developers
- **Alert fatigue** from generic notifications that cry wolf
- **Reactive dashboards** that show problems only after they've already derailed the sprint

Meanwhile, Formula 1 teams have mastered the art of **real-time decision-making**. Pit wall engineers monitor dozens of telemetry streams, predict tire degradation before it happens, and execute strategic interventions at 300 km/h. They don't wait for the driver to say "I have a problem"—they see it coming in the data and radio in: **"Box box, we're switching strategy."**

What if software teams had the same level of intelligence?

That's when it clicked: **Every sprint is a race. Every ticket is a lap. And teams need a race engineer.**

With the Codegeist 2025 hackathon themed around Williams Racing, the stars aligned. This wasn't just a hackathon project—it was a chance to fundamentally reimagine how teams think about sprint management.

---

## 🎓 What We Learned

### 1. **Metaphors are Powerful Mental Models**
The F1 racing framework transformed how people understand complex sprint dynamics:
- **"WIP Limit" → "Fuel Load"** instantly communicates scarcity
- **"Cycle Time" → "Lap Time"** makes performance metrics intuitive
- **"Blocked Ticket" → "Red Flag"** conveys urgency without jargon

Users don't need to understand Agile theory—they already understand racing strategy.

### 2. **AI Agents Need Domain Expertise, Not Just Data**
Generic chatbots regurgitate information. **Strategic agents make decisions.**

We learned that prompt engineering for Rovo isn't about listing features—it's about encoding a **decision framework**:
```
Is the issue STALLED? → Check last update timestamp
Is the DRIVER overloaded? → Count active tickets per assignee
Is it TOO LARGE? → Analyze subtask structure
```

The agent doesn't just answer questions—it **recommends specific pit strategies** based on telemetry.

### 3. **Universal Compatibility Requires Deep Jira Understanding**
Every organization configures Jira differently. We learned to:
- Dynamically discover custom fields (Story Points, Sprint, etc.)
- Detect board types (Scrum vs Kanban) and adapt terminology
- Map arbitrary status workflows to universal status categories
- Gracefully fallback when APIs fail or permissions are restricted

**Key insight:** Don't fight Jira's flexibility—embrace it. Our app works on a vanilla Jira instance *and* a 10-year-old enterprise workflow monster with 47 custom statuses.

### 4. **Predictive > Reactive**
Traditional dashboards show you problems after they happen. We learned that **early intervention is everything**:
- Detect tickets aging in "In Progress" for 18+ hours (before the 24h stall threshold)
- Identify assignees approaching capacity before they hit burnout
- Flag bottlenecks in workflow columns before they cascade

The math behind pre-stall warnings:
$$
\text{Risk Score} = \frac{\text{Hours Since Last Update}}{\text{Stall Threshold}} \times \text{Assignee WIP}
$$

If Risk Score > 0.75, trigger early warning.

---

## 🛠️ How We Built It

### Architecture Overview
```
┌─────────────────────────────────────────────────────┐
│                 Jira Cloud                          │
│  ┌────────────────────────────────────────────┐    │
│  │  Pit Wall Strategist Panel                 │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │    │
│  │  │Telemetry │  │ Circuit  │  │   Rovo   │ │    │
│  │  │   Deck   │  │   Map    │  │ Engineer │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘ │    │
│  └────────────────────────────────────────────┘    │
│                      ▲                              │
│                      │                              │
│  ┌───────────────────┴──────────────────────────┐  │
│  │      Forge Serverless Backend               │  │
│  │  ┌──────────────────────────────────────┐   │  │
│  │  │  Resolvers (TypeScript)              │   │  │
│  │  │  • getTelemetryData                  │   │  │
│  │  │  • getSprintIssues                   │   │  │
│  │  │  • getAdvancedAnalytics               │   │  │
│  │  │  • chatWithRovo (AI Agent)           │   │  │
│  │  └──────────────────────────────────────┘   │  │
│  │                                              │  │
│  │  ┌──────────────────────────────────────┐   │  │
│  │  │  10 Rovo Actions                     │   │  │
│  │  │  • split-ticket, reassign-ticket     │   │  │
│  │  │  • defer-ticket, change-priority     │   │  │
│  │  │  • add-blocker-flag, link-issues     │   │  │
│  │  │  • update-estimate, create-subtask   │   │  │
│  │  └──────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────┘  │
│                      ▲                              │
│                      │                              │
│  ┌───────────────────┴──────────────────────────┐  │
│  │  Jira REST APIs (asApp() + asUser())        │  │
│  │  • Issues API, Boards API, Sprint API       │  │
│  │  • Changelog API, Transitions API            │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Development Phases

#### **Phase 1: Foundation (Week 1)**
- Set up Forge project with TypeScript
- Built core telemetry calculations (WIP, velocity, burnout)
- Implemented status category mapping for universal compatibility

#### **Phase 2: Intelligence Layer (Week 2)**
- Developed stall detection algorithm
- Created pre-stall warning system (predictive)
- Built bottleneck analysis (column flow metrics)
- Implemented sprint health scoring:
  $$
  \text{Health Score} = 0.4 \times \text{Velocity}_{\text{normalized}} + 0.3 \times (1 - \text{WIP}_{\text{excess}}) + 0.3 \times \text{Completion}_{\%}
  $$

#### **Phase 3: Rovo Integration (Week 3)**
- Designed Rovo Agent prompt with F1 strategic framework
- Implemented 10 Rovo Actions with real Jira API calls
- Built contextual agent that adapts to board type (Scrum vs Kanban)
- Added expert system rules for strategic recommendations

#### **Phase 4: UI/UX (Week 4)**
- Built F1-themed dashboard with React + Vite
- Created "Circuit" visualization (track sectors = board columns)
- Implemented real-time telemetry deck
- Added sprint health gauge with animated indicators

#### **Phase 5: Testing & Hardening (Week 5)**
- Wrote comprehensive unit tests (Vitest)
- Added integration tests for resolver functions
- Implemented E2E tests (Playwright)
- Fixed edge cases (empty boards, missing permissions, fallback logic)

#### **Phase 6: Polish & Documentation (Final Week)**
- Created comprehensive documentation (Architecture, Features, Testing)
- Built demo environments (local mock + live Jira)
- Optimized performance (lazy loading, memoization)
- Final UI polish and bug fixes

---

## 🚧 Challenges We Faced

### **Challenge 1: Universal Jira Compatibility**
**Problem:** Every organization has different:
- Custom field names (Story Points could be `customfield_10040` or `customfield_12345`)
- Status workflows (some have 5 statuses, others have 50)
- Board configurations (Scrum, Kanban, mixed)

**Solution:** Dynamic discovery + fallbacks
```typescript
// Discover custom fields at runtime
const fields = await discoverCustomFields()
const storyPointsField = fields.storyPoints || 'customfield_10040'

// Fallback column mapping if board fetch fails
if (columns.length === 0) {
  columns = [
    { name: 'To Do', statuses: [] },
    { name: 'In Progress', statuses: [] },
    { name: 'Done', statuses: [] }
  ]
}
```

### **Challenge 2: Rovo Agent Contextual Intelligence**
**Problem:** A generic chatbot that just answers "What is WIP?" is boring. We needed an agent that **thinks strategically**.

**Solution:** Embedded decision frameworks in the agent prompt:
```markdown
When analyzing an issue, consider:
1. Is it STALLED? (No movement > 24h = High Drag)
2. Is the DRIVER overloaded? (Assignee has > 3 active tickets)
3. Is it BLOCKED? (Dependencies unresolved = Red Flag)
```

The agent doesn't just report data—it **recommends specific actions** from the 10 pit strategies.

### **Challenge 3: Real-Time Performance**
**Problem:** Fetching changelog history for 50+ issues is slow (3-5 seconds).

**Solution:** Smart sampling + caching
- Calculate metrics on max 20 sample issues
- Cache field discoveries in memory
- Use `asApp()` API for faster auth (no user consent flow)
- Implemented concurrent promise execution

### **Challenge 4: Missing Visual Indicators**
**Problem:** During testing, we discovered the "Circuit" panel wasn't showing ticket dots (the visual circles).

**Root Cause:** When `getBoardColumns()` failed (permissions, board type), the component received empty columns and rendered nothing.

**Solution:** Implemented fallback logic:
```typescript
if (columns.length === 0) {
  // Fallback to status categories
  columns = ['To Do', 'In Progress', 'Done']
  issue.column = issue.statusCategory === 'new' ? 'To Do' 
    : issue.statusCategory === 'done' ? 'Done' 
    : 'In Progress'
}
```

Now the Circuit always shows tickets, even in edge cases.

### **Challenge 5: Runs on Atlassian Compliance**
**Problem:** We wanted the "Runs on Atlassian" badge for security credibility.

**Requirement:** Zero egress (no external API calls).

**Solution:** 100% Forge-native architecture
- No external databases (used Forge Storage for config)
- No third-party APIs (all data from Jira)
- No analytics services (no Google Analytics, no Mixpanel)

Result: Automatic eligibility ✅

---

## 🎯 What Makes It Special

### **1. It's Not Just a Theme—It's a Mental Model**
Other apps might slap on some car emojis and call it "F1-themed." We reimagined the entire information architecture:
- Fuel Load > WIP
- Tire Degradation > Team Burnout
- Lap Time > Cycle Time
- Pit Stop > Sprint Retrospective

This makes sprint complexity **intuitive**.

### **2. Predictive, Not Reactive**
We don't wait for tickets to stall—we predict them 6 hours early and intervene.

### **3. Strategic AI, Not Just Q&A**
The Rovo Agent doesn't answer "What is my velocity?"—it says:
> "Velocity is trending down 12%. Sarah has 3 stalled tickets. Recommend **Team Orders** to redistribute load to Mike."

### **4. Production-Ready from Day One**
This isn't a hackathon prototype. It has:
- Comprehensive test coverage (unit, integration, E2E)
- Error handling and graceful degradation
- Clean architecture with separation of concerns
- TypeScript strict mode throughout

---

## 🏁 The Finish Line

Building **Pit Wall Strategist** taught us that the best developer tools don't just solve problems—they **change how teams think about the problems**.

Every sprint is a race. And now, every team has a race engineer in their corner.

**Box. Box. Ship. Repeat.** 🏎️💨
