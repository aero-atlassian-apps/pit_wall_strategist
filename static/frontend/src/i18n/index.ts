const dict: Record<string, Record<string, string>> = {
  en: { circuit: 'The Circuit', tickets: 'TICKETS', sectorPrefix: 'Sector:', grid: 'Grid', racing: 'Racing', pitlane: 'Pit Lane', finished: 'Finished', telemetry: 'Telemetry', refreshAll: 'Refresh All', settings: 'Race Configuration', refreshCenter: 'Refresh Center', refreshAllData: 'Refresh All Data', sysHealth: 'Sys Health', trends: 'Trends', timing: 'Timing', issues: 'Issues', fuelLoad: 'Fuel Load', critical: 'CRITICAL', high: 'HIGH', nominal: 'NOMINAL', workInProgress: 'Work In Progress', capacity: 'Capacity', velocityDelta: 'Velocity Delta', tireDeg: 'Tire Deg', teamLoad: 'TEAM LOAD', legend: 'Legend', fresh: 'Fresh', used: 'Used', systemHealth: 'System Health', online: 'ONLINE', local: 'LOCAL', project: 'Project', board: 'Board', fieldMap: 'Field Map', browse: 'Browse', userScope: 'User Scope', appScope: 'App Scope', user: 'User', app: 'App', refresh: 'Refresh', diagnostics: 'Diagnostics', drs: 'DRS', enabled: 'ENABLED', safetyCar: 'Safety Car', virtualSc: 'VIRTUAL SC', clear: 'CLEAR', trackStatus: 'Track Status', yellowFlag: 'YELLOW FLAG', greenFlag: 'GREEN FLAG', raceControlFeed: 'Race Control Feed', boxboxReq: '[!] BOX BOX: INTERVENTION REQ', raceNormal: 'RACE NORMAL', systemDiagnostics: 'System Diagnostics', healthCheck: 'Health Check', platform: 'Platform', type: 'Type', fields: 'Fields', permissions: 'Permissions', userBrowseScope: 'User Browse Scope', appBrowseScope: 'App Browse Scope', sprintFieldAccess: 'Sprint Field Access', granted: 'GRANTED', denied: 'DENIED', available: 'AVAILABLE', missing: 'MISSING', status: 'Status', loading: 'Loading...', noData: 'No data', deepInspection: 'Deep Inspection', cspNonce: 'CSP Nonce', present: 'Present', fieldCache: 'Field Cache', boardFilter: 'Board Filter', filterJql: 'Filter JQL', sprintId: 'Sprint ID', forgeScopes: 'Forge Scopes', scopes: 'scopes', refreshing: 'Refreshing...', runDiagnostics: 'Run Diagnostics' },
  fr: { circuit: 'Le Circuit', tickets: 'TICKETS', sectorPrefix: 'Secteur :', grid: 'Grille', racing: 'Course', pitlane: 'Stand', finished: 'Terminé', telemetry: 'Télémetrie', refreshAll: 'Tout Actualiser', settings: 'Configuration', refreshCenter: 'Centre de Rafraîchissement', refreshAllData: 'Actualiser Toutes les Données', sysHealth: 'Santé Système', trends: 'Tendances', timing: 'Chronos', issues: 'Tickets', fuelLoad: 'Charge Carburant', critical: 'CRITIQUE', high: 'ÉLEVÉ', nominal: 'NOMINAL', workInProgress: 'En Cours', capacity: 'Capacité', velocityDelta: 'Delta de Vélocité', tireDeg: 'Usure Pneus', teamLoad: 'CHARGE ÉQUIPE', legend: 'Légende', fresh: 'Neuf', used: 'Usé', systemHealth: 'Santé du Système', online: 'EN LIGNE', local: 'LOCAL', project: 'Projet', board: 'Tableau', fieldMap: 'Champs', browse: 'Parcourir', userScope: 'Portée Utilisateur', appScope: 'Portée App', user: 'Utilisateur', app: 'App', refresh: 'Actualiser', diagnostics: 'Diagnostics', drs: 'DRS', enabled: 'ACTIF', safetyCar: 'Voiture de Sécurité', virtualSc: 'SC VIRTUEL', clear: 'LIBRE', trackStatus: 'État de la Piste', yellowFlag: 'DRAPEAU JAUNE', greenFlag: 'DRAPEAU VERT', raceControlFeed: 'Flux Race Control', boxboxReq: '[!] BOX BOX: INTERVENTION', raceNormal: 'COURSE NORMALE', systemDiagnostics: 'Diagnostics Système', healthCheck: 'Vérification Santé', platform: 'Plateforme', type: 'Type', fields: 'Champs', permissions: 'Permissions', userBrowseScope: 'Parcours Utilisateur', appBrowseScope: 'Parcours App', sprintFieldAccess: 'Accès Champ Sprint', granted: 'ACCORDÉ', denied: 'REFUSÉ', available: 'DISPONIBLE', missing: 'MANQUANT', status: 'Statut', loading: 'Chargement...', noData: 'Aucune donnée', deepInspection: 'Inspection Approfondie', cspNonce: 'CSP Nonce', present: 'Présent', fieldCache: 'Cache des Champs', boardFilter: 'Filtre du Tableau', filterJql: 'Filtre JQL', sprintId: 'ID Sprint', forgeScopes: 'Scopes Forge', scopes: 'scopes', refreshing: 'Actualisation...', runDiagnostics: 'Lancer Diagnostics' },
  es: { circuit: 'El Circuito', tickets: 'TICKETS', sectorPrefix: 'Sector:', grid: 'Parrilla', racing: 'Carrera', pitlane: 'Pit Lane', finished: 'Terminado', telemetry: 'Telemetría', refreshAll: 'Actualizar Todo', settings: 'Configuración', refreshCenter: 'Centro de Actualización', refreshAllData: 'Actualizar Todos los Datos', sysHealth: 'Salud del Sistema', trends: 'Tendencias', timing: 'Tiempos', issues: 'Tickets', fuelLoad: 'Carga de Combustible', critical: 'CRÍTICO', high: 'ALTO', nominal: 'NORMAL', workInProgress: 'Trabajo en Progreso', capacity: 'Capacidad', velocityDelta: 'Delta de Velocidad', tireDeg: 'Desgaste de Neumáticos', teamLoad: 'CARGA DEL EQUIPO', legend: 'Leyenda', fresh: 'Nuevo', used: 'Usado', systemHealth: 'Salud del Sistema', online: 'EN LÍNEA', local: 'LOCAL', project: 'Proyecto', board: 'Tablero', fieldMap: 'Mapa de Campos', browse: 'Explorar', userScope: 'Alcance Usuario', appScope: 'Alcance App', user: 'Usuario', app: 'App', refresh: 'Actualizar', diagnostics: 'Diagnóstico', drs: 'DRS', enabled: 'ACTIVADO', safetyCar: 'Coche de Seguridad', virtualSc: 'SC VIRTUAL', clear: 'LIBRE', trackStatus: 'Estado de Pista', yellowFlag: 'BANDERA AMARILLA', greenFlag: 'BANDERA VERDE', raceControlFeed: 'Feed de Race Control', boxboxReq: '[!] BOX BOX: INTERVENCIÓN', raceNormal: 'CARRERA NORMAL', systemDiagnostics: 'Diagnóstico del Sistema', healthCheck: 'Chequeo de Salud', platform: 'Plataforma', type: 'Tipo', fields: 'Campos', permissions: 'Permisos', userBrowseScope: 'Alcance Navegación Usuario', appBrowseScope: 'Alcance Navegación App', sprintFieldAccess: 'Acceso Campo Sprint', granted: 'CONCEDIDO', denied: 'DENEGADO', available: 'DISPONIBLE', missing: 'FALTANTE', status: 'Estado', loading: 'Cargando...', noData: 'Sin datos', deepInspection: 'Inspección Profunda', cspNonce: 'CSP Nonce', present: 'Presente', fieldCache: 'Cache de Campos', boardFilter: 'Filtro del Tablero', filterJql: 'JQL del Filtro', sprintId: 'ID de Sprint', forgeScopes: 'Scopes Forge', scopes: 'scopes', refreshing: 'Actualizando...', runDiagnostics: 'Ejecutar Diagnóstico' },
  pt: { circuit: 'O Circuito', tickets: 'TICKETS', sectorPrefix: 'Setor:', grid: 'Grid', racing: 'Corrida', pitlane: 'Pit Lane', finished: 'Concluído', telemetry: 'Telemetria', refreshAll: 'Atualizar Tudo', settings: 'Configuração', refreshCenter: 'Centro de Atualização', refreshAllData: 'Atualizar Todos os Dados', sysHealth: 'Saúde do Sistema', trends: 'Tendências', timing: 'Tempos', issues: 'Tickets', fuelLoad: 'Carga de Combustível', critical: 'CRÍTICO', high: 'ALTO', nominal: 'NORMAL', workInProgress: 'Em Progresso', capacity: 'Capacidade', velocityDelta: 'Delta de Velocidade', tireDeg: 'Desgaste do Pneu', teamLoad: 'CARGA DA EQUIPE', legend: 'Legenda', fresh: 'Novo', used: 'Usado', systemHealth: 'Saúde do Sistema', online: 'ONLINE', local: 'LOCAL', project: 'Projeto', board: 'Quadro', fieldMap: 'Mapa de Campos', browse: 'Explorar', userScope: 'Escopo Usuário', appScope: 'Escopo App', user: 'Usuário', app: 'App', refresh: 'Atualizar', diagnostics: 'Diagnóstico', drs: 'DRS', enabled: 'ATIVADO', safetyCar: 'Carro de Segurança', virtualSc: 'SC VIRTUAL', clear: 'LIVRE', trackStatus: 'Estado da Pista', yellowFlag: 'BANDEIRA AMARELA', greenFlag: 'BANDEIRA VERDE', raceControlFeed: 'Feed Race Control', boxboxReq: '[!] BOX BOX: INTERVENÇÃO', raceNormal: 'CORRIDA NORMAL', systemDiagnostics: 'Diagnóstico do Sistema', healthCheck: 'Verificação de Saúde', platform: 'Plataforma', type: 'Tipo', fields: 'Campos', permissions: 'Permissões', userBrowseScope: 'Escopo de Navegação Usuário', appBrowseScope: 'Escopo de Navegação App', sprintFieldAccess: 'Acesso ao Campo Sprint', granted: 'CONCEDIDO', denied: 'NEGADO', available: 'DISPONÍVEL', missing: 'AUSENTE', status: 'Status', loading: 'Carregando...', noData: 'Sem dados', deepInspection: 'Inspeção Profunda', cspNonce: 'CSP Nonce', present: 'Presente', fieldCache: 'Cache de Campos', boardFilter: 'Filtro do Quadro', filterJql: 'JQL do Filtro', sprintId: 'ID do Sprint', forgeScopes: 'Scopes Forge', scopes: 'scopes', refreshing: 'Atualizando...', runDiagnostics: 'Executar Diagnóstico' }
}

