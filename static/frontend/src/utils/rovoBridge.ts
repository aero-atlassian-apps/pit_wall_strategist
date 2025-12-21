// @ts-ignore - rovo is a preview feature not yet in types
import { rovo } from '@forge/bridge';

/**
 * Opens a chat with the Rovo agent.
 * @param prompt - The initial prompt to send to the agent.
 */
export async function openAgentChat(prompt?: string) {
    try {
        await rovo.open({
            type: 'agent',
            agentKey: 'pit-wall-engineer',
            prompt: prompt
        });
    } catch (error) {
        console.error('Failed to open Rovo agent chat:', error);
    }
}
