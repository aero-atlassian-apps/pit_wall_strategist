/**
 * Action Resolvers
 * 
 * Rovo action resolvers for the 10 strategic actions:
 * - split-ticket (The Undercut)
 * - reassign-ticket (Team Orders)
 * - defer-ticket (Retire Car)
 * - change-priority (Blue Flag)
 * - transition-issue (Push to Limit)
 * - add-blocker-flag (Red Flag)
 * - link-issues (Slipstream)
 * - update-estimate (Fuel Adjustment)
 * - add-radio-message (Radio Message)
 * - create-subtask (Pit Crew Task)
 */

import {
    splitTicket,
    reassignTicket,
    deferTicket,
    handleAction,
    changePriority,
    transitionIssue,
    addBlockerFlag,
    linkIssues,
    updateEstimate,
    addRadioMessage,
    createSubtask
} from '../rovoActions';

/**
 * Registers all Rovo action resolvers on the provided resolver instance
 */
export function registerActionResolvers(resolver: any): void {
    resolver.define('split-ticket', async ({ payload }: any) => { return splitTicket(payload); });
    resolver.define('reassign-ticket', async ({ payload }: any) => { return reassignTicket(payload); });
    resolver.define('defer-ticket', async ({ payload }: any) => { return deferTicket(payload); });
    resolver.define('change-priority', async ({ payload }: any) => { return changePriority(payload); });
    resolver.define('transition-issue', async ({ payload }: any) => { return transitionIssue(payload); });
    resolver.define('add-blocker-flag', async ({ payload }: any) => { return addBlockerFlag(payload); });
    resolver.define('link-issues', async ({ payload }: any) => { return linkIssues(payload); });
    resolver.define('update-estimate', async ({ payload }: any) => { return updateEstimate(payload); });
    resolver.define('add-radio-message', async ({ payload }: any) => { return addRadioMessage(payload); });
    resolver.define('create-subtask', async ({ payload }: any) => { return createSubtask(payload); });
}

/**
 * Action handler for Rovo agent action events
 */
export const actionHandler = async (event: any) => {
    const key = event?.actionKey ?? event?.key;
    const inputs = event?.inputs ?? event?.payload;
    return handleAction(key, inputs);
};
