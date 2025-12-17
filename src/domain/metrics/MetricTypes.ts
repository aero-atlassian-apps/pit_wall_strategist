import { JiraIssue } from '../../types/jira';

export interface MetricInput {
  issues: JiraIssue[];
  config?: any;
  context?: any;
}

export interface MetricResult {
  status: 'computed' | 'disabled';
  value?: number;
  reason?: string;
  explanation?: string;
  metadata?: Record<string, any>;
  source?: string;
  window?: string;
}

export interface MetricCalculator {
  calculate(input: MetricInput): Promise<MetricResult>;
}
