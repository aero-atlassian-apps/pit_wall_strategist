# QA TESTING SCENARIOS
**Project:** The Pit Wall Strategist (Codegeist 2025)
**Document:** Test Script v1.0

This document outlines the Manual Testing Scenarios to validate the "F1 Mission Control" experience.

---

## TEST SUITE A: ONBOARDING & SETUP

| ID | Scenario | Steps | Expected Result | Pass/Fail |
|----|----------|-------|-----------------|-----------|
| **A1** | **Driver Briefing (Start)** | 1. Open App for first time (Clear LocalStorage).<br>2. Wait for page load. | "Welcome to the Pit Wall" modal appears. Spotlight effect is active. | |
| **A2** | **Tour Navigation** | 1. Click "Start Briefing".<br>2. Use Right Arrow key or "Next" button. | Spotlight moves to Telemetry Panel, then Track Map, then Race Control. | |
| **A3** | **Tour Skip & Replay** | 1. Click "Skip to Grid".<br>2. Open Settings (Gear Icon).<br>3. Click "Replay Driver Briefing". | Tour closes immediately on Skip. Reopens from start on Replay. | |
| **A4** | **Settings Config** | 1. Open Settings.<br>2. Change WIP Limit to 5.<br>3. Save.<br>4. Reset to Default. | Values update. Reset restores defaults (WIP: 8, Tire: 3). | |

---

## TEST SUITE B: CORE TELEMETRY (VISUALS)

| ID | Scenario | Steps | Expected Result | Pass/Fail |
|----|----------|-------|-----------------|-----------|
| **B1** | **Fuel Load (WIP)** | 1. Set WIP Limit to 5 in Settings.<br>2. Ensure mock data has > 5 active tickets. | Fuel Gauge bar turns **RED** (Critical). | |
| **B2** | **Tire Deg (Burnout)** | 1. Check "Sarah" in mock data (Workload: High).<br>2. Check "Mike" (Workload: Low). | Sarah's bar is **RED/YELLOW**. Mike's bar is **GREEN**. | |
| **B3** | **Track Map Flow** | 1. Identify a "Done" ticket in mock data.<br>2. Identify an "In Progress" ticket. | "Done" dot is in rightmost swimlane. "In Progress" dot is in middle lane. | |
| **B4** | **Stalled Ticket Alert** | 1. Look for TICKET-422 in Track Map. | Dot has a **FLASHING RED HALO**. | |

---

## TEST SUITE C: ADVANCED METRICS

| ID | Scenario | Steps | Expected Result | Pass/Fail |
|----|----------|-------|-----------------|-----------|
| **C1** | **Lap Times (Leaforboard)** | 1. Inspect "Lap Times" panel.<br>2. Verify sorting. | Fastest driver (lowest avg hours) is at the top. | |
| **C2** | **Sector Times** | 1. Look at "Sector 2" (In Progress) box.<br>2. Compare with Mock Data avg. | Displays Avg Time. Color coded (Green/Yellow/Red) based on status. | |
| **C3** | **Sparklines** | 1. Look at "Fuel Trend" (WIP) sparkline.<br>2. Look at "Pace Trend" (Velocity). | Charts render. Tooltip appears on hover showing values. | |
| **C4** | **DevOps Feed** | 1. Check Race Control panel bottom.<br>2. Verify "Telemetry Feed" badge. | Badge says "CONNECTED". Alert shows "TICKET-422: No Commits". | |

---

## TEST SUITE D: ROVO AI INTERVENTION ("BOX BOX")

| ID | Scenario | Steps | Expected Result | Pass/Fail |
|----|----------|-------|-----------------|-----------|
| **D1** | **Triggering Box Box** | 1. Locate "BOX BOX" button.<br>2. Verify state. | Button is flashing RED. Text says "INTERVENTION REQ". | |
| **D2** | **Strategy Modal** | 1. Click "BOX BOX". | Modal opens. Typewriter effect plays Rovo's analysis. | |
| **D3** | **Strategy Options** | 1. Verify card content. | 3 distinct options appear: Undercut, Team Orders, Retire. | |
| **D4** | **Execution** | 1. Click "Team Orders". | Modal closes. Toast notification confirms action. (In actual Forge, performs transition). | |

---

## TEST SUITE E: RESPONSIVENESS & THEME

| ID | Scenario | Steps | Expected Result | Pass/Fail |
|----|----------|-------|-----------------|-----------|
| **E1** | **Dark Mode Force** | 1. Check background color. | Must be `#0F172A` (Slate 900). No white backgrounds allowed. | |
| **E2** | **Resizing** | 1. Resize browser window. | Grid adjusts. Track Map swimlanes resize roughly proportionally. | |
