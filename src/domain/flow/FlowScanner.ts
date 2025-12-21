import { DomainIssue } from '../issue/DomainIssue';
import { FlowClassifier } from './FlowClassifier';
import { FlowCategory } from './FlowCategory';

export interface FlowDistribution {
    features: { count: number; percentage: number };
    defects: { count: number; percentage: number };
    risks: { count: number; percentage: number };
    debt: { count: number; percentage: number };
    other: { count: number; percentage: number };
    total: number;
}

export interface FlowLoad {
    features: number;
    defects: number;
    risks: number;
    debt: number;
    other: number;
    total: number;
}

export class FlowScanner {
    constructor(private classifier: FlowClassifier) { }

    public calculateDistribution(issues: DomainIssue[]): FlowDistribution {
        const total = issues.length;
        const counts: Record<FlowCategory, number> = {
            features: 0, defects: 0, risks: 0, debt: 0, other: 0
        };

        issues.forEach(i => {
            const cat = this.classifier.classify(i.issueType || '');
            counts[cat] = (counts[cat] || 0) + 1;
        });

        const calc = (count: number) => ({
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
        });

        return {
            features: calc(counts.features),
            defects: calc(counts.defects),
            risks: calc(counts.risks),
            debt: calc(counts.debt),
            other: calc(counts.other),
            total
        };
    }

    public calculateLoad(inProgressIssues: DomainIssue[]): FlowLoad {
        const counts: Record<FlowCategory, number> = {
            features: 0, defects: 0, risks: 0, debt: 0, other: 0
        };

        inProgressIssues.forEach(i => {
            const cat = this.classifier.classify(i.issueType || '');
            counts[cat] = (counts[cat] || 0) + 1;
        });

        return {
            features: counts.features,
            defects: counts.defects,
            risks: counts.risks,
            debt: counts.debt,
            other: counts.other,
            total: inProgressIssues.length
        };
    }
}
