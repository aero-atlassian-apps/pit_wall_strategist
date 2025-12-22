import React, { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { DashboardView } from './components/NextGen/Dashboard/DashboardView'
import DiagnosticsModal from './components/Modals/DiagnosticsModal'
import TerminologyModal from './components/Modals/TerminologyModal'
import StrategyModal from './components/Modals/StrategyModal'
import SettingsPanel from './components/Settings/SettingsPanel'
import { IconButton } from './components/Common/Buttons'
import { t } from './i18n'
import { BoardContextProvider, useBoardContext } from './context/BoardContext'
import { openAgentChat } from './utils/rovoBridge'
import { useDashboardData } from './hooks/useDashboardData'
import { PwsApi } from './services/api'
import { invoke } from '@forge/bridge'
import { PitWallFooter } from './components/Common/PitWallFooter'
import { Header } from './components/Common/Header'

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-app);
  color: var(--text-primary);
  overflow: hidden;
  font-family: var(--font-stack-body);
`

const SettingsOverlay = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  z-index: 1000;
  box-shadow: var(--shadow-floating);
  display: flex;
  flex-direction: column;
`

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-glass);
  backdrop-filter: blur(4px);
  z-index: 999;
`

function InnerApp() {
  const { context, boardId, boardName, sprintStatus } = useBoardContext()
  const { projectType, boardStrategy, locale: contextLocale } = context;

  // UI Theme Mapping (Derived strictly from Canonical Context)
  // Maps backend context to frontend component themes (Scrum/Kanban/Business)
  let boardType: 'scrum' | 'kanban' | 'business';

  if (projectType === 'business') {
    boardType = 'business';
  } else if (boardStrategy === 'scrum') {
    boardType = 'scrum';
  } else {
    // Fallback for Software projects with No Board, or Kanban Board
    // We default to 'kanban' theme (Flow-based) as it's the safest UI for unstructured work
    boardType = 'kanban';
  }

  // Data Hook
  const {
    telemetryData,
    issues,
    timingMetrics,
    trendData,
    healthData,
    advancedAnalytics,
    loading,
    error,
    permissions,
    refreshAll
  } = useDashboardData()

  // Local UI State
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
  const [dictionaryOpen, setDictionaryOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)

  // Config State (Separate from Data for immediate UI feedback)
  const [config, setConfig] = useState({ wipLimit: 8, assigneeCapacity: 3, stalledThresholdHours: 24, locale: 'en', theme: 'dark' })
  const [locale, setLocale] = useState<string>('en')

  // Load Config
  useEffect(() => {
    if (boardId) {
      PwsApi.getConfig(boardId).then((res) => {
        if (res?.success && res.config) {
          setConfig(res.config as any)
          if (res.config.locale) setLocale(res.config.locale)
        }
      })
    }
  }, [boardId])

  // Theme Effect
  useEffect(() => {
    const theme = (config as any).theme || 'dark'
    document.body.dataset.theme = theme
    if (theme === 'light') document.body.classList.add('theme-light'); else document.body.classList.remove('theme-light')
  }, [config])

  // Global Locale
  useEffect(() => { (window as any).__PWS_LOCALE = (config as any)?.locale || locale || 'en' }, [config, locale])

  // Actions
  const handleOpenRovo = () => {
    const prompt = t('rovo_radioPrompt', locale)
    // Build rich context for the Rovo agent
    // Calculate stalled count from issues array
    const stalledCount = issues.filter((i: any) => i.isStalled === true).length
    openAgentChat(prompt, {
      context, // Pass the full strict context
      boardType: boardStrategy as 'scrum' | 'kanban' | 'business',
      locale,
      sprintStatus: telemetryData?.sprintStatus || telemetryData?.healthStatus,
      metrics: {
        wip: telemetryData?.wipCurrent,
        velocity: telemetryData?.velocity,
        stalledCount,
        healthScore: healthData?.sprintHealth?.score,
        sprintDaysRemaining: telemetryData?.sprintDaysRemaining
      }
    })
  }

  const handleStrategyAction = async (action: string, ticket: any, assignee?: string) => {
    try {
      const payload: any = { issueKey: ticket.key };
      if (action === 'reassign-ticket' && assignee) payload.newAssignee = assignee;

      await PwsApi.performStrategyAction(action, payload);
      setModalOpen(false);
      refreshAll();
    } catch (e) {
      console.error("Strategy Action Failed", e);
    }
  }

  const handleSaveSettings = async (newConfig: any) => {
    setConfig(newConfig);
    if (newConfig.locale && newConfig.locale !== locale) {
      setLocale(newConfig.locale);
    }
    setSettingsOpen(false);

    await PwsApi.setConfig(boardId || null, newConfig);
    refreshAll();
  }

  if (loading) return (<AppContainer><LoadingScreen /></AppContainer>)

  const displayStatus = telemetryData?.healthStatus || telemetryData?.sprintStatus || 'OPTIMAL'
  const Notice = (props: any) => <div className="notice" {...props} />

  return (
    <AppContainer>
      <Header
        status={displayStatus}
        boardType={boardType}
        locale={locale}
        theme={(config as any).theme || 'dark'}
        dictionaryOpen={dictionaryOpen}
        onToggleDictionary={() => setDictionaryOpen(!dictionaryOpen)}
        onToggleTheme={() => {
          const newTheme = (config as any).theme === 'dark' ? 'light' : 'dark'
          setConfig((prev: any) => ({ ...prev, theme: newTheme }))
        }}
        onOpenSettings={() => setSettingsOpen(!settingsOpen)}
        onRefresh={() => refreshAll()}
      />

      {error && (<Notice>{error} {permissions ? ` | Read: ${permissions.canRead}` : ''}</Notice>)}

      {settingsOpen && (
        <>
          <Backdrop onClick={() => setSettingsOpen(false)} />
          <SettingsOverlay>
            <SettingsPanel
              config={config as any}
              boardType={boardType}
              boardName={boardName || 'Board'}
              onSave={handleSaveSettings}
              onClose={() => setSettingsOpen(false)}
            />
          </SettingsOverlay>
        </>
      )}

      <DashboardView
        telemetryData={telemetryData}
        timingMetrics={timingMetrics}
        trendData={trendData}
        issues={issues}
        healthData={healthData}
        advancedAnalytics={advancedAnalytics}
        context={context} // Passing full strict context
        locale={locale}
        refreshAll={refreshAll}
        onOpenDiagnostics={() => setDiagnosticsOpen(true)}
        handleStrategyAction={(id) => {
          // Find ticket info if available in issues list, or fallback
          const ticket = issues.find(i => i.key === id) || { key: id, summary: 'Loading...', fields: {} }
          setSelectedTicket(ticket)
          setModalOpen(true)
        }}
        onOpenRovo={handleOpenRovo}
      />

      <PitWallFooter onOpenDiagnostics={() => setDiagnosticsOpen(true)} />

      {modalOpen && selectedTicket && (
        <StrategyModal
          ticket={selectedTicket}
          boardContext={{
            boardType: boardType as 'scrum' | 'kanban',
            sprintActive: !!telemetryData?.sprintStatus,
            sprintDaysRemaining: telemetryData?.sprintDaysRemaining,
            wipLimit: telemetryData?.wipLimit,
            wipCurrent: telemetryData?.wipCurrent
          }}
          alertType={selectedTicket?.isBlocked ? 'blocked' : selectedTicket?.isStalled ? 'stalled' : 'general'}
          canWrite={permissions.canWrite}
          onClose={() => setModalOpen(false)}
          onAction={handleStrategyAction}
        />
      )}

      <TerminologyModal open={dictionaryOpen} onClose={() => setDictionaryOpen(false)} boardType={boardType} />
      <DiagnosticsModal open={diagnosticsOpen} onClose={() => setDiagnosticsOpen(false)} health={healthData} />
    </AppContainer>
  )
}

function App() {
  return (
    <BoardContextProvider>
      <InnerApp />
    </BoardContextProvider>
  )
}

function LoadingScreen() {
  const locale = (window as any).__PWS_LOCALE || 'en';
  return (
    <LoadingContainer>
      <LoadingText>{t('initializingTelemetry', locale)}</LoadingText>
      <LoadingBar><LoadingProgress /></LoadingBar>
    </LoadingContainer>
  )
}

const loadingAnim = keyframes`
  0% { transform: translateX(-100%); }
  50% { transform: translateX(150%); }
  100% { transform: translateX(-100%); }
`

const LoadingContainer = styled.div`
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  height: 100vh; 
  gap: 24px;
`

const LoadingText = styled.div`
  font-family: var(--font-stack-mono); 
  font-size: 14px; 
  color: var(--text-tertiary); 
  letter-spacing: 2px;
  text-transform: uppercase;
`

const LoadingBar = styled.div`
  width: 200px; 
  height: 4px; 
  background: var(--bg-surface-hover); 
  border-radius: 2px; 
  overflow: hidden;
`

const LoadingProgress = styled.div`
  width: 40%; 
  height: 100%; 
  background: linear-gradient(90deg, var(--color-brand), var(--color-success)); 
  animation: ${loadingAnim} 1.5s ease-in-out infinite;
`

export default App
