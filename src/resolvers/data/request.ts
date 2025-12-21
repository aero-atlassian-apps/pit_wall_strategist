import api, { route } from '@forge/api'

/**
 * Makes a Jira API request with automatic retry and exponential backoff for transient errors.
 * @param url - The Jira REST API path (e.g., '/rest/api/3/issue/PROJ-123')
 * @param options - Request options (method, headers, body)
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns The API response
 */
export async function requestJiraWithRetry(url: string, options: any, maxRetries = 3): Promise<any> {
  let attempt = 0
  let lastErr: any

  while (attempt <= maxRetries) {
    try {
      // Use route template literal for proper Forge API typing
      const resp = await api.asApp().requestJira(route`${url}`, options)
      if (resp.ok || (resp.status >= 400 && resp.status < 500)) return resp
      // retry only server/transient errors (5xx)
    } catch (e) {
      lastErr = e
    }
    attempt++
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000)
    await new Promise(r => setTimeout(r, delay))
  }

  if (lastErr) throw lastErr

  // final request without catch to surface error
  return await api.asApp().requestJira(route`${url}`, options)
}
