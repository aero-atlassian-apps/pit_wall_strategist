export const invoke = async (key: string, payload?: any) => {
  throw new Error('Not in Forge context')
}

// Rovo shim for local development (no-op)
export const rovo = {
  open: async (_options: { type: string; agentKey?: string; prompt?: string }) => {
    console.log('[Rovo Shim] rovo.open() called in non-Forge context - no-op');
  }
}
