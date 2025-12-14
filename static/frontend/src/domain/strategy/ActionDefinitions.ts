import { ActionDefinition } from './StrategyTypes';

export const ALL_ACTIONS: ActionDefinition[] = [
    { id: 'undercut', name: 'The Undercut', description: 'Split ticket into smaller subtasks for faster sector times.', icon: '✂️', action: 'split-ticket', category: 'decomposition' },
    { id: 'team-orders', name: 'Team Orders', description: 'Reassign to driver with more capacity.', icon: '👥', action: 'reassign-ticket', category: 'assignment' },
    { id: 'retire', name: 'Retire Car', description: 'Move to backlog. Save engine for next race.', icon: '🏁', action: 'defer-ticket', category: 'triage' },
    { id: 'blue-flag', name: 'Blue Flag', description: 'Escalate priority to clear the track.', icon: '🔵', action: 'change-priority', category: 'priority' },
    { id: 'push-limit', name: 'Push to Limit', description: 'Transition to next workflow status.', icon: '⚡', action: 'transition-issue', category: 'workflow' },
    { id: 'red-flag', name: 'Red Flag', description: 'Mark as blocked. Stop and address.', icon: '🚩', action: 'add-blocker-flag', category: 'blocker' },
    { id: 'slipstream', name: 'Slipstream', description: 'Link related issues for coordinated flow.', icon: '🔗', action: 'link-issues', category: 'coordination' },
    { id: 'fuel-adjust', name: 'Fuel Adjustment', description: 'Update story points or time estimate.', icon: '⛽', action: 'update-estimate', category: 'estimation' },
    { id: 'radio', name: 'Radio Message', description: 'Broadcast strategic comment to team.', icon: '📻', action: 'add-radio-message', category: 'communication' },
    { id: 'pit-crew', name: 'Pit Crew Task', description: 'Create a specific subtask for team member.', icon: '🔧', action: 'create-subtask', category: 'decomposition' }
];
