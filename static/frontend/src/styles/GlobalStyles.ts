import { createGlobalStyle } from 'styled-components'

const GlobalStyles = createGlobalStyle`
  /* Resets & Core Styles managed in base.css */
  *, *::before, *::after { box-sizing: border-box; }
  
  body {
    background-color: var(--bg-main);
    color: var(--text-primary);
    font-family: var(--font-ui);
    overflow: hidden; /* App-like feel */
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    margin: 0;
  }
  
  /* Animations */
  @keyframes pulse-red { 0%, 100% { opacity: 1; box-shadow: 0 0 20px var(--color-danger-dim) } 50% { opacity: 0.8; box-shadow: 0 0 40px var(--color-danger-dim) } }
  @keyframes slide-in { from { opacity: 0; transform: translateY(-10px) } to { opacity: 1; transform: translateY(0) } }
  
  .animate-pulse-red { animation: pulse-red 2s ease-in-out infinite }
  .animate-slide-in { animation: slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) }

  /* Forge specific overrides if needed */
  #root { height: 100%; display: flex; flex-direction: column; }

`

export default GlobalStyles
