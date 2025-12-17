import api, { route } from '@forge/api'
import type { JiraIssue } from '../../types/jira'

export class IssueSearchService {
  private readonly batchSize: number
  private readonly maxRetries: number

  constructor(batchSize = 100, maxRetries = 3) {
    this.batchSize = batchSize
    this.maxRetries = maxRetries
  }

  async search(jql: string, fields: string[], expandBlockage = false): Promise<{ ok: boolean, issues: JiraIssue[] }> {
    const requestedFields = expandBlockage ? [...fields, 'issuelinks'] : fields
    const issues = await this.fetchAllPagesWithTokenPagination(jql, requestedFields)
    return { ok: true, issues: expandBlockage ? this.processIssueLinks(issues) : issues }
  }

  async singleIssueSearch(issueKey: string, fields: string[], expandBlockage = false): Promise<any> {
    const requestedFields = expandBlockage && !fields.includes('issuelinks') ? [...fields, 'issuelinks'] : fields
    const queryString = `fields=${requestedFields.join(',')}&fieldsByKeys=true&expand=renderedFields`
    const resp = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}?${queryString}`, { method: 'GET', headers: { 'Accept': 'application/json' } })
    if (!resp.ok) throw new Error(`Failed to fetch issue ${issueKey}: ${resp.status} ${resp.statusText}`)
    const issue = await resp.json()
    return expandBlockage ? this.processSingleIssueLinks(issue) : issue
  }

  private async fetchIssues(jql: string, fields: string[], maxResults: number, nextPageToken?: string): Promise<any> {
    const body: any = { jql: this.ensureBoundedJQL(jql), maxResults }
    if (fields && fields.length) body.fields = fields
    if (nextPageToken) body.nextPageToken = nextPageToken

    // Try asApp first
    let resp = await api.asApp().requestJira(route`/rest/api/3/search/jql`, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!resp.ok && (resp.status === 401 || resp.status === 403)) {
      // Fallback to asUser once for consent-based or permission-based access
      resp = await api.asUser().requestJira(route`/rest/api/3/search/jql`, { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    if (!resp.ok) {
      if (resp.status === 404) return { issues: [], nextPageToken: undefined }
      throw new Error(`Failed to fetch issues: ${resp.status} ${resp.statusText}`)
    }
    return await resp.json()
  }

  private ensureBoundedJQL(jql: string): string {
    if (!jql || jql.trim() === '') return 'created >= "2000/01/01"'
    const keywords = ['project', 'created', 'updated', 'key', 'filter', 'assignee', 'status', 'issuetype']
    const hasBound = keywords.some(k => jql.toLowerCase().includes(k))
    return hasBound ? jql : `(${jql}) AND created >= "2000/01/01"`
  }

  private async fetchAllPagesWithTokenPagination(jql: string, fields: string[]): Promise<JiraIssue[]> {
    const results: JiraIssue[] = []
    let nextPageToken: string | undefined = undefined
    let pageCount = 0
    const maxPages = 1000
    const isLocal = (process.env.PLATFORM || '').toLowerCase() === 'local'
    const maxRetries = isLocal ? 0 : this.maxRetries

    do {
      let retry = 0
      let success = false
      while (retry <= maxRetries && !success) {
        try {
          const data: { issues?: JiraIssue[]; nextPageToken?: string } = await this.fetchIssues(jql, fields, this.batchSize, nextPageToken)
          const issues: JiraIssue[] = data.issues || []
          if (issues.length) results.push(...issues)
          nextPageToken = data.nextPageToken
          success = true
          pageCount++
          if (pageCount >= maxPages) return results
        } catch (e) {
          retry++
          if (retry > maxRetries) throw e
          const delay = Math.min(500 * Math.pow(2, retry - 1), 3000)
          await new Promise(r => setTimeout(r, delay))
        }
      }
    } while (nextPageToken)

    return results
  }

  private processIssueLinks(issues: any[]): any[] {
    return issues.map(issue => {
      const links = issue.fields?.issuelinks || []
      const blockedBy: any[] = []
      const blocks: any[] = []
      for (const link of links) {
        if (link.type?.name === 'Blocks' && link.outwardIssue) {
          blocks.push({ key: link.outwardIssue.key, status: link.outwardIssue.fields?.status?.name, statusCategoryColor: link.outwardIssue.fields?.status?.statusCategory?.colorName })
        } else if (link.type?.name === 'Blocks' && link.inwardIssue) {
          blockedBy.push({ key: link.inwardIssue.key, status: link.inwardIssue.fields?.status?.name, statusCategoryColor: link.inwardIssue.fields?.status?.statusCategory?.colorName })
        }
      }
      return { ...issue, fields: { ...issue.fields, blockedBy: { count: blockedBy.length, issues: blockedBy }, blocks: { count: blocks.length, issues: blocks } } }
    })
  }

  private processSingleIssueLinks(issue: any): any {
    const links = issue.fields?.issuelinks || []
    const blockedBy: any[] = []
    const blocks: any[] = []
    for (const link of links) {
      if (link.type?.name === 'Blocks' && link.outwardIssue) {
        blocks.push({ key: link.outwardIssue.key, status: link.outwardIssue.fields?.status?.name, statusCategoryColor: link.outwardIssue.fields?.status?.statusCategory?.colorName })
      } else if (link.type?.name === 'Blocks' && link.inwardIssue) {
        blockedBy.push({ key: link.inwardIssue.key, status: link.inwardIssue.fields?.status?.name, statusCategoryColor: link.inwardIssue.fields?.status?.statusCategory?.colorName })
      }
    }
    return { ...issue, fields: { ...issue.fields, blockedBy: { count: blockedBy.length, issues: blockedBy }, blocks: { count: blocks.length, issues: blocks } } }
  }
}

export const issueSearchService = new IssueSearchService()
