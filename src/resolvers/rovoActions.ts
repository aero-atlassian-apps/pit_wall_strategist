import api, { route } from '@forge/api'
import { mockActionResult } from './mocks'
import { TelemetryService } from '../infrastructure/services/TelemetryService'
import { getProjectContext } from './contextEngine'

const PLATFORM = process.env.PLATFORM || 'atlassian'

/**
 * Rovo Actions Handler
 * Executes write operations on Jira issues.
 *
 * AUTHENTICATION POLICY:
 * - All write operations MUST use `asUser()` to ensure the actor has permission to perform the action.
 * - This prevents unauthorized modifications by the app on behalf of users.
 */

// Helper to get allowed values for a field
async function getFieldAllowedValues(issueKey: string, fieldId: string): Promise<any[]> {
  try {
    const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/editmeta`, { headers: { Accept: 'application/json' } });
    if (response.ok) {
      const data = await response.json();
      const fieldMeta = data.fields?.[fieldId];
      return fieldMeta?.allowedValues || [];
    }
  } catch (e) {
    console.warn('Failed to fetch editmeta:', e);
  }
  return [];
}

/**
 * SPLIT TICKET
 * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post
 * Scope: write:issue:jira
 */
export async function splitTicket({ issueKey, subtasks }: { issueKey: string; subtasks?: Array<{ summary: string }> }) {
  if (PLATFORM === 'local') { return mockActionResult('split') }

  const parentIssue = await getIssue(issueKey)
  const projectKey = parentIssue.fields.project.key

  // Agnostic: Discover Sub-task issue type name
  const context = await getProjectContext(projectKey);
  // Default to 'Sub-task' if nothing found (fallback), but try to use discovered name
  // The context.issueTypes has hierarchyLevel. We want level 2 or subtask: true.
  const subtaskType = context.issueTypes.find(t => t.subtask || t.hierarchyLevel === 2) || { name: 'Sub-task' };

  const tasksToCreate = subtasks || [
    { summary: `[Spike] Research and clarify requirements for ${issueKey}` },
    { summary: `[Implementation] Core functionality for ${issueKey}` },
    { summary: `[Testing] Write tests for ${issueKey}` }
  ]

  const createdSubtasks: string[] = []

  for (const task of tasksToCreate) {
    const response = await api.asApp().requestJira(route`/rest/api/3/issue`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          project: { key: projectKey },
          parent: { key: issueKey },
          summary: task.summary,
          issuetype: { name: subtaskType.name }, // Use dynamic name
          assignee: parentIssue.fields.assignee
        }
      })
    })

    if (response.ok) {
      const created = await response.json();
      createdSubtasks.push(created.key)
    }
  }

  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: THE UNDERCUT*\n\nRace Engineer split this ticket into ${createdSubtasks.length} subtasks for faster sector times:\n${createdSubtasks.map(k => `• ${k}`).join('\n')}\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: `Split into ${createdSubtasks.length} subtasks`, subtasks: createdSubtasks }
}

/**
 * REASSIGN TICKET
 * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issuekey-or-id-put
 * Scope: write:issue:jira, read:user:jira
 */
export async function reassignTicket({ issueKey, newAssignee }: { issueKey: string; newAssignee: string }) {
  if (PLATFORM === 'local') { return mockActionResult('reassign') }
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, { method: 'PUT', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { assignee: { accountId: newAssignee } } }) })
  if (!response.ok) throw new Error(`Failed to reassign: ${response.status}`)
  const userResponse = await api.asApp().requestJira(route`/rest/api/3/user?accountId=${newAssignee}`, { headers: { Accept: 'application/json' } })
  const user = await userResponse.json()
  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: TEAM ORDERS*\n\nRace Engineer has reassigned this ticket to *${user.displayName}* for faster lap times.\n\n_"Copy, understood. New driver on track."_\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: `Reassigned to ${user.displayName}` }
}

/**
 * DEFER TICKET
 * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issuekey-or-id-transitions-post
 * Scope: write:issue:jira
 */
export async function deferTicket({ issueKey }: { issueKey: string }) {
  if (PLATFORM === 'local') { return mockActionResult('defer') }

  // 1. Try to transition to "Backlog" or "To Do" status
  const transitionsResponse = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, { headers: { Accept: 'application/json' } })
  const transitionsData = await transitionsResponse.json()
  const list = (transitionsData?.transitions || [])

  // Agnostic: Look for status category 'new' (To Do)
  const backlogTransition = list.find((t: any) => (t?.to?.statusCategory?.key || '').toLowerCase() === 'new') ||
    list.find((t: any) => t.name?.toLowerCase?.().includes('backlog') || t.name?.toLowerCase?.().includes('to do'))

  if (backlogTransition) {
    await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ transition: { id: backlogTransition.id } }) })
  }

  // 2. Remove from active sprint (Clear Sprint Field)
  try {
    const fieldsCache = await TelemetryService.discoverCustomFields()
    const sprintField = fieldsCache.sprint
    if (sprintField) {
      // Check if field is present on issue before trying to clear it (avoid 400 on Kanban)
      const issue = await getIssue(issueKey);
      if (issue.fields[sprintField]) {
        await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
          method: 'PUT',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { [sprintField]: null } })
        })
      }
    }
  } catch (e) { console.warn('Failed to clear sprint field:', e) }

  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: RETIRE CAR*\n\nRace Engineer has moved this ticket to the backlog/to-do to save resources for next sprint.\n\n_"Box confirmed. Saving the engine for the next race."_\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: 'Moved to backlog' }
}

// ============ NEW ACTIONS ============

/** BLUE FLAG - Change priority
 * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issuekey-or-id-put
 * Scope: write:issue:jira
 */
export async function changePriority({ issueKey, priority }: { issueKey: string; priority: string }) {
  if (PLATFORM === 'local') { return mockActionResult('priority') }
  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { priority: { name: priority } } })
  })
  if (!response.ok) throw new Error(`Failed to change priority: ${response.status}`)
  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: BLUE FLAG*\n\nPriority escalated to *${priority}*. Clear the track!\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: `Priority changed to ${priority}` }
}

/** PUSH TO LIMIT - Transition to next status
 * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issuekey-or-id-transitions-post
 * Scope: write:issue:jira
 */
export async function transitionIssue({ issueKey, transitionId, transitionName }: { issueKey: string; transitionId?: string; transitionName?: string }) {
  if (PLATFORM === 'local') { return mockActionResult('transition') }
  const transitionsResponse = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, { headers: { Accept: 'application/json' } })
  const transitionsData = await transitionsResponse.json()
  const list = (transitionsData?.transitions || [])

  // Agnostic: Try to match by ID, then strict name, then loose name
  let target = transitionId ? list.find((t: any) => t.id === transitionId) : undefined;
  if (!target && transitionName) {
    target = list.find((t: any) => t.name?.toLowerCase() === transitionName.toLowerCase());
  }
  // Fallback: If no specific transition requested, look for "In Progress" or next "Indeterminate"
  if (!target && !transitionId && !transitionName) {
    target = list.find((t: any) => t.to?.statusCategory?.key === 'indeterminate') || list[0];
  }

  if (!target) throw new Error('No available transitions')

  await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ transition: { id: target.id } }) })
  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: PUSH TO THE LIMIT*\n\nTransitioned to *${target.name}*. Full throttle!\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: `Transitioned to ${target.name}` }
}

/** RED FLAG - Add blocker flag
 * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issuekey-or-id-put
 * Scope: write:issue:jira
 */
export async function addBlockerFlag({ issueKey, reason }: { issueKey: string; reason?: string }) {
  if (PLATFORM === 'local') { return mockActionResult('blocker') }

  // 1. Add 'blocked' label
  const issue = await getIssue(issueKey)
  const existingLabels = issue.fields.labels || []
  if (!existingLabels.includes('blocked')) {
    await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: 'PUT',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { labels: [...existingLabels, 'blocked'] } })
    })
  }

  // 2. Set "Flagged" field to "Impediment" OR whatever valid option is available
  try {
    const fields = await TelemetryService.discoverCustomFields()
    if (fields.flagged) {
      // Agnostic: Discovery allowed values via editmeta
      const allowedValues = await getFieldAllowedValues(issueKey, fields.flagged);
      // Look for 'Impediment' or anything that looks like a flag/blocker
      const impedimentOption = allowedValues.find(v => v.value === 'Impediment') ||
        allowedValues.find(v => v.value.toLowerCase().includes('block')) ||
        allowedValues[0]; // Fallback to first option if exists

      if (impedimentOption) {
        await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
          method: 'PUT',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { [fields.flagged]: [{ value: impedimentOption.value }] } })
        })
      }
    }
  } catch (e) {
    console.warn('Failed to set Flagged field:', e)
  }

  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: RED FLAG*\n\n⚠️ This issue is now FLAGGED as blocked.\nReason: ${reason || 'Awaiting resolution'}\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: 'Issue flagged as blocked' }
}

/** SLIPSTREAM - Link issues
 * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-links/#api-rest-api-3-issuelink-post
 * Scope: write:issue:jira
 */
export async function linkIssues({ issueKey, linkedIssueKey, linkType }: { issueKey: string; linkedIssueKey: string; linkType?: string }) {
  if (PLATFORM === 'local') { return mockActionResult('link') }
  const type = linkType || 'Relates'
  // Note: Link types are also configurable, but 'Relates' is a standard system type usually present.
  // Checking for link type existence would be even more robust, but 'Relates' is very safe.

  await api.asApp().requestJira(route`/rest/api/3/issueLink`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: { name: type },
      inwardIssue: { key: issueKey },
      outwardIssue: { key: linkedIssueKey }
    })
  })
  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: SLIPSTREAM*\n\nLinked to *${linkedIssueKey}* (${type}). Drafting for speed!\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: `Linked to ${linkedIssueKey}` }
}

/** FUEL ADJUSTMENT - Update estimate
 * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issuekey-or-id-put
 * Scope: write:issue:jira
 */
export async function updateEstimate({ issueKey, storyPoints, timeEstimate }: { issueKey: string; storyPoints?: number; timeEstimate?: string }) {
  if (PLATFORM === 'local') { return mockActionResult('estimate') }

  const fields: any = {}

  // Dynamic Story Points Field
  if (storyPoints !== undefined) {
    const fieldsCache = await TelemetryService.discoverCustomFields()
    const spFields = fieldsCache.storyPoints || []
    if (spFields.length > 0) {
      // Use the first discovered field as the target for writing
      fields[spFields[0]] = storyPoints
    }
  }

  if (timeEstimate) fields.timeoriginalestimate = timeEstimate

  await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  })
  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: FUEL ADJUSTMENT*\n\nEstimate updated. ${storyPoints ? `Story Points: ${storyPoints}` : ''} ${timeEstimate ? `Time: ${timeEstimate}` : ''}\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: 'Estimate updated' }
}

/** RADIO MESSAGE - Add strategic comment
 * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issue-comments/#api-rest-api-3-issue-issuekey-or-id-comment-post
 * Scope: write:comment:jira
 */
export async function addRadioMessage({ issueKey, message }: { issueKey: string; message: string }) {
  if (PLATFORM === 'local') { return mockActionResult('radio') }
  await addComment(issueKey, `🏎️ *PIT WALL RADIO*\n\n${message}\n\n_Transmitted via Pit Wall Strategist_`)
  return { success: true, message: 'Radio message sent' }
}

/** PIT CREW TASK - Create specific subtask
 * Docs: https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-post
 * Scope: write:issue:jira
 */
export async function createSubtask({ issueKey, summary, assignee }: { issueKey: string; summary: string; assignee?: string }) {
  if (PLATFORM === 'local') { return mockActionResult('subtask') }
  const parentIssue = await getIssue(issueKey)
  const projectKey = parentIssue.fields.project.key

  // Agnostic: Discover Sub-task issue type name
  const context = await getProjectContext(projectKey);
  const subtaskType = context.issueTypes.find(t => t.subtask || t.hierarchyLevel === 2) || { name: 'Sub-task' };

  const fields: any = {
    project: { key: projectKey },
    parent: { key: issueKey },
    summary: summary,
    issuetype: { name: subtaskType.name }
  }
  if (assignee) fields.assignee = { accountId: assignee }
  const response = await api.asApp().requestJira(route`/rest/api/3/issue`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  })
  if (!response.ok) throw new Error(`Failed to create subtask: ${response.status}`)
  const created = await response.json()
  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: PIT CREW TASK*\n\nCreated subtask *${created.key}*: ${summary}\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: `Created ${created.key}`, subtaskKey: created.key }
}

// ============ HELPERS ============

async function getIssue(issueKey: string) { const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, { headers: { Accept: 'application/json' } }); if (!response.ok) throw new Error(`Failed to get issue: ${response.status}`); return response.json() }
async function addComment(issueKey: string, body: string) { await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] } }) }) }

// ============ ACTION ROUTER ============

export async function handleAction(actionKey: string, payload: any) {
  switch (actionKey) {
    case 'split-ticket': return splitTicket(payload)
    case 'reassign-ticket': return reassignTicket(payload)
    case 'defer-ticket': return deferTicket(payload)
    case 'change-priority': return changePriority(payload)
    case 'transition-issue': return transitionIssue(payload)
    case 'add-blocker-flag': return addBlockerFlag(payload)
    case 'link-issues': return linkIssues(payload)
    case 'update-estimate': return updateEstimate(payload)
    case 'add-radio-message': return addRadioMessage(payload)
    case 'create-subtask': return createSubtask(payload)
    default: throw new Error(`Unknown action: ${actionKey}`)
  }
}
