import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import DashboardLayout from './components/Dashboard/DashboardLayout'
import TrackMap from './components/Dashboard/TrackMap'
import StrategyAssistant from './components/Dashboard/StrategyAssistant'
import TelemetryDeck from './components/Dashboard/TelemetryDeck'
import SprintHealthGauge from './components/Dashboard/SprintHealthGauge'
import PredictiveAlertsPanel from './components/Dashboard/PredictiveAlertsPanel'
import DiagnosticsModal from './components/Modals/DiagnosticsModal'
import TerminologyModal from './components/Modals/TerminologyModal'
import EmptyState from './components/Common/EmptyState'
import StrategyModal from './components/Modals/StrategyModal'
import SettingsPanel from './components/Settings/SettingsPanel'
import mockData from './data/mock-data.json'
import { getMockIssues, getMockTelemetry, getMockTiming, getMockTrends, getMockDevOps } from './mocks'
import { IconButton, RefreshIcon } from './components/Common/Buttons'
import { t } from './i18n'
import { BoardContextProvider, useBoardContext } from './context/BoardContext'

import { invoke } from '@forge/bridge'

const platform = (import.meta as any).env?.VITE_PLATFORM || 'local'
const isForgeContext = () => platform === 'atlassian'

const AppContainer = (props: any) => <div className="app-container" {...props} />
const Header = (props: any) => <header className="header" {...props} />
const Logo = (props: any) => <div className="logo" {...props} />
const LogoIcon = (props: any) => <div className="logo-icon" {...props} />
const LogoText = (props: any) => <h1 className="logo-text" {...props} />
const StatusBadge = (props: any) => <div className="status-badge" {...props} />
const HeaderRight = (props: any) => <div className="header-right" {...props} />
const SettingsButton = (props: any) => <button className="settings-button" {...props} />
const SettingsOverlay = (props: any) => <div className="settings-overlay" {...props} />
const TelemetryColumn = (props: any) => <div className="telemetry-col" {...props} />
const RaceControlColumn = (props: any) => <div className="racecontrol-col" {...props} />

