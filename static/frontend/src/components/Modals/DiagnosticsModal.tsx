import React, { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { invoke } from '@forge/bridge'
import { IconButton, CloseIcon, Button } from '../Common/Buttons'

type Props = {
  open: boolean
  onClose: () => void
  health?: any
}

export default function DiagnosticsModal({ open, onClose, health }: Props) {
  const locale = (window as any).__PWS_LOCALE || 'en'
  const [diag, setDiag] = useState<any>(null)
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (open) refresh() }, [open])

  async function refresh() {
    setLoading(true)
    try {
      const res = await invoke('getPermissionsDiagnostics'); if (res?.success) setDiag(res.permissions)
      const d = await invoke('getDiagnosticsDetails'); if (d?.success) setDetails(d)
    } catch { } finally { setLoading(false) }
  }

  if (!open) return null

  return (
    <Overlay>
      <Modal>
        <Header>
          <Title>{t('systemDiagnostics', locale)}</Title>
          <IconButton onClick={onClose} title={t('close', locale)}><CloseIcon /></IconButton>
        </Header>
        <Body>
          <Section>
            <SectionTitle>{t('healthCheck', locale)}</SectionTitle>
            <KV><K>{t('platform', locale)}</K><V>{health?.platform || 'local'}</V></KV>
            <KV><K>{t('project', locale)}</K><V>{health?.projectKey || '—'}</V></KV>
            <KV><K>{t('board', locale)}</K><V>{health?.boardInfo?.boardName || health?.boardInfo?.error || '—'}</V></KV>
            <KV><K>{t('type', locale)}</K><V>{health?.boardInfo?.type || '—'}</V></KV>
            <KV><K>{t('fields', locale)}</K><V>{`SP:${health?.fields?.storyPoints || 'unknown'} Sprint:${health?.fields?.sprint || 'unknown'} Epic:${health?.fields?.epicLink || 'n/a'}`}</V></KV>
          </Section>

          <Divider />

          <Section>
            <SectionTitle>{t('permissions', locale)}</SectionTitle>
            {diag ? (
              <>
                <KV><K>{t('userBrowseScope', locale)}</K><V $good={diag.userBrowse}>{diag.userBrowse ? t('granted', locale) : t('denied', locale)}</V></KV>
                <KV><K>{t('appBrowseScope', locale)}</K><V $good={diag.appBrowse}>{diag.appBrowse ? t('granted', locale) : t('denied', locale)}</V></KV>
                <KV><K>{t('sprintFieldAccess', locale)}</K><V $good={diag.hasSprintField}>{diag.hasSprintField ? t('available', locale) : t('missing', locale)}</V></KV>
              </>
            ) : (
              <KV><K>{t('status', locale)}</K><V>{loading ? t('loading', locale) : t('noData', locale)}</V></KV>
            )}
          </Section>

          <Divider />

          <Section>
            <SectionTitle>{t('deepInspection', locale)}</SectionTitle>
            <KV><K>{t('cspNonce', locale)}</K><V>{getCspNonce() ? t('present', locale) : t('missing', locale)}</V></KV>
            <KV><K>{t('fieldCache', locale)}</K><V>{formatFields(details?.fields)}</V></KV>
            <KV><K>{t('boardFilter', locale)}</K><V>{details?.filter?.id || 'n/a'}</V></KV>
            <KV><K>{t('filterJql', locale)}</K><V className="code">{details?.filter?.jql || 'n/a'}</V></KV>
            <KV><K>{t('sprintId', locale)}</K><V>{details?.sprint?.id ?? 'n/a'}</V></KV>
            <KV><K>{t('forgeScopes', locale)}</K><V className="code">{Array.isArray(details?.scopes) ? `${details.scopes.length} ${t('scopes', locale)}` : 'n/a'}</V></KV>
          </Section>
        </Body>
        <Footer>
          <Button type="button" onClick={refresh} $variant="secondary" disabled={loading}>{loading ? t('refreshing', locale) : t('runDiagnostics', locale)}</Button>
        </Footer>
      </Modal>
    </Overlay>
  )
}

function getCspNonce(): string | undefined {
  const meta = document.querySelector('meta[name="csp-nonce"]') as HTMLMetaElement | null
  if (meta?.content) return meta.content
  const scripts = Array.from(document.getElementsByTagName('script'))
  for (const s of scripts) { const n = (s as any).nonce || s.getAttribute('nonce'); if (n) return n as string }
  return (window as any).__webpack_nonce__
}

function formatFields(f: any) {
  const locale = (window as any).__PWS_LOCALE || 'en'
  if (!f) return 'n/a';
  const sp = f.storyPoints || '?';
  const sprint = f.sprint || '?';
  const epic = f.epicLink || '?';
  return `SP:${sp} ${t('sprint', locale)}:${sprint} ${t('epic', locale)}:${epic}`
}

const fadeIn = keyframes`from{opacity:0}to{opacity:1}`
const slideUp = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`

const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
  animation: ${fadeIn} 0.2s ease-out;
`

const Modal = styled.div`
  width: 600px; max-width: 90vw; max-height: 90vh; overflow-y: auto;
  background: ${({ theme }) => (theme as any).colors.bgCard};
  border: 1px solid ${({ theme }) => (theme as any).colors.border};
  border-radius: ${({ theme }) => (theme as any).borderRadius.lg};
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex; flex-direction: column;
  animation: ${slideUp} 0.3s ease-out;
`

const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between; padding: 16px 20px;
  border-bottom: 1px solid ${({ theme }) => (theme as any).colors.border};
  background: rgba(0,0,0,0.2);
`

const Title = styled.div`
  font-family: ${({ theme }) => (theme as any).fonts.mono};
  font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;
  color: ${({ theme }) => (theme as any).colors.textPrimary};
`

const Body = styled.div`
  padding: 20px;
  display: flex; flex-direction: column; gap: 20px;
`

const Section = styled.div`
  display: flex; flex-direction: column; gap: 8px;
`

const SectionTitle = styled.div`
  font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;
  color: ${({ theme }) => (theme as any).colors.purpleSector};
  margin-bottom: 4px;
`

const KV = styled.div`
  display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
`

const K = styled.div`
  font-size: 12px; color: ${({ theme }) => (theme as any).colors.textMuted}; min-width: 100px;
`

const V = styled.div<{ $good?: boolean }>`
  font-size: 12px; font-family: ${({ theme }) => (theme as any).fonts.mono};
  color: ${({ theme, $good }) => $good === true ? (theme as any).colors.greenPace : $good === false ? (theme as any).colors.redAlert : (theme as any).colors.textPrimary};
  text-align: right;
  word-break: break-all;
  
  &.code {
    font-size: 10px; opacity: 0.8;
  }
`

const Divider = styled.div`
  height: 1px; background: ${({ theme }) => (theme as any).colors.border}; opacity: 0.5;
`

const Footer = styled.div`
  padding: 16px 20px; border-top: 1px solid ${({ theme }) => (theme as any).colors.border};
  display: flex; justify-content: flex-end;
  background: rgba(0,0,0,0.2);
`
import { t } from '../../i18n'
