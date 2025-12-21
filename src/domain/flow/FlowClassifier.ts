import { FlowCategory, FlowCategories } from './FlowCategory';

export class FlowClassifier {

    private patterns: Record<FlowCategory, RegExp[]> = {
        features: [
            /story/i, /epic/i, /feature/i, /enhancement/i, /proposal/i, /request/i, /requirement/i, /user story/i,
            /sub-task/i, /task/i,
            /new/i, /initiative/i
        ],
        defects: [
            /bug/i, /defect/i, /error/i, /fix/i, /incident/i, /outage/i, /problem/i, /failure/i, /glitch/i
        ],
        risks: [
            /risk/i, /security/i, /vulnerability/i, /audit/i, /compliance/i, /legal/i, /mitigation/i, /spike/i, /investigation/i, /analysis/i
        ],
        debt: [
            /debt/i, /refactor/i, /improvement/i, /chore/i, /maintenance/i, /cleanup/i, /deprecation/i, /upgrade/i
        ],
        other: []
    };

    public classify(issueTypeName: string): FlowCategory {
        const normalized = (issueTypeName || '').trim();

        if (!normalized) return FlowCategories.OTHER;

        for (const category of [FlowCategories.DEFECTS, FlowCategories.RISKS, FlowCategories.DEBT, FlowCategories.FEATURES]) {
            const regexes = this.patterns[category];
            if (regexes.some(r => r.test(normalized))) {
                return category;
            }
        }

        return FlowCategories.OTHER;
    }

    public buildTypeMapping(issueTypes: string[]): Record<string, string> {
        const mapping: Record<string, string> = {};
        issueTypes.forEach(type => {
            mapping[type] = this.classify(type);
        });
        return mapping;
    }
}
