import api, { route } from '@forge/api'
import { mockActionResult } from './mocks'
import { discoverCustomFields } from './telemetryUtils'
const PLATFORM = process.env.PLATFORM || 'atlassian'

export async function splitTicket({ issueKey, subtasks }: { issueKey: string; subtasks?: Array<{ summary: string }> }) {
  if (PLATFORM === 'local') { return mockActionResult('split') }
  const parentIssue = await getIssue(issueKey)
  const projectKey = parentIssue.fields.project.key
  const tasksToCreate = subtasks || [
    { summary: `[Spike] Research and clarify requirements for ${issueKey}` },
    { summary: `[Implementation] Core functionality for ${issueKey}` },
    { summary: `[Testing] Write tests for ${issueKey}` }
  ]
  const createdSubtasks: string[] = []
  for (const task of tasksToCreate) {
    const response = await api.asUser().requestJira(route`/rest/api/3/issue`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { project: { key: projectKey }, parent: { key: issueKey }, summary: task.summary, issuetype: { name: 'Sub-task' }, assignee: parentIssue.fields.assignee } }) })
    if (response.ok) { const created = await response.json(); createdSubtasks.push(created.key) }
  }
  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: THE UNDERCUT*\n\nRace Engineer split this ticket into ${createdSubtasks.length} subtasks for faster sector times:\n${createdSubtasks.map(k => `• ${k}`).join('\n')}\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: `Split into ${createdSubtasks.length} subtasks`, subtasks: createdSubtasks }
}

export async function reassignTicket({ issueKey, newAssignee }: { issueKey: string; newAssignee: string }) {
  if (PLATFORM === 'local') { return mockActionResult('reassign') }
  const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, { method: 'PUT', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { assignee: { accountId: newAssignee } } }) })
  if (!response.ok) throw new Error(`Failed to reassign: ${response.status}`)
  const userResponse = await api.asUser().requestJira(route`/rest/api/3/user?accountId=${newAssignee}`, { headers: { Accept: 'application/json' } })
  const user = await userResponse.json()
  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: TEAM ORDERS*\n\nRace Engineer has reassigned this ticket to *${user.displayName}* for faster lap times.\n\n_"Copy, understood. New driver on track."_\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: `Reassigned to ${user.displayName}` }
}

export async function deferTicket({ issueKey }: { issueKey: string }) {
  if (PLATFORM === 'local') { return mockActionResult('defer') }

  // 1. Try to transition to "Backlog" or "To Do" status
  const transitionsResponse = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, { headers: { Accept: 'application/json' } })
  const transitionsData = await transitionsResponse.json()
  const list = (transitionsData?.transitions || [])
  const backlogTransition = list.find((t: any) => (t?.to?.statusCategory?.key || '').toLowerCase() === 'new') || list.find((t: any) => t.name?.toLowerCase?.().includes('backlog') || t.name?.toLowerCase?.().includes('to do'))

  if (backlogTransition) {
    await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ transition: { id: backlogTransition.id } }) })
  }

  // 2. Remove from active sprint (Clear Sprint Field)
  try {
    const fieldsCache = await discoverCustomFields()
    const sprintField = fieldsCache.sprint
    if (sprintField) {
      await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { [sprintField]: null } })
      })
    }
  } catch (e) { console.warn('Failed to clear sprint field:', e) }

  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: RETIRE CAR*\n\nRace Engineer has moved this ticket to the backlog to save resources for next sprint.\n\n_"Box confirmed. Saving the engine for the next race."_\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: 'Moved to backlog' }
}

// ============ NEW ACTIONS ============

/** BLUE FLAG - Change priority */
export async function changePriority({ issueKey, priority }: { issueKey: string; priority: string }) {
  if (PLATFORM === 'local') { return mockActionResult('priority') }
  const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { priority: { name: priority } } })
  })
  if (!response.ok) throw new Error(`Failed to change priority: ${response.status}`)
  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: BLUE FLAG*\n\nPriority escalated to *${priority}*. Clear the track!\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: `Priority changed to ${priority}` }
}

