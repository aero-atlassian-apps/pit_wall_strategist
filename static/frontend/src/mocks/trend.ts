export function getMockTrends() {
  return {
    wip: {
      data: [
        { dayLabel: 'D-6', value: 5 },
        { dayLabel: 'D-5', value: 6 },
        { dayLabel: 'D-4', value: 4 },
        { dayLabel: 'D-3', value: 7 },
        { dayLabel: 'D-2', value: 8 },
        { dayLabel: 'Yest', value: 9 },
        { dayLabel: 'Today', value: 9 }
      ],
      direction: 'up',
      change: 80
    },
    velocity: {
      data: [
        { dayLabel: 'D-6', value: 2 },
        { dayLabel: 'D-5', value: 1 },
        { dayLabel: 'D-4', value: 3 },
        { dayLabel: 'D-3', value: 2 },
        { dayLabel: 'D-2', value: 1 },
        { dayLabel: 'Yest', value: 2 },
        { dayLabel: 'Today', value: 1 }
      ],
      direction: 'down',
      change: -30
    }
  }
}
