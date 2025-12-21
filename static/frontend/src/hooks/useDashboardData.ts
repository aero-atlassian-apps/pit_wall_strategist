
import { useState, useEffect, useCallback } from 'react';
import { PwsApi } from '../services/api';
import { TelemetryData, BoardType } from '../types/telemetry';
import { useBoardContext } from '../context/BoardContext';

export interface DashboardState {
    telemetryData: TelemetryData | null;
    issues: any[];
    timingMetrics: any;
    trendData: any;
    healthData: any;
    advancedAnalytics: any;
    loading: boolean;
    error: string | null;
    permissions: { canRead: boolean; canWrite: boolean };
}

export const useDashboardData = () => {
    const { boardId, setBoardContext, sprintStatus } = useBoardContext();
    const [state, setState] = useState<DashboardState>({
        telemetryData: null,
        issues: [],
        timingMetrics: null,
        trendData: null,
        healthData: null,
        advancedAnalytics: null,
        loading: true,
        error: null,
        permissions: { canRead: true, canWrite: false }
    });

    const loadData = useCallback(async (fullRefresh = false) => {
        if (!fullRefresh) {
            // Optimistic updates or partial loading logic could go here
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            // Parallelize independent fetches
            const [telemetryRes, permissionsRes] = await Promise.all([
                PwsApi.getTelemetry(boardId),
                PwsApi.getPermissions(boardId)
            ]);

            if (!telemetryRes.success && !telemetryRes.data) {
                throw new Error(telemetryRes.error || 'Failed to load telemetry foundation');
            }

            const telemetry = telemetryRes.data!;

            // Update Context if changed
            // Note: In a real reducer pattern this would be cleaner, but side-effect here is acceptable for now
            // We avoid infinite loops by checking equality if possible, but setBoardContext is stable

            // Dependent fetches (need boardId from telemetry if not already set, but we assume boardId is stable or passed)
            // If boardId was null, telemetry might provide it.
            const targetBoardId = boardId || telemetry.boardId;

            const [issuesRes, timingRes, trendRes, healthRes, analyticsRes] = await Promise.all([
                PwsApi.getIssues(targetBoardId),
                PwsApi.getTimingMetrics(targetBoardId),
                PwsApi.getTrendData(targetBoardId),
                PwsApi.getHealth(targetBoardId),
                PwsApi.getAdvancedAnalytics(targetBoardId)
            ]);

            setState({
                telemetryData: telemetry,
                issues: issuesRes.success ? (issuesRes as any).issues : [],
                timingMetrics: timingRes.success ? timingRes : null,
                trendData: trendRes.success ? trendRes : null,
                healthData: healthRes.success ? healthRes : null,
                advancedAnalytics: analyticsRes.success ? analyticsRes : null,
                loading: false,
                error: null,
                permissions: {
                    canRead: permissionsRes?.canRead ?? true,
                    canWrite: permissionsRes?.canWrite ?? false
                }
            });

            if (telemetry) {
                setBoardContext({
                    context: (telemetry as any).context, // Strict Context from Backend
                    boardType: telemetry.boardType,      // Keep for legacy fallback if needed
                    boardId: telemetry.boardId,
                    boardName: telemetry.sprintName || 'Board',
                    sprintName: telemetry.sprintName,
                    healthStatus: telemetry.healthStatus
                });
            }

        } catch (err: any) {
            console.error('Dashboard Data Load Failed:', err);
            setState(prev => ({ ...prev, loading: false, error: err.message || 'Unknown error' }));
        }
    }, [boardId, setBoardContext]);

    // Initial Load
    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        ...state,
        refreshAll: () => loadData(true),
        refreshIssues: async () => { /* implement partial refresh */ },
        refreshTelemetry: async () => { /* implement partial refresh */ }
    };
};
