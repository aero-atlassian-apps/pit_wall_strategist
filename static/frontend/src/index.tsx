import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, StyleSheetManager } from 'styled-components'
import App from './App'
import { theme } from './styles/theme'
import GlobalStyles from './styles/GlobalStyles'
import { TourProvider } from './context/TourContext'
import TourOverlay from './components/Onboarding/TourOverlay'
import './styles/base.css'
import './styles/cards.css'

// Bundled fonts for Runs on Atlassian compliance (no external CDN)
import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/roboto-mono/400.css'
import '@fontsource/roboto-mono/600.css'
import '@fontsource/roboto-mono/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'

function getCspNonce(): string | undefined {
  const meta = document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null
  if (meta?.content) return meta.content
  const scripts = Array.from(document.getElementsByTagName('script'))
  for (const s of scripts) {
    const n = (s as any).nonce || s.getAttribute('nonce')
    if (n) return n as string
  }
  return (window as any).__webpack_nonce__
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <StyleSheetManager nonce={getCspNonce()} disableCSSOMInjection>
      <ThemeProvider theme={theme as any}>
        <TourProvider>
          <GlobalStyles />
          <App />
          <TourOverlay />
        </TourProvider>
      </ThemeProvider>
    </StyleSheetManager>
  </React.StrictMode>
)
