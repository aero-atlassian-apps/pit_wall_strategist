import React, { useCallback } from 'react'
import styled from 'styled-components'

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(145deg, #1a1a2e, #16213e);
  border: 1px solid rgba(57, 255, 20, 0.3);
  border-radius: 8px;
  color: #39FF14;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(145deg, #16213e, #1a1a2e);
    border-color: rgba(57, 255, 20, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(57, 255, 20, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
`

const Icon = styled.span`
  font-size: 14px;
`

interface Issue {
    key: string
    summary?: string
    status?: string
    assignee?: string
    priority?: string
    isStalled?: boolean
    fields?: {
        summary?: string
        status?: { name: string }
        assignee?: { displayName: string }
        priority?: { name: string }
    }
}

interface StalledTicket {
    key: string
    summary?: string
    assignee?: string
    hoursSinceUpdate?: number
}

interface StandupExportProps {
    issues: Issue[]
    stalledTickets?: StalledTicket[]
    sprintName?: string
    telemetry?: {
        wipCurrent?: number
        wipLimit?: number
        velocityDelta?: number
        sprintStatus?: string
    }
}

function formatMarkdown(
    issues: Issue[],
    stalledTickets: StalledTicket[],
    sprintName: string,
    telemetry: StandupExportProps['telemetry']
): string {
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

    // Group issues by status
    const byStatus: Record<string, Issue[]> = {}
    for (const issue of issues) {
        const status = issue.status || issue.fields?.status?.name || 'Unknown'
        if (!byStatus[status]) byStatus[status] = []
        byStatus[status].push(issue)
    }

    // Group by assignee for Who's Working on What
    const byAssignee: Record<string, Issue[]> = {}
    for (const issue of issues) {
        const assignee = issue.assignee || issue.fields?.assignee?.displayName || 'Unassigned'
        if (!byAssignee[assignee]) byAssignee[assignee] = []
        byAssignee[assignee].push(issue)
    }

    let md = `# 🏎️ Daily Standup Report\n`
    md += `**${sprintName}** | ${dateStr}\n\n`
    md += `---\n\n`

    // Telemetry Summary
    if (telemetry) {
        const statusEmoji = telemetry.sprintStatus === 'OPTIMAL' ? '🟢' : telemetry.sprintStatus === 'WARNING' ? '🟡' : '🔴'
        md += `## 📊 Race Telemetry\n`
        md += `- **Status:** ${statusEmoji} ${telemetry.sprintStatus || 'Unknown'}\n`
        md += `- **WIP Load:** ${telemetry.wipCurrent || 0} / ${telemetry.wipLimit || 8} (${Math.round(((telemetry.wipCurrent || 0) / (telemetry.wipLimit || 8)) * 100)}%)\n`
        md += `- **Velocity Delta:** ${(telemetry.velocityDelta || 0) >= 0 ? '+' : ''}${telemetry.velocityDelta || 0}%\n`
        md += `\n`
    }

    // Stalled Tickets (Blockers)
    if (stalledTickets.length > 0) {
        md += `## 🚨 Red Flags (Stalled Tickets)\n`
        for (const ticket of stalledTickets) {
            md += `- **${ticket.key}**: ${ticket.summary || 'No summary'}\n`
            md += `  - Assignee: ${ticket.assignee || 'Unassigned'}\n`
            md += `  - Stalled: ${ticket.hoursSinceUpdate || 0}h\n`
        }
        md += `\n`
    }

    // Who's Working on What
    md += `## 👥 Driver Assignments\n`
    for (const [assignee, assigneeIssues] of Object.entries(byAssignee)) {
        const inProgress = assigneeIssues.filter(i => {
            const status = (i.status || i.fields?.status?.name || '').toLowerCase()
            return status.includes('progress') || status.includes('doing') || status.includes('review')
        })
        if (inProgress.length > 0) {
            md += `### ${assignee} (${inProgress.length} active)\n`
            for (const issue of inProgress) {
                const status = issue.status || issue.fields?.status?.name || ''
                md += `- [${issue.key}] ${issue.summary || issue.fields?.summary || ''} *(${status})*\n`
            }
            md += `\n`
        }
    }

    // Quick Stats
    md += `## 📈 Quick Stats\n`
    md += `- **Total Issues:** ${issues.length}\n`
    md += `- **Stalled:** ${stalledTickets.length}\n`
    md += `- **In Progress:** ${Object.values(byStatus).flat().filter(i => {
        const s = (i.status || i.fields?.status?.name || '').toLowerCase()
        return s.includes('progress') || s.includes('doing')
    }).length}\n`
    md += `- **Done:** ${Object.values(byStatus).flat().filter(i => {
        const s = (i.status || i.fields?.status?.name || '').toLowerCase()
        return s.includes('done') || s.includes('complete')
    }).length}\n`

    md += `\n---\n*Generated by Pit Wall Strategist 🏁*\n`

    return md
}

export default function StandupExportButton({
    issues,
    stalledTickets = [],
    sprintName = 'Current Sprint',
    telemetry
}: StandupExportProps) {

    const handleExport = useCallback(() => {
        const markdown = formatMarkdown(issues, stalledTickets, sprintName, telemetry)

        // Copy to clipboard
        navigator.clipboard.writeText(markdown).then(() => {
            alert('📋 Standup summary copied to clipboard!')
        }).catch(() => {
            // Fallback: Download as file
            const blob = new Blob([markdown], { type: 'text/markdown' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `standup-${new Date().toISOString().split('T')[0]}.md`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        })
    }, [issues, stalledTickets, sprintName, telemetry])

    return (
        <Button onClick={handleExport}>
            <Icon>📋</Icon>
            Export Standup
        </Button>
    )
}
