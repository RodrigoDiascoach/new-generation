// Constantes e helpers partilhados entre AdminDashboard e Apresentacao.

export const CAMINHOS = ['sucessor', 'apoiante', 'independente', 'explorando']

export const CAMINHO_LABELS = {
  sucessor: 'Sucessor',
  apoiante: 'Apoiante',
  independente: 'Independente',
  explorando: 'A explorar',
}

export const CAMINHO_COLORS = {
  sucessor: 'bg-alfa-blue/10 text-alfa-blue border-alfa-blue/30',
  apoiante: 'bg-purple-100 text-purple-700 border-purple-200',
  independente: 'bg-alfa-orange/10 text-alfa-orange border-alfa-orange/30',
  explorando: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function aggregateCompetencias(h1Data) {
  const stats = {}
  h1Data.forEach(h => {
    const comps = Array.isArray(h.competencias) ? h.competencias : []
    comps.forEach(c => {
      const label = (c.label || '').trim()
      if (!label) return
      const norm = label.toLowerCase()
      if (!stats[norm]) {
        stats[norm] = { label, count: 0, sum: 0, hasCustom: false }
      }
      stats[norm].count += 1
      stats[norm].sum += Number(c.score) || 0
      if (c.custom) stats[norm].hasCustom = true
    })
  })
  return Object.values(stats)
    .map(s => ({ ...s, avg: parseFloat((s.sum / s.count).toFixed(1)) }))
    .sort((a, b) => b.count - a.count || b.avg - a.avg)
}

// Devolve "Ana & Tiago" para ideias de equipa, ou só o nome se não há parceiro
export function getTeamLabel(participantId, participants) {
  const author = participants.find(p => p.id === participantId)
  if (!author) return '—'
  if (!author.equipa_numero) return author.nome_completo || '—'
  const teammates = participants.filter(p => p.equipa_numero === author.equipa_numero)
  if (teammates.length <= 1) return author.nome_completo || '—'
  return teammates.map(p => (p.nome_completo || '').split(' ')[0]).join(' & ')
}

// Pseudonymize: "Sucessor #1", "Independente #2"...
export function buildAnonMap(participants) {
  const counters = {}
  const map = {}
  participants.forEach(p => {
    const k = p.caminho || 'explorando'
    counters[k] = (counters[k] || 0) + 1
    map[p.id] = `${CAMINHO_LABELS[k]} #${counters[k]}`
  })
  return map
}