export function t(key: string, locale: string = 'en') {
  const l = dict[locale] ? locale : 'en'
  return dict[l][key] || key
}
const ensure = (loc: string, entries: Record<string, string>) => { dict[loc] = { ...(dict[loc] || {}), ...entries } }
ensure('en', { telemetryFeed: 'Telemetry Feed', connected: 'CONNECTED', offline: 'OFFLINE', receivingData: 'Receiving Data', noSignal: 'No Signal', allCarsTx: 'All cars transmitting telemetry', connectDevops: 'Connect Bitbucket, GitHub, or GitLab\nto receive code telemetry' })
ensure('en', { performanceTrends: 'Performance Trends', wipTrend: 'WIP Trend', velocity: 'Velocity', last7Days: 'Last 7 Days', capacityPercent: '{percent}% Capacity', metricUnavailable: 'N/A' })
ensure('en', { flowTelemetry: 'Flow Telemetry', sprintTelemetry: 'Sprint Telemetry', avgCycleTime: 'Avg Cycle Time', completion: 'Completion', vitals: 'Vitals', flowLoad: 'Flow Load', wipUtilization: 'WIP Utilization', sprintLoad: 'Sprint Load', teamBurnout: 'Team Burnout', wipConsistency: 'WIP Consistency', source: 'Source', window: 'Window' })
ensure('en', { flow: 'FLOW', sprint: 'SPRINT', refreshTelemetry: 'Refresh Telemetry', refreshTiming: 'Refresh Timing', connectionLost: 'Connection Lost', noSprintIssues: 'No issues assigned to the active sprint', noBoardIssues: 'No issues on this board', emptyStateDesc: 'Create your first issue in Jira to see telemetry and the track map.', error: 'Error', initializingTelemetry: 'INITIALIZING TELEMETRY...', close: 'Close', unmappedTransitions: 'Transitions outside board columns' })
ensure('en', { sprintHealth: 'Sprint Health', calculatingPrediction: 'Calculating prediction...', sprintHealthPredictor: 'Sprint Health Predictor', velocityVsHistory: 'Velocity vs History', pace: 'Pace', timeProgress: 'Time Progress', time: 'Time', stallFree: 'Stall-Free', wipBalance: 'WIP Balance', scope: 'Scope' })
ensure('en', { openDiagnostics: 'Open Diagnostics', dismiss: 'Dismiss' })
ensure('en', { appTitle: 'Pit Wall Strategist', insufficientPermissions: 'Insufficient permissions to read issues. Ensure app has Browse Projects and issue security visibility.', userBrowse: 'UserBrowse', appBrowse: 'AppBrowse', sprintField: 'SprintField', yes: 'yes', no: 'no', systems: 'SYSTEMS', checking: 'CHECKING...' })
ensure('en', { controls: 'CONTROLS', strategyCall: 'Strategy Call:', esc: 'ESC', driver: 'Driver', status: 'Status', priority: 'Priority', stalled: 'STALLED', high: 'HIGH', raceEngineerAnalysis: 'Engineer Analysis', selectStrategy: 'Select Strategy', assigneeTeamOrders: 'Assignee (Team Orders)', splitTicket: 'The Undercut', splitTicketDesc: 'Split ticket into smaller subtasks for faster sector times.', teamOrders: 'Team Orders', teamOrdersDesc: 'Reassign to senior driver with more track experience.', retireCar: 'Retire Car', retireCarDesc: 'Move to backlog. Save engine for next race.' })
ensure('en', { detectedBoard: 'Detected Board', wipLimitLabel: 'WIP Limit (Fuel Capacity)', wipLimitDesc: 'Maximum tickets allowed in progress before overload warning.', ticketsUnit: 'tickets', assigneeCapacityLabel: 'Assignee Capacity (Tire Load)', assigneeCapacityDesc: 'Max tickets per person before burnout warning triggers.', ticketsPerPersonUnit: 'tickets/person', stalledThresholdLabel: 'Stalled Threshold (Pit Window)', stalledThresholdDesc: 'Hours without update before triggering BOX BOX alert.', recommendedRange: 'Recommended 8–72h', hoursUnit: 'hours', language: 'Language', languageDesc: 'Select UI language. Defaults to Jira preference when available.', perTypeThresholdsLabel: 'Per-Issuetype Stalled Thresholds', perTypeThresholdsDesc: 'Override stalled hours per issuetype. Empty type or non-positive hours are ignored.', issuetypePlaceholder: 'Issuetype (e.g., Bug)', remove: 'Remove', addIssuetypeRule: 'Add Issuetype Rule', duplicateIssuetypeEntries: 'Duplicate issuetype entries:', applySettings: 'Apply Settings', resetDefaults: 'Reset Defaults', system: 'System', replayBriefing: 'Missed the briefing? Replay the onboarding tour.', replayDriverBriefing: 'Replay Driver Briefing 🏁', kanbanModeDesc: 'Kanban mode: No sprints, continuous flow monitoring.', scrumModeDesc: 'Scrum mode: Tracking active sprint progress.', businessModeDesc: 'Business mode: Task tracking without sprints or boards.', sprint: 'Sprint', epic: 'Epic' })
ensure('en', {
  rovo_radioBtn: 'Radio to Pit Wall',
  rovo_briefingBtn: 'Strategy Briefing',
  rovo_radioPrompt: "Race Engineer, what's the current situation on track? Do we need to box?",
  rovo_briefingPrompt: "Analyze the current sprint telemetry. Are we on track for the podium? What are the main risks?"
})
ensure('en', { analyzingTelemetry: 'Analyzing telemetry data...', criticalAlert: 'CRITICAL ALERT:', immediateIntervention: 'Immediate intervention recommended. Check "Box Box" for details.', warning: 'WARNING:', adjustStrategy: 'Consider adjusting strategy to avoid potential stalls.', flowOptimalHint: 'Flow is optimal. Monitor Cycle Time for anomalies. Current WIP levels are within limits.', sprintPaceHint: 'Pace is good. Velocity is tracking well against the target.', analyzing: 'Analyzing', failedToAnalyze: 'Failed to analyze:', telemetryLinkFailed: 'Telemetry link failed. Please retry.', strategyAssistant: 'Strategy Assistant', ai: 'AUTO', calculating: 'CALCULATING...', strategicInsight: 'STRATEGIC INSIGHT', analyzeCycleTime: 'Analyze Cycle Time', cycleTime: 'Cycle Time', analyzeFlow: 'Analyze Flow', checkCycleLap: 'Check Cycle Time & Lap Pace', showWipAging: 'Show WIP Aging', wipAging: 'WIP Aging', tireDegCheck: 'Tire Deg Check', identifyAgingWip: 'Identify aging WIP items', checkThroughput: 'Check Throughput Trend', throughput: 'Throughput', flowRate: 'Flow Rate', verifyThroughput: 'Verify delivery throughput', identifyBlocked: 'Identify Blocked Items', blockers: 'Blockers', redFlags: 'Red Flags', findBlockedOrStalled: 'Find blocked or stalled work', analyzeSprintVelocity: 'Analyze Velocity', analyzePace: 'Analyze Pace', checkVelocityVsTarget: 'Check velocity vs target', identifyBottlenecks: 'Identify Bottlenecks', bottlenecks: 'Bottlenecks', trafficReport: 'Traffic Report', locateBottlenecks: 'Locate process bottlenecks', predictCompletion: 'Predict Completion Date', predictions: 'Predictions', racePrediction: 'Race Prediction', forecastCompletion: 'Forecast completion', showTeamHealth: 'Show Team Health', teamHealth: 'Team Health', pitCrewStatus: 'Pit Crew Status', checkTeamLoadBurnout: 'Check team load & burnout', boxboxCritical: '⚠️ BOX BOX (CRITICAL ALERTS)', noCriticalAlerts: 'NO CRITICAL ALERTS', glossary: 'Glossary' })
ensure('en', { avgLapTime: 'Avg Lap Time', sectorTimes: 'Sector Times', cycleBadge: 'CYCLE', avg: 'avg', driverLapTimes: 'Driver Lap Times', lapsBadge: 'LAPS', tickets: 'tickets', best: 'best' })
ensure('en', { stalled: 'Stalled', noSummary: 'No summary', unassigned: 'Unassigned', unknown: 'Unknown', glossary: 'Glossary', proTipTitle: 'Pro Tip:', proTipBody: 'The Pit Wall interface makes Strategy feel like Race Control. Use this guide to translate between F1 and Sprint delivery.' })
ensure('en', {
  glossary: 'Terminology Mapping', termF1: 'F1 Term', termAgile: 'Agile/Lean Term', termDesc: 'Description',
  g_downforce: 'Downforce', g_downforce_desc: 'Team focus and stability enabling consistent delivery.',
  g_fuel: 'Fuel Load', g_fuel_desc: 'Work In Progress (WIP) - items being actively worked on.',
  g_tire: 'Tire Degradation', g_tire_desc: 'Team burnout from sustained high workload.',
  g_grid: 'Starting Grid', g_grid_desc: 'Backlog of work ready to start.',
  g_safetycar: 'Safety Car', g_safetycar_desc: 'Blocker slowing team progress.',
  g_boxbox: 'Box Box', g_boxbox_desc: 'Critical intervention required immediately.',
  g_pitstop: 'Pit Stop', g_pitstop_desc: 'Planning/refinement session to prepare for next phase.',
  g_blueflag: 'Blue Flag', g_blueflag_desc: 'Priority escalation needed.',
  g_sectors: 'Track Sectors', g_sectors_desc: 'Workflow stages (columns on board).',
  g_race: 'Race', g_race_desc: 'The current work period being tracked.',
  g_driver: 'Driver', g_driver_desc: 'Team member responsible for completing work.',
  g_laptime: 'Lap Time', g_laptime_desc: 'Time from start to completion of an item.',
  g_velocity: 'Velocity', g_velocity_desc: 'Rate of work completion over time.',
  g_dragdetected: 'Drag Detected', g_dragdetected_desc: 'Item stuck without progress.',
  g_greenflag: 'Green Flag', g_greenflag_desc: 'Period has started, work is flowing.',
  populationNote: 'Population Mode',
  populationScrumDesc: 'Terminology optimized for Sprint-based teams using Scrum methodology.',
  populationFlowDesc: 'Terminology optimized for Kanban/Flow teams focused on continuous delivery.',
  populationProcessDesc: 'Terminology optimized for Business teams managing work without sprints.'
})

ensure('fr', {
  glossary: 'Lexique F1 / Agile', termF1: 'Terme F1', termAgile: 'Terme Agile/Lean',
  g_downforce: 'Appui Aéro (Downforce)', g_downforce_desc: 'Vélocité / Débit',
  g_fuel: 'Carburant', g_fuel_desc: 'Tâches en Cours (WIP)',
  g_tire: 'Dégradation Pneus', g_tire_desc: 'Fatigue Équipe',
  g_grid: 'Grille de Départ', g_grid_desc: 'Sprint Backlog',
  g_safetycar: 'Safety Car', g_safetycar_desc: 'Bloquant / Obstacle',
  g_boxbox: 'Box Box', g_boxbox_desc: 'Intervention critique requise immédiatement.',
  g_pitstop: 'Arrêt au Stand', g_pitstop_desc: 'Séance de planification/raffinement.',
  g_blueflag: 'Drapeau Bleu', g_blueflag_desc: 'Escalade de priorité nécessaire.',
  g_sectors: 'Secteurs', g_sectors_desc: 'Étapes du workflow (colonnes).',
  g_race: 'Course', g_race_desc: 'La période de travail en cours.',
  g_driver: 'Pilote', g_driver_desc: 'Membre de l\'équipe responsable du travail.',
  g_laptime: 'Temps au Tour', g_laptime_desc: 'Temps du début à la complétion.',
  g_velocity: 'Vélocité', g_velocity_desc: 'Taux de complétion du travail.',
  g_dragdetected: 'Traînée Détectée', g_dragdetected_desc: 'Élément bloqué sans progression.',
  g_greenflag: 'Drapeau Vert', g_greenflag_desc: 'La période a commencé, le travail avance.',
  termDesc: 'Description',
  populationNote: 'Mode Population',
  populationScrumDesc: 'Terminologie optimisée pour les équipes Sprint utilisant Scrum.',
  populationFlowDesc: 'Terminologie optimisée pour les équipes Kanban/Flux.',
  populationProcessDesc: 'Terminologie optimisée pour les équipes Business sans sprints.'
})

ensure('es', {
  glossary: 'Mapa de Terminología', termF1: 'Término F1', termAgile: 'Término Agile/Lean',
  g_downforce: 'Carga Aero (Downforce)', g_downforce_desc: 'Velocidad / Rendimiento',
  g_fuel: 'Combustible', g_fuel_desc: 'Trabajo en Progreso (WIP)',
  g_tire: 'Degradación Neumáticos', g_tire_desc: 'Fatiga del Equipo',
  g_grid: 'Parrilla de Salida', g_grid_desc: 'Sprint Backlog',
  g_safetycar: 'Safety Car', g_safetycar_desc: 'Impedimento / Bloqueo',
  g_boxbox: 'Box Box', g_boxbox_desc: 'Intervención crítica requerida inmediatamente.',
  g_pitstop: 'Pit Stop', g_pitstop_desc: 'Sesión de planificación/refinamiento.',
  g_blueflag: 'Bandera Azul', g_blueflag_desc: 'Escalada de prioridad necesaria.',
  g_sectors: 'Sectores', g_sectors_desc: 'Etapas del flujo de trabajo (columnas).',
  g_race: 'Carrera', g_race_desc: 'El período de trabajo actual.',
  g_driver: 'Piloto', g_driver_desc: 'Miembro del equipo responsable del trabajo.',
  g_laptime: 'Tiempo de Vuelta', g_laptime_desc: 'Tiempo desde inicio hasta completar.',
  g_velocity: 'Velocidad', g_velocity_desc: 'Tasa de completación del trabajo.',
  g_dragdetected: 'Arrastre Detectado', g_dragdetected_desc: 'Elemento atascado sin progreso.',
  g_greenflag: 'Bandera Verde', g_greenflag_desc: 'El período ha comenzado, el trabajo fluye.',
  termDesc: 'Descripción',
  populationNote: 'Modo Población',
  populationScrumDesc: 'Terminología optimizada para equipos Sprint usando Scrum.',
  populationFlowDesc: 'Terminología optimizada para equipos Kanban/Flujo.',
  populationProcessDesc: 'Terminología optimizada para equipos de Negocio sin sprints.'
})

