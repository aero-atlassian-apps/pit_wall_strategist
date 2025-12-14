import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }
  html, body, #root { height: 100%; width: 100%; overflow: hidden }
  body { font-family: ${({ theme }) => (theme as any).fonts.ui}; background-color: ${({ theme }) => (theme as any).colors.bgMain}; color: ${({ theme }) => (theme as any).colors.textPrimary }; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale }
  .mono, code, pre { font-family: ${({ theme }) => (theme as any).fonts.mono}; letter-spacing: 1px }
  .label { font-family: ${({ theme }) => (theme as any).fonts.mono}; font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px; color: ${({ theme }) => (theme as any).colors.textMuted } }
  .data-value { font-family: ${({ theme }) => (theme as any).fonts.mono}; font-size: 24px; font-weight: 700; color: ${({ theme }) => (theme as any).colors.textPrimary } }
  ::-webkit-scrollbar { width: 6px; height: 6px }
  ::-webkit-scrollbar-track { background: ${({ theme }) => (theme as any).colors.bgMain } }
  ::-webkit-scrollbar-thumb { background: ${({ theme }) => (theme as any).colors.border }; border-radius: 3px }
  ::-webkit-scrollbar-thumb:hover { background: ${({ theme }) => (theme as any).colors.textMuted } }
  @keyframes pulse-red { 0%, 100% { opacity: 1; box-shadow: 0 0 20px rgba(255, 0, 51, 0.8) } 50% { opacity: 0.8; box-shadow: 0 0 40px rgba(255, 0, 51, 0.4) } }
  @keyframes pulse-dot { 0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(255, 0, 51, 0.8) } 50% { transform: scale(1.2); box-shadow: 0 0 16px rgba(255, 0, 51, 1) } }
  @keyframes slide-in { from { opacity: 0; transform: translateY(-10px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes typewriter { from { width: 0 } to { width: 100% } }
  .animate-pulse-red { animation: pulse-red 1.5s ease-in-out infinite }
  .animate-slide-in { animation: slide-in 0.3s ease-out }
`

export default GlobalStyles
