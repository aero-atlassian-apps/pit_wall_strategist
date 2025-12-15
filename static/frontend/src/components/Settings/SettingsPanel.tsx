import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import F1Card from '../Common/F1Card'
import { t } from '../../i18n'
import { useTour } from '../../context/TourContext'

const SettingsContainer = styled.div`display:flex; flex-direction:column; gap:${({ theme }) => (theme as any).spacing.md}`
const SettingGroup = styled.div`display:flex; flex-direction:column; gap:${({ theme }) => (theme as any).spacing.sm}`
const SettingLabel = styled.label`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:${({ theme }) => (theme as any).colors.textMuted}`
const SettingDescription = styled.p`font-family:${({ theme }) => (theme as any).fonts.ui}; font-size:11px; color:${({ theme }) => (theme as any).colors.textDim}; margin:0 0 ${({ theme }) => (theme as any).spacing.xs} 0`
const InputRow = styled.div`display:flex; align-items:center; gap:${({ theme }) => (theme as any).spacing.sm}`
const NumberInput = styled.input`width:80px; padding:${({ theme }) => (theme as any).spacing.sm}; background:${({ theme }) => (theme as any).colors.bgMain}; border:1px solid ${({ theme }) => (theme as any).colors.border}; border-radius:${({ theme }) => (theme as any).borderRadius.sm}; color:${({ theme }) => (theme as any).colors.textPrimary}; font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:14px; text-align:center; &:focus { outline:none; border-color:${({ theme }) => (theme as any).colors.purpleSector} } &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { opacity: 1 }`
const InputUnit = styled.span`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:11px; color:${({ theme }) => (theme as any).colors.textMuted}`
const BoardTypeIndicator = styled.div<{ $type: 'scrum' | 'kanban' }>`display:flex; align-items:center; gap:${({ theme }) => (theme as any).spacing.sm}; padding:${({ theme }) => (theme as any).spacing.sm} ${({ theme }) => (theme as any).spacing.md}; background:${({ $type, theme }) => ($type === 'kanban' ? `${(theme as any).colors.yellowFlag}22` : `${(theme as any).colors.purpleSector}22`)}; border:1px solid ${({ $type, theme }) => ($type === 'kanban' ? (theme as any).colors.yellowFlag : (theme as any).colors.purpleSector)}; border-radius:${({ theme }) => (theme as any).borderRadius.sm}`
const BoardTypeBadge = styled.span<{ $type: 'scrum' | 'kanban' }>`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:11px; font-weight:600; text-transform:uppercase; color:${({ $type, theme }) => ($type === 'kanban' ? (theme as any).colors.yellowFlag : (theme as any).colors.purpleSector)}`
const SaveButton = styled.button`padding:${({ theme }) => (theme as any).spacing.sm} ${({ theme }) => (theme as any).spacing.lg}; background:${({ theme }) => (theme as any).colors.purpleSector}; border:none; border-radius:${({ theme }) => (theme as any).borderRadius.sm}; color:white; font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px; cursor:pointer; transition:all ${({ theme }) => (theme as any).transitions.fast}; &:hover { transform: translateY(-1px); box-shadow:${({ theme }) => (theme as any).shadows.glow.purple} } &:disabled { opacity:.5; cursor:not-allowed; transform:none; box-shadow:none }`
const ResetButton = styled.button`padding:${({ theme }) => (theme as any).spacing.sm} ${({ theme }) => (theme as any).spacing.md}; background:transparent; border:1px solid ${({ theme }) => (theme as any).colors.border}; border-radius:${({ theme }) => (theme as any).borderRadius.sm}; color:${({ theme }) => (theme as any).colors.textMuted}; font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:11px; cursor:pointer; transition:all ${({ theme }) => (theme as any).transitions.fast}; &:hover { border-color:${({ theme }) => (theme as any).colors.textPrimary}; color:${({ theme }) => (theme as any).colors.textPrimary} }`
const ButtonRow = styled.div`display:flex; gap:${({ theme }) => (theme as any).spacing.md}; margin-top:${({ theme }) => (theme as any).spacing.md}`

const DEFAULT_CONFIG = { wipLimit: 8, assigneeCapacity: 3, stalledThresholdHours: 24, stalledThresholdHoursByType: {} }