function InnerApp() {
  const { boardType, setBoardContext, boardName, sprintStatus } = useBoardContext()
  const [telemetryData, setTelemetryData] = useState<any>(null)
  const [issues, setIssues] = useState<any[]>([])
  const [boardColumns, setBoardColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [timingMetrics, setTimingMetrics] = useState<any>(null)
  const [trendData, setTrendData] = useState<any>(null)
  const [devOpsData, setDevOpsData] = useState<any>(null)
  const [healthData, setHealthData] = useState<any>(null)
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
  const [dictionaryOpen, setDictionaryOpen] = useState(false)
  const [config, setConfig] = useState({ wipLimit: 8, assigneeCapacity: 3, stalledThresholdHours: 24, locale: 'en' })
  const [locale, setLocale] = useState<string>('en')
  const [error, setError] = useState<string | null>(null)
  const [perms, setPerms] = useState<any>(null)
  const [projectContext, setProjectContext] = useState<any>(null)
  const [advancedAnalytics, setAdvancedAnalytics] = useState<any>(null)
  const Notice = (props: any) => <div className="notice" {...props} />

  useEffect(() => { fetchData() }, [])
  useEffect(() => { if (isForgeContext()) { invoke('getConfig').then((res: any) => { if (res?.success && res.config) { setConfig(res.config); if (res.config.locale) setLocale(res.config.locale) } }).catch(() => { }); invoke('getLocale').then((res: any) => { if (res?.success && res.locale) setLocale(res.locale) }).catch(() => { }) } }, [])
  useEffect(() => { (window as any).__PWS_LOCALE = (config as any)?.locale || locale || 'en' }, [config, locale])

  async function fetchData() {
    if (!isForgeContext()) {
      const mockTel = getMockTelemetry()
      setTelemetryData(mockTel)
      setBoardContext({ boardType: mockTel.boardType, boardName: 'Mock Board' })
      setIssues(getMockIssues())
      setTimingMetrics(getMockTiming())
      setTrendData(getMockTrends())
      setDevOpsData(getMockDevOps())
      setLoading(false)
      return
    }
    setError(null)
    try {
      const result = await invoke('getTelemetryData')
      if (result.success) {
        setTelemetryData(result.data)
        setBoardContext({
            boardType: result.data.boardType,
            boardName: result.data.sprintName, // Using sprintName as display name for period
            sprintName: result.data.sprintName,
            healthStatus: result.data.healthStatus || result.data.sprintStatus
        })
      } else {
        console.error('Failed to load telemetry:', result.error)
        setError(result.error || 'Failed to load telemetry data')
        setTelemetryData(null)
      }

      const issuesResult = await invoke('getSprintIssues')
      if (issuesResult.success) {
        setIssues(issuesResult.issues)
        setBoardColumns(issuesResult.columns || [])
      } else {
        if (!error) setError(issuesResult.error || 'Failed to load issues')
        try { const diag = await invoke('getPermissionsDiagnostics'); if (diag?.success) setPerms(diag.permissions) } catch { }
      }

      const timingResult = await invoke('getTimingMetrics')
      const trendResult = await invoke('getTrendData')
      const devOpsResult = await invoke('getDevOpsStatus')
      const healthResult = await invoke('getHealth')

      if (timingResult?.success) setTimingMetrics(timingResult)
      if (trendResult?.success) setTrendData(trendResult)
      if (devOpsResult?.success) setDevOpsData(devOpsResult)
      if (healthResult?.success) setHealthData(healthResult)

      // Fetch project context for adaptive UI
      try {
        const contextResult = await invoke('getContext') as any
        if (contextResult?.success && contextResult.context) {
          setProjectContext(contextResult.context)
        }
      } catch { }

      // Fetch advanced analytics (P0 intelligence features)
      try {
        const analyticsResult = await invoke('getAdvancedAnalytics') as any
        if (analyticsResult?.success) {
          setAdvancedAnalytics(analyticsResult)
          console.log('[App] Advanced Analytics loaded:', analyticsResult.sprintHealth?.status)
        }
      } catch (e) { console.warn('Advanced analytics not available:', e) }
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'An unexpected error occurred')
      setTelemetryData(null)
      setIssues([])
      try { const diag = await invoke('getPermissionsDiagnostics'); if (diag?.success) setPerms(diag.permissions) } catch { }
    } finally { setLoading(false) }
  }

  function handleBoxBox() { if (telemetryData?.stalledTickets?.length > 0) { setSelectedTicket(telemetryData.stalledTickets[0]); setModalOpen(true) } }
  async function handleStrategyAction(action: string, ticket: any, assignee?: string) { if (!isForgeContext()) { setModalOpen(false); setTelemetryData((prev: any) => ({ ...prev, alertActive: false, stalledTickets: [] })); return } try { const payload: any = { issueKey: ticket.key }; if (action === 'reassign-ticket' && assignee) payload.newAssignee = assignee; await invoke(action, payload); setModalOpen(false); fetchData() } catch (error) { } }

  async function refreshHealth() { try { const res = await invoke('getHealth'); if (res?.success) setHealthData(res) } catch { } }
  async function refreshAll() { setLoading(true); await fetchData() }
  // Granular refreshes
  async function refreshDevOps() { try { const res = await invoke('getDevOpsStatus'); if (res?.success) setDevOpsData(res) } catch { } }
  async function refreshTrends() { try { const res = await invoke('getTrendData'); if (res?.success) setTrendData(res) } catch { } }
  async function refreshTelemetry() {
      try {
          const res = await invoke('getTelemetryData')
          if (res?.success) {
              setTelemetryData(res.data)
              // Update context lightly
              if (res.data.healthStatus !== sprintStatus) {
                  setBoardContext({
                    boardType: res.data.boardType,
                    boardName: res.data.sprintName,
                    healthStatus: res.data.healthStatus
                  })
              }
          }
      } catch { }
  }
  async function refreshTiming() { try { const res = await invoke('getTimingMetrics'); if (res?.success) setTimingMetrics(res) } catch { } }
  async function refreshIssues() { try { const res = await invoke('getSprintIssues'); if (res?.success) setIssues(res.issues) } catch { } }

  if (loading) return (<AppContainer><LoadingScreen /></AppContainer>)

  const displayStatus = telemetryData?.healthStatus || telemetryData?.sprintStatus || 'OPTIMAL'

  return (
    <AppContainer>
      <Header>
        <Logo>
          <LogoIcon>🏎️</LogoIcon>
          <LogoText>Pit Wall Strategist</LogoText>
        </Logo>
        <HeaderRight>
          <StatusBadge status={displayStatus}>{boardType === 'kanban' ? t('flow', locale) : t('sprint', locale)}: {displayStatus}</StatusBadge>
          {timingMetrics?.hasUnmapped && (<span title={t('unmappedTransitions', locale)} style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 12, color: '#f59e0b' }}>⚠</span>)}

          <SettingsButton $active={dictionaryOpen} onClick={() => setDictionaryOpen(!dictionaryOpen)} title={t('glossary', locale)} style={{ marginRight: 8 }}>📖</SettingsButton>
          <SettingsButton $active={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)} title={t('settings', locale)} data-tour="settings">⚙️</SettingsButton>
          <SettingsButton onClick={refreshAll} title={t('refreshAll', locale)}>⟳</SettingsButton>
        </HeaderRight>
      </Header>
      {error && (<Notice>{error.includes('Unauthorized') || error.includes('permission') ? 'Insufficient permissions to read issues. Ensure app has Browse Projects and issue security visibility.' : error}{perms ? ` | UserBrowse: ${perms.userBrowse ? 'yes' : 'no'} | AppBrowse: ${perms.appBrowse ? 'yes' : 'no'} | SprintField: ${perms.hasSprintField ? 'yes' : 'no'}` : ''}</Notice>)}
      {settingsOpen ? (
        <SettingsOverlay>
          <SettingsPanel config={config as any} boardType={boardType} boardName={boardName || 'Board'} onSave={(newConfig: any) => {
            setConfig(newConfig);
            // Immediately update locale if changed - no refresh needed
            if (newConfig.locale && newConfig.locale !== locale) {
              setLocale(newConfig.locale);
              (window as any).__PWS_LOCALE = newConfig.locale;
            }
            setSettingsOpen(false);
            if (isForgeContext()) { invoke('setConfig', newConfig).catch(() => { }) }
          }} onClose={() => setSettingsOpen(false)} />
        </SettingsOverlay>
      ) : (
        <DashboardLayout>
          <TelemetryColumn>
            <TelemetryDeck
              telemetryData={telemetryData}
              timingMetrics={timingMetrics}
              trendData={trendData}
              boardType={boardType}
              projectContext={projectContext}
              onRefresh={refreshTelemetry}
            />

            {/* P0 Intelligence Features */}
            <SprintHealthGauge
              sprintHealth={advancedAnalytics?.sprintHealth}
              loading={!advancedAnalytics}
            />
            <PredictiveAlertsPanel
              preStallWarnings={advancedAnalytics?.preStallWarnings || []}
              bottleneck={advancedAnalytics?.bottleneck}
              loading={!advancedAnalytics}
              onIssueClick={(key) => {
                const issue = issues.find(i => i.key === key)
                if (issue) { setSelectedTicket(issue); setModalOpen(true) }
              }}
            />
          </TelemetryColumn>

          <div data-tour="track" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {issues && issues.length > 0 ? (
              <TrackMap issues={issues} columns={boardColumns} locale={locale} />
            ) : (
              <EmptyState
                title={error ? t('connectionLost', locale) : (boardType === 'scrum' ? t('noSprintIssues', locale) : t('noBoardIssues', locale))}
                description={error ? `${t('error', locale)}: ${error}` : t('emptyStateDesc', locale)}
              />
            )}
          </div>

          <RaceControlColumn>
            <StrategyAssistant
              feed={telemetryData?.feed || []}
              alertActive={telemetryData?.alertActive || false}
              onBoxBox={handleBoxBox}
              onRefresh={refreshAll}
              boardType={boardType}
              projectContext={projectContext}
            />
            {/* Systems Status Strip */}
            <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>
                <span>SYSTEMS: {healthData?.platform ? 'ONLINE' : 'CHECKING...'}</span>
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setDiagnosticsOpen(true)}>DIAGNOSTICS</span>
              </div>
            </div>
          </RaceControlColumn>
        </DashboardLayout>
      )}
      {modalOpen && selectedTicket && (
        <StrategyModal
          ticket={selectedTicket}
          boardContext={{
            boardType: boardType as 'scrum' | 'kanban',
            sprintActive: telemetryData?.sprintStatus !== undefined,
            sprintDaysRemaining: telemetryData?.sprintDaysRemaining,
            wipLimit: telemetryData?.wipLimit,
            wipCurrent: telemetryData?.wipCurrent
          }}
          alertType={selectedTicket?.isBlocked ? 'blocked' : selectedTicket?.isStalled ? 'stalled' : 'general'}
          onClose={() => setModalOpen(false)}
          onAction={handleStrategyAction}
        />
      )}
      <TerminologyModal open={dictionaryOpen} onClose={() => setDictionaryOpen(false)} />
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
  return (
    <LoadingContainer>
      <LoadingText>{t('initializingTelemetry', (window as any).__PWS_LOCALE || 'en')}</LoadingText>
      <LoadingBar><LoadingProgress /></LoadingBar>
    </LoadingContainer>
  )
}

const LoadingContainer = styled.div`display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; gap:${({ theme }) => (theme as any).spacing.lg}`
const LoadingText = styled.div`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:14px; color:${({ theme }) => (theme as any).colors.textMuted}; letter-spacing:2px`
const LoadingBar = styled.div`width:200px; height:4px; background:${({ theme }) => (theme as any).colors.bgCard}; border-radius:2px; overflow:hidden`
const LoadingProgress = styled.div`width:40%; height:100%; background: linear-gradient(90deg, ${({ theme }) => (theme as any).colors.purpleSector}, ${({ theme }) => (theme as any).colors.greenPace}); animation: loading 1.5s ease-in-out infinite; @keyframes loading { 0% { transform: translateX(-100%) } 50% { transform: translateX(150%) } 100% { transform: translateX(-100%) } }`
const NoticeStyles = styled.div``

export default App
