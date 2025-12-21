
import { invoke } from '@forge/bridge';
import { TelemetryData, TelemetryConfig, BoardContext } from '../types/telemetry';

const isForge = typeof window !== 'undefined' && (window as any).bridge !== undefined; // Simple check or rely on invoke failing

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    [key: string]: any;
}

export class PwsApi {
    static async getTelemetry(boardId?: number | null): Promise<ApiResponse<TelemetryData>> {
        return invoke('getTelemetryData', { boardId });
    }

    static async getIssues(boardId?: number | null): Promise<ApiResponse<any>> {
        return invoke('getSprintIssues', { boardId });
    }

    static async getTimingMetrics(boardId?: number | null): Promise<ApiResponse<any>> {
        return invoke('getTimingMetrics', { boardId });
    }

    static async getTrendData(boardId?: number | null): Promise<ApiResponse<any>> {
        return invoke('getTrendData', { boardId });
    }

    static async getHealth(boardId?: number | null): Promise<ApiResponse<any>> {
        return invoke('getHealth', { boardId });
    }

    static async getAdvancedAnalytics(boardId?: number | null): Promise<ApiResponse<any>> {
        return invoke('getAdvancedAnalytics', { boardId });
    }

    static async getContext(boardId?: number | null): Promise<ApiResponse<{ context: any }>> {
        return invoke('getContext', { boardId });
    }

    static async getConfig(boardId?: number | null): Promise<ApiResponse<{ config: TelemetryConfig }>> {
        return invoke('getConfig', { boardId });
    }

    static async setConfig(boardId: number | null, config: TelemetryConfig): Promise<ApiResponse<any>> {
        return invoke('setConfig', { boardId, ...config });
    }

    static async getPermissions(boardId?: number | null): Promise<any> {
        return invoke('getPermissions', { boardId });
    }

    static async performStrategyAction(action: string, payload: any): Promise<ApiResponse<any>> {
        return invoke(action, payload);
    }
}
