import { ISSUE_SIGNALS } from './IssueSignals';

export type DetectedSignal = 'DEPENDENCY' | 'SCOPE' | 'SKILL' | 'TECHNICAL' | 'NONE';

export interface IssueAnalysisInput {
    summary?: string;
    latestComment?: string;
}

export function detectIssueSignal(input: IssueAnalysisInput): DetectedSignal {
    if (!input) return 'NONE';

    const summary = (input.summary || '').toLowerCase();
    const comments = (input.latestComment || '').toLowerCase();
    const text = `${summary} ${comments}`;

    if (hasKeywords(text, ISSUE_SIGNALS.DEPENDENCY)) return 'DEPENDENCY';
    if (hasKeywords(text, ISSUE_SIGNALS.SCOPE)) return 'SCOPE';
    if (hasKeywords(text, ISSUE_SIGNALS.SKILL)) return 'SKILL';
    if (hasKeywords(text, ISSUE_SIGNALS.TECHNICAL)) return 'TECHNICAL';

    return 'NONE';
}

function hasKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(word => text.includes(word));
}
