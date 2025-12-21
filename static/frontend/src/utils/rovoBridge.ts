// @ts-ignore - rovo is a preview feature not yet in types
import { rovo } from '@forge/bridge';
import { InternalContext } from '../types/Context';
import { tPop } from '../i18n';

export interface RovoContext {
    /** Strict Context Model from Backend */
    context?: InternalContext;
    /** Legacy: Board type (derived from context.boardStrategy) */
    boardType?: 'scrum' | 'kanban' | 'business';
    /** User's locale for localized responses */
    locale?: string;
    /** Key metrics to provide context to the agent */
    metrics?: {
        wip?: number;
        velocity?: number;
        cycleTime?: number;
        stalledCount?: number;
        healthScore?: number;
        sprintDaysRemaining?: number;
    };
    /** Selected issue key if user is asking about a specific issue */
    selectedIssue?: string;
    /** Sprint status if applicable */
    sprintStatus?: string;
    /** Additional context */
    [key: string]: any;
}

/**
 * Opens a chat with the Rovo Race Engineer agent.
 * @param prompt - The initial prompt to send to the agent.
 * @param rovoContext - Optional context to provide situational awareness to the agent.
 */
export async function openAgentChat(prompt?: string, rovoContext?: RovoContext) {
    try {
        let finalPrompt = prompt || '';

        // Serialize context if provided - agent is trained to look for [System Context: ...]
        if (rovoContext) {
            const ctx = rovoContext.context;

            // Determine population mode for terminology selection
            const populationMode = ctx?.projectType === 'business' ? 'process'
                : ctx?.boardStrategy === 'kanban' ? 'flow'
                    : 'scrum';

            // Build a clean context object for the agent
            const contextPayload: Record<string, any> = {
                // Prefer strict context if available
                projectType: ctx?.projectType || 'software',
                boardStrategy: ctx?.boardStrategy || rovoContext.boardType || 'scrum',
                agileCapability: ctx?.agileCapability || 'full',
                estimationMode: ctx?.estimationMode || 'storyPoints',
                locale: ctx?.locale || rovoContext.locale || 'en',
                // Population mode for terminology (scrum/flow/process)
                populationMode,
                // Terminology hints for the agent
                terminologyHints: {
                    workContainer: tPop('workContainer', populationMode, rovoContext.locale),
                    progressMetric: tPop('progressMetric', populationMode, rovoContext.locale),
                    health: tPop('health', populationMode, rovoContext.locale)
                },
                // Include metric validity so agent knows what metrics are relevant
                validMetrics: ctx?.metricValidity ? Object.keys(ctx.metricValidity).filter(k => ctx.metricValidity[k] === 'valid') : ['velocity', 'wip'],
                ...(rovoContext.metrics && { metrics: rovoContext.metrics }),
                ...(rovoContext.sprintStatus && { sprintStatus: rovoContext.sprintStatus }),
                ...(rovoContext.selectedIssue && { selectedIssue: rovoContext.selectedIssue })
            };
            const contextStr = `\n\n[System Context: ${JSON.stringify(contextPayload)}]`;
            finalPrompt += contextStr;
        }

        await rovo.open({
            type: 'agent',
            agentKey: 'pit-wall-engineer',
            prompt: finalPrompt
        });
    } catch (error) {
        console.error('Failed to open Rovo agent chat:', error);
    }
}