/** PUSH TO LIMIT - Transition to next status */
export async function transitionIssue({ issueKey, transitionId, transitionName }: { issueKey: string; transitionId?: string; transitionName?: string }) {
  if (PLATFORM === 'local') { return mockActionResult('transition') }
  const transitionsResponse = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, { headers: { Accept: 'application/json' } })
  const transitionsData = await transitionsResponse.json()
  const list = (transitionsData?.transitions || [])
  let target = transitionId ? list.find((t: any) => t.id === transitionId) : list.find((t: any) => t.name?.toLowerCase() === (transitionName || '').toLowerCase())
  if (!target && list.length > 0) target = list[0] // Default to first available
  if (!target) throw new Error('No available transitions')
  await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/transitions`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ transition: { id: target.id } }) })
  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: PUSH TO THE LIMIT*\n\nTransitioned to *${target.name}*. Full throttle!\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: `Transitioned to ${target.name}` }
}

/** RED FLAG - Add blocker flag */
export async function addBlockerFlag({ issueKey, reason }: { issueKey: string; reason?: string }) {
  if (PLATFORM === 'local') { return mockActionResult('blocker') }

  // 1. Add 'blocked' label
  const issue = await getIssue(issueKey)
  const existingLabels = issue.fields.labels || []
  if (!existingLabels.includes('blocked')) {
    await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: 'PUT',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { labels: [...existingLabels, 'blocked'] } })
    })
  }

  // 2. Set "Flagged" field to "Impediment" if available
  try {
    const fields = await discoverCustomFields()
    if (fields.flagged) {
      await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { [fields.flagged]: [{ value: 'Impediment' }] } })
      })
    }
  } catch (e) {
    console.warn('Failed to set Flagged field (Impediment option may not exist):', e)
    // Continue - non-fatal
  }

  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: RED FLAG*\n\n⚠️ This issue is now FLAGGED as blocked.\nReason: ${reason || 'Awaiting resolution'}\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: 'Issue flagged as blocked' }
}

/** SLIPSTREAM - Link issues */
export async function linkIssues({ issueKey, linkedIssueKey, linkType }: { issueKey: string; linkedIssueKey: string; linkType?: string }) {
  if (PLATFORM === 'local') { return mockActionResult('link') }
  const type = linkType || 'Relates'
  await api.asUser().requestJira(route`/rest/api/3/issueLink`, {
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

/** FUEL ADJUSTMENT - Update estimate */
export async function updateEstimate({ issueKey, storyPoints, timeEstimate }: { issueKey: string; storyPoints?: number; timeEstimate?: string }) {
  if (PLATFORM === 'local') { return mockActionResult('estimate') }

  const fields: any = {}

  // Dynamic Story Points Field
  if (storyPoints !== undefined) {
    const fieldsCache = await discoverCustomFields()
    const spField = fieldsCache.storyPoints || 'customfield_10016'
    fields[spField] = storyPoints
  }

  if (timeEstimate) fields.timeoriginalestimate = timeEstimate

  await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  })
  await addComment(issueKey, `🏎️ *PIT WALL STRATEGY: FUEL ADJUSTMENT*\n\nEstimate updated. ${storyPoints ? `Story Points: ${storyPoints}` : ''} ${timeEstimate ? `Time: ${timeEstimate}` : ''}\n\n_Strategy executed via Pit Wall Strategist_`)
  return { success: true, message: 'Estimate updated' }
}

/** RADIO MESSAGE - Add strategic comment */
export async function addRadioMessage({ issueKey, message }: { issueKey: string; message: string }) {
  if (PLATFORM === 'local') { return mockActionResult('radio') }
  await addComment(issueKey, `🏎️ *PIT WALL RADIO*\n\n${message}\n\n_Transmitted via Pit Wall Strategist_`)
  return { success: true, message: 'Radio message sent' }
}

/** PIT CREW TASK - Create specific subtask */
export async function createSubtask({ issueKey, summary, assignee }: { issueKey: string; summary: string; assignee?: string }) {
  if (PLATFORM === 'local') { return mockActionResult('subtask') }
  const parentIssue = await getIssue(issueKey)
  const projectKey = parentIssue.fields.project.key
  const fields: any = {
    project: { key: projectKey },
    parent: { key: issueKey },
    summary: summary,
    issuetype: { name: 'Sub-task' }
  }
  if (assignee) fields.assignee = { accountId: assignee }
  const response = await api.asUser().requestJira(route`/rest/api/3/issue`, {
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

async function getIssue(issueKey: string) { const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, { headers: { Accept: 'application/json' } }); if (!response.ok) throw new Error(`Failed to get issue: ${response.status}`); return response.json() }
async function addComment(issueKey: string, body: string) { await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}/comment`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: body }] }] } }) }) }
async function removeFromSprint(issueKey: string) { const issue = await getIssue(issueKey); const sprintField = issue?.fields?.customfield_10020; if (sprintField && sprintField.length > 0) { const sprintId = sprintField[0]?.id; if (sprintId) { await api.asUser().requestJira(route`/rest/agile/1.0/sprint/${sprintId}/issue`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ issues: [issueKey] }) }) } } }

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

