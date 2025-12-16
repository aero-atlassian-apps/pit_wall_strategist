import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { t } from '../../i18n'
import { invoke } from '@forge/bridge'

const Container = styled.div`
  margin-top: 12px;
  background: ${({ theme }) => (theme as any).colors.bgCard};
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
  border-radius: ${({ theme }) => (theme as any).borderRadius.sm};
  padding: 12px;
`

const Title = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 10px;
  color: ${({ theme }) => (theme as any).colors.textDim};
  text-transform: uppercase;
  margin-bottom: 8px;
`

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 100px 60px;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid ${({ theme }) => (theme as any).colors.border};
  &:last-child { border-bottom: none }
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 10px;
`

const KV = styled.div`
  display: flex; gap: 8px; align-items: baseline; margin-bottom: 8px;
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-size: 10px;
  color: ${({ theme }) => (theme as any).colors.textMuted};
`

type Status = { endpoint: string; ok: boolean; status?: number }

export default function DiagnosticsWidget() {
  const locale = (window as any).__PWS_LOCALE || 'en'
  const [velocitySource, setVelocitySource] = useState<string>('-')
  const [velocityWindow, setVelocityWindow] = useState<string>('-')
  const [statuses, setStatuses] = useState<Status[]>([])
  const [auth, setAuth] = useState<{ appBrowse?: boolean; userBrowse?: boolean } | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    try {
      const res: any = await invoke('getTelemetryDiagnostics')
      if (res?.success) {
        const d = res.diagnostics || {}
        setVelocitySource(d.velocitySource || '-')
        setVelocityWindow(d.velocityWindow || '-')
        setStatuses((d.fetchStatuses || []).slice(-5).reverse())
        // Permissions
        const summary: any = await invoke('getDiagnosticsSummary')
        if (summary?.success) setAuth(summary.summary?.permissions || null)
      }
    } catch {}
  }

  return (
    <Container>
      <Title>{t('diagnostics', locale)}</Title>
      <KV><span>{t('source', locale)}:</span><strong>{velocitySource}</strong></KV>
      <KV><span>{t('window', locale)}:</span><strong>{velocityWindow}</strong></KV>
      {auth && (auth.appBrowse === false) && (
        <div style={{ color: '#FF0033', marginBottom: 8, fontFamily: (window as any).__THEME?.fonts?.mono || 'monospace' }}>
          {t('permissions', locale)}: App browse denied. Using user fallback where possible.
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <Row>
          <div>{t('endpoint', locale)}</div>
          <div>{t('status', locale)}</div>
          <div>{t('ok', locale)}</div>
        </Row>
        {statuses.map((s, i) => (
          <Row key={`${s.endpoint}-${i}`}>
            <div>{s.endpoint}</div>
            <div>{s.status ?? ''}</div>
            <div style={{ color: s.ok ? '#39FF14' : '#FF0033' }}>{s.ok ? 'Yes' : 'No'}</div>
          </Row>
        ))}
      </div>
    </Container>
  )
}