ensure('pt', {
  glossary: 'Mapeamento de Termos', termF1: 'Termo F1', termAgile: 'Termo Agile/Lean',
  g_downforce: 'Downforce', g_downforce_desc: 'Foco e estabilidade da equipe.',
  g_fuel: 'Combustível', g_fuel_desc: 'Trabalho em Progresso (WIP).',
  g_tire: 'Desgaste Pneus', g_tire_desc: 'Esgotamento da equipe.',
  g_grid: 'Grid de Largada', g_grid_desc: 'Backlog de trabalho.',
  g_safetycar: 'Safety Car', g_safetycar_desc: 'Bloqueio atrasando o progresso.',
  g_boxbox: 'Box Box', g_boxbox_desc: 'Intervenção crítica necessária imediatamente.',
  g_pitstop: 'Pit Stop', g_pitstop_desc: 'Sessão de planejamento/refinamento.',
  g_blueflag: 'Bandeira Azul', g_blueflag_desc: 'Escalada de prioridade necessária.',
  g_sectors: 'Setores', g_sectors_desc: 'Etapas do workflow (colunas).',
  g_race: 'Corrida', g_race_desc: 'O período de trabalho atual.',
  g_driver: 'Piloto', g_driver_desc: 'Membro da equipe responsável pelo trabalho.',
  g_laptime: 'Tempo de Volta', g_laptime_desc: 'Tempo do início à conclusão.',
  g_velocity: 'Velocidade', g_velocity_desc: 'Taxa de conclusão do trabalho.',
  g_dragdetected: 'Arrasto Detectado', g_dragdetected_desc: 'Item parado sem progresso.',
  g_greenflag: 'Bandeira Verde', g_greenflag_desc: 'O período começou, o trabalho flui.',
  termDesc: 'Descrição',
  populationNote: 'Modo População',
  populationScrumDesc: 'Terminologia otimizada para equipes Sprint usando Scrum.',
  populationFlowDesc: 'Terminologia otimizada para equipes Kanban/Fluxo.',
  populationProcessDesc: 'Terminologia otimizada para equipes de Negócio sem sprints.'
})
ensure('fr', { telemetryFeed: 'Flux de Télémétrie', connected: 'CONNECTÉ', offline: 'HORS LIGNE', receivingData: 'Réception de Données', noSignal: 'Pas de Signal', allCarsTx: 'Toutes les voitures transmettent la télémétrie', connectDevops: 'Connectez Bitbucket, GitHub ou GitLab\npour recevoir la télémétrie de code' })
ensure('fr', { performanceTrends: 'Tendances de Performance', wipTrend: 'Tendance WIP', velocity: 'Vélocité', last7Days: '7 Derniers Jours', capacityPercent: '{percent}% Capacité', metricUnavailable: 'N/D' })
ensure('fr', { flowTelemetry: 'Télémetrie du Flux', sprintTelemetry: 'Télémetrie du Sprint', avgCycleTime: 'Temps moyen de cycle', completion: 'Achèvement', vitals: 'VITAUX', flowLoad: 'Charge du Flux', wipUtilization: 'Utilisation WIP', sprintLoad: 'Charge du Sprint', teamBurnout: "Epuisement de l'équipe", wipConsistency: 'Consistance WIP', source: 'Source', window: 'Fenêtre' })
ensure('fr', { flow: 'FLUX', sprint: 'SPRINT', refreshTelemetry: 'Actualiser Télémetrie', refreshTiming: 'Actualiser Chronos', connectionLost: 'Connexion perdue', noSprintIssues: "Aucun ticket assigné au sprint actif", noBoardIssues: 'Aucun ticket sur ce tableau', emptyStateDesc: 'Créez votre premier ticket dans Jira pour voir la télémétrie et la carte.', error: 'Erreur', initializingTelemetry: 'INITIALISATION DE LA TÉLÉMÉTRIE...', close: 'Fermer', unmappedTransitions: 'Transitions hors colonas configuradas' })
ensure('fr', { sprintHealth: 'Santé du Sprint', calculatingPrediction: 'Calcul de la prédiction...', sprintHealthPredictor: 'Prédicteur de Santé du Sprint', velocityVsHistory: 'Vélocité vs Historique', pace: 'Rythme', timeProgress: 'Progression du Temps', time: 'Temps', stallFree: 'Sans blocage', wipBalance: 'Équilibre WIP', scope: 'Scope' })
ensure('fr', { openDiagnostics: 'Ouvrir Diagnostics', dismiss: 'Ignorer' })
ensure('fr', { controls: 'CONTRÔLES', strategyCall: 'Appel de Stratégie :', esc: 'ESC', driver: 'Pilote', status: 'Statut', priority: 'Priorité', stalled: 'EN PANNE', high: 'ÉLEVÉE', raceEngineerAnalysis: "Analyse de l'Ingénieur de Course", selectStrategy: 'Sélectionner Stratégie', assigneeTeamOrders: 'Assigné (Team Orders)', splitTicket: 'The Undercut', splitTicketDesc: 'Diviser en sous-tâches pour accélérer les secteurs.', teamOrders: 'Team Orders', teamOrdersDesc: 'Réassigner à un senior expérimenté.', retireCar: 'Retirer la Voiture', retireCarDesc: 'Mettre au backlog. Sauver le moteur pour la prochaine course.' })
ensure('fr', { detectedBoard: 'Tableau détecté', wipLimitLabel: 'Limite WIP (Capacité Carburant)', wipLimitDesc: 'Nombre maximum de tickets en cours avant alerte.', ticketsUnit: 'tickets', assigneeCapacityLabel: 'Capacité Assigné (Charge Pneus)', assigneeCapacityDesc: 'Tickets max par personne avant alerte de surcharge.', ticketsPerPersonUnit: 'tickets/personne', stalledThresholdLabel: 'Seuil de Blocage (Fenêtre Stand)', stalledThresholdDesc: 'Heures sans mise à jour avant alerte BOX BOX.', recommendedRange: 'Recommandé 8–72h', hoursUnit: 'heures', language: 'Langue', languageDesc: 'Sélection de la langue. Par défaut: préférence Jira.', perTypeThresholdsLabel: 'Seuils par type de ticket', perTypeThresholdsDesc: 'Remplacer le seuil par type de ticket.', issuetypePlaceholder: 'Type (ex: Bug)', remove: 'Supprimer', addIssuetypeRule: 'Ajouter une règle', duplicateIssuetypeEntries: 'Doublons de types :', applySettings: 'Appliquer', resetDefaults: 'Réinitialiser', system: 'Système', replayBriefing: "Briefing manqué ? Rejouer l'onboarding.", replayDriverBriefing: 'Rejouer le Briefing 🏁', kanbanModeDesc: 'Mode Kanban : pas de sprints, flux continu.', scrumModeDesc: 'Mode Scrum : suivi du sprint actif.', businessModeDesc: 'Mode Business : suivi des tâches sans sprints.', sprint: 'Sprint', epic: 'Épopée' })
ensure('fr', {
  rovo_radioBtn: 'Radio du Stand',
  rovo_briefingBtn: 'Briefing Stratégie',
  rovo_radioPrompt: "Ingénieur de Course, quelle est la situation en piste ? Doit-on rentrer au stand ?",
  rovo_briefingPrompt: "Analyse la télémétrie du sprint. Sommes-nous en route pour le podium ? Quels sont les risques ?"
})
ensure('fr', { avgLapTime: 'Temps au Tour Moyen', sectorTimes: 'Temps par Secteur', cycleBadge: 'CYCLE', avg: 'moy', driverLapTimes: 'Temps des Pilotes', lapsBadge: 'TOURS', tickets: 'tickets', best: 'meilleur' })
ensure('es', { telemetryFeed: 'Feed de Telemetría', connected: 'CONECTADO', offline: 'SIN CONEXIÓN', receivingData: 'Recibiendo Datos', noSignal: 'Sin Señal', allCarsTx: 'Todos los coches transmitiendo telemetría', connectDevops: 'Conecte Bitbucket, GitHub o GitLab\npara recibir telemetría de código' })
ensure('es', { performanceTrends: 'Tendencias de Rendimiento', wipTrend: 'Tendencia WIP', velocity: 'Velocidad', last7Days: 'Últimos 7 Días', capacityPercent: '{percent}% Capacidad', metricUnavailable: 'N/D' })
ensure('es', { flowTelemetry: 'Telemetría de Flujo', sprintTelemetry: 'Telemetría de Sprint', avgCycleTime: 'Tiempo medio de ciclo', completion: 'Completado', vitals: 'VITALES', flowLoad: 'Carga de Flujo', wipUtilization: 'Utilización WIP', sprintLoad: 'Carga de Sprint', teamBurnout: 'Fatiga del Equipo', wipConsistency: 'Consistencia WIP', source: 'Fuente', window: 'Ventana' })
ensure('es', { flow: 'FLUJO', sprint: 'SPRINT', refreshTelemetry: 'Actualizar Telemetría', refreshTiming: 'Actualizar Tiempos', connectionLost: 'Conexión perdida', noSprintIssues: 'No hay tickets asignados al sprint activo', noBoardIssues: 'No hay tickets en este tablero', emptyStateDesc: 'Crea tu primer ticket en Jira para ver la telemetría y el mapa.', error: 'Error', initializingTelemetry: 'INICIALIZANDO TELEMETRÍA...', close: 'Cerrar', unmappedTransitions: 'Transiciones fuera de columnas configuradas' })
ensure('es', { sprintHealth: 'Salud del Sprint', calculatingPrediction: 'Calculando predicción...', sprintHealthPredictor: 'Predictor de Salud del Sprint', velocityVsHistory: 'Velocidad vs Historial', pace: 'Ritmo', timeProgress: 'Progreso del Tiempo', time: 'Tiempo', stallFree: 'Sin bloqueos', wipBalance: 'Balance WIP', scope: 'Alcance' })
ensure('es', { openDiagnostics: 'Abrir Diagnóstico', dismiss: 'Descartar' })
ensure('es', { controls: 'CONTROLES', strategyCall: 'Llamada de Estrategia:', esc: 'ESC', driver: 'Piloto', status: 'Estado', priority: 'Prioridad', stalled: 'DETENIDO', high: 'ALTA', raceEngineerAnalysis: 'Análisis del Ingeniero', selectStrategy: 'Seleccionar Estrategia', assigneeTeamOrders: 'Asignado (Team Orders)', splitTicket: 'The Undercut', splitTicketDesc: 'Dividir el ticket en subtareas para acelerar.', teamOrders: 'Team Orders', teamOrdersDesc: 'Reasignar a un senior con experiencia.', retireCar: 'Retirar Coche', retireCarDesc: 'Mover al backlog. Guardar motor para próxima carrera.' })
ensure('es', { detectedBoard: 'Tablero detectado', wipLimitLabel: 'Límite WIP (Capacidad Combustible)', wipLimitDesc: 'Máximo de tickets en progreso antes de alerta.', ticketsUnit: 'tickets', assigneeCapacityLabel: 'Capacidad Asignado (Carga Neumático)', assigneeCapacityDesc: 'Máx tickets por persona antes de alerta.', ticketsPerPersonUnit: 'tickets/persona', stalledThresholdLabel: 'Umbral de Bloqueo (Ventana Box)', stalledThresholdDesc: 'Horas sin actualización antes alerta BOX BOX.', recommendedRange: 'Recomendado 8–72h', hoursUnit: 'horas', language: 'Idioma', languageDesc: 'Selecciona idioma; por defecto el de Jira.', perTypeThresholdsLabel: 'Umbrales por tipo', perTypeThresholdsDesc: 'Sobrescribir horas por tipo.', issuetypePlaceholder: 'Tipo (ej., Bug)', remove: 'Eliminar', addIssuetypeRule: 'Añadir regla', duplicateIssuetypeEntries: 'Duplicados de tipos:', applySettings: 'Aplicar', resetDefaults: 'Restablecer', system: 'Sistema', replayBriefing: '¿Perdiste el briefing? Reproduce el onboarding.', replayDriverBriefing: 'Reproducir Briefing 🏁', kanbanModeDesc: 'Kanban: sin sprints, flujo continuo.', scrumModeDesc: 'Scrum: seguimiento del sprint activo.', businessModeDesc: 'Modo Business: Seguimiento de tareas sin sprints ni tableros.', sprint: 'Sprint', epic: 'Épica' })
ensure('es', {
  rovo_radioBtn: 'Radio de Boxes',
  rovo_briefingBtn: 'Briefing de Estrategia',
  rovo_radioPrompt: "Ingeniero de Carrera, ¿cuál es la situación en pista? ¿Necesitamos entrar a boxes?",
  rovo_briefingPrompt: "Analiza la telemetría del sprint actual. ¿Vamos para el podio? ¿Cuáles son los riesgos?"
})
ensure('es', { avgLapTime: 'Tiempo Medio por Vuelta', sectorTimes: 'Tiempos por Sector', cycleBadge: 'CICLO', avg: 'med', driverLapTimes: 'Tiempos de Pilotos', lapsBadge: 'VUELTAS', tickets: 'tickets', best: 'mejor' })
ensure('pt', { telemetryFeed: 'Feed de Telemetria', connected: 'CONECTADO', offline: 'OFFLINE', receivingData: 'Recebendo Dados', noSignal: 'Sem Sinal', allCarsTx: 'Todos os carros transmitindo telemetria', connectDevops: 'Conecte Bitbucket, GitHub ou GitLab\npara receber telemetria de código' })
ensure('pt', { performanceTrends: 'Tendências de Desempenho', wipTrend: 'Tendência WIP', velocity: 'Velocidade', last7Days: 'Últimos 7 Dias', capacityPercent: '{percent}% Capacidade', metricUnavailable: 'N/D' })
ensure('pt', { flowTelemetry: 'Telemetria de Fluxo', sprintTelemetry: 'Telemetria de Sprint', avgCycleTime: 'Tempo médio de ciclo', completion: 'Conclusão', vitals: 'VITAIS', flowLoad: 'Carga de Fluxo', wipUtilization: 'Utilização WIP', sprintLoad: 'Carga do Sprint', teamBurnout: 'Esgotamento da Equipe', wipConsistency: 'Consistência WIP', source: 'Fonte', window: 'Janela' })
ensure('pt', { flow: 'FLUXO', sprint: 'SPRINT', refreshTelemetry: 'Atualizar Telemetria', refreshTiming: 'Atualizar Tempos', connectionLost: 'Conexão perdida', noSprintIssues: 'Nenhum ticket atribuído ao sprint ativo', noBoardIssues: 'Nenhum ticket neste quadro', emptyStateDesc: 'Crie seu primeiro ticket no Jira para ver a telemetria e o mapa.', error: 'Erro', initializingTelemetry: 'INICIALIZANDO TELEMETRIA...', close: 'Fechar', unmappedTransitions: 'Transições fora das colunas configuradas' })
ensure('pt', { sprintHealth: 'Saúde do Sprint', calculatingPrediction: 'Calculando previsão...', sprintHealthPredictor: 'Preditor de Saúde do Sprint', velocityVsHistory: 'Velocidade vs Histórico', pace: 'Ritmo', timeProgress: 'Progresso do Tempo', time: 'Tempo', stallFree: 'Sem paralisações', wipBalance: 'Balanço WIP', scope: 'Escopo' })
ensure('pt', { openDiagnostics: 'Abrir Diagnóstico', dismiss: 'Dispensar' })
ensure('pt', { controls: 'CONTROLES', strategyCall: 'Chamada de Estratégia:', esc: 'ESC', driver: 'Piloto', status: 'Status', priority: 'Prioridade', stalled: 'PARADO', high: 'ALTA', raceEngineerAnalysis: 'Análise do Engenheiro de Corrida', selectStrategy: 'Selecionar Estratégia', assigneeTeamOrders: 'Designado (Team Orders)', splitTicket: 'The Undercut', splitTicketDesc: 'Dividir o ticket em subtarefas para acelerar.', teamOrders: 'Team Orders', teamOrdersDesc: 'Reatribuir a um sênior experiente.', retireCar: 'Retirar Carro', retireCarDesc: 'Mover para backlog. Salvar motor para a próxima corrida.' })
ensure('pt', { detectedBoard: 'Quadro detectado', wipLimitLabel: 'Limite WIP (Capacidade de Combustível)', wipLimitDesc: 'Máximo de tickets em progresso antes de alerta.', ticketsUnit: 'tickets', assigneeCapacityLabel: 'Capacidade por Pessoa (Carga do Pneu)', assigneeCapacityDesc: 'Máx tickets por pessoa antes de alerta.', ticketsPerPersonUnit: 'tickets/pessoa', stalledThresholdLabel: 'Limite de Paralisação (Janela do Pit)', stalledThresholdDesc: 'Horas sem atualização antes do alerta BOX BOX.', recommendedRange: 'Recomendado 8–72h', hoursUnit: 'horas', language: 'Idioma', languageDesc: 'Selecione idioma; padrão: Jira.', perTypeThresholdsLabel: 'Limites por Tipo', perTypeThresholdsDesc: 'Substituir horas por tipo.', issuetypePlaceholder: 'Tipo (ex.: Bug)', remove: 'Remover', addIssuetypeRule: 'Adicionar regra', duplicateIssuetypeEntries: 'Tipos duplicados:', applySettings: 'Aplicar', resetDefaults: 'Redefinir', system: 'Sistema', replayBriefing: 'Perdeu o briefing? Reproduza o onboarding.', replayDriverBriefing: 'Reproduzir Briefing 🏁', kanbanModeDesc: 'Kanban: sem sprints, fluxo contínuo.', scrumModeDesc: 'Scrum: acompanhamento do sprint ativo.', businessModeDesc: 'Modo Business: Acompanhamento de tarefas sem sprints ou quadros.', sprint: 'Sprint', epic: 'Épico' })
ensure('pt', {
  rovo_radioBtn: 'Rádio dos Boxes',
  rovo_briefingBtn: 'Briefing de Estratégia',
  rovo_radioPrompt: "Engenheiro de Corrida, qual a situação na pista? Precisamos ir para os boxes?",
  rovo_briefingPrompt: "Analise a telemetria do sprint. Estamos no caminho para o pódio? Quais são os riscos?"
})
ensure('pt', { avgLapTime: 'Tempo Médio por Volta', sectorTimes: 'Tempos por Setor', cycleBadge: 'CICLO', avg: 'méd', driverLapTimes: 'Tempos dos Pilotos', lapsBadge: 'VOLTAS', tickets: 'tickets', best: 'melhor' })
ensure('fr', { stalled: 'En panne', noSummary: 'Pas de résumé', unassigned: 'Non assigné', unknown: 'Inconnu', glossary: 'Glossaire', proTipTitle: 'Astuce :', proTipBody: "L'interface Pit Wall fait de la Stratégie un contrôle de course. Utilisez ce guide pour traduire entre F1 et la livraison Sprint." })
ensure('es', { stalled: 'Detenido', noSummary: 'Sin resumen', unassigned: 'Sin asignar', unknown: 'Desconocido', glossary: 'Glosario', proTipTitle: 'Consejo:', proTipBody: 'La interfaz Pit Wall hace que la estrategia se sienta como Race Control. Usa esta guía para traducir entre F1 y la entrega del Sprint.' })
ensure('pt', { stalled: 'Parado', noSummary: 'Sem resumo', unassigned: 'Não atribuído', unknown: 'Desconhecido', glossary: 'Glossário', proTipTitle: 'Dica:', proTipBody: 'A interface Pit Wall faz a estratégia parecer o controle de corrida. Use este guia para traduzir entre F1 e entrega de Sprint.' })
ensure('fr', { analyzingTelemetry: 'Analyse des données de télémétrie...', criticalAlert: 'ALERTE CRITIQUE :', immediateIntervention: 'Intervention immédiate recommandée. Voir "Box Box".', warning: 'AVERTISSEMENT :', adjustStrategy: 'Ajustez la stratégie pour éviter les blocages.', flowOptimalHint: 'Flux optimal. Surveillez le Cycle Time pour anomalies. WIP dans les limites.', sprintPaceHint: 'Bon rythme de sprint. La vélocité suit l’objectif.', analyzing: 'Analyse', failedToAnalyze: 'Échec de l’analyse :', telemetryLinkFailed: 'Lien de télémétrie en échec. Réessayez.', strategyAssistant: 'Assistant de Stratégie', ai: 'IA', calculating: 'CALCUL...', strategicInsight: 'VISION STRATÉGIQUE', analyzeCycleTime: 'Analyser Cycle Time', cycleTime: 'Cycle Time', analyzeFlow: 'Analyser le Flux', checkCycleLap: 'Vérifier Cycle Time & rythme', showWipAging: 'Afficher vieillissement WIP', wipAging: 'Vieillissement WIP', tireDegCheck: 'Usure des Pneus', identifyAgingWip: 'Identifier WIP vieillissant', checkThroughput: 'Vérifier tendance de débit', throughput: 'Débit', flowRate: 'Taux de Flux', verifyThroughput: 'Vérifier le débit', identifyBlocked: 'Identifier éléments bloqués', blockers: 'Bloqueurs', redFlags: 'Drapeaux Rouges', findBlockedOrStalled: 'Trouver travail bloqué ou en panne', analyzeSprintVelocity: 'Analyser vélocité du sprint', analyzePace: 'Analyser le rythme', checkVelocityVsTarget: 'Vérifier vélocité vs cible', identifyBottlenecks: 'Identifier goulots', bottlenecks: 'Goulots', trafficReport: 'Rapport de Trafic', locateBottlenecks: 'Localiser les goulots', predictCompletion: 'Prédire date de fin', predictions: 'Prédictions', racePrediction: 'Prédiction de Course', forecastCompletion: 'Prévoir achèvement', showTeamHealth: 'Afficher santé de l’équipe', teamHealth: 'Santé de l’équipe', pitCrewStatus: 'Statut du Pit Crew', checkTeamLoadBurnout: 'Vérifier charge & burnout', boxboxCritical: '⚠️ BOX BOX (ALERTES CRITIQUES)', noCriticalAlerts: 'AUCUNE ALERTE CRITIQUE' })
ensure('es', { analyzingTelemetry: 'Analizando datos de telemetría...', criticalAlert: 'ALERTA CRÍTICA:', immediateIntervention: 'Intervención inmediata recomendada. Ver "Box Box".', warning: 'ADVERTENCIA:', adjustStrategy: 'Ajuste la estrategia para evitar bloqueos.', flowOptimalHint: 'Flujo óptimo. Controle el Cycle Time por anomalías. WIP dentro de límites.', sprintPaceHint: 'Buen ritmo de sprint. La velocidad sigue el objetivo.', analyzing: 'Analizando', failedToAnalyze: 'Fallo al analizar:', telemetryLinkFailed: 'Enlace de telemetría falló. Reintente.', strategyAssistant: 'Asistente de Estrategia', ai: 'IA', calculating: 'CALCULANDO...', strategicInsight: 'INSIGHT ESTRATÉGICO', analyzeCycleTime: 'Analizar Cycle Time', cycleTime: 'Cycle Time', analyzeFlow: 'Analizar Flujo', checkCycleLap: 'Verificar Cycle Time y ritmo', showWipAging: 'Mostrar envejecimiento WIP', wipAging: 'Envejecimiento WIP', tireDegCheck: 'Chequeo de Desgaste', identifyAgingWip: 'Identificar WIP envejecido', checkThroughput: 'Verificar tendencia de rendimiento', throughput: 'Rendimiento', flowRate: 'Tasa de Flujo', verifyThroughput: 'Verificar rendimiento', identifyBlocked: 'Identificar bloqueados', blockers: 'Bloqueadores', redFlags: 'Banderas Rojas', findBlockedOrStalled: 'Encontrar trabajo bloqueado o detenido', analyzeSprintVelocity: 'Analizar velocidad de sprint', analyzePace: 'Analizar Ritmo', checkVelocityVsTarget: 'Verificar velocidad vs objetivo', identifyBottlenecks: 'Identificar cuellos', bottlenecks: 'Cuellos', trafficReport: 'Informe de Tráfico', locateBottlenecks: 'Localizar cuellos de botella', predictCompletion: 'Predecir fecha de conclusión', predictions: 'Predicciones', racePrediction: 'Predicción de Carrera', forecastCompletion: 'Pronosticar conclusión', showTeamHealth: 'Mostrar salud del equipo', teamHealth: 'Salud del equipo', pitCrewStatus: 'Estado del Pit Crew', checkTeamLoadBurnout: 'Verificar carga y burnout', boxboxCritical: '⚠️ BOX BOX (ALERTAS CRÍTICAS)', noCriticalAlerts: 'SIN ALERTAS CRÍTICAS' })
ensure('pt', { analyzingTelemetry: 'Analisando dados de telemetria...', criticalAlert: 'ALERTA CRÍTICA:', immediateIntervention: 'Intervenção imediata recomendada. Veja "Box Box".', warning: 'AVISO:', adjustStrategy: 'Ajuste a estratégia para evitar bloqueios.', flowOptimalHint: 'Fluxo ótimo. Monitore Cycle Time para anomalias. WIP dentro dos limites.', sprintPaceHint: 'Bom ritmo de sprint. A velocidade acompanha a meta.', analyzing: 'Analisando', failedToAnalyze: 'Falha ao analisar:', telemetryLinkFailed: 'Falha no link de telemetria. Tente novamente.', strategyAssistant: 'Assistente de Estratégia', ai: 'IA', calculating: 'CALCULANDO...', strategicInsight: 'INSIGHT ESTRATÉGICO', analyzeCycleTime: 'Analisar Cycle Time', cycleTime: 'Cycle Time', analyzeFlow: 'Analisar Fluxo', checkCycleLap: 'Verificar Cycle Time e ritmo', showWipAging: 'Mostrar envelhecimento WIP', wipAging: 'Envelhecimento WIP', tireDegCheck: 'Checar desgaste do pneu', identifyAgingWip: 'Identificar WIP envelhecido', checkThroughput: 'Verificar tendência de throughput', throughput: 'Throughput', flowRate: 'Taxa de Fluxo', verifyThroughput: 'Verificar throughput', identifyBlocked: 'Identificar itens bloqueados', blockers: 'Bloqueios', redFlags: 'Bandeiras Vermelhas', findBlockedOrStalled: 'Encontrar trabalho bloqueado ou parado', analyzeSprintVelocity: 'Analisar velocidade do sprint', analyzePace: 'Analisar Ritmo', checkVelocityVsTarget: 'Verificar velocidade vs meta', identifyBottlenecks: 'Identificar gargalos', bottlenecks: 'Gargalos', trafficReport: 'Relatório de Tráfego', locateBottlenecks: 'Localizar gargalos', predictCompletion: 'Prever data de conclusão', predictions: 'Previsões', racePrediction: 'Predição de Corrida', forecastCompletion: 'Prever conclusão', showTeamHealth: 'Mostrar saúde da equipe', teamHealth: 'Saúde da equipe', pitCrewStatus: 'Status do Pit Crew', checkTeamLoadBurnout: 'Verificar carga e burnout', boxboxCritical: '⚠️ BOX BOX (ALERTAS CRÍTICOS)', noCriticalAlerts: 'SEM ALERTAS CRÍTICOS' })
ensure('fr', { appTitle: 'Pit Wall Strategist', insufficientPermissions: 'Permissions insuffisantes pour lire les tickets. Vérifiez Parcourir Projets et sécurité.', userBrowse: 'Parcours Utilisateur', appBrowse: 'Parcours App', sprintField: 'Champ Sprint', yes: 'oui', no: 'non', systems: 'SYSTÈMES', checking: 'VÉRIFICATION...' })
ensure('es', { appTitle: 'Pit Wall Strategist', insufficientPermissions: 'Permisos insuficientes para leer tickets. Verifique Navegar Proyectos y seguridad.', userBrowse: 'Navegación Usuario', appBrowse: 'Navegación App', sprintField: 'Campo Sprint', yes: 'sí', no: 'no', systems: 'SISTEMAS', checking: 'VERIFICANDO...' })
ensure('pt', { appTitle: 'Pit Wall Strategist', insufficientPermissions: 'Permissões insuficientes para ler tickets. Verifique Navegar Projetos e segurança.', userBrowse: 'Navegar Usuário', appBrowse: 'Navegar App', sprintField: 'Campo Sprint', yes: 'sim', no: 'não', systems: 'SISTEMAS', checking: 'VERIFICANDO...' })
ensure('en', { pitCrewDebrief: 'Pit Crew Debrief', retro: 'Retro', needTwoSprints: 'Need at least 2 sprints for comparison.', previous: 'Previous', current: 'Current', committed: 'Committed', completed: 'Completed', up: 'up', down: 'down', fromLastSprint: 'from last sprint', improvedByDays: 'improved by', days: 'days', moreCarryOverThanLastSprint: 'More carry-over than last sprint', lessCarryOverThanLastSprint: 'Less carry-over than last sprint', excellentCompletionRate: 'Excellent completion rate:', lowCompletionRate: 'Low completion rate:' })
ensure('fr', { pitCrewDebrief: 'Compte-rendu Pit Crew', retro: 'Rétro', needTwoSprints: 'Au moins 2 sprints nécessaires pour comparer.', previous: 'Précédent', current: 'Courant', committed: 'Engagé', completed: 'Terminé', up: 'en hausse', down: 'en baisse', fromLastSprint: 'par rapport au dernier sprint', improvedByDays: 'amélioré de', days: 'jours', moreCarryOverThanLastSprint: 'Plus de carry-over que le dernier sprint', lessCarryOverThanLastSprint: 'Moins de carry-over que le dernier sprint', excellentCompletionRate: 'Excellent taux de complétion :', lowCompletionRate: 'Faible taux de complétion :' })
ensure('es', { pitCrewDebrief: 'Informe del Pit Crew', retro: 'Retro', needTwoSprints: 'Se necesitan al menos 2 sprints para comparar.', previous: 'Anterior', current: 'Actual', committed: 'Comprometido', completed: 'Completado', up: 'arriba', down: 'abajo', fromLastSprint: 'desde el último sprint', improvedByDays: 'mejorado por', days: 'días', moreCarryOverThanLastSprint: 'Más carry-over que el último sprint', lessCarryOverThanLastSprint: 'Menos carry-over que el último sprint', excellentCompletionRate: 'Excelente tasa de finalización:', lowCompletionRate: 'Baja tasa de finalización:' })
ensure('pt', { pitCrewDebrief: 'Relatório da Equipe de Box', retro: 'Retrô', needTwoSprints: 'Necessário pelo menos 2 sprints para comparar.', previous: 'Anterior', current: 'Atual', committed: 'Comprometido', completed: 'Concluído', up: 'acima', down: 'abaixo', fromLastSprint: 'do último sprint', improvedByDays: 'melhorado em', days: 'dias', moreCarryOverThanLastSprint: 'Mais carry-over que o último sprint', lessCarryOverThanLastSprint: 'Menos carry-over que o último sprint', excellentCompletionRate: 'Excelente taxa de conclusão:', lowCompletionRate: 'Baixa taxa de conclusão:' })
ensure('en', { pitLaneProgress: 'Pit Lane Progress', qaStatus: 'QA Status', noIssuesToTrack: 'No issues to track', garage: 'Garage', onTrack: 'On Track', pitStop: 'Pit Stop', finish: 'Finish', raceCompletion: 'Race Completion', issues: 'issues', inPitStopTesting: 'in Pit Stop (Testing)', qaBottleneckDetected: 'QA bottleneck detected', checkeredFlagAllDone: 'Checkered Flag! All issues complete!' })
ensure('fr', { pitLaneProgress: 'Progression Pit Lane', qaStatus: 'Statut QA', noIssuesToTrack: 'Aucun ticket à suivre', garage: 'Garage', onTrack: 'En Piste', pitStop: 'Arrêt au Stand', finish: 'Arrivée', raceCompletion: 'Achèvement de la Course', issues: 'tickets', inPitStopTesting: 'dans le Pit Stop (Test)', qaBottleneckDetected: 'Goulot QA détecté', checkeredFlagAllDone: 'Drapeau à damier ! Tous les tickets terminés !' })
ensure('es', { pitLaneProgress: 'Progreso Pit Lane', qaStatus: 'Estado QA', noIssuesToTrack: 'No hay tickets para seguir', garage: 'Garaje', onTrack: 'En Pista', pitStop: 'Pit Stop', finish: 'Meta', raceCompletion: 'Finalización de la Carrera', issues: 'tickets', inPitStopTesting: 'en Pit Stop (Pruebas)', qaBottleneckDetected: 'Cuello de botella QA detectado', checkeredFlagAllDone: '¡Bandera a cuadros! ¡Todos los tickets completos!' })
ensure('pt', { pitLaneProgress: 'Progresso Pit Lane', qaStatus: 'Status QA', noIssuesToTrack: 'Sem tickets para acompanhar', garage: 'Garagem', onTrack: 'Na Pista', pitStop: 'Pit Stop', finish: 'Chegada', raceCompletion: 'Conclusão da Corrida', issues: 'itens', inPitStopTesting: 'no Pit Stop (Teste)', qaBottleneckDetected: 'Gargalo de QA detectado', checkeredFlagAllDone: 'Bandeira quadriculada! Todos os itens concluídos!' })
ensure('en', { raceStrategyAnalysis: 'Race Strategy Analysis', calculatingFlowMetrics: 'Calculating flow metrics...', safeFlow: 'SAFe Flow', strategyMix: 'Strategy Mix', lapsCompleted: 'Laps Completed', items: 'items', sectorTimeLeadTime: 'Sector Time (Lead Time)', average: 'Average', median: 'Median', p85: 'P85', fuelLoadWip: 'Fuel Load (WIP)', autoDetectedIssueTypes: 'Auto-Detected Issue Types' })
ensure('fr', { raceStrategyAnalysis: 'Analyse de Stratégie de Course', calculatingFlowMetrics: 'Calcul des métriques de flux...', safeFlow: 'Flux SAFe', strategyMix: 'Mix de Stratégie', lapsCompleted: 'Tours Complétés', items: 'éléments', sectorTimeLeadTime: 'Temps de Secteur (Lead Time)', average: 'Moyenne', median: 'Médiane', p85: 'P85', fuelLoadWip: 'Charge de Carburant (WIP)', autoDetectedIssueTypes: 'Types de tickets détectés automatiquement' })
ensure('es', { raceStrategyAnalysis: 'Análisis de Estrategia de Carrera', calculatingFlowMetrics: 'Calculando métricas de flujo...', safeFlow: 'Flujo SAFe', strategyMix: 'Mezcla de Estrategia', lapsCompleted: 'Vueltas Completadas', items: 'elementos', sectorTimeLeadTime: 'Tiempo de Sector (Lead Time)', average: 'Promedio', median: 'Mediana', p85: 'P85', fuelLoadWip: 'Carga de Combustible (WIP)', autoDetectedIssueTypes: 'Tipos de tickets detectados automáticamente' })
ensure('pt', { raceStrategyAnalysis: 'Análise de Estratégia de Corrida', calculatingFlowMetrics: 'Calculando métricas de fluxo...', safeFlow: 'Fluxo SAFe', strategyMix: 'Mix de Estratégia', lapsCompleted: 'Voltas Completas', items: 'itens', sectorTimeLeadTime: 'Tempo de Setor (Lead Time)', average: 'Média', median: 'Mediana', p85: 'P85', fuelLoadWip: 'Carga de Combustível (WIP)', autoDetectedIssueTypes: 'Tipos de itens detectados automaticamente' })
ensure('en', { dailyStandupReport: 'Daily Standup Report', raceTelemetry: 'Race Telemetry', driverAssignments: 'Driver Assignments', active: 'active', quickStats: 'Quick Stats', totalIssues: 'Total Issues', generatedByApp: 'Generated by Pit Wall Strategist 🏁', standupCopied: 'Standup summary copied to clipboard!', exportStandup: 'Export Standup' })
ensure('fr', { dailyStandupReport: 'Compte-rendu quotidien', raceTelemetry: 'Télémétrie de Course', driverAssignments: 'Affectations des Pilotes', active: 'actif', quickStats: 'Statistiques rapides', totalIssues: 'Total des tickets', generatedByApp: 'Généré par Pit Wall Strategist 🏁', standupCopied: 'Résumé Standup copié dans le presse-papiers !', exportStandup: 'Exporter Standup' })
ensure('es', { dailyStandupReport: 'Informe Diario', raceTelemetry: 'Telemetría de Carrera', driverAssignments: 'Asignaciones de Pilotos', active: 'activo', quickStats: 'Estadísticas rápidas', totalIssues: 'Total de tickets', generatedByApp: 'Generado por Pit Wall Strategist 🏁', standupCopied: '¡Resumen de standup copiado al portapapeles!', exportStandup: 'Exportar Standup' })
ensure('pt', { dailyStandupReport: 'Relatório Diário', raceTelemetry: 'Telemetria de Corrida', driverAssignments: 'Atribuições dos Pilotos', active: 'ativo', quickStats: 'Estatísticas rápidas', totalIssues: 'Total de itens', generatedByApp: 'Gerado por Pit Wall Strategist 🏁', standupCopied: 'Resumo do standup copiado para a área de transferência!', exportStandup: 'Exportar Standup' })
ensure('en', { strategy: 'STRATEGY', recShort: 'rec:', switchBoard: 'Switch Board', loadingBoards: 'Loading boards...', noBoardsFound: 'No boards found', selectYourView: 'Select Your View' })
ensure('fr', { strategy: 'STRATÉGIE', recShort: 'reco :', switchBoard: 'Changer de tableau', loadingBoards: 'Chargement des tableaux...', noBoardsFound: 'Aucun tableau', selectYourView: 'Choisir la vue' })
ensure('es', { strategy: 'ESTRATEGIA', recShort: 'reco:', switchBoard: 'Cambiar tablero', loadingBoards: 'Cargando tableros...', noBoardsFound: 'No hay tableros', selectYourView: 'Selecciona tu vista' })
ensure('pt', { strategy: 'ESTRATÉGIA', recShort: 'reco:', switchBoard: 'Trocar quadro', loadingBoards: 'Carregando quadros...', noBoardsFound: 'Nenhum quadro', selectYourView: 'Selecione sua visão' })
ensure('en', { waitingOnYou: 'Waiting on you', ticketsBlockedByYou: 'Tickets Blocked by You', more: 'more', taggedWaitingOnYou: 'Tagged as waiting on you', mentionedInBlockedTicket: 'Mentioned in blocked ticket', yourTicketAwaitingReview: 'Your ticket awaiting review', explicitlyBlockedByYou: 'Explicitly blocked by you' })
ensure('fr', { waitingOnYou: 'En attente de vous', ticketsBlockedByYou: 'Tickets bloqués par vous', more: 'plus', taggedWaitingOnYou: 'Marqué en attente de vous', mentionedInBlockedTicket: 'Mentionné dans un ticket bloqué', yourTicketAwaitingReview: 'Votre ticket en attente de revue', explicitlyBlockedByYou: 'Bloqué explicitement par vous' })
ensure('es', { waitingOnYou: 'Esperando por ti', ticketsBlockedByYou: 'Tickets bloqueados por ti', more: 'más', taggedWaitingOnYou: 'Marcado como esperando por ti', mentionedInBlockedTicket: 'Mencionado en ticket bloqueado', yourTicketAwaitingReview: 'Tu ticket en espera de revisión', explicitlyBlockedByYou: 'Bloqueado explícitamente por ti' })
ensure('pt', { waitingOnYou: 'Aguardando você', ticketsBlockedByYou: 'Itens bloqueados por você', more: 'mais', taggedWaitingOnYou: 'Marcado como aguardando você', mentionedInBlockedTicket: 'Mencionado em item bloqueado', yourTicketAwaitingReview: 'Seu item aguardando revisão', explicitlyBlockedByYou: 'Bloqueado explicitamente por você' })
ensure('en', { executePitStrategy: 'Execute pit strategy', targetIssue: 'Target Issue', key: 'Key', summary: 'Summary', proposedChanges: 'Proposed Changes', willBeUpdated: 'Will be updated', cancel: 'Cancel', executing: 'Executing...', confirmStrategy: 'Confirm Strategy', daysShort: 'd', inStatus: 'in status', tactics: 'Tactics', urgent: '🔥 URGENT', suggested: '✓ SUGGESTED', priority: 'Priority', task: 'Task' })
ensure('fr', { executePitStrategy: 'Exécuter la stratégie de pit', targetIssue: 'Ticket cible', key: 'Clé', summary: 'Résumé', proposedChanges: 'Changements proposés', willBeUpdated: 'Sera mis à jour', cancel: 'Annuler', executing: 'Exécution...', confirmStrategy: 'Confirmer la stratégie', daysShort: 'j', inStatus: 'dans le statut', tactics: 'Tactiques', urgent: '🔥 URGENT', suggested: '✓ SUGGÉRÉ', priority: 'Priorité', task: 'Tâche' })
ensure('es', { executePitStrategy: 'Ejecutar estrategia de pit', targetIssue: 'Ticket objetivo', key: 'Clave', summary: 'Resumen', proposedChanges: 'Cambios propuestos', willBeUpdated: 'Se actualizará', cancel: 'Cancelar', executing: 'Ejecutando...', confirmStrategy: 'Confirmar estrategia', daysShort: 'd', inStatus: 'en estado', tactics: 'Tácticas', urgent: '🔥 URGENTE', suggested: '✓ SUGERIDO', priority: 'Prioridad', task: 'Tarea' })
ensure('pt', { executePitStrategy: 'Executar estratégia de pit', targetIssue: 'Item alvo', key: 'Chave', summary: 'Resumo', proposedChanges: 'Alterações propostas', willBeUpdated: 'Será atualizado', cancel: 'Cancelar', executing: 'Executando...', confirmStrategy: 'Confirmar estratégia', daysShort: 'd', inStatus: 'no status', tactics: 'Táticas', urgent: '🔥 URGENTE', suggested: '✓ SUGERIDO', priority: 'Prioridade', task: 'Tarefa' })

