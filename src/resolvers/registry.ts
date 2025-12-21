/**
 * Resolver Registry
 * 
 * Central composition file that registers all resolver modules.
 * This is the single entry point for all Forge resolvers.
 * 
 * Architecture:
 * - Each domain-specific resolver module exports a `register*Resolvers(resolver)` function
 * - This registry creates the Forge Resolver instance and registers all modules
 * - Exports `handler` for the main resolver and `actionHandler` for Rovo actions
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

// Re-export the action handler for Rovo agent actions
export { actionHandler };
