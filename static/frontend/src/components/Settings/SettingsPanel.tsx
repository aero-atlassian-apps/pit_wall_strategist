import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import F1Card from '../Common/F1Card'
import { t, tPop } from '../../i18n'
import { useTour } from '../../context/TourContext'
import { invoke } from '@forge/bridge'
const SettingsContainer = styled.div`display:flex; flex-direction:column; gap: var(--space-4); max-height: 100%; overflow-y: auto; padding-right: 4px;`
const SettingGroup = styled.div`display:flex; flex-direction:column; gap: var(--space-2)`
const SettingLabel = styled.label`font-family: var(--font-stack-mono); font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color: var(--text-muted)`
const SettingDescription = styled.p`font-family: var(--font-stack-ui); font-size:11px; color: var(--text-tertiary); margin:0 0 var(--space-1) 0`
const InputRow = styled.div`display:flex; align-items:center; gap: var(--space-2)`
const NumberInput = styled.input`width:80px; padding: var(--space-2); background: var(--bg-main); border:1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); font-family: var(--font-stack-mono); font-size:14px; text-align:center; &:focus { outline:none; border-color: var(--color-brand) } &::-webkit-inner-spin-button, &::-webkit-outer-spin-button { opacity: 1 }`
const InputUnit = styled.span`font-family: var(--font-stack-mono); font-size:11px; color: var(--text-tertiary)`
const BoardTypeIndicator = styled.div<{ $type: 'scrum' | 'kanban' | 'business' }>`display:flex; align-items:center; gap: var(--space-2); padding: var(--space-2) var(--space-4); background:${({ $type }) => ($type === 'kanban' ? 'rgba(250, 204, 21, 0.1)' : $type === 'business' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(168, 85, 247, 0.1)')}; border:1px solid ${({ $type }) => ($type === 'kanban' ? 'var(--color-yellow-500)' : $type === 'business' ? 'var(--color-green-500)' : 'var(--color-purple-500)')}; border-radius: var(--radius-sm)`
const BoardTypeBadge = styled.span<{ $type: 'scrum' | 'kanban' | 'business' }>`font-family: var(--font-stack-mono); font-size:11px; font-weight:600; text-transform:uppercase; color:${({ $type }) => ($type === 'kanban' ? 'var(--color-yellow-500)' : $type === 'business' ? 'var(--color-green-500)' : 'var(--color-purple-500)')}`
const SaveButton = styled.button`padding: var(--space-2) var(--space-5); background: var(--color-brand); border:none; border-radius: var(--radius-sm); color: white; font-family: var(--font-stack-mono); font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px; cursor:pointer; transition:all 0.2s; &:hover { transform: translateY(-1px); box-shadow: var(--shadow-glow) } &:disabled { opacity:.5; cursor:not-allowed; transform:none; box-shadow:none }`
const ResetButton = styled.button`padding: var(--space-2) var(--space-4); background:transparent; border:1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-muted); font-family: var(--font-stack-mono); font-size:11px; cursor:pointer; transition:all 0.2s; &:hover { border-color: var(--text-primary); color: var(--text-primary) }`
const ButtonRow = styled.div`display:flex; gap: var(--space-4); margin-top: var(--space-4)`

const DEFAULT_CONFIG = { wipLimit: 8, assigneeCapacity: 3, stalledThresholdHours: 24, stalledThresholdHoursByType: {}, theme: 'dark' }

