/**
 * Resolver Entry Point
 * 
 * This file composes all resolver modules and exports the main handler.
 * The resolver definitions are organized in domain-specific modules:
 * 
 * - config/ConfigResolvers.ts     - Configuration, view/theme mode, boards
 * - telemetry/TelemetryResolvers.ts - Telemetry data, sprint issues
 * - diagnostics/DiagnosticsResolvers.ts - Health checks, permissions
 * - timing/TimingResolvers.ts     - Lead/cycle time metrics
 * - trends/TrendResolvers.ts      - WIP/velocity trends
 * - analytics/AnalyticsResolvers.ts - Advanced analytics, flow metrics
 * - rovo/RovoResolvers.ts         - AI chat, analysis
 * - actions/ActionResolvers.ts    - 10 Rovo strategic actions
 */

import Resolver from '@forge/resolver';

// Import all resolver registration functions
import { registerConfigResolvers } from './config/ConfigResolvers';
import { registerTelemetryResolvers } from './telemetry/TelemetryResolvers';
import { registerDiagnosticsResolvers } from './diagnostics/DiagnosticsResolvers';
import { registerTimingResolvers } from './timing/TimingResolvers';
import { registerTrendResolvers } from './trends/TrendResolvers';
import { registerAnalyticsResolvers } from './analytics/AnalyticsResolvers';
import { registerRovoResolvers } from './rovo/RovoResolvers';
import { registerActionResolvers, actionHandler } from './actions/ActionResolvers';

// Create the Forge resolver instance
const resolver = new Resolver();

// Register all resolver modules
registerConfigResolvers(resolver);
registerTelemetryResolvers(resolver);
registerDiagnosticsResolvers(resolver);
registerTimingResolvers(resolver);
registerTrendResolvers(resolver);
registerAnalyticsResolvers(resolver);
registerRovoResolvers(resolver);
registerActionResolvers(resolver);

// Export the handler for Forge
export const handler = resolver.getDefinitions();

// Export the action handler for Rovo agent actions
export { actionHandler };
