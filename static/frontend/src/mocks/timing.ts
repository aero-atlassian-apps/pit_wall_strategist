export function getMockTiming() {
  return {
    leadTime: {
      avgLapTime: 56,
      bestLap: 12,
      worstLap: 120,
      completedLaps: 8,
      driverTimes: {
        sarah: { average: 48, best: 12, count: 4 },
        mike: { average: 72, best: 24, count: 3 },
        jess: { average: 36, best: 18, count: 1 }
      }
    },
    sectorTimes: {
      sector1: { name: 'TO DO', avgHours: 18, status: 'optimal' },
      sector2: { name: 'IN PROGRESS', avgHours: 52, status: 'warning' },
      sector3: { name: 'DONE', avgHours: 4, status: 'optimal' }
    },
    raceStatus: 'caution'
  }
}
