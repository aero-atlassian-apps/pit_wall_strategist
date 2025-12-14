type CacheEntry<T> = { value: T; expiresAt: number }
const memory: Record<string, CacheEntry<any>> = {}

export function cacheGet<T>(key: string): T | undefined {
  const entry = memory[key]
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) { delete memory[key]; return undefined }
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  memory[key] = { value, expiresAt: Date.now() + Math.max(0, ttlMs || 0) }
}

export function cacheInvalidate(prefix?: string) {
  const keys = Object.keys(memory)
  keys.forEach(k => { if (!prefix || k.startsWith(prefix)) delete memory[k] })
}
