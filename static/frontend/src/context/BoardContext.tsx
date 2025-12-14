import React, { createContext, useContext, useState, useEffect } from 'react'

export type BoardType = 'scrum' | 'kanban' | 'business'

export interface BoardContextType {
  boardType: BoardType
  boardName: string
  sprintName?: string
  sprintStatus?: string
  capabilities: {
    hasSprints: boolean
    hasBacklog: boolean
    hasEstimation: boolean
    hasReports: boolean
  }
  setBoardContext: (data: any) => void
}

const defaultContext: BoardContextType = {
  boardType: 'scrum',
  boardName: 'Board',
  capabilities: {
    hasSprints: true,
    hasBacklog: true,
    hasEstimation: true,
    hasReports: true
  },
  setBoardContext: () => {}
}

const BoardContext = createContext<BoardContextType>(defaultContext)

export const useBoardContext = () => useContext(BoardContext)

export const BoardContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [contextState, setContextState] = useState<Partial<BoardContextType>>({})

  const setBoardContext = (data: any) => {
    // Infer capabilities from data
    const boardType = data.boardType || 'scrum'
    const capabilities = {
        hasSprints: boardType === 'scrum',
        hasBacklog: boardType !== 'business', // Simplistic assumption
        hasEstimation: boardType !== 'business',
        hasReports: true
    }

    setContextState({
        boardType,
        boardName: data.boardName || 'Board',
        sprintName: data.sprintName,
        sprintStatus: data.sprintStatus || data.healthStatus,
        capabilities
    })
  }

  const value = {
      ...defaultContext,
      ...contextState,
      setBoardContext
  }

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  )
}
