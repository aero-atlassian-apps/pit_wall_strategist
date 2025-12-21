import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import DashboardLayout from './components/Dashboard/DashboardLayout'
import LiveCircuit from './components/Dashboard/LiveCircuit'
import StrategyAssistant from './components/Dashboard/StrategyAssistant'
import { DashboardView } from './components/NextGen/Dashboard/DashboardView' // NextGen Import
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

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-app);
  color: var(--text-primary);
  overflow: hidden;
  font-family: var(--font-stack-body);
`

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  padding: 0 24px;
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--border-app);
  flex-shrink: 0;
  transition: all 0.3s ease;
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const LogoIcon = styled.div`
  font-size: 24px;
`

const LogoText = styled.h1`
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
  color: var(--text-primary);
`

const StatusBadge = styled.div<{ status: string }>`
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 12px;
  background: ${({ status }) => status === 'CRITICAL' ? 'var(--color-danger)' : status === 'WARNING' ? 'var(--color-warning)' : 'var(--color-success)'};
  color: #000;
  margin-right: 24px;
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const SettingsButton = styled.button<{ $active?: boolean }>`
  background: ${({ $active }) => $active ? 'var(--bg-card-hover)' : 'transparent'};
  border: 1px solid ${({ $active }) => $active ? 'var(--text-primary)' : 'transparent'};
  color: var(--text-primary);
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  font-size: 16px;
  transition: all 0.2s;
  
  &:hover {
    background: var(--bg-card-hover);
    transform: scale(1.1);
  }
`

const SettingsOverlay = styled.div`
  position: absolute;
  top: 60px;
  right: 24px;
  width: 380px;
  z-index: 100;
  box-shadow: var(--shadow-floating);
`

const TelemetryColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
`

const RaceControlColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow: hidden;
`

