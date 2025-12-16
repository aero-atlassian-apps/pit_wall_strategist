type FetchStatus = { endpoint: string; ok: boolean; status?: number; note?: string }
const MAX = 25
let buffer: FetchStatus[] = []

export function recordFetchStatus(s: FetchStatus) {
  buffer.push({ endpoint: s.endpoint, ok: s.ok, status: s.status, note: s.note })
  if (buffer.length > MAX) buffer = buffer.slice(-MAX)
}

export function getFetchStatuses() {
  return buffer.slice(-MAX)
}

export function clearFetchStatuses() {
  buffer = []
}
