export type MockIssue = { key: string; summary?: string; status: string; statusCategory: 'new' | 'indeterminate' | 'done' | string; assignee: string; isStalled?: boolean }

export function getMockIssues(): MockIssue[] {
  return [
    { key: 'TICKET-420', summary: 'Setup Auth Flow', status: 'Done', statusCategory: 'done', assignee: 'Mike', isStalled: false },
    { key: 'TICKET-421', summary: 'Create User Model', status: 'In Progress', statusCategory: 'indeterminate', assignee: 'Jess', isStalled: false },
    { key: 'TICKET-422', summary: 'Implement OAuth2 Backend', status: 'In Progress', statusCategory: 'indeterminate', assignee: 'Sarah', isStalled: true },
    { key: 'TICKET-423', summary: 'Design Dashboard UI', status: 'To Do', statusCategory: 'new', assignee: 'Mike', isStalled: false },
    { key: 'TICKET-424', summary: 'Write API Tests', status: 'In Review', statusCategory: 'indeterminate', assignee: 'Sarah', isStalled: false }
  ]
}