function InnerApp() {
  const { boardType, boardId, setBoardContext, boardName, sprintStatus } = useBoardContext()
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
  const [config, setConfig] = useState({ wipLimit: 8, assigneeCapacity: 3, stalledThresholdHours: 24, locale: 'en', theme: 'dark' })
  const [locale, setLocale] = useState<string>('en')
  const [error, setError] = useState<string | null>(null)
  const [perms, setPerms] = useState<any>(null)
  const [permissions, setPermissions] = useState<{ canRead: boolean; canWrite: boolean }>({ canRead: true, canWrite: true })
  const [projectContext, setProjectContext] = useState<any>(null)
  const [advancedAnalytics, setAdvancedAnalytics] = useState<any>(null)
  const Notice = (props: any) => <div className="notice" {...props} />

  useEffect(() => { fetchData() }, [])
  // Config loading is deferred until boardId is known
  useEffect(() => {
    if (isForgeContext() && boardId) {
      invoke('getConfig', { boardId }).then((res: any) => {
        if (res?.success && res.config) {
          setConfig(res.config)
          if (res.config.locale) setLocale(res.config.locale)
        }
      }).catch(() => { })
    }
  }, [boardId])
  useEffect(() => { if (isForgeContext()) { invoke('getLocale').then((res: any) => { if (res?.success && res.locale) setLocale(res.locale) }).catch(() => { }) } }, [])
  useEffect(() => { (window as any).__PWS_LOCALE = (config as any)?.locale || locale || 'en' }, [config, locale])

  // Theme Application Effect
  useEffect(() => {
    const theme = (config as any).theme || 'dark'
    document.body.dataset.theme = theme
    // Clean up potentially conflicting classes if any
    if (theme === 'light') document.body.classList.add('theme-light'); else document.body.classList.remove('theme-light')
  }, [config])

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
          boardId: result.data.boardId,
          boardName: result.data.sprintName, // Using sprintName as display name for period
          sprintName: result.data.sprintName,
          healthStatus: result.data.healthStatus || result.data.sprintStatus
        })
      } else {
        console.error('Failed to load telemetry:', result.error)
        setError(result.error || 'Failed to load telemetry data')
        setTelemetryData(null)
      }

      const bId = result.data.boardId;

      const issuesResult = await invoke('getSprintIssues', { boardId: bId })
      if (issuesResult.success) {
        setIssues(issuesResult.issues)
        setBoardColumns(issuesResult.columns || [])
      } else {
        if (!error) setError(issuesResult.error || 'Failed to load issues')
        try { const diag = await invoke('getPermissionsDiagnostics', { boardId: bId }); if (diag?.success) setPerms(diag.permissions) } catch { }
      }

      const timingResult = await invoke('getTimingMetrics', { boardId: bId })
      const trendResult = await invoke('getTrendData', { boardId: bId })
      const devOpsResult = await invoke('getDevOpsStatus', { boardId: bId })
      const healthResult = await invoke('getHealth', { boardId: bId })

      if (timingResult?.success) setTimingMetrics(timingResult)
      if (trendResult?.success) setTrendData(trendResult)
      if (devOpsResult?.success) setDevOpsData(devOpsResult)
      if (healthResult?.success) setHealthData(healthResult)

      // Fetch project context for adaptive UI
      try {
        const contextResult = await invoke('getContext', { boardId: bId }) as any
        if (contextResult?.success && contextResult.context) {
          setProjectContext(contextResult.context)
        }
      } catch { }

      // Fetch advanced analytics (P0 intelligence features)
      try {
        const analyticsResult = await invoke('getAdvancedAnalytics', { boardId: bId }) as any
        if (analyticsResult?.success) {
          setAdvancedAnalytics(analyticsResult)
          console.log('[App] Advanced Analytics loaded:', analyticsResult.sprintHealth?.status)
        }
      } catch (e) { console.warn('Advanced analytics not available:', e) }


      // Fetch permissions for UI enablement
      try {
        const permResult = await invoke('getPermissions') as any
        if (permResult) {
          setPermissions({ canRead: permResult.canRead ?? true, canWrite: permResult.canWrite ?? false })
        }
      } catch { /* Permissions endpoint not available, default to canWrite=true */ }
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
          <LogoText>{t('appTitle', locale)}</LogoText>
        </Logo>
        <HeaderRight>
          <StatusBadge status={displayStatus}>{boardType === 'kanban' ? t('flow', locale) : t('sprint', locale)}: {t(displayStatus.toLowerCase(), locale) || displayStatus}</StatusBadge>
          {timingMetrics?.hasUnmapped && (<span title={t('unmappedTransitions', locale)} style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: 12, color: '#f59e0b' }}>⚠</span>)}

          <SettingsButton $active={dictionaryOpen} onClick={() => setDictionaryOpen(!dictionaryOpen)} title={t('glossary', locale)} style={{ marginRight: 8 }}>📖</SettingsButton>
          <SettingsButton
            onClick={() => {
              const newTheme = config.theme === 'dark' ? 'light' : 'dark'
              setConfig((prev: any) => ({ ...prev, theme: newTheme }))
            }}
            title={config.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ marginRight: 8 }}
          >
            {config.theme === 'dark' ? '☀️' : '🌙'}
          </SettingsButton>
          <SettingsButton $active={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)} title={t('settings', locale)} data-tour="settings">⚙️</SettingsButton>
          <SettingsButton onClick={refreshAll} title={t('refreshAll', locale)}>⟳</SettingsButton>
        </HeaderRight>
      </Header>
      {error && (<Notice>{error.includes('Unauthorized') || error.includes('permission') ? t('insufficientPermissions', locale) : error}{perms ? ` | ${t('userBrowse', locale)}: ${perms.userBrowse ? t('yes', locale) : t('no', locale)} | ${t('appBrowse', locale)}: ${perms.appBrowse ? t('yes', locale) : t('no', locale)} | ${t('sprintField', locale)}: ${perms.hasSprintField ? t('yes', locale) : t('no', locale)}` : ''}</Notice>)}
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
            if (isForgeContext()) {
              invoke('setConfig', { ...newConfig, boardId })
                .then(() => {
                  // Trigger full data reload so new settings take effect immediately
                  refreshAll()
                })
                .catch(() => { })
            }
          }} onClose={() => setSettingsOpen(false)} />
        </SettingsOverlay>
      ) : (
        <DashboardView
          telemetryData={telemetryData}
          timingMetrics={timingMetrics}
          trendData={trendData}
          issues={issues}
          boardType={boardType}
          locale={locale}
          refreshAll={refreshAll}
          handleStrategyAction={(id) => handleStrategyAction('resolve', { key: id })} // Simplified adapter
        />
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
