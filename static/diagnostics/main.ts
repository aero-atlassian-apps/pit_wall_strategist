type FetchStatus = { endpoint: string; ok: boolean; status?: number }
type Diagnostics = { velocitySource?: string; velocityWindow?: string; cycleTimeWindow?: string; throughputWindow?: string; fetchStatuses?: FetchStatus[]; boardType?: string; sprintName?: string }
type Summary = { success: boolean; summary?: { permissions?: { userBrowse?: boolean; appBrowse?: boolean } } }

function wireTabs(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('.tab')
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'))
    t.classList.add('active')
    const id = t.getAttribute('data-tab') || ''
    const status = document.getElementById('panel-status')
    const metrics = document.getElementById('panel-metrics')
    const permissions = document.getElementById('panel-permissions')
    if (status) status.classList.toggle('hidden', id !== 'status')
    if (metrics) metrics.classList.toggle('hidden', id !== 'metrics')
    if (permissions) permissions.classList.toggle('hidden', id !== 'permissions')
  }))
}

async function load(): Promise<void> {
  try {
    const mod: any = await import('https://esm.sh/@forge/bridge')
    const res: { success?: boolean; diagnostics?: Diagnostics } = await mod.invoke('getTelemetryDiagnostics', {})
    if (!res?.success) return
    const d = res.diagnostics || {}
    const vsrc = document.getElementById('velocitySource')
    const vwin = document.getElementById('velocityWindow')
    const rows = document.getElementById('statusRows')
    if (vsrc) vsrc.textContent = d.velocitySource || '-'
    if (vwin) vwin.textContent = d.velocityWindow || '-'
    const list = (d.fetchStatuses || []).slice(-5).reverse()
    if (rows) rows.innerHTML = list.map(s => `<div class="row-item"><div>${s.endpoint || ''}</div><div>${s.status ?? ''}</div><div class="${s.ok ? 'ok':'err'}">${s.ok ? 'Yes':'No'}</div></div>`).join('')

    const ct = document.getElementById('cycleTimeWindow')
    const th = document.getElementById('throughputWindow')
    const bt = document.getElementById('boardType')
    const sp = document.getElementById('sprintName')
    if (ct) ct.textContent = d.cycleTimeWindow || '-'
    if (th) th.textContent = d.throughputWindow || '-'
    if (bt) bt.textContent = d.boardType || '-'
    if (sp) sp.textContent = d.sprintName || '-'

    const sum: Summary = await mod.invoke('getDiagnosticsSummary', {})
    if (sum?.success) {
      const perms = sum.summary?.permissions || {}
      const pu = document.getElementById('permUser')
      const pa = document.getElementById('permApp')
      if (pu) pu.textContent = perms.userBrowse ? 'Yes' : 'No'
      if (pa) pa.textContent = perms.appBrowse ? 'Yes' : 'No'
    }
  } catch {
    const vsrc = document.getElementById('velocitySource')
    const vwin = document.getElementById('velocityWindow')
    const rows = document.getElementById('statusRows')
    if (vsrc) vsrc.textContent = 'bridge-unavailable'
    if (vwin) vwin.textContent = '-'
    if (rows) rows.innerHTML = ''
  }
}

wireTabs()
load()

