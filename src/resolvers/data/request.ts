import api from '@forge/api'

export async function requestJiraWithRetry(url: string, options: any, maxRetries = 3): Promise<Response> {
  let attempt = 0
  let lastErr: any
  while (attempt <= maxRetries) {
    try {
      const resp = await api.asApp().requestJira(url, options)
      if (resp.ok || (resp.status >= 400 && resp.status < 500)) return resp
      // retry only server/transient errors
    } catch (e) {
      lastErr = e
    }
    attempt++
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000)
    await new Promise(r => setTimeout(r, delay))
  }
  if (lastErr) throw lastErr
  // final request without catch to surface error
  return await api.asApp().requestJira(url, options)
}
