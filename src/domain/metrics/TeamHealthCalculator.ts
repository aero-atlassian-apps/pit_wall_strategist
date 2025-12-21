import { DomainIssue } from '../issue/DomainIssue';

export interface AssigneeLoad {
    [assignee: string]: number;
}

export interface TeamBurnout {
    [assignee: string]: number; // Percentage
}

export class TeamHealthCalculator {
    /**
     * Calculate workload distribution across team members
     */
    public calculateAssigneeLoad(issues: DomainIssue[]): AssigneeLoad {
        const load: AssigneeLoad = {};
        issues.forEach(issue => {
            // Uses proper DomainIssue.assigneeName field (no unsafe cast needed)
            const name = issue.assigneeName || 'Unassigned';
            load[name] = (load[name] || 0) + 1;
        });
        return load;
    }

    public calculateBurnout(load: AssigneeLoad, capacity: number): TeamBurnout {
        const burnout: TeamBurnout = {};
        Object.entries(load).forEach(([name, count]) => {
            const firstName = name.toLowerCase().split(' ')[0];
            burnout[firstName] = Math.round((count / capacity) * 100);
        });
        return burnout;
    }
}
