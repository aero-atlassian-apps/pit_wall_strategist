declare module '@forge/bridge' {
  export const invoke: (key: string, payload?: any) => Promise<any>
}
