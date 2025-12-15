# Pit Wall Strategist: Mobile App Documentation

## 1. Product Vision & Mental Model

### 1.1 The Problem
**ELI5:** Imagine you are driving a race car with a blindfold on. You don't know if you have gas (fuel) or if your tires are good. This is how most software teams work—they just code blindly.
**Junior:** Teams lack real-time situational awareness. Dashboards are static lists, not active monitors.
**Senior:** Velocity volatility and high WIP (Work In Progress) are lagging indicators in standard Jira reports. We need leading indicators (e.g., "Time in Status") visualized immediately.

### 1.2 The Solution
**ELI5:** We give you a "Race Engineer" in your pocket who tells you exactly what to do ("Box now!" = "Take a break").
**Junior:** A mobile app that visualizes Jira data as an F1 circuit.
**Senior:** A companion app using OAuth to connect to Jira Cloud, processing agile metrics locally to provide deterministic recommendations via a "Strategy Engine."

### 1.3 Mental Model
Think of this app as the **Steering Wheel Display** of an F1 car.
*   **High Contrast:** Actionable signals only.
*   **Glanceable:** No scrolling through 100 tickets.
*   **Action-Oriented:** "Box Box" button to execute complex workflows in one tap.

---

## 2. User Experience & Features (EXHAUSTIVE)

### 2.1 The "Track Map" (Dashboard)
**What the user sees:**
A literal race track loop visualization.
*   **Cars (Dots):** Each dot is a ticket.
    *   **Position:** Interpolated by status (To Do = Start, Done = Finish).
    *   **Color:** Green (Active), Yellow (Stalling), Red (Blocked).
    *   **Motion:** Dots animate to show "flow."

**Interaction:**
*   Tap to view details.
*   Pinch to zoom into "corners" (e.g., QA column).

**Behind the Scenes:**
*   **Data Read:** Fetches active sprint issues from `/rest/agile/1.0/board/{id}/sprint/{id}/issue`.
*   **Logic:** Maps Status Categories to SVG path coordinates.

### 2.2 The "Pit Wall" (Strategy Center)
**What the user sees:**
A vertical feed of "Radio Messages" (Alerts).
*   "⚠️ **Tire Wear Critical**: You have 5 tickets in progress."

**Behind the Scenes:**
*   **Logic:** The "Intelligence Engine" runs locally, comparing WIP/Cycle Time against thresholds in `ActionPolicies.ts`.

### 2.3 "Box Box" (Action Button)
**What the user sees:**
A large FAB (Floating Action Button).
*   **State:** Flashes Red when critical actions are needed.
*   **Action:** Opens the "Pit Stop" modal with one-tap resolutions (e.g., "Move to Backlog").

---

## 3. Screen-by-Screen Breakdown

### 3.1 `LoginScreen`
*   **Purpose:** OAuth 2.0 flow with Atlassian.
*   **UI:** Blurred track background, "Connect" button.
*   **Why:** We never touch the user's password. We trade an Authorization Code for an Access Token.

### 3.2 `PaddockScreen`
*   **Purpose:** Select which Project (Board) to monitor.
*   **UI:** List of Boards with "Race Status" (Sprint progress).

### 3.3 `TelemetryScreen`
*   **Purpose:** The main dashboard (Track Map).
*   **Performance:** Uses `Reanimated` and `Skia` for 60fps animations.

---

## 4. Component Architecture

### 4.1 Atomic Design (F1 Themed)
**ELI5:** We build the car from small parts (Atoms) to make big parts (Organisms).
*   **Atoms:** `TyreIcon`, `FlagBadge`.
*   **Molecules:** `TelemetryCard` (Speed + Delta).
*   **Organisms:** `TrackMap` (The whole circuit).

### 4.2 Key Component: `TrackPath.tsx`
**Why:** To support different "circuits" (sprint difficulties).
**Props:** `shape` ('monaco' | 'silverstone').
**Logic:** Renders an SVG Path. `CarDot` components attach to this path using `react-native-redash` (path interpolation).

---

## 5. Navigation System

