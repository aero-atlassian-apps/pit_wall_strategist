import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'pit-wall-tour-completed'
const TOUR_STEPS = [
  { id: 'welcome', target: null as any, title: '🏁 Welcome to the Pit Wall', content: 'This is your Mission Control for the sprint. Let me give you a quick driver briefing before we go racing.', position: 'center' },
  { id: 'telemetry', target: '[data-tour="telemetry"]', title: '📊 Car Telemetry', content: '**Fuel Load** = Work In Progress. **Tire Deg** = Team burnout. Watch these gauges to know when the car is struggling.', position: 'right' },
  { id: 'track', target: '[data-tour="track"]', title: '🏎️ The Circuit', content: 'Your sprint visualized as an F1 track. Tickets move through sectors. A **red glow** means a ticket has stalled — it needs pit strategy!', position: 'bottom' },
  { id: 'racecontrol', target: '[data-tour="racecontrol"]', title: '📡 Race Control', content: 'Live feed of sprint events. Yellow = caution. Red = critical. When something needs attention, the **BOX BOX** button flashes.', position: 'left' },
  { id: 'boxbox', target: '[data-tour="boxbox"]', title: '🔴 BOX BOX Button', content: 'Click this when a ticket is stalled. The Strategy Assistant will analyze the situation and offer you 3 pit strategies to get back on track.', position: 'left' },
  { id: 'settings', target: '[data-tour="settings"]', title: '⚙️ Race Configuration', content: 'Customize your pit strategy: WIP limits, burnout thresholds, and stall detection timing. Every team is different.', position: 'bottom-left' }
]

const TourContext = createContext<any>(null)

function TourProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(true)
  useEffect(() => { const completed = localStorage.getItem(STORAGE_KEY); if (!completed) { setHasCompleted(false); const timer = setTimeout(() => { setIsActive(true) }, 1500); return () => clearTimeout(timer) } }, [])
  const startTour = useCallback(() => { setCurrentStep(0); setIsActive(true) }, [])
  const nextStep = useCallback(() => { if (currentStep < TOUR_STEPS.length - 1) setCurrentStep(prev => prev + 1); else completeTour() }, [currentStep])
  const prevStep = useCallback(() => { if (currentStep > 0) setCurrentStep(prev => prev - 1) }, [currentStep])
  const skipTour = useCallback(() => { completeTour() }, [])
  const completeTour = useCallback(() => { setIsActive(false); setHasCompleted(true); localStorage.setItem(STORAGE_KEY, 'true') }, [])
  const resetTour = useCallback(() => { localStorage.removeItem(STORAGE_KEY); setHasCompleted(false); setCurrentStep(0); setIsActive(true) }, [])
  const value = { isActive, currentStep, totalSteps: TOUR_STEPS.length, currentStepData: TOUR_STEPS[currentStep], hasCompleted, steps: TOUR_STEPS, startTour, nextStep, prevStep, skipTour, resetTour }
  return (<TourContext.Provider value={value}>{children}</TourContext.Provider>)
}

function useTour() { const context = useContext(TourContext); if (!context) throw new Error('useTour must be used within a TourProvider'); return context }

export { TourProvider, useTour, TOUR_STEPS }
