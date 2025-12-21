export class PaceCalculator {
    /**
     * Calculates the pace variance (actual completion - expected progress).
     * Negative values mean behind schedule.
     */
    public calculate(
        startDate: Date | undefined,
        endDate: Date | undefined,
        completionPercentage: number
    ): number {
        if (!startDate || !endDate) return 0;

        const now = new Date().getTime();
        const start = startDate.getTime();
        const end = endDate.getTime();
        const totalDuration = end - start;

        if (totalDuration <= 0) return 0;

        const elapsed = now - start;
        // Expected progress is purely time-based (linear burnup)
        const expectedProgress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

        return completionPercentage - expectedProgress;
    }
}