ensure('en', { flow_features: 'Features', flow_defects: 'Defects', flow_risks: 'Risks', flow_debt: 'Debt', flow_other: 'Other' })
ensure('fr', { flow_features: 'Fonctionnalités', flow_defects: 'Défauts', flow_risks: 'Risques', flow_debt: 'Dette Technique', flow_other: 'Autre' })
ensure('es', { flow_features: 'Funcionalidades', flow_defects: 'Defectos', flow_risks: 'Riesgos', flow_debt: 'Deuda Técnica', flow_other: 'Otro' })
ensure('pt', { flow_features: 'Funcionalidades', flow_defects: 'Defeitos', flow_risks: 'Riscos', flow_debt: 'Dívida Técnica', flow_other: 'Outro' })

// =============================================================================
// POPULATION-SPECIFIC TERMINOLOGY
// Three modes: scrum (sprint teams), flow (kanban/lean teams), process (business teams)
// =============================================================================

// --- SCRUM MODE (Software + Scrum Board) ---
ensure('en', {
  pop_scrum_telemetryTitle: 'Sprint Telemetry',
  pop_scrum_workContainer: 'Sprint',
  pop_scrum_progressMetric: 'Velocity',
  pop_scrum_timeMetric: 'Sprint Progress',
  pop_scrum_workItems: 'Sprint Backlog',
  pop_scrum_health: 'Sprint Health',
  pop_scrum_completion: 'Sprint Completion',
  pop_scrum_stalled: 'Blocked',
  pop_scrum_overload: 'Sprint Overcommit',
  pop_scrum_load: 'Sprint Load',
  pop_scrum_prediction: 'Sprint Prediction',
  pop_scrum_modeDesc: 'Scrum mode: Tracking sprint-based delivery.',
  pop_scrum_noActiveWork: 'No issues in active sprint',
  pop_scrum_emptyHint: 'Add issues to your sprint to see telemetry.'
})
ensure('fr', {
  pop_scrum_telemetryTitle: 'Télémétrie du Sprint',
  pop_scrum_workContainer: 'Sprint',
  pop_scrum_progressMetric: 'Vélocité',
  pop_scrum_timeMetric: 'Progression du Sprint',
  pop_scrum_workItems: 'Backlog du Sprint',
  pop_scrum_health: 'Santé du Sprint',
  pop_scrum_completion: 'Complétion du Sprint',
  pop_scrum_stalled: 'Bloqué',
  pop_scrum_overload: 'Sprint Surchargé',
  pop_scrum_load: 'Charge du Sprint',
  pop_scrum_prediction: 'Prédiction Sprint',
  pop_scrum_modeDesc: 'Mode Scrum : Suivi des sprints.',
  pop_scrum_noActiveWork: 'Aucun ticket dans le sprint actif',
  pop_scrum_emptyHint: 'Ajoutez des tickets au sprint pour voir la télémétrie.'
})
ensure('es', {
  pop_scrum_telemetryTitle: 'Telemetría del Sprint',
  pop_scrum_workContainer: 'Sprint',
  pop_scrum_progressMetric: 'Velocidad',
  pop_scrum_timeMetric: 'Progreso del Sprint',
  pop_scrum_workItems: 'Backlog del Sprint',
  pop_scrum_health: 'Salud del Sprint',
  pop_scrum_completion: 'Completado del Sprint',
  pop_scrum_stalled: 'Bloqueado',
  pop_scrum_overload: 'Sprint Sobrecargado',
  pop_scrum_load: 'Carga del Sprint',
  pop_scrum_prediction: 'Predicción Sprint',
  pop_scrum_modeDesc: 'Modo Scrum: Seguimiento de sprints.',
  pop_scrum_noActiveWork: 'No hay tickets en sprint activo',
  pop_scrum_emptyHint: 'Agrega tickets al sprint para ver telemetría.'
})
ensure('pt', {
  pop_scrum_telemetryTitle: 'Telemetria do Sprint',
  pop_scrum_workContainer: 'Sprint',
  pop_scrum_progressMetric: 'Velocidade',
  pop_scrum_timeMetric: 'Progresso do Sprint',
  pop_scrum_workItems: 'Backlog do Sprint',
  pop_scrum_health: 'Saúde do Sprint',
  pop_scrum_completion: 'Conclusão do Sprint',
  pop_scrum_stalled: 'Bloqueado',
  pop_scrum_overload: 'Sprint Sobrecarregado',
  pop_scrum_load: 'Carga do Sprint',
  pop_scrum_prediction: 'Predição Sprint',
  pop_scrum_modeDesc: 'Modo Scrum: Acompanhamento de sprints.',
  pop_scrum_noActiveWork: 'Nenhum item no sprint ativo',
  pop_scrum_emptyHint: 'Adicione itens ao sprint para ver telemetria.'
})