function SettingsPanel({ config = DEFAULT_CONFIG, boardType = 'scrum', boardName = 'Board', onSave, onClose }: { config?: any; boardType?: 'scrum' | 'kanban'; boardName?: string; onSave?: (cfg: any) => void; onClose?: () => void }) {
  const [localConfig, setLocalConfig] = useState(config)
  const [hasChanges, setHasChanges] = useState(false)
  const [typeRows, setTypeRows] = useState<Array<{ typeName: string; hours: number }>>([])
  const [suggestTypes, setSuggestTypes] = useState<string[]>([])
  const [typeHints, setTypeHints] = useState<Record<string, { avgInProgressHours: number; recommendedMin: number; recommendedMax: number }>>({})
  const { resetTour } = useTour()
  useEffect(() => { setLocalConfig(config); const byType = config?.stalledThresholdHoursByType || {}; const rows = Object.keys(byType || {}).map(k => ({ typeName: k, hours: byType[k] })); setTypeRows(rows) }, [config])
  const [hintsError, setHintsError] = useState<string>('')
  useEffect(() => { ;(async () => { try { const bridge = await import('@forge/bridge'); const details = await bridge.invoke('getDiagnosticsDetails'); const keys = Object.keys(details?.statuses?.byIssueType || {}); setSuggestTypes(keys); const ch = await bridge.invoke('getCycleHints'); if (ch?.success) { setTypeHints(ch.hints || {}); setHintsError('') } else { const code = ch?.code || 'UNKNOWN'; const msg = code === 'PERMISSION_DENIED' ? 'Permission denied while computing hints' : code === 'RATE_LIMITED' ? 'Rate limited while computing hints' : code === 'NO_DATA' ? 'No data available to compute hints' : 'Failed to compute hints'; setHintsError(msg) } } catch (e: any) { setHintsError(e?.message || 'Hints unavailable') } })() }, [])
  const dupeKeys = (() => { const counts: Record<string, number> = {}; typeRows.forEach(r => { const k = (r.typeName || '').trim().toLowerCase(); if (k) counts[k] = (counts[k] || 0) + 1 }); return Object.keys(counts).filter(k => counts[k] > 1) })()
  const isValid = typeRows.every(r => (r.typeName || '').trim().length > 0 && r.hours > 0) && dupeKeys.length === 0
  function handleChange(key: string, value: string) { const numValue = parseInt(value, 10) || 0; setLocalConfig((prev: any) => ({ ...prev, [key]: numValue })); setHasChanges(true) }
  function handleTypeRowChange(idx: number, field: 'typeName' | 'hours', value: string) { setTypeRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: field === 'hours' ? Math.max(0, parseInt(value || '0', 10) || 0) : value } : r)); setHasChanges(true) }
  function addTypeRow() { setTypeRows(prev => [...prev, { typeName: '', hours: localConfig.stalledThresholdHours || 24 }]); setHasChanges(true) }
  function removeTypeRow(idx: number) { setTypeRows(prev => prev.filter((_, i) => i !== idx)); setHasChanges(true) }
  function handleSave() { const map: any = {}; typeRows.forEach(r => { const key = (r.typeName || '').trim().toLowerCase(); if (key && r.hours > 0) map[key] = r.hours }); onSave?.({ ...localConfig, stalledThresholdHoursByType: map }); setHasChanges(false) }
  function handleReset() { setLocalConfig(DEFAULT_CONFIG); setTypeRows([]); setHasChanges(true) }
  const locale = (window as any).__PWS_LOCALE || 'en'
  return (
    <F1Card title={t('settings', locale)} badge={t('settings', locale)}>
      <SettingsContainer>
        <SettingGroup>
          <SettingLabel>{t('detectedBoard', locale)}</SettingLabel>
          <BoardTypeIndicator $type={boardType}><span>{boardType === 'kanban' ? '📊' : '🏃'}</span><BoardTypeBadge $type={boardType}>{boardType.toUpperCase()} - {boardName}</BoardTypeBadge></BoardTypeIndicator>
          <SettingDescription>{boardType === 'kanban' ? t('kanbanModeDesc', locale) : t('scrumModeDesc', locale)}</SettingDescription>
        </SettingGroup>
        <SettingGroup>
          <SettingLabel>{t('wipLimitLabel', locale)}</SettingLabel>
          <SettingDescription>{t('wipLimitDesc', locale)}</SettingDescription>
          <InputRow><NumberInput type="number" min="1" max="50" value={localConfig.wipLimit} onChange={e => handleChange('wipLimit', e.target.value)} /><InputUnit>{t('ticketsUnit', locale)}</InputUnit></InputRow>
        </SettingGroup>
        <SettingGroup>
          <SettingLabel>{t('assigneeCapacityLabel', locale)}</SettingLabel>
          <SettingDescription>{t('assigneeCapacityDesc', locale)}</SettingDescription>
          <InputRow><NumberInput type="number" min="1" max="20" value={localConfig.assigneeCapacity} onChange={e => handleChange('assigneeCapacity', e.target.value)} /><InputUnit>{t('ticketsPerPersonUnit', locale)}</InputUnit></InputRow>
        </SettingGroup>
        <SettingGroup>
          <SettingLabel>{t('stalledThresholdLabel', locale)}</SettingLabel>
          <SettingDescription>{t('stalledThresholdDesc', locale)}</SettingDescription>
          <InputRow><NumberInput type="number" min="1" max="168" title={t('recommendedRange', locale)} value={localConfig.stalledThresholdHours} onChange={e => handleChange('stalledThresholdHours', e.target.value)} /><InputUnit>{t('hoursUnit', locale)}</InputUnit></InputRow>
        </SettingGroup>
        <SettingGroup>
          <SettingLabel>{t('language', locale)}</SettingLabel>
          <SettingDescription>{t('languageDesc', locale)}</SettingDescription>
          <InputRow>
            <select value={localConfig.locale || 'en'} onChange={e => { setLocalConfig((prev: any) => ({ ...prev, locale: e.target.value })); setHasChanges(true) }} style={{ padding: '6px 8px', background: 'var(--bg-main, #0b1221)', border: '1px solid #334155', borderRadius: '6px', color: '#cbd5e1', fontFamily: 'monospace', fontSize: '12px' }}>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="pt">Português</option>
            </select>
          </InputRow>
        </SettingGroup>
        <SettingGroup>
          <SettingLabel>{t('perTypeThresholdsLabel', locale)}</SettingLabel>
          <SettingDescription>{t('perTypeThresholdsDesc', locale)}</SettingDescription>
          {hintsError && (<SettingDescription style={{ color: '#ef4444' }}>{hintsError}</SettingDescription>)}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {typeRows.map((row, idx) => (
              <InputRow key={`type-row-${idx}`}>
                <input list="issuetype-suggestions" placeholder={t('issuetypePlaceholder', locale)} value={row.typeName} onChange={e => handleTypeRowChange(idx, 'typeName', e.target.value)} style={{ flex: 1, padding: '6px 8px', background: 'var(--bg-main, #0b1221)', border: dupeKeys.includes((row.typeName || '').trim().toLowerCase()) ? '1px solid #ef4444' : '1px solid #334155', borderRadius: '6px', color: '#cbd5e1', fontFamily: 'monospace', fontSize: '12px' }} />
                <NumberInput type="number" min="1" max="168" title={t('recommendedRange', locale)} value={row.hours} onChange={e => handleTypeRowChange(idx, 'hours', e.target.value)} />
                <InputUnit>{formatHint(typeHints[(row.typeName || '').trim().toLowerCase()])}</InputUnit>
                <ResetButton onClick={() => removeTypeRow(idx)}>{t('remove', locale)}</ResetButton>
              </InputRow>
            ))}
            <ButtonRow style={{ marginTop: 0 }}>
              <ResetButton onClick={addTypeRow}>{t('addIssuetypeRule', locale)}</ResetButton>
            </ButtonRow>
            {dupeKeys.length > 0 && (<SettingDescription style={{ color: '#ef4444' }}>{t('duplicateIssuetypeEntries', locale)} {dupeKeys.join(', ')}</SettingDescription>)}
            <datalist id="issuetype-suggestions">
              {suggestTypes.map(t => (<option key={`sugg-${t}`} value={t} />))}
            </datalist>
          </div>
        </SettingGroup>
        <ButtonRow>
          <SaveButton onClick={handleSave} disabled={!hasChanges || !isValid}>{t('applySettings', locale)}</SaveButton>
          <ResetButton onClick={handleReset}>{t('resetDefaults', locale)}</ResetButton>
        </ButtonRow>
        <SettingGroup style={{ marginTop: '16px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
          <SettingLabel>{t('system', locale)}</SettingLabel>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SettingDescription style={{ margin: 0 }}>{t('replayBriefing', locale)}</SettingDescription>
            <ResetButton onClick={() => { resetTour(); onClose?.() }}>{t('replayDriverBriefing', locale)}</ResetButton>
          </div>
        </SettingGroup>
      </SettingsContainer>
    </F1Card>
  )
}

export default SettingsPanel
function formatHint(h?: { avgInProgressHours: number; recommendedMin: number; recommendedMax: number }) { const locale = (window as any).__PWS_LOCALE || 'en'; if (!h) return ''; return `${t('recShort', locale)} ${h.recommendedMin}–${h.recommendedMax}${t('hoursUnit', locale)}` }
