/**
 * Configuration Resolvers
 * 
 * Handles user configuration persistence including:
 * - Telemetry configuration (WIP limit, stalled threshold, etc.)
 * - View mode (driver, engineer, all)
 * - Theme mode (light, dark)
 * - Multi-board support
 */

import { storage } from '@forge/api';
import api, { route } from '@forge/api';
import { DEFAULT_CONFIG } from '../../infrastructure/services/LegacyTelemetryAdapter';
import type { TelemetryConfig } from '../../types/telemetry';

const PLATFORM = process.env.PLATFORM || 'atlassian';

// Shared global config for current execution context
let globalConfig: TelemetryConfig = { ...DEFAULT_CONFIG };

/**
 * Builds scoped storage keys for user:project:board granularity
 */
export function buildStorageKey(prefix: string, context: any, payload?: any): { key: string; legacy: string } {
    const accountId = context?.accountId || context?.userAccountId || context?.cloudId || 'anon';
    const projectKey = context?.extension?.project?.key || payload?.projectKey || 'global';
    const boardId = payload?.boardId || context?.boardId || 'default';
    return {
        key: `${prefix}:${accountId}:${projectKey}:${boardId}`,
        legacy: `${prefix}:${accountId}:${projectKey}`
    };
}

/**
 * Fetches the most recent configuration from storage, with fallbacks for scoping.
 * Ensures the resolver always uses the latest settings saved by the user.
 */
export async function getEffectiveConfig(context: any, payload?: any): Promise<TelemetryConfig> {
    if (PLATFORM === 'local') return { ...DEFAULT_CONFIG };
    try {
        const { key, legacy } = buildStorageKey('telemetryConfig', context, payload);
        let stored = await storage.get(key) as any;
        if (!stored) stored = await storage.get(legacy) as any;
        // Backwards compatibility for project+user specific key missing boardId
        const accountId = context?.accountId || context?.userAccountId || context?.cloudId || 'anon';
        if (!stored) stored = await storage.get(`telemetryConfig:${accountId}`) as any;

        const cfg = stored ? { ...DEFAULT_CONFIG, ...stored } : { ...DEFAULT_CONFIG };
        globalConfig = cfg; // Sync global for the current execution context
        return cfg;
    } catch (e) {
        console.warn('[Config] Error fetching effective config, using defaults:', e);
        return { ...DEFAULT_CONFIG };
    }
}

/**
 * Gets the current global config (for use within same execution context)
 */
export function getGlobalConfig(): TelemetryConfig {
    return globalConfig;
}

/**
 * Updates the global config (for use within same execution context)
 */
export function setGlobalConfig(config: TelemetryConfig): void {
    globalConfig = config;
}

/**
 * Registers all configuration-related resolvers on the provided resolver instance
 */
export function registerConfigResolvers(resolver: any): void {

    // === Telemetry Configuration ===
    resolver.define('getConfig', async ({ payload, context }: any) => {
        try {
            const config = await getEffectiveConfig(context, payload);
            return { success: true, config };
        } catch (e: any) {
            return { success: true, config: { ...DEFAULT_CONFIG } };
        }
    });

    resolver.define('setConfig', async ({ payload, context }: { payload: Partial<TelemetryConfig> & { boardId?: number }; context: any }) => {
        try {
            const { key } = buildStorageKey('telemetryConfig', context, payload);
            const newConfig = { ...DEFAULT_CONFIG, ...payload };
            await storage.set(key, newConfig);
            globalConfig = newConfig; // Immediately update global for this container
            return { success: true, config: newConfig };
        } catch (e: any) {
            return { success: false, error: e?.message || 'failed to save' };
        }
    });

    // === View Mode Persistence (Hybrid Role-Based Views) ===
    resolver.define('getViewMode', async ({ payload, context }: any) => {
        try {
            const { key, legacy } = buildStorageKey('viewMode', context, payload);
            let stored = await storage.get(key);
            if (!stored) stored = await storage.get(legacy);
            return { success: true, viewMode: stored || 'all' };
        } catch (e: any) {
            return { success: true, viewMode: 'all' };
        }
    });

    resolver.define('setViewMode', async ({ payload, context }: { payload: { viewMode: string; boardId?: number }; context: any }) => {
        try {
            const { key } = buildStorageKey('viewMode', context, payload);
            await storage.set(key, payload.viewMode);
            return { success: true, viewMode: payload.viewMode };
        } catch (e: any) {
            return { success: false, error: e?.message || 'failed to save view mode' };
        }
    });

    // === Theme Mode Persistence (User-level, not board-scoped) ===
    resolver.define('getThemeMode', async ({ context }: any) => {
        try {
            const accountId = context?.accountId || context?.userAccountId || 'anon';
            const stored = await storage.get(`themeMode:${accountId}`);
            return { success: true, mode: stored || 'dark' };
        } catch { return { success: true, mode: 'dark' }; }
    });

    resolver.define('setThemeMode', async ({ payload, context }: { payload: { mode: string }; context: any }) => {
        try {
            const accountId = context?.accountId || context?.userAccountId || 'anon';
            await storage.set(`themeMode:${accountId}`, payload.mode);
            return { success: true, mode: payload.mode };
        } catch (e: any) { return { success: false, error: e?.message }; }
    });

    // === Multi-Board Support ===
    resolver.define('getProjectBoards', async ({ context }: any) => {
        try {
            if (PLATFORM === 'local') {
                return {
                    success: true, boards: [
                        { id: 1, name: 'Main Board', type: 'scrum' },
                        { id: 2, name: 'Kanban Flow', type: 'kanban' }
                    ]
                };
            }
            const projectKey = context.extension.project.key as string;
            const resp = await api.asApp().requestJira(route`/rest/agile/1.0/board?projectKeyOrId=${projectKey}`, { headers: { Accept: 'application/json' } });
            if (!resp.ok) return { success: true, boards: [] };
            const data = await resp.json();
            const boards = (data.values || []).map((b: any) => ({ id: b.id, name: b.name, type: b.type?.toLowerCase() || 'scrum' }));
            return { success: true, boards };
        } catch (e: any) { return { success: false, boards: [], error: e?.message }; }
    });
}