// --- FLOW MODE (Software + Kanban Board) ---
ensure('en', {
  pop_flow_telemetryTitle: 'Flow Telemetry',
  pop_flow_workContainer: 'Flow',
  pop_flow_progressMetric: 'Throughput',
  pop_flow_timeMetric: 'Cycle Time',
  pop_flow_workItems: 'Work In Progress',
  pop_flow_health: 'Flow Health',
  pop_flow_completion: 'Flow Efficiency',
  pop_flow_stalled: 'Stalled',
  pop_flow_overload: 'WIP Exceeded',
  pop_flow_load: 'Flow Load',
  pop_flow_prediction: 'Flow Forecast',
  pop_flow_modeDesc: 'Kanban mode: Continuous flow monitoring.',
  pop_flow_noActiveWork: 'No items in progress',
  pop_flow_emptyHint: 'Start working on items to see flow metrics.'
})
ensure('fr', {
  pop_flow_telemetryTitle: 'Télémétrie du Flux',
  pop_flow_workContainer: 'Flux',
  pop_flow_progressMetric: 'Débit',
  pop_flow_timeMetric: 'Temps de Cycle',
  pop_flow_workItems: 'Travail en Cours',
  pop_flow_health: 'Santé du Flux',
  pop_flow_completion: 'Efficacité du Flux',
  pop_flow_stalled: 'En Panne',
  pop_flow_overload: 'WIP Dépassé',
  pop_flow_load: 'Charge du Flux',
  pop_flow_prediction: 'Prévision du Flux',
  pop_flow_modeDesc: 'Mode Kanban : Suivi du flux continu.',
  pop_flow_noActiveWork: 'Aucun élément en cours',
  pop_flow_emptyHint: 'Commencez à travailler sur des éléments pour voir les métriques.'
})
ensure('es', {
  pop_flow_telemetryTitle: 'Telemetría de Flujo',
  pop_flow_workContainer: 'Flujo',
  pop_flow_progressMetric: 'Rendimiento',
  pop_flow_timeMetric: 'Tiempo de Ciclo',
  pop_flow_workItems: 'Trabajo en Progreso',
  pop_flow_health: 'Salud del Flujo',
  pop_flow_completion: 'Eficiencia del Flujo',
  pop_flow_stalled: 'Detenido',
  pop_flow_overload: 'WIP Excedido',
  pop_flow_load: 'Carga del Flujo',
  pop_flow_prediction: 'Pronóstico del Flujo',
  pop_flow_modeDesc: 'Modo Kanban: Monitoreo de flujo continuo.',
  pop_flow_noActiveWork: 'Ningún elemento en progreso',
  pop_flow_emptyHint: 'Comienza a trabajar en elementos para ver métricas de flujo.'
})
ensure('pt', {
  pop_flow_telemetryTitle: 'Telemetria de Fluxo',
  pop_flow_workContainer: 'Fluxo',
  pop_flow_progressMetric: 'Vazão',
  pop_flow_timeMetric: 'Tempo de Ciclo',
  pop_flow_workItems: 'Trabalho em Progresso',
  pop_flow_health: 'Saúde do Fluxo',
  pop_flow_completion: 'Eficiência do Fluxo',
  pop_flow_stalled: 'Parado',
  pop_flow_overload: 'WIP Excedido',
  pop_flow_load: 'Carga do Fluxo',
  pop_flow_prediction: 'Previsão do Fluxo',
  pop_flow_modeDesc: 'Modo Kanban: Monitoramento de fluxo contínuo.',
  pop_flow_noActiveWork: 'Nenhum item em progresso',
  pop_flow_emptyHint: 'Comece a trabalhar em itens para ver métricas de fluxo.'
})

