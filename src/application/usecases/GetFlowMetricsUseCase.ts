import { BoardData, TelemetryConfig } from '../../types/telemetry';
import { JiraBoardRepository } from '../../infrastructure/jira/JiraBoardRepository';
import { IssueMapper } from '../../infrastructure/mappers/IssueMapper';
import { CycleTimeCalculator } from '../../domain/metrics/CycleTimeCalculator';
import { FlowScanner } from '../../domain/flow/FlowScanner';
import { FlowClassifier } from '../../domain/flow/FlowClassifier';
import { FlowTheme } from '../../domain/flow/FlowTheme';
import { JiraStatusCategory } from '../../domain/issue/JiraStatusCategory';

import { StatusMapService } from '../../infrastructure/services/StatusMapService';

export class GetFlowMetricsUseCase {
    private flowScanner: FlowScanner;
    private cycleTimeCalculator: CycleTimeCalculator;
    private classifier: FlowClassifier;
    private boardRepository: JiraBoardRepository;
    private statusMapService: StatusMapService;

    constructor() {
        this.classifier = new FlowClassifier();
        this.flowScanner = new FlowScanner(this.classifier);
        this.cycleTimeCalculator = new CycleTimeCalculator();
        this.boardRepository = new JiraBoardRepository();
        this.statusMapService = new StatusMapService();
    }

    async execute(projectKey: string, config: TelemetryConfig, context: any) {
        const boardData: BoardData = await this.boardRepository.getBoardData(projectKey, config, context);
        const statusMap = await this.statusMapService.getProjectStatusMap(projectKey);

        // Map to Domain
        const spField = config.storyPointsFieldName;
        const issues = boardData.issues.map(i => IssueMapper.toDomain(i, spField));

        // Distribution
        const distribution = this.flowScanner.calculateDistribution(issues);

        // Velocity
        const completedIssues = issues.filter(i => i.statusCategory.isDone);
        const velocity = {
            completed: completedIssues.length,
            period: boardData.sprint?.name || boardData.boardName || 'Current Period',
            trend: 'stable' as const,
            changePercent: 0
        };

        // Flow Time
        // Use proper resolver from StatusMapService
        const resolver = this.statusMapService.createResolver(statusMap);
        const flowTimeResult = this.cycleTimeCalculator.calculate(completedIssues, resolver);

        // Flow Load
        const flowLoadResult = this.flowScanner.calculateLoad(issues);
        const limit = config.wipLimit || 10;
        const loadPercent = limit > 0 ? Math.round((flowLoadResult.total / limit) * 100) : 0;

        // Derived properties
        const issueTypes = Array.from(new Set(issues.map(i => i.issueType || 'Unknown')));
        const typeMapping = this.classifier.buildTypeMapping(issueTypes);
        const detectedTypes = issueTypes;

        // Mode
        const mode = boardData.boardType === 'business' ? 'process' : boardData.boardType === 'kanban' ? 'flow' : 'scrum';

        return {
            success: true,
            distribution,
            velocity,
            flowTime: {
                avgHours: flowTimeResult.avgHours,
                medianHours: flowTimeResult.medianHours,
                p85Hours: flowTimeResult.p85Hours,
                minHours: flowTimeResult.minHours,
                maxHours: flowTimeResult.maxHours
            },
            flowLoad: {
                total: flowLoadResult.total,
                byCategory: flowLoadResult,
                limit,
                loadPercent
            },
            typeMapping,
            detectedTypes,
            f1Theme: FlowTheme,
            boardType: boardData.boardType,
            mode
        };
    }
}
