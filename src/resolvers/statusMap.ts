import api, { route, storage } from '@forge/api'

type StatusEntry = { id: string; name: string; category: 'new' | 'indeterminate' | 'done' }
type StatusBucket = { byId: Record<string, StatusEntry>; byName: Record<string, StatusEntry> }
type StatusMap = { byId: Record<string, StatusEntry>; byName: Record<string, StatusEntry>; byIssueType: Record<string, StatusBucket>; fetchedAt: number }

const CACHE_TTL_MS = 60 * 60 * 1000

function normalizeName(name?: string) { return (name || '').trim().toLowerCase() }

export async function getProjectStatusMap(projectKey: string): Promise<StatusMap> {
  const cacheKey = `statusMap:${projectKey}`
  try {
    const cached = await storage.get(cacheKey) as StatusMap | null
    if (cached && Date.now() - (cached.fetchedAt || 0) < CACHE_TTL_MS) return cached
  } catch {}

  let entries: StatusEntry[] = []
  let perType: Record<string, StatusBucket> = {}
  try {
    const resp = await api.asApp().requestJira(route`/rest/api/3/project/${projectKey}/statuses`, { headers: { Accept: 'application/json' } })
    if (resp.ok) {
      const data = await resp.json()
      const seen = new Map<string, StatusEntry>()
      for (const it of (data || [])) {
        const typeName = normalizeName(it.name)
        if (!perType[typeName]) perType[typeName] = { byId: {}, byName: {} }
        for (const status of (it.statuses || [])) {
          const cat = (status.statusCategory?.key || '').toLowerCase()
          const entry: StatusEntry = { id: String(status.id), name: status.name, category: cat === 'done' ? 'done' : cat === 'new' ? 'new' : 'indeterminate' }
          if (!seen.has(entry.id)) seen.set(entry.id, entry)
          perType[typeName].byId[entry.id] = entry
          const key = normalizeName(entry.name)
          if (!perType[typeName].byName[key]) perType[typeName].byName[key] = entry
        }
      }
      entries = Array.from(seen.values())
    }
  } catch {}

  if (!entries.length) {
    try {
      const resp = await api.asApp().requestJira(route`/rest/api/3/status`, { headers: { Accept: 'application/json' } })
      if (resp.ok) {
        const data = await resp.json()
        entries = (data || []).map((s: any) => ({ id: String(s.id), name: s.name, category: ((s.statusCategory?.key || '').toLowerCase() === 'done') ? 'done' : ((s.statusCategory?.key || '').toLowerCase() === 'new') ? 'new' : 'indeterminate' }))
      }
    } catch {}
  }

  // Fallback: no entries → minimal defaults
  if (!entries.length) {
    entries = [
      { id: 'new', name: 'To Do', category: 'new' },
      { id: 'inprogress', name: 'In Progress', category: 'indeterminate' },
      { id: 'done', name: 'Done', category: 'done' }
    ]
  }

  const byId: Record<string, StatusEntry> = {}
  const byName: Record<string, StatusEntry> = {}
  for (const e of entries) {
    byId[e.id] = e
    const key = normalizeName(e.name)
    if (!byName[key]) byName[key] = e
  }
  const map: StatusMap = { byId, byName, byIssueType: perType, fetchedAt: Date.now() }
  try { await storage.set(cacheKey, map) } catch {}
  return map
}

export function resolveCategoryFromName(map: StatusMap | null, name?: string): 'new' | 'indeterminate' | 'done' | undefined {
  if (!map || !name) return undefined
  const found = map.byName[normalizeName(name)]
  return found?.category
}

export function resolveCategoryFromId(map: StatusMap | null, id?: string): 'new' | 'indeterminate' | 'done' | undefined {
  if (!map || !id) return undefined
  const found = map.byId[id]
  return found?.category
}

export function resolveCategoryForIssue(map: StatusMap | null, statusName?: string, issueTypeName?: string): 'new' | 'indeterminate' | 'done' | undefined {
  if (!map || !statusName) return undefined
  const statusKey = normalizeName(statusName)
  const typeKey = normalizeName(issueTypeName)
  const bucket = typeKey ? map.byIssueType[typeKey] : undefined
  const byType = bucket?.byName?.[statusKey]?.category
  if (byType) return byType
  return map.byName[statusKey]?.category
}
