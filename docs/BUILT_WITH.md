# Built With

## 🏗️ Core Platform

### **Atlassian Forge**
- **Serverless Platform**: 100% Forge-native, zero external dependencies
- **Runtime**: Node.js 22.x (ARM64 architecture)
- **Memory**: 256MB per function execution
- **Compliance**: Runs on Atlassian eligible (zero egress)

---

## 💻 Programming Languages

### **TypeScript** (Primary Language)
- **Backend**: All resolvers, domain logic, and API integration
- **Frontend**: React components, state management, utilities
- **Strict Mode**: Full type safety across entire codebase
- **Version**: 5.6.3

### **JavaScript (ES2022)**
- Compiled output from TypeScript
- Used in Forge runtime execution

---

## 🎨 Frontend Technologies

### **React 18**
- Component-based UI architecture
- Hooks for state management (useState, useEffect, useRef)
- Context API for global state (locale, configuration)

### **Styled Components**
- CSS-in-JS for dynamic theming
- F1-themed design system
- Responsive layouts and animations

### **Vite**
- Fast development server with HMR
- Optimized production builds
- Environment variable management (.env.local, .env.atlassian)

### **Forge Bridge**
- `@forge/bridge` for frontend-backend communication
- `invoke()` API for calling resolvers from UI

---

## ⚙️ Backend Technologies

### **Forge APIs**
- **`@forge/api`**: Core API for Jira REST calls
  - `api.asApp()`: App-level authentication (primary)
  - `api.asUser()`: User-level authentication (fallback)
  - `route` tagged template for type-safe URLs

- **`@forge/resolver`**: Serverless function handlers
  - Custom resolver definitions
  - Payload validation
  - Context management

- **Forge Storage**: Key-value storage for user configuration
  - Per-user telemetry settings
  - Locale preferences
  - WIP limits and thresholds

### **Jira REST APIs (v3)**
- **Issues API**: Fetch sprint issues, changelog, transitions
- **Boards API**: Detect board type, configuration, columns
- **Sprint API**: Active sprint detection, sprint details
- **Agile API**: Board configuration, column mapping
- **Fields API**: Custom field discovery (Story Points, Sprint, etc.)
- **Permissions API**: User and app permission diagnostics
- **Transitions API**: Issue status workflow transitions

---

## 🤖 AI & Intelligence Layer

### **Rovo by Atlassian**
- **`rovo:agent` Module**: Custom AI agent (`pit-wall-engineer`)
  - F1-themed strategic prompt engineering
  - Context-aware responses (Scrum vs Kanban)
  - Decision framework for recommendations

- **Rovo Actions** (10 total):
  1. `split-ticket` - The Undercut (create subtasks)
  2. `reassign-ticket` - Team Orders (reassign to available developer)
  3. `defer-ticket` - Retire Car (move to backlog)
  4. `change-priority` - Blue Flag (escalate priority)
  5. `transition-issue` - Push to Limit (force status change)
  6. `add-blocker-flag` - Red Flag (flag as blocked)
  7. `link-issues` - Slipstream (link related issues)
  8. `update-estimate` - Fuel Adjustment (update story points)
  9. `add-radio-message` - Radio Message (add strategic comment)
  10. `create-subtask` - Pit Crew Task (create subtask with assignee)

### **Custom Algorithms**
- **Stall Detection**: Identifies tickets with no updates > configured threshold
- **Pre-Stall Warnings**: Predictive algorithm for early intervention
- **Bottleneck Analysis**: Workflow column flow metrics
- **Sprint Health Scoring**: Multi-factor health calculation
- **Burnout Detection**: Per-assignee WIP capacity monitoring
- **Velocity Trending**: Historical sprint comparison
- **Cycle Time Calculation**: Status category time tracking

---

## 🧪 Testing & Quality Assurance

### **Vitest**
- Unit testing framework for TypeScript/JavaScript
- Mock implementations for Forge APIs
- Coverage reporting with `@vitest/coverage-v8`
- Watch mode for rapid development

### **Playwright**
- End-to-end testing framework
- Browser automation for UI validation
- Custom test scenarios for Forge apps

### **Test Coverage**
- **Unit Tests**: Resolvers, utilities, calculations
- **Integration Tests**: API mocking, data flow validation
- **E2E Tests**: Full user workflows in browser

---

## 🎨 Design & UI Components

### **Custom Components**
- **F1Card**: Themed card container with glow effects
- **TrackMap**: Circuit visualization with sector lanes
- **TelemetryDeck**: Real-time metrics dashboard
- **SprintHealthGauge**: Animated health indicator
- **PredictiveAlertsPanel**: Early warning system
- **StatusLight**: Color-coded status indicators
- **Sparkline**: Inline trend visualization

### **Styling System**
- CSS Custom Properties (CSS Variables)
- F1-inspired color palette:
  - Red Alert: `#FF0033`
  - Purple Sector: `#BF5AF2`
  - Green Pace: `#39FF14`
