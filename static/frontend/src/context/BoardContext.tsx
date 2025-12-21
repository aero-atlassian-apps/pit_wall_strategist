import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { InternalContext, DEFAULT_CONTEXT, ProjectType, BoardStrategy, AgileCapability, EstimationMode, MetricValidity } from '../types/Context';

export interface BoardContextType {
  // STRICT CONTEXT
  context: InternalContext;

  // METADATA
  boardId?: number;
  boardName: string;
  sprintName?: string;
  sprintStatus?: string;

  // ACTIONS
  setBoardContext: (data: any) => void;
}

const defaultContext: BoardContextType = {
  context: DEFAULT_CONTEXT,
  boardName: 'Board',
  setBoardContext: () => { }
}

const BoardContext = createContext<BoardContextType>(defaultContext)

export const useBoardContext = () => useContext(BoardContext)

export const BoardContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<Partial<BoardContextType>>({})

  const setBoardContext = useCallback((data: any) => {
    // Expecting full context structure from backend
    // If backend sends legacy data, we might need a migration/adapter here, but we strive for clean cut.

    // Check if we received the strict context object
    const incomingContext = data.context || DEFAULT_CONTEXT;

    setState({
      context: incomingContext,
      boardId: data.boardId,
      boardName: data.boardName || 'Board',
      sprintName: data.sprintName,
      sprintStatus: data.sprintStatus || data.healthStatus
    })
  }, [])

  const value = {
    ...defaultContext,
    ...state,
    setBoardContext
  }

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  )
}
