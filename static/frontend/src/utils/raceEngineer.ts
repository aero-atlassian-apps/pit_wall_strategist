const KEYWORDS = { dependency: ['wait', 'waiting', 'blocked', 'dependency', 'api', 'backend', 'frontend', '3rd party', 'vendor'], scope: ['scope', 'creep', 'large', 'big', 'complex', 'hard', 'difficult', 'unknown', 'ac', 'acceptance'], skill: ['help', 'stuck', 'unfamiliar', 'new', 'junior', 'senior', 'guide', 'pair'], technical: ['fail', 'error', 'bug', 'crash', 'exception', 'timeout', 'latency', 'slow'] }

export function analyzeTicket(ticket: any) {
  if (!ticket) return getDefaultAnalysis()
  const summary = (ticket.summary || '').toLowerCase()
  const comments = (ticket.latestComment || '').toLowerCase()
  const text = `${summary} ${comments}`
  if (hasKeywords(text, KEYWORDS.dependency)) return { message: 'Telemetry indicates high drag from external components. We are losing time in the dirty air.', recommendation: 'split', reason: 'External Dependency Detected' }
  if (hasKeywords(text, KEYWORDS.scope)) return { message: 'Car is too heavy. Fuel load is exceeding race parameters. We need to shed weight.', recommendation: 'split', reason: 'Scope Complexity Detected' }
  if (hasKeywords(text, KEYWORDS.skill)) return { message: 'Driver is reporting handling issues in Sector 2. Pace is dropping.', recommendation: 'reassign', reason: 'Knowledge Gap Detected' }
  if (hasKeywords(text, KEYWORDS.technical)) return { message: 'Critical mechanical failure detected. Engine telemetry is erratic.', recommendation: 'defer', reason: 'Technical Blocker' }
  return { message: 'Pace has dropped below delta. Tires are gone. We need a fresh set of options.', recommendation: 'reassign', reason: 'Stalled Progress' }
}

function hasKeywords(text: string, keywords: string[]) { return keywords.some(word => text.includes(word)) }
function getDefaultAnalysis() { return { message: 'Analysis complete. Sector 2 yellow flag.', recommendation: null, reason: 'General Caution' } }
export const STRATEGIES = { split: { title: 'The Undercut', subtitle: 'Split Ticket', icon: '⚡', desc: 'Break down the issue to bypass the blocker.' }, reassign: { title: 'Team Orders', subtitle: 'Reassign', icon: '🏎️', desc: 'Swap drivers to regain pace.' }, defer: { title: 'Retire Car', subtitle: 'Defer to Backlog', icon: '🏳️', desc: 'Box the car. Fix it later.' } }
