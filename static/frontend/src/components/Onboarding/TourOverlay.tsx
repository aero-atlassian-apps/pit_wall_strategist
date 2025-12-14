import React, { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { useTour } from '../../context/TourContext'
import { t } from '../../i18n'

const pulse = keyframes`0%,100% { box-shadow: 0 0 0 4px rgba(156, 39, 176, 0.3) } 50% { box-shadow: 0 0 0 8px rgba(156, 39, 176, 0.1) }`
const fadeIn = keyframes`from { opacity: 0 } to { opacity: 1 }`
const slideUp = keyframes`from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) }`
const Overlay = styled.div`position:fixed; top:0; left:0; right:0; bottom:0; z-index:9998; animation:${fadeIn} .3s ease`
const Backdrop = styled.div`position:absolute; top:0; left:0; right:0; bottom:0; background: rgba(0, 0, 0, 0.75)`
const Spotlight = styled.div`position:absolute; border-radius:8px; animation:${pulse} 2s ease-in-out infinite; pointer-events:none; box-shadow: 0 0 0 4px rgba(156, 39, 176, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.75)`
const TooltipContainer = styled.div`position:absolute; z-index:9999; width:320px; animation:${slideUp} .3s ease`
const Tooltip = styled.div`background:${({ theme }) => (theme as any).colors.bgCard}; border:1px solid ${({ theme }) => (theme as any).colors.purpleSector}; border-radius:${({ theme }) => (theme as any).borderRadius.md}; padding:${({ theme }) => (theme as any).spacing.lg}; box-shadow:0 8px 32px rgba(0,0,0,.5)`
const TooltipTitle = styled.h3`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:${({ theme }) => (theme as any).colors.textPrimary}; margin:0 0 ${({ theme }) => (theme as any).spacing.sm} 0`
const TooltipContent = styled.p`font-family:${({ theme }) => (theme as any).fonts.ui}; font-size:13px; line-height:1.5; color:${({ theme }) => (theme as any).colors.textMuted}; margin:0 0 ${({ theme }) => (theme as any).spacing.md} 0; strong { color:${({ theme }) => (theme as any).colors.purpleSector} }`
const TooltipFooter = styled.div`display:flex; justify-content:space-between; align-items:center; padding-top:${({ theme }) => (theme as any).spacing.md}; border-top:1px solid ${({ theme }) => (theme as any).colors.border}`
const ProgressDots = styled.div`display:flex; gap:6px`
const Dot = styled.div<{ $active?: boolean }>`width:8px; height:8px; border-radius:50%; background:${({ $active, theme }) => ($active ? (theme as any).colors.purpleSector : (theme as any).colors.border)}; transition: background .2s`
const ButtonGroup = styled.div`display:flex; gap:${({ theme }) => (theme as any).spacing.sm}`
const Button = styled.button<{ $primary?: boolean }>`padding:${({ theme }) => (theme as any).spacing.xs} ${({ theme }) => (theme as any).spacing.md}; border:1px solid ${({ $primary, theme }) => ($primary ? (theme as any).colors.purpleSector : (theme as any).colors.border)}; border-radius:${({ theme }) => (theme as any).borderRadius.sm}; background:${({ $primary, theme }) => ($primary ? (theme as any).colors.purpleSector : 'transparent')}; color:${({ $primary, theme }) => ($primary ? 'white' : (theme as any).colors.textMuted)}; font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; cursor:pointer; transition:all .2s; &:hover { border-color:${({ theme }) => (theme as any).colors.purpleSector}; color:${({ $primary, theme }) => ($primary ? 'white' : (theme as any).colors.textPrimary)} }`
const LapIndicator = styled.span`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:10px; color:${({ theme }) => (theme as any).colors.textDim}`
const CenterModal = styled.div`position:fixed; top:50%; left:50%; transform: translate(-50%, -50%); z-index:9999; width:400px; animation:${slideUp} .4s ease`
const WelcomeTitle = styled.h2`font-family:${({ theme }) => (theme as any).fonts.mono}; font-size:24px; font-weight:700; text-align:center; color:${({ theme }) => (theme as any).colors.textPrimary}; margin:0 0 ${({ theme }) => (theme as any).spacing.md} 0`

function TourOverlay() {
  const { isActive, currentStep, totalSteps, currentStepData, nextStep, prevStep, skipTour } = useTour()
  const [spotlightPosition, setSpotlightPosition] = useState<any>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  useEffect(() => {
    if (!isActive || !currentStepData) return
    if (!currentStepData.target) { setSpotlightPosition(null); return }
    const targetElement = document.querySelector(currentStepData.target)
    if (!targetElement) return
    const rect = (targetElement as HTMLElement).getBoundingClientRect()
    const padding = 8
    setSpotlightPosition({ top: rect.top - padding, left: rect.left - padding, width: rect.width + padding * 2, height: rect.height + padding * 2 })
    const tooltipWidth = 320
    const tooltipHeight = 200
    let top: number, left: number
    switch (currentStepData.position) {
      case 'right': top = rect.top; left = rect.right + 16; break
      case 'left': top = rect.top; left = rect.left - tooltipWidth - 16; break
      case 'bottom': top = rect.bottom + 16; left = rect.left + rect.width / 2 - tooltipWidth / 2; break
      case 'bottom-left': top = rect.bottom + 16; left = rect.left - tooltipWidth + rect.width; break
      case 'top': top = rect.top - tooltipHeight - 16; left = rect.left + rect.width / 2 - tooltipWidth / 2; break
      default: top = rect.bottom + 16; left = rect.left
    }
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16))
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16))
    setTooltipPosition({ top, left })
  }, [isActive, currentStep, currentStepData])
  useEffect(() => {
    if (!isActive) return
    function handleKeyDown(e: KeyboardEvent) { if (e.key === 'Escape') skipTour(); else if (e.key === 'Enter' || e.key === 'ArrowRight') nextStep(); else if (e.key === 'ArrowLeft') prevStep() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, nextStep, prevStep, skipTour])
  if (!isActive) return null
  if (!currentStepData.target) {
    return (
      <Overlay>
        <Backdrop />
        <CenterModal>
          <Tooltip>
            <WelcomeTitle>{currentStepData.title}</WelcomeTitle>
            <TooltipContent>{currentStepData.content}</TooltipContent>
            <TooltipFooter>
              <Button onClick={skipTour}>{t('skipToGrid', (window as any).__PWS_LOCALE || 'en')}</Button>
              <Button $primary onClick={nextStep}>{t('startBriefing', (window as any).__PWS_LOCALE || 'en')} →</Button>
            </TooltipFooter>
          </Tooltip>
        </CenterModal>
      </Overlay>
    )
  }
  return (
    <Overlay>
      {spotlightPosition && (<Spotlight style={spotlightPosition} />)}
      <TooltipContainer style={tooltipPosition}>
        <Tooltip>
          <TooltipTitle>{currentStepData.title}</TooltipTitle>
          <TooltipContent dangerouslySetInnerHTML={{ __html: currentStepData.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          <TooltipFooter>
            <ProgressDots>{Array.from({ length: totalSteps }).map((_, i) => (<Dot key={i} $active={i === currentStep} />))}</ProgressDots>
            <LapIndicator>{t('lap', (window as any).__PWS_LOCALE || 'en')} {currentStep + 1}/{totalSteps}</LapIndicator>
            <ButtonGroup>
              {currentStep > 0 && (<Button onClick={prevStep}>← {t('back', (window as any).__PWS_LOCALE || 'en')}</Button>)}
              <Button onClick={skipTour}>{t('skip', (window as any).__PWS_LOCALE || 'en')}</Button>
              <Button $primary onClick={nextStep}>{currentStep === totalSteps - 1 ? `${t('lightsOut', (window as any).__PWS_LOCALE || 'en')} 🏁` : `${t('next', (window as any).__PWS_LOCALE || 'en')} →`}</Button>
            </ButtonGroup>
          </TooltipFooter>
        </Tooltip>
      </TooltipContainer>
    </Overlay>
  )
}

export default TourOverlay
