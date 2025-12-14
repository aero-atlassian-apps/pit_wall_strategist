Appendix D: Visual Interface Guidelines (The Pit Wall Aesthetic)Purpose: This section defines the strict UI specifications required to achieve the "Formula 1 Mission Control" aesthetic. The interface must prioritize high-contrast data visualization over standard Jira UI patterns.D.1 Design Philosophy: "Dark Mode Only"To simulate a specialized race engineering tool, the app must render in a dedicated dark theme regardless of the user's Jira settings.Global Background: #0F172A (Slate 900) - Simulates the pit wall monitor background.Surface/Card Background: #1E293B (Slate 800) - Container elements.Border/Divider: #334155 (Slate 600).D.2 F1 Color Palette (CSS Variables)Use these exact hex codes to ensure the "Telemetry" look.CSS:root {

&nbsp; /\* Status Indicators \*/

&nbsp; --pit-red-alert: #FF0033;      /\* Box Box / Critical / Stalled \*/

&nbsp; --pit-green-pace: #39FF14;     /\* On Track / Velocity Good \*/

&nbsp; --pit-yellow-flag: #F4D03F;    /\* Warning / High WIP \*/

&nbsp; --pit-purple-sector: #BF5AF2;  /\* Fastest Sector / Best Pace \*/

&nbsp; 

&nbsp; /\* Text \& Data \*/

&nbsp; --pit-text-primary: #F8FAFC;   /\* Main Data Values (White) \*/

&nbsp; --pit-text-muted: #94A3B8;     /\* Labels (Slate 400) \*/

&nbsp; 

&nbsp; /\* Typography \*/

&nbsp; --font-mono: 'Roboto Mono', 'Courier New', monospace; /\* For all data \*/

&nbsp; --font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

}

D.3 Dashboard Layout GridThe dashboard uses a fixed 3-column layout mimicking a multi-monitor setup.Grid Structure: \[ 25% | 50% | 25% ]Panel A: Car Health (Left)Panel B: Track Map (Center)Panel C: Race Control (Right)Metaphor: Engine/TiresMetaphor: The CircuitMetaphor: Radio/StrategyVisuals: Vertical GaugesVisuals: Horizontal SwimlanesVisuals: Feed \& Hero ButtonD.4 Component Specifications1. Panel A: Car Health (Telemetry Gauges)Fuel Load Gauge (Work In Progress):Visual: Vertical progress bar.Logic:Height = (Current WIP / WIP Limit) \* 100.Color: Green if <80%, Yellow if 80-99%, Red if ≥100%.Label: FUEL (WIP): 8/8 (Monospace font).Tire Deg Gauge (Team Burnout):Visual: List of horizontal bars, one per squad member.Logic:Width = (Active Tickets / Capacity) \* 100.Color: Green (Fresh Tires), Yellow (Used), Red (Critical Deg).2. Panel B: The Track Map (Work Visualization)Replace the standard Kanban board with a "Circuit" visualization.The Track: 3 Horizontal Lines (Swimlanes).Line 1: Sector 1 (To Do)Line 2: Sector 2 (In Progress) -> Longest line.Line 3: Sector 3 (Review/QA)The Cars (Tickets):Represented as Dots (12px circle).Animation: Use CSS transition ease-in-out when status changes (simulating a car passing a sector).Stalled State: If a ticket triggers a "Box Box" alert, the dot pulses Neon Red with a 2px glow.3. Panel C: Race Control \& The "Box Box" ButtonThis is the most critical element for the demo video.The "BOX BOX" Button (Hero Element):Location: Fixed at the bottom of the right panel.Size: Full width, 64px height.State 1 (Normal):Color: #334155 (Gray).Text: RACE NORMAL.Icon: Green Checkmark.State 2 (Alert Active):Color: --pit-red-alert.Animation: CSS Keyframe Pulse (Opacity 1 -> 0.8 -> 1).Text: \[!] BOX BOX: INTERVENTION REQ.Icon: Flashing Warning Triangle.D.5 The Strategy Modal (Rovo Interface)When "Box Box" is clicked, the modal must look like a tactical decision screen, not a standard form.Header: STRATEGY CALL: TICKET-{KEY} (Monospace, Red Border).Rovo Analysis: Displayed as "Telemetry Readout" (Typewriter effect).Action Cards:Three large clickable cards arranged horizontally.Hover Effect: Border turns --pit-purple-sector.Card 1 (Undercut): Icon: Scissors (Split Ticket).Card 2 (Team Orders): Icon: Users (Reassign).Card 3 (Retire): Icon: Flag (Backlog).