function SettingsPanel({ config = DEFAULT_CONFIG, boardType = 'scrum', boardName = 'Board', onSave, onClose }: { config?: any; boardType?: 'scrum' | 'kanban' | 'business'; boardName?: string; onSave?: (cfg: any) => void; onClose?: () => void }) {
  const [localConfig, setLocalConfig] = useState(config)
  const [hasChanges, setHasChanges] = useState(false)
  const [typeRows, setTypeRows] = useState<Array<{ typeName: string; hours: number }>>([])
  const [suggestTypes, setSuggestTypes] = useState<string[]>([])
  const [typeHints, setTypeHints] = useState<Record<string, { avgInProgressHours: number; recommendedMin: number; recommendedMax: number }>>({})
  const { resetTour } = useTour()
  useEffect(() => { setLocalConfig(config); const byType = config?.stalledThresholdHoursByType || {}; const rows = Object.keys(byType || {}).map(k => ({ typeName: k, hours: byType[k] })); setTypeRows(rows) }, [config])
  const [hintsError, setHintsError] = useState<string>('')
  useEffect(() => {
    ; (async () => {
      try {
        const details = await invoke('getDiagnosticsDetails') as any;
        const keys = Object.keys(details?.statuses?.byIssueType || {});
        setSuggestTypes(keys);

        const ch = await invoke('getCycleHints') as any;
        if (ch?.success) {
          setTypeHints(ch.hints || {});
          setHintsError('')
        } else {
          const code = ch?.code || 'UNKNOWN';
          const msg = code === 'PERMISSION_DENIED' ? 'Permission denied while computing hints' :
            code === 'RATE_LIMITED' ? 'Rate limited while computing hints' :
              code === 'NO_DATA' ? 'No data available to compute hints' : 'Failed to compute hints';
          setHintsError(msg)
        }
      } catch (e: any) {
        setHintsError(e?.message || 'Hints unavailable')
      }
    })()
  }, [])
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
          <BoardTypeIndicator $type={boardType}>
            <span>{boardType === 'kanban' ? '📊' : boardType === 'business' ? '💼' : '🏃'}</span>
            <BoardTypeBadge $type={boardType}>{boardType.toUpperCase()} - {boardName}</BoardTypeBadge>
          </BoardTypeIndicator>
          <SettingDescription>
            {tPop('modeDesc', boardType, locale)}
          </SettingDescription>
        </SettingGroup>
        <SettingGroup>
          <SettingLabel>{tPop('wipLimitLabel', boardType, locale)}</SettingLabel>
          <SettingDescription>{t('wipLimitDesc', locale)}</SettingDescription>
          <InputRow><NumberInput type="number" min="1" max="50" value={localConfig.wipLimit} onChange={e => handleChange('wipLimit', e.target.value)} /><InputUnit>{t('ticketsUnit', locale)}</InputUnit></InputRow>
        </SettingGroup>
        <SettingGroup>
          <SettingLabel>{tPop('assigneeCapacityLabel', boardType, locale)}</SettingLabel>
          <SettingDescription>{t('assigneeCapacityDesc', locale)}</SettingDescription>
          <InputRow><NumberInput type="number" min="1" max="20" value={localConfig.assigneeCapacity} onChange={e => handleChange('assigneeCapacity', e.target.value)} /><InputUnit>{t('ticketsPerPersonUnit', locale)}</InputUnit></InputRow>
        </SettingGroup>
        <SettingGroup>
          <SettingLabel>{tPop('stalledThresholdLabel', boardType, locale)}</SettingLabel>
          <SettingDescription>{t('stalledThresholdDesc', locale)}</SettingDescription>
          <InputRow><NumberInput type="number" min="1" max="168" title={t('recommendedRange', locale)} value={localConfig.stalledThresholdHours} onChange={e => handleChange('stalledThresholdHours', e.target.value)} /><InputUnit>{t('hoursUnit', locale)}</InputUnit></InputRow>
        </SettingGroup>

        <SettingGroup>
          <SettingLabel>{t('language', locale)}</SettingLabel>
          <SettingDescription>{t('languageDesc', locale)}</SettingDescription>
          <InputRow>
            <select value={localConfig.locale || 'en'} onChange={e => { setLocalConfig((prev: any) => ({ ...prev, locale: e.target.value })); setHasChanges(true) }} style={{ padding: '6px 8px', background: 'var(--bg-main, #0b1221)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontFamily: 'var(--font-stack-mono)', fontSize: '12px' }}>
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="pt">Português</option>
            </select>
          </InputRow>
        </SettingGroup>
        <SettingGroup>
          <SettingLabel>Theme</SettingLabel>
          <SettingDescription>Choose your cockpit appearance.</SettingDescription>
          <InputRow>
            <select value={localConfig.theme || 'dark'} onChange={e => { setLocalConfig((prev: any) => ({ ...prev, theme: e.target.value })); setHasChanges(true) }} style={{ padding: '6px 8px', background: 'var(--bg-main, #0b1221)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontFamily: 'var(--font-stack-mono)', fontSize: '12px' }}>
              <option value="dark">🏎️ Night Race (Dark)</option>
              <option value="light">☀️ Day Race (Light)</option>
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
                <input list="issuetype-suggestions" placeholder={t('issuetypePlaceholder', locale)} value={row.typeName} onChange={e => handleTypeRowChange(idx, 'typeName', e.target.value)} style={{ flex: 1, padding: '6px 8px', background: 'var(--bg-main)', border: dupeKeys.includes((row.typeName || '').trim().toLowerCase()) ? '1px solid var(--color-danger)' : '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontFamily: 'var(--font-stack-mono)', fontSize: '12px' }} />
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
