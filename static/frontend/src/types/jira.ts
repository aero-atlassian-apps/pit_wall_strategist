export type StatusCategoryKey = 'new' | 'indeterminate' | 'done' | string

export interface JiraUser { displayName?: string; accountId?: string }
export interface JiraPriority { name?: string }
export interface JiraStatusCategory { key?: StatusCategoryKey }
export interface JiraStatus { name?: string; statusCategory?: JiraStatusCategory }
export interface JiraIssueFields {
  summary?: string
  assignee?: JiraUser | null
  updated?: string
  created?: string
  resolutiondate?: string | null
  priority?: JiraPriority | null
  labels?: string[]
  status?: JiraStatus
  issuetype?: { name?: string }
  customfield_10020?: any
}
export interface JiraIssue { key: string; fields: JiraIssueFields; changelog?: { histories?: Array<{ created?: string; items?: Array<{ field?: string; fromString?: string; toString?: string }> }> } }
export interface JiraSearchResult { issues?: JiraIssue[]; total?: number }