### 5.1 Choice: Expo Router
**ELI5:** The app works like a website. Every screen is a file.
**Technical:** File-system based routing in `app/`.
**Tree:**
```text
app/
├── (auth)/
│   ├── track.tsx
│   └── pitwall.tsx
└── modal/
    └── [issueId].tsx
```

### 5.2 Deep Linking
**Scheme:** `pitwall://`
**Use Case:** A Slack bot sends "Check ticket PROJ-123". Clicking it opens the app directly to the `modal/[issueId]` screen.

---

## 6. State Management (CRITICAL)

### 6.1 Strategy: Split Brain
**ELI5:** The app has Short-Term Memory (Screen) and Long-Term Memory (Jira).
**Senior:** We decouple **Server State** from **Client State**.

### 6.2 Server State (TanStack Query)
*   **Role:** Caching API responses.
*   **Config:** `staleTime: 30000` (30s).
*   **Why:** Jira is slow. We show the cached "Ghost Car" while fetching the real position.

### 6.3 Client State (Zustand)
*   **Role:** UI preferences (e.g., "Show Avatars").
*   **Store:** `useRaceStore`.
*   **Why:** Redux is boilerplate-heavy. Zustand is atomic and fast.

---

## 7. Data Layer & API Interaction

### 7.1 API Structure
*   **Endpoint:** `https://api.atlassian.com/ex/jira/{cloudId}/...`
*   **Auth:** Bearer Token via `Expo SecureStore`.

### 7.2 Data Transformation (DTOs)
**Design:** We never use raw Jira JSON in components.
**Adapter:** `JiraToRaceAdapter` converts `{ fields: { status: ... } }` -> `{ lapProgress: 0.5 }`.
**Why:** If Jira changes their API, we only fix the Adapter, not the UI.

---

## 8. Offline, Sync & Resilience Strategy

### 8.1 "Pit Lane" Mode (Offline)
**ELI5:** The app remembers the last lap even if the radio cuts out.
**Technical:** `react-query-persist-client` saves the Query Cache to `AsyncStorage`.
**Behavior:** User can view the board but sees a "Radio Silence" icon.

### 8.2 Optimistic Updates
**ELI5:** When you move a car, it moves instantly. We tell the server later.
**Technical:** We mutate the Cache immediately. If the API call fails, we rollback the change and show a toast.

---

## 9. Performance Engineering

### 9.1 Rendering
**Problem:** Moving 50 dots every frame kills the battery.
**Solution:**
1.  **Reanimated:** Animation logic runs on the UI Thread (Native), not JS Thread.
2.  **Skia:** For complex tracks, we draw on a Canvas, which is faster than SVG DOM.

### 9.2 Memoization
**Strategy:** `React.memo` wraps every `CarDot`. It only re-renders if `status` or `position` changes.

---

## 10. Error Handling & Observability

### 10.1 Error Boundaries
**ELI5:** If one part crashes, the whole app shouldn't die.
**Technical:** `RaceMarshalErrorBoundary` catches exceptions.
**UI:** Displays "Red Flag Session Stopped" instead of a white screen.

### 10.2 Logging
**Tool:** Sentry.
**Context:** We log `sprintId` with every error to reproduce the exact board state.

---

## 11. Security & Permissions