// --- POPULATION MODES (Scrum, Flow, Process) ---
ensure('en', {
  pop_scrum_wipLimitLabel: 'WIP Limit (Fuel)',
  pop_scrum_assigneeCapacityLabel: 'Assignee Capacity (Tire)',
  pop_scrum_stalledThresholdLabel: 'Stalled Threshold (Pit Window)',
  pop_scrum_sprint: 'Sprint',
  pop_scrum_epic: 'Epic',
  pop_scrum_velocity: 'Velocity',
  pop_scrum_modeDesc: 'Scrum mode: Tracking active sprint progress.',
  pop_flow_wipLimitLabel: 'WIP Limit (Pit Capacity)',
  pop_flow_assigneeCapacityLabel: 'Assignee Capacity (Pressure)',
  pop_flow_stalledThresholdLabel: 'Stalled Threshold (Sector Lag)',
  pop_flow_sprint: 'Cycle',
  pop_flow_epic: 'Initiative',
  pop_flow_velocity: 'Throughput',
  pop_flow_modeDesc: 'Kanban mode: No sprints, continuous flow monitoring.',
  pop_process_wipLimitLabel: 'Active Task Limit (Load)',
  pop_process_assigneeCapacityLabel: 'Staff Capacity (Availability)',
  pop_process_stalledThresholdLabel: 'Idle Threshold (Aging)',
  pop_process_sprint: 'Workflow Period',
  pop_process_epic: 'Project',
  pop_process_velocity: 'Output Rate',
  pop_process_telemetryTitle: 'Process Dashboard',
  pop_process_workContainer: 'Queue',
  pop_process_progressMetric: 'Delivery Rate',
  pop_process_timeMetric: 'Lead Time',
  pop_process_workItems: 'Active Tasks',
  pop_process_health: 'Process Health',
  pop_process_completion: 'Task Completion',
  pop_process_stalled: 'Stuck',
  pop_process_overload: 'Queue Overflow',
  pop_process_load: 'Queue Load',
  pop_process_prediction: 'Delivery Forecast',
  pop_process_modeDesc: 'Business mode: Process and task management.',
  pop_process_noActiveWork: 'No active tasks',
  pop_process_emptyHint: 'Create tasks to see your process dashboard.'
})
ensure('fr', {
  pop_scrum_wipLimitLabel: 'Limite WIP (Carburant)',
  pop_scrum_assigneeCapacityLabel: 'Capacité par Personne (Pneu)',
  pop_scrum_stalledThresholdLabel: 'Seuil de Blocage (Fenêtre Stand)',
  pop_scrum_sprint: 'Sprint',
  pop_scrum_epic: 'Épique',
  pop_scrum_velocity: 'Vélocité',
  pop_scrum_modeDesc: 'Mode Scrum : Suivi de la progression du sprint actif.',
  pop_flow_wipLimitLabel: 'Limite WIP (Capacité Stand)',
  pop_flow_assigneeCapacityLabel: 'Capacité par Personne (Pression)',
  pop_flow_stalledThresholdLabel: 'Seuil de Blocage (Retard Secteur)',
  pop_flow_sprint: 'Cycle',
  pop_flow_epic: 'Initiative',
  pop_flow_velocity: 'Débit',
  pop_flow_modeDesc: 'Mode Kanban : Sans sprints, flux continu.',
  pop_process_wipLimitLabel: 'Limite Tâches (Charge)',
  pop_process_assigneeCapacityLabel: 'Capacité Staff (Disponibilité)',
  pop_process_stalledThresholdLabel: 'Seuil Inactif (Vieillissement)',
  pop_process_sprint: 'Période',
  pop_process_epic: 'Projet',
  pop_process_velocity: 'Taux Qualité',
  pop_process_telemetryTitle: 'Tableau de Bord Processus',
  pop_process_workContainer: 'File d\'Attente',
  pop_process_progressMetric: 'Taux de Livraison',
  pop_process_timeMetric: 'Délai de Livraison',
  pop_process_workItems: 'Tâches Actives',
  pop_process_health: 'Santé du Processus',
  pop_process_completion: 'Achèvement des Tâches',
  pop_process_stalled: 'Bloqué',
  pop_process_overload: 'File Saturée',
  pop_process_load: 'Charge de la File',
  pop_process_prediction: 'Prévision de Livraison',
  pop_process_modeDesc: 'Mode Business : Gestion des processus et tâches.',
  pop_process_noActiveWork: 'Aucune tâche active',
  pop_process_emptyHint: 'Créez des tâches pour voir votre tableau de bord.'
})
ensure('es', {
  pop_scrum_wipLimitLabel: 'Límite WIP (Combustible)',
  pop_scrum_assigneeCapacityLabel: 'Capacidad Asignado (Neumático)',
  pop_scrum_stalledThresholdLabel: 'Umbral de Bloqueo (Ventana Box)',
  pop_scrum_sprint: 'Sprint',
  pop_scrum_epic: 'Épica',
  pop_scrum_velocity: 'Velocidad',
  pop_scrum_modeDesc: 'Modo Scrum: Seguimiento del progreso del sprint activo.',
  pop_flow_wipLimitLabel: 'Límite WIP (Capacidad Boxes)',
  pop_flow_assigneeCapacityLabel: 'Capacidad Asignado (Presión)',
  pop_flow_stalledThresholdLabel: 'Umbral de Bloqueo (Retraso Sector)',
  pop_flow_sprint: 'Ciclo',
  pop_flow_epic: 'Iniciativa',
  pop_flow_velocity: 'Rendimiento',
  pop_flow_modeDesc: 'Modo Kanban: Sin sprints, monitoreo de flujo continuo.',
  pop_process_wipLimitLabel: 'Límite de Tareas (Carga)',
  pop_process_assigneeCapacityLabel: 'Capacidad Staff (Disponibilidad)',
  pop_process_stalledThresholdLabel: 'Umbral de Inactividad (Envejecimiento)',
  pop_process_sprint: 'Periodo',
  pop_process_epic: 'Proyecto',
  pop_process_velocity: 'Tasa de Salida',
  pop_process_telemetryTitle: 'Panel de Procesos',
  pop_process_workContainer: 'Cola',
  pop_process_progressMetric: 'Tasa de Entrega',
  pop_process_timeMetric: 'Tiempo de Entrega',
  pop_process_workItems: 'Tareas Activas',
  pop_process_health: 'Salud del Proceso',
  pop_process_completion: 'Finalización de Tareas',
  pop_process_stalled: 'Atascado',
  pop_process_overload: 'Cola Saturada',
  pop_process_load: 'Carga de la Cola',
  pop_process_prediction: 'Pronóstico de Entrega',
  pop_process_modeDesc: 'Modo Business: Gestión de procesos y tareas.',
  pop_process_noActiveWork: 'No hay tareas activas',
  pop_process_emptyHint: 'Crea tareas para ver tu panel de procesos.'
})
ensure('pt', {
  pop_scrum_wipLimitLabel: 'Limite WIP (Combustível)',
  pop_scrum_assigneeCapacityLabel: 'Capacidade por Pessoa (Pneu)',
  pop_scrum_stalledThresholdLabel: 'Limite de Paralisação (Janela do Pit)',
  pop_scrum_sprint: 'Sprint',
  pop_scrum_epic: 'Épico',
  pop_scrum_velocity: 'Velocidade',
  pop_scrum_modeDesc: 'Modo Scrum: Acompanhamento do progresso do sprint ativo.',
  pop_flow_wipLimitLabel: 'Limite WIP (Capacidade Boxes)',
  pop_flow_assigneeCapacityLabel: 'Capacidade por Pessoa (Pressão)',
  pop_flow_stalledThresholdLabel: 'Limite de Paralisação (Atraso Setor)',
  pop_flow_sprint: 'Ciclo',
  pop_flow_epic: 'Iniciativa',
  pop_flow_velocity: 'Vazão',
  pop_flow_modeDesc: 'Modo Kanban: Sem sprints, monitoramento de fluxo contínuo.',
  pop_process_wipLimitLabel: 'Limite de Tarefas (Carga)',
  pop_process_assigneeCapacityLabel: 'Capacidade Staff (Disponibilidade)',
  pop_process_stalledThresholdLabel: 'Limite de Inatividade (Envelhecimento)',
  pop_process_sprint: 'Período',
  pop_process_epic: 'Projeto',
  pop_process_velocity: 'Taxa de Saída',
  pop_process_telemetryTitle: 'Painel de Processos',
  pop_process_workContainer: 'Fila',
  pop_process_progressMetric: 'Taxa de Entrega',
  pop_process_timeMetric: 'Tempo de Entrega',
  pop_process_workItems: 'Tarefas Ativas',
  pop_process_health: 'Saúde do Processo',
  pop_process_completion: 'Conclusão de Tarefas',
  pop_process_stalled: 'Travado',
  pop_process_overload: 'Fila Saturada',
  pop_process_load: 'Carga da Fila',
  pop_process_prediction: 'Previsão de Entrega',
  pop_process_modeDesc: 'Modo Business: Gestão de processos e tarefas.',
  pop_process_noActiveWork: 'Nenhuma tarefa ativa',
  pop_process_emptyHint: 'Crie tarefas para ver seu painel de processos.'
})

