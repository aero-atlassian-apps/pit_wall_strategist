// Forge-Safe Theme using CSS Variables for Runtime Light/Dark Switching
// strictly CSP compliant - no external resources
export const theme = {
  colors: {
    // Structural
    bgMain: 'var(--bg-main)',
    bgPanel: 'var(--bg-panel)',
    bgCard: 'var(--bg-card)',
    bgCardHover: 'var(--bg-card-hover)',
    border: 'var(--border)',
    borderSubtle: 'var(--border-subtle)',

    // Text
    textPrimary: 'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    textTertiary: 'var(--text-tertiary)',
    textInverse: 'var(--text-inverse)',

    // Status / Sentiment
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
    info: 'var(--color-info)',

    // Brand / F1 Specific
    brandPrimary: 'var(--brand-primary)', // Red
    brandSecondary: 'var(--brand-secondary)', // Grid Dark
    circuitAsphalt: 'var(--circuit-asphalt)',

    // Data Viz
    chart1: 'var(--chart-1)',
    chart2: 'var(--chart-2)',
    chart3: 'var(--chart-3)',
  },
  fonts: {
    mono: "'Roboto Mono', 'JetBrains Mono', monospace", // Data density
    ui: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", // Readability
    display: "'Inter', sans-serif" // Headlines
  },
  fontSizes: {
    xs: '10px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '20px',
    xxl: '32px',
    display: '48px'
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    bold: 700,
    black: 900
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px'
  },
  borderRadius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    round: '50%'
  },
  shadows: {
    card: 'var(--shadow-card)',
    floating: 'var(--shadow-floating)',
    glow: {
      success: '0 0 12px var(--color-success-dim)',
      danger: '0 0 12px var(--color-danger-dim)',
      warning: '0 0 12px var(--color-warning-dim)',
    }
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)'
  }
}

// Type inference helper
export type Theme = typeof theme