### 11.1 Secure Storage
**Rule:** Never store Tokens in `AsyncStorage` (it's unencrypted).
**Solution:** Use `Expo SecureStore`. It uses the device's hardware enclave.

### 11.2 Data Privacy
**Rule:** We only store metadata (Keys, Status). We do NOT cache sensitive Description text permanently.

---

## 12. Internationalization (i18n)

### 12.1 Racing Slang
**Challenge:** "Box Box" doesn't translate literally.
**Strategy:** We use `i18next` with "Context".
*   `en`: "Box Box"
*   `fr`: "Arrêt au stand" (Standard F1 terminology, not literal translation).

---

## 13. Build System & Tooling

### 13.1 Expo Config
*   **Managed Workflow:** No `android/` or `ios/` folders committed.
*   **Prebuild:** We generate native code on CI using `npx expo prebuild`.

### 13.2 CI/CD
*   **Provider:** GitHub Actions + EAS (Expo Application Services).
*   **Trigger:** Push to `main` -> build "Preview" APK/IPA.

---

## 14. Deployment & Distribution

### 14.1 Channels
*   **Production:** App Store / Play Store.
*   **Staging:** Expo Go (QR Code) for internal testing.

### 14.2 PWA
*   **Command:** `npx expo export -p web`.
*   **Host:** Vercel.
*   **Why:** Allows usage on Desktop without installing the app.

---

## 15. Folder Structure (FROM SCRATCH)

```text
pit-wall-mobile/
├── .github/                # CI/CD workflows
├── app/                    # Expo Router pages
│   ├── _layout.tsx         # Root layout
│   ├── index.tsx           # Login screen
│   ├── (tabs)/             # Main app tabs
│   │   ├── _layout.tsx
│   │   ├── track.tsx
│   │   └── pitwall.tsx
│   └── modal/              # Modals
│       └── [id].tsx
├── assets/
│   ├── fonts/              # Custom F1 fonts
│   └── images/             # Track SVGs
├── components/
│   ├── atoms/              # Buttons, Text
│   ├── molecules/          # Cards, ListItems
│   └── organisms/          # TrackMap, StrategyFeed
├── hooks/                  # Custom React hooks (useRaceData)
├── services/
│   ├── api/                # Jira API client
│   └── auth/               # OAuth logic
├── store/                  # Zustand stores
├── types/                  # TypeScript interfaces
├── utils/                  # Helper functions
├── app.json                # Expo Config
├── babel.config.js
├── package.json
└── tsconfig.json
```

---

## 16. Step-by-Step Rebuild Guide

**Goal:** Go from an empty folder to a running F1 Dashboard.

### Phase 1: The Chassis (Setup)
1.  **Initialize:** `npx create-expo-app@latest pit-wall-mobile --template tabs`
2.  **Dependencies:** `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar react-native-gesture-handler`
3.  **Clean:** Delete `app/(tabs)/explore.tsx`. Rename `index.tsx` to `login.tsx` (temporarily).

### Phase 2: The Engine (Data)
1.  **Auth:** Install `expo-auth-session` and `expo-crypto`.
2.  **Config:** Create a Jira OAuth 2.0 App in Atlassian Developer Console. Set callback to `exp://localhost:8081`.
3.  **Service:** Create `services/auth/AuthService.ts` to handle the token exchange.

### Phase 3: The Cockpit (UI)
1.  **Styling:** We use standard `StyleSheet` or `NativeWind` (Tailwind). Let's use `StyleSheet` for stability.
2.  **Track Map:**
    *   Install `react-native-svg`.
    *   Create `components/organisms/TrackMap.tsx`.
    *   Draw a simple oval `<Path d="M..." />`.
3.  **Cars:**
    *   Create `components/atoms/CarDot.tsx`.
    *   Place it on top of the SVG using absolute positioning.

### Phase 4: Aerodynamics (Animation)
1.  **Install:** `npx expo install react-native-reanimated`.
2.  **Animate:** Wrap `CarDot` in `Animated.View`.
3.  **Loop:** Use `withRepeat(withTiming(...))` to make dots orbit the track.

### Phase 5: Race Strategy (Logic)
1.  **Store:** Install `zustand`. Create `store/raceStore.ts`.
2.  **Fetch:** Install `@tanstack/react-query`.
3.  **Connect:** Fetch Jira issues, map them to the store, and feed the `TrackMap`.

---

## 17. Long-Term Evolution (3–5 Years)

### 17.1 Scalability
*   **Monorepo:** Eventually, move this app into a Monorepo (`turborepo`) sharing logic with the Web App.
*   **GraphQL:** If Jira expands GraphQL support, migrate from REST to GraphQL to reduce over-fetching.

### 17.2 Technical Debt Prevention
*   **Strict Typing:** Maintain 100% TypeScript coverage. No `any`.
*   **Component Library:** Extract UI components to a separate package (`pit-wall-ui`) to ensure consistency between Web and Mobile.

### 17.3 Feature Growth
*   **Augmented Reality (AR):** View the race track on a meeting room table using ARKit.
*   **Live Telemetry:** WebSockets for real-time ticket updates (no pull-to-refresh).

---

**END OF DOCUMENTATION**
*Documentation generated by Jules, Principal Software Architect.*