// =============================================================================
// HEALTH GAUGE FACTOR LABELS (Population-Specific)
// These are the 4 factors shown in SprintHealthGauge / Process Health panels
// =============================================================================

// --- SCRUM FACTOR LABELS ---
ensure('en', {
  pop_scrum_factor_pace: 'PACE',
  pop_scrum_factor_time: 'TAC',
  pop_scrum_factor_flow: 'FLOW',
  pop_scrum_factor_scope: 'SCOPE',
  pop_scrum_factor_pace_tooltip: 'Velocity Rate vs Historical',
  pop_scrum_factor_time_tooltip: 'Time Against Completion',
  pop_scrum_factor_flow_tooltip: 'Flow Efficiency (stall-free)',
  pop_scrum_factor_scope_tooltip: 'Scope Stability'
})
ensure('fr', {
  pop_scrum_factor_pace: 'RYTHME',
  pop_scrum_factor_time: 'TEMPS',
  pop_scrum_factor_flow: 'FLUX',
  pop_scrum_factor_scope: 'SCOPE',
  pop_scrum_factor_pace_tooltip: 'Vélocité vs Historique',
  pop_scrum_factor_time_tooltip: 'Temps avant Fin',
  pop_scrum_factor_flow_tooltip: 'Efficacité du Flux',
  pop_scrum_factor_scope_tooltip: 'Stabilité du Scope'
})
ensure('es', {
  pop_scrum_factor_pace: 'RITMO',
  pop_scrum_factor_time: 'TIEMPO',
  pop_scrum_factor_flow: 'FLUJO',
  pop_scrum_factor_scope: 'ALCANCE',
  pop_scrum_factor_pace_tooltip: 'Velocidad vs Historial',
  pop_scrum_factor_time_tooltip: 'Tiempo Restante',
  pop_scrum_factor_flow_tooltip: 'Eficiencia del Flujo',
  pop_scrum_factor_scope_tooltip: 'Estabilidad del Alcance'
})
ensure('pt', {
  pop_scrum_factor_pace: 'RITMO',
  pop_scrum_factor_time: 'TEMPO',
  pop_scrum_factor_flow: 'FLUXO',
  pop_scrum_factor_scope: 'ESCOPO',
  pop_scrum_factor_pace_tooltip: 'Velocidade vs Histórico',
  pop_scrum_factor_time_tooltip: 'Tempo Restante',
  pop_scrum_factor_flow_tooltip: 'Eficiência do Fluxo',
  pop_scrum_factor_scope_tooltip: 'Estabilidade do Escopo'
})

// --- FLOW (KANBAN) FACTOR LABELS ---
ensure('en', {
  pop_flow_factor_pace: 'RATE',
  pop_flow_factor_time: 'CYCLE',
  pop_flow_factor_flow: 'FLOW',
  pop_flow_factor_scope: 'WIP',
  pop_flow_factor_pace_tooltip: 'Throughput Rate',
  pop_flow_factor_time_tooltip: 'Cycle Time Trend',
  pop_flow_factor_flow_tooltip: 'Flow Efficiency',
  pop_flow_factor_scope_tooltip: 'WIP Stability'
})
ensure('fr', {
  pop_flow_factor_pace: 'DÉBIT',
  pop_flow_factor_time: 'CYCLE',
  pop_flow_factor_flow: 'FLUX',
  pop_flow_factor_scope: 'WIP',
  pop_flow_factor_pace_tooltip: 'Taux de Débit',
  pop_flow_factor_time_tooltip: 'Tendance Temps de Cycle',
  pop_flow_factor_flow_tooltip: 'Efficacité du Flux',
  pop_flow_factor_scope_tooltip: 'Stabilité WIP'
})
ensure('es', {
  pop_flow_factor_pace: 'TASA',
  pop_flow_factor_time: 'CICLO',
  pop_flow_factor_flow: 'FLUJO',
  pop_flow_factor_scope: 'WIP',
  pop_flow_factor_pace_tooltip: 'Tasa de Rendimiento',
  pop_flow_factor_time_tooltip: 'Tendencia del Tiempo de Ciclo',
  pop_flow_factor_flow_tooltip: 'Eficiencia del Flujo',
  pop_flow_factor_scope_tooltip: 'Estabilidad WIP'
})
ensure('pt', {
  pop_flow_factor_pace: 'TAXA',
  pop_flow_factor_time: 'CICLO',
  pop_flow_factor_flow: 'FLUXO',
  pop_flow_factor_scope: 'WIP',
  pop_flow_factor_pace_tooltip: 'Taxa de Vazão',
  pop_flow_factor_time_tooltip: 'Tendência do Tempo de Ciclo',
  pop_flow_factor_flow_tooltip: 'Eficiência do Fluxo',
  pop_flow_factor_scope_tooltip: 'Estabilidade WIP'
})