- Monospace fonts for telemetry aesthetics
- Dark theme optimized for readability

---

## 🌍 Internationalization (i18n)

### **Supported Languages**
- English (en) - Default
- French (fr)
- Spanish (es)
- Portuguese (pt)

### **Implementation**
- Custom `t()` translation function
- Locale detection from Jira user preferences
- Fallback to English for unsupported locales
- Dynamic locale switching via settings panel

---

## 📊 Data Processing & Analytics

### **Calculations**
- **Lead Time**: Created → Resolved (hours)
- **Cycle Time**: In Progress → Done (hours)
- **WIP Load**: Current WIP / WIP Limit × 100%
- **Velocity Delta**: (Current Sprint - Previous Sprint) / Previous Sprint
- **Team Burnout**: Active Tickets / Capacity × 100% per assignee

### **Sampling Strategy**
- Smart sampling to optimize performance
- Max 20 issues for cycle time calculations
- Cached field discoveries to reduce API calls

---

## 🔧 Development Tools

### **Forge CLI**
- `forge tunnel`: Local development with live Jira connection
- `forge deploy`: Deploy to Atlassian infrastructure
- `forge install`: Install app to Jira instance
- `forge logs`: Real-time log streaming
- `forge eligibility`: Check Runs on Atlassian status

### **Node Package Manager (npm)**
- Dependency management
- Script automation (build, test, deploy)

### **Version Control**
- Git for source control
- Feature branch workflow
- Semantic versioning

---

## 🚀 Deployment & Infrastructure

### **Atlassian Cloud**
- Hosted on Atlassian's serverless infrastructure
- Auto-scaling based on usage
- Global CDN for frontend assets
- Data residency compliance built-in

### **Build Pipeline**
- TypeScript compilation to JavaScript
- React bundling with Vite
- Asset optimization (minification, tree-shaking)
- Environment-specific builds (local vs production)

---

## 📦 Key Dependencies

### Production Dependencies
```json
{
  "@forge/api": "^3.0.0",
  "@forge/resolver": "^1.6.0"
}
```

### Development Dependencies
```json
{
  "@forge/cli": "^12.11.0",
  "@types/node": "^20.11.30",
  "@vitest/coverage-v8": "^2.1.9",
  "playwright": "^1.48.0",
  "typescript": "^5.6.3",
  "vitest": "^2.1.2"
}
```

---

## 🔐 Security & Compliance

### **Runs on Atlassian**
- ✅ Zero egress (no external API calls)
- ✅ No third-party services
- ✅ All data stays within Atlassian infrastructure
- ✅ Automatic badge eligibility

### **Permissions (OAuth Scopes)**
- `read:jira-work` - Read issues, boards, sprints
- `write:jira-work` - Update issues, transitions
- `read:jira-user` - User information for assignees
- `manage:jira-project` - Project configuration access
- `read:board-scope:jira-software` - Board configuration
- `read:sprint:jira-software` - Sprint data
- `storage:app` - Forge storage for user settings

### **Data Privacy**
- No telemetry collection
- No external analytics
- Local storage only (Forge Storage)
- User data never leaves Atlassian

---

## 🎯 Architecture Patterns

### **Backend (Domain-Driven Design)**
- **Resolvers**: API endpoint handlers
- **Services**: Business logic (telemetry calculation, analytics)
- **Repositories**: Data access layer (Jira API abstraction)
- **Domain Models**: TypeScript interfaces for type safety

### **Frontend (Component Architecture)**
- **Containers**: Dashboard layout, page structure
- **Components**: Reusable UI elements (cards, charts, modals)
- **Utils**: Helper functions (date formatting, calculations)
- **Context**: Global state management (configuration, locale)

### **Code Organization**
```
src/
├── resolvers/           # Backend functions
│   ├── index.ts         # Main resolver definitions
│   ├── telemetryUtils.ts
│   ├── advancedAnalytics.ts
│   └── rovoActions.ts
├── types/               # TypeScript interfaces
└── config/              # Configuration files

static/frontend/src/
├── components/          # React components
│   ├── Dashboard/
│   ├── Common/
│   └── Modals/
├── utils/               # Frontend utilities
├── styles/              # CSS and themes
└── i18n/                # Internationalization
```

---

## 📈 Performance Optimizations

- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Concurrent API Calls**: Promise.all for parallel fetching
- **Smart Caching**: Field discoveries cached in memory
- **Sampling**: Limit sample size for expensive calculations
- **Debouncing**: Input handlers debounced for performance

---

## 🏆 What Makes Our Tech Stack Special

1. **100% Forge-Native**: No external dependencies = Runs on Atlassian eligible
2. **TypeScript Throughout**: Full type safety from backend to frontend
3. **Rovo Excellence**: Most sophisticated agent integration in competition
4. **Universal Jira Support**: Dynamic field discovery works with any configuration
5. **Production-Ready**: Comprehensive testing, error handling, graceful degradation

---

**Technology choices optimized for speed, security, and scale.** 🚀