// --- PROCESS (BUSINESS) FACTOR LABELS ---
ensure('en', {
  pop_process_factor_pace: 'OUTPUT',
  pop_process_factor_time: 'LEAD',
  pop_process_factor_flow: 'FLOW',
  pop_process_factor_scope: 'QUEUE',
  pop_process_factor_pace_tooltip: 'Delivery Output Rate',
  pop_process_factor_time_tooltip: 'Lead Time Trend',
  pop_process_factor_flow_tooltip: 'Process Flow',
  pop_process_factor_scope_tooltip: 'Queue Stability'
})
ensure('fr', {
  pop_process_factor_pace: 'SORTIE',
  pop_process_factor_time: 'DÉLAI',
  pop_process_factor_flow: 'FLUX',
  pop_process_factor_scope: 'FILE',
  pop_process_factor_pace_tooltip: 'Taux de Livraison',
  pop_process_factor_time_tooltip: 'Tendance Délai',
  pop_process_factor_flow_tooltip: 'Flux du Processus',
  pop_process_factor_scope_tooltip: 'Stabilité de la File'
})
ensure('es', {
  pop_process_factor_pace: 'SALIDA',
  pop_process_factor_time: 'PLAZO',
  pop_process_factor_flow: 'FLUJO',
  pop_process_factor_scope: 'COLA',
  pop_process_factor_pace_tooltip: 'Tasa de Entrega',
  pop_process_factor_time_tooltip: 'Tendencia del Plazo',
  pop_process_factor_flow_tooltip: 'Flujo del Proceso',
  pop_process_factor_scope_tooltip: 'Estabilidad de la Cola'
})
ensure('pt', {
  pop_process_factor_pace: 'SAÍDA',
  pop_process_factor_time: 'PRAZO',
  pop_process_factor_flow: 'FLUXO',
  pop_process_factor_scope: 'FILA',
  pop_process_factor_pace_tooltip: 'Taxa de Entrega',
  pop_process_factor_time_tooltip: 'Tendência do Prazo',
  pop_process_factor_flow_tooltip: 'Fluxo do Processo',
  pop_process_factor_scope_tooltip: 'Estabilidade da Fila'
})

// --- HEALTH PANEL TITLE (Population-Specific) ---
ensure('en', {
  pop_scrum_healthTitle: 'SPRINT HEALTH PREDICTOR',
  pop_flow_healthTitle: 'FLOW HEALTH',
  pop_process_healthTitle: 'PROCESS HEALTH'
})
ensure('fr', {
  pop_scrum_healthTitle: 'PRÉDICTEUR DE SANTÉ DU SPRINT',
  pop_flow_healthTitle: 'SANTÉ DU FLUX',
  pop_process_healthTitle: 'SANTÉ DU PROCESSUS'
})
ensure('es', {
  pop_scrum_healthTitle: 'PREDICTOR DE SALUD DEL SPRINT',
  pop_flow_healthTitle: 'SALUD DEL FLUJO',
  pop_process_healthTitle: 'SALUD DEL PROCESO'
})
ensure('pt', {
  pop_scrum_healthTitle: 'PREDITOR DE SAÚDE DO SPRINT',
  pop_flow_healthTitle: 'SAÚDE DO FLUXO',
  pop_process_healthTitle: 'SAÚDE DO PROCESSO'
})


/**
 * Population-adaptive translation helper.
 * Returns the most appropriate term based on the population/board type or internal population mode.
 * Accepts: 'scrum' | 'kanban' | 'business' OR 'scrum' | 'flow' | 'process'
 */
export function tPop(key: string, mode: string, locale: string = 'en'): string {
  let population = mode;
  if (mode === 'kanban') population = 'flow';
  if (mode === 'business') population = 'process';

  // Look for population-specific keys first, e.g., "pop_scrum_sprint", "pop_flow_sprint", "pop_process_sprint"
  const popKey = `pop_${population}_${key}`;
  const translated = t(popKey, locale);

  // If pop-specific translation exists and is not just the key string, return it
  if (translated !== popKey) return translated;

  // Fallback to the generic key
  return t(key, locale);
}



// =============================================================================
// BACKEND EXPLANATION TRANSLATIONS
// These translate the dynamic explanation strings returned from MetricCalculator
// =============================================================================

ensure('en', {
  exp_noWipLimit: 'No WIP limit configured.',
  exp_noClosedSprints: 'No closed sprints found to calculate velocity.',
  exp_noCompletedIssuesRecent: 'No completed issues found in recent history.',
  exp_noCompletedIssues: 'No completed issues to analyze.',
  exp_insufficientData: 'Insufficient data.',
  exp_insufficientHistoryWip: 'Insufficient history for WIP trends.',
  exp_wipZero: 'WIP is consistently zero.',
  exp_noCompletedFound: 'No completed issues found.',
  exp_velocitySprints: 'Completed issues over last {count} sprints',
  exp_velocityAvgSprints: 'Average completed {unit} across {count} closed sprints.',
  exp_velocityAvgSprintsFallback: 'Average completed {unit} across {count} closed sprints (JQL fallback).',
  exp_velocitySprintsFallback: 'Average completed {unit} over last {count} sprints (fallback).',
  exp_pseudoVelocity: 'Estimated {unit} per 2 weeks (Pseudo-Velocity).',
  exp_cycleTimeChangelog: 'Average based on {count} issues (First Transition to Done): {days} days.',
  exp_cycleTimeResolution: 'Based on {count} issues (Created to Resolved): {days} days.',
  exp_throughputTotal: 'Total items completed in last {days} days.',
  exp_throughputAvg: 'Average items per week (over {days} days).',
  exp_wipDeviation: 'WIP Deviation: {deviation} (Avg WIP: {avg}).'
})

ensure('fr', {
  exp_noWipLimit: 'Aucune limite WIP configurée.',
  exp_noClosedSprints: 'Aucun sprint fermé trouvé pour calculer la vélocité.',
  exp_noCompletedIssuesRecent: 'Aucun ticket complété dans l\'historique récent.',
  exp_noCompletedIssues: 'Aucun ticket complété à analyser.',
  exp_insufficientData: 'Données insuffisantes.',
  exp_insufficientHistoryWip: 'Historique insuffisant pour les tendances WIP.',
  exp_wipZero: 'Le WIP est constamment à zéro.',
  exp_noCompletedFound: 'Aucun ticket complété trouvé.',
  exp_velocitySprints: 'Tickets complétés sur les {count} derniers sprints',
  exp_velocityAvgSprints: 'Moyenne de {unit} complétés sur {count} sprints fermés.',
  exp_velocityAvgSprintsFallback: 'Moyenne de {unit} complétés sur {count} sprints fermés (fallback JQL).',
  exp_velocitySprintsFallback: 'Moyenne de {unit} complétés sur les {count} derniers sprints (fallback).',
  exp_pseudoVelocity: 'Estimation de {unit} par 2 semaines (Pseudo-Vélocité).',
  exp_cycleTimeChangelog: 'Moyenne basée sur {count} tickets (Première Transition à Terminé): {days} jours.',
  exp_cycleTimeResolution: 'Basé sur {count} tickets (Créé à Résolu): {days} jours.',
  exp_throughputTotal: 'Total des éléments complétés ces {days} derniers jours.',
  exp_throughputAvg: 'Moyenne d\'éléments par semaine (sur {days} jours).',
  exp_wipDeviation: 'Écart WIP: {deviation} (Moyenne WIP: {avg}).'
})

ensure('es', {
  exp_noWipLimit: 'No hay límite WIP configurado.',
  exp_noClosedSprints: 'No se encontraron sprints cerrados para calcular la velocidad.',
  exp_noCompletedIssuesRecent: 'No se encontraron tickets completados en el historial reciente.',
  exp_noCompletedIssues: 'No hay tickets completados para analizar.',
  exp_insufficientData: 'Datos insuficientes.',
  exp_insufficientHistoryWip: 'Historial insuficiente para tendencias WIP.',
  exp_wipZero: 'El WIP es constantemente cero.',
  exp_noCompletedFound: 'No se encontraron tickets completados.',
  exp_velocitySprints: 'Tickets completados en los últimos {count} sprints',
  exp_velocityAvgSprints: 'Promedio de {unit} completados en {count} sprints cerrados.',
  exp_velocityAvgSprintsFallback: 'Promedio de {unit} completados en {count} sprints cerrados (fallback JQL).',
  exp_velocitySprintsFallback: 'Promedio de {unit} completados en los últimos {count} sprints (fallback).',
  exp_pseudoVelocity: 'Estimación de {unit} por 2 semanas (Pseudo-Velocidad).',
  exp_cycleTimeChangelog: 'Promedio basado en {count} tickets (Primera Transición a Hecho): {days} días.',
  exp_cycleTimeResolution: 'Basado en {count} tickets (Creado a Resuelto): {days} días.',
  exp_throughputTotal: 'Total de elementos completados en los últimos {days} días.',
  exp_throughputAvg: 'Promedio de elementos por semana (en {days} días).',
  exp_wipDeviation: 'Desviación WIP: {deviation} (Promedio WIP: {avg}).'
})

ensure('pt', {
  exp_noWipLimit: 'Nenhum limite WIP configurado.',
  exp_noClosedSprints: 'Nenhum sprint fechado encontrado para calcular velocidade.',
  exp_noCompletedIssuesRecent: 'Nenhum item concluído encontrado no histórico recente.',
  exp_noCompletedIssues: 'Nenhum item concluído para analisar.',
  exp_insufficientData: 'Dados insuficientes.',
  exp_insufficientHistoryWip: 'Histórico insuficiente para tendências de WIP.',
  exp_wipZero: 'O WIP está constantemente em zero.',
  exp_noCompletedFound: 'Nenhum item concluído encontrado.',
  exp_velocitySprints: 'Itens concluídos nos últimos {count} sprints',
  exp_velocityAvgSprints: 'Média de {unit} concluídos em {count} sprints fechados.',
  exp_velocityAvgSprintsFallback: 'Média de {unit} concluídos em {count} sprints fechados (fallback JQL).',
  exp_velocitySprintsFallback: 'Média de {unit} concluídos nos últimos {count} sprints (fallback).',
  exp_pseudoVelocity: 'Estimativa de {unit} por 2 semanas (Pseudo-Velocidade).',
  exp_cycleTimeChangelog: 'Média baseada em {count} itens (Primeira Transição para Concluído): {days} dias.',
  exp_cycleTimeResolution: 'Baseado em {count} itens (Criado até Resolvido): {days} dias.',
  exp_throughputTotal: 'Total de itens concluídos nos últimos {days} dias.',
  exp_throughputAvg: 'Média de itens por semana (em {days} dias).',
  exp_wipDeviation: 'Desvio WIP: {deviation} (Média WIP: {avg}).'
})

/**
 * Translate backend explanation string
 * Backend returns explanation keys in format: "exp:key:param1:param2" or raw English strings
 * This function parses the key format and applies translations with params
 * 
 * @param explanation - The explanation string from backend
 * @param locale - Language code
 * @returns Translated explanation string
 */
export function tExp(explanation: string | undefined, locale: string = 'en'): string {
  if (!explanation) return ''

  // If it starts with "exp:", it's a translation key with params
  if (explanation.startsWith('exp:')) {
    const parts = explanation.split(':')
    const key = `exp_${parts[1]}`
    const params: Record<string, string> = {}

    // Parse params from format "exp:key:param1=val1:param2=val2"
    for (let i = 2; i < parts.length; i++) {
      const [paramKey, paramVal] = parts[i].split('=')
      if (paramKey && paramVal !== undefined) {
        params[paramKey] = paramVal
      }
    }

    let result = t(key, locale)
    // Replace placeholders like {count}, {days}, etc.
    Object.entries(params).forEach(([k, v]) => {
      result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v)
    })
    return result
  }

  // Fallback: return the raw string (for backward compatibility with existing English strings)
  return explanation
}



ensure('en', {
  liveFeed: 'LIVE FEED',
  strategy_boxBox: 'BOX BOX (CRITICAL ALERTS)'
})
ensure('fr', {
  liveFeed: 'DIRECT',
  strategy_boxBox: 'BOX BOX (ALERTES CRITIQUES)'
})
ensure('es', {
  liveFeed: 'EN VIVO',
  strategy_boxBox: 'BOX BOX (ALERTAS CRÍTICAS)'
})
ensure('pt', {
  liveFeed: 'AO VIVO',
  strategy_boxBox: 'BOX BOX (ALERTAS CRÍTICOS)'
})

// =============================================================================
// PRODUCTION HARDENING - Additional i18n keys for zero hardcoded strings
// =============================================================================

ensure('en', {
  metricUnavailable: 'Metric Data Unavailable',
  capacityPercent: '{percent}% Capacity',
  askRovoAnalysis: 'Ask Rovo for analysis',
  scopeCreepTitle: 'Scope Creep',
  scopeCreepPoints: 'Sprint scope increased by {points} points.'
})
ensure('fr', {
  metricUnavailable: 'Données indisponibles',
  capacityPercent: '{percent}% Capacité',
  askRovoAnalysis: 'Demander une analyse à Rovo',
  scopeCreepTitle: 'Dérive du Périmètre',
  scopeCreepPoints: 'Le périmètre du sprint a augmenté de {points} points.'
})
ensure('es', {
  metricUnavailable: 'Datos no disponibles',
  capacityPercent: '{percent}% Capacidad',
  askRovoAnalysis: 'Pedir análisis a Rovo',
  scopeCreepTitle: 'Aumento de Alcance',
  scopeCreepPoints: 'El alcance del sprint aumentó en {points} puntos.'
})
ensure('pt', {
  metricUnavailable: 'Dados não disponíveis',
  capacityPercent: '{percent}% Capacidade',
  askRovoAnalysis: 'Pedir análise ao Rovo',
  scopeCreepTitle: 'Aumento de Escopo',
  scopeCreepPoints: 'O escopo do sprint aumentou em {points} pontos.'
})
