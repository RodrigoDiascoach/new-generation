import { useEffect, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import Logo from '../components/Logo'
import { supabase } from '../lib/supabase'
import { isAdminAuth } from './AdminLogin'
import { CAMINHO_LABELS, CAMINHO_COLORS, CAMINHOS, aggregateCompetencias } from '../lib/workshop-utils'

const PRAZO_LABELS = {
  '3m': '3 meses',
  '6m': '6 meses',
  '12m': '12 meses',
  '24m': '24 meses',
  '+24m': 'Mais de 2 anos',
  'nao_sei': 'A definir',
}

const CAMINHO_DESC = {
  sucessor: 'Preparado/a para assumir o negócio',
  apoiante: 'Quer continuar envolvido/a, sem liderar',
  independente: 'Seguirá o seu próprio caminho',
  explorando: 'Ainda a definir o rumo',
}

export default function Relatorio() {
  const navigate = useNavigate()
  const adminOK = isAdminAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!adminOK) return
    async function load() {
      const [pRes, h1Res, h2Res, h3Res, h4Res] = await Promise.all([
        supabase.from('workshop_participants').select('*').order('equipa_numero').order('nome_completo'),
        supabase.from('h1_competencias').select('*'),
        supabase.from('h2_ideias_equipa').select('*').eq('oculta', false).order('created_at'),
        supabase.from('h3_pitch_individual').select('*'),
        supabase.from('h4_plano_acao').select('*'),
      ])
      const allParticipants = pRes.data || []
      const active = allParticipants.filter(p => p.incluir_analise !== false && !p.is_test)
      const activeIds = new Set(active.map(p => p.id))
      setData({
        participants: active,
        allParticipants,
        h1Data: (h1Res.data || []).filter(h => activeIds.has(h.participant_id)),
        h2Data: (h2Res.data || []).filter(h => activeIds.has(h.participant_id)),
        h3Data: (h3Res.data || []).filter(h => activeIds.has(h.participant_id)),
        h4Data: (h4Res.data || []).filter(h => activeIds.has(h.participant_id)),
      })
      setLoading(false)
    }
    load()
  }, [adminOK])

  if (!adminOK) return <Navigate to="/admin" replace />

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  const { participants, allParticipants, h1Data, h2Data, h3Data, h4Data } = data

  const compStats = aggregateCompetencias(h1Data)
  const top5Comps = compStats.slice(0, 5)
  const caminhoStats = CAMINHOS.map(c => ({
    c,
    label: CAMINHO_LABELS[c],
    count: participants.filter(p => p.caminho === c).length,
    desc: CAMINHO_DESC[c],
  })).filter(s => s.count > 0)

  const ideiasPorCat = h2Data.reduce((acc, i) => {
    acc[i.categoria] = (acc[i.categoria] || 0) + 1
    return acc
  }, {})
  const topCats = Object.entries(ideiasPorCat).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const ratingsH4 = h4Data.filter(h => h.rating_workshop)
  const avgRating = ratingsH4.length
    ? (ratingsH4.reduce((s, h) => s + (h.rating_workshop || 0), 0) / ratingsH4.length).toFixed(1)
    : null

  const today = new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 print:hidden sticky top-0 z-10">
        <div className="brand-bar" />
        <div className="px-6 py-3 flex items-center justify-between max-w-[210mm] mx-auto">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-gray-600 hover:text-navy flex items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft size={16} /> Voltar ao dashboard
          </button>
          <div className="text-sm text-gray-500">
            Relatório de líderes · {participants.length} participantes
          </div>
          <button
            onClick={() => window.print()}
            className="bg-alfa-blue text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* CAPA */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none my-6 print:my-0 p-10 print:p-8 text-[11pt] leading-snug print-page">
        {/* Logo + Título */}
        <div className="flex flex-col items-center text-center mb-10 mt-4">
          <Logo size="lg" />
          <div className="mt-6 text-xs text-alfa-orange uppercase tracking-widest font-semibold">Relatório de Líderes</div>
          <h1 className="text-4xl font-display text-navy mt-2 mb-1">New Generation</h1>
          <div className="text-xl font-display text-alfa-orange">AGEBROKERS — Convenção 2026</div>
          <div className="text-sm text-gray-400 mt-3">{today}</div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Participantes', value: participants.length },
            { label: 'Ideias geradas', value: h2Data.length },
            { label: 'Planos de ação', value: h4Data.length },
            { label: 'Satisfação média', value: avgRating ? `${avgRating}/10` : '—' },
          ].map(k => (
            <div key={k.label} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-3xl font-display text-alfa-blue">{k.value}</div>
              <div className="text-xs text-gray-500 mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Distribuição por caminho */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-3">Distribuição por caminho de sucessão</h2>
          <div className="grid grid-cols-2 gap-3">
            {caminhoStats.map(s => (
              <div key={s.c} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                <div className="text-2xl font-display text-alfa-blue w-8 text-center">{s.count}</div>
                <div>
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded border inline-block ${CAMINHO_COLORS[s.c]}`}>{s.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top competências do grupo */}
        {top5Comps.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-3">Top competências identificadas pelo grupo</h2>
            <div className="space-y-2">
              {top5Comps.map((c, i) => (
                <div key={c.label} className="flex items-center gap-3">
                  <div className="text-xs text-gray-400 w-4">{i + 1}</div>
                  <div className="flex-1 text-sm font-semibold text-navy">{c.label}</div>
                  <div className="text-xs text-gray-500">{c.count} pessoa{c.count !== 1 ? 's' : ''}</div>
                  <div className="text-sm font-display text-alfa-blue tabular-nums">{c.avg}<span className="text-xs text-gray-400">/10</span></div>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-alfa-blue rounded-full" style={{ width: `${c.avg * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top categorias de ideias */}
        {topCats.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-3">Categorias de ideias mais exploradas</h2>
            <div className="flex flex-wrap gap-2">
              {topCats.map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-1.5 bg-alfa-blue/5 border border-alfa-blue/20 px-3 py-1.5 rounded-full">
                  <span className="text-xs font-semibold text-alfa-blue">{cat}</span>
                  <span className="text-xs text-gray-400">({count})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Índice */}
        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wider mb-3">Participantes incluídos neste relatório</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {participants.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 text-xs w-5">{i + 1}.</span>
                <span className="font-semibold text-navy">{p.nome_completo}</span>
                {p.caminho && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${CAMINHO_COLORS[p.caminho]}`}>
                    {CAMINHO_LABELS[p.caminho]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FICHA POR PARTICIPANTE */}
      {participants.map(p => {
        const h1 = h1Data.find(h => h.participant_id === p.id)
        const h3 = h3Data.find(h => h.participant_id === p.id)
        const h4 = h4Data.find(h => h.participant_id === p.id)
        const competencias = Array.isArray(h1?.competencias) ? h1.competencias : []
        const top3 = [...competencias].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3)
        const gaps = [...competencias].sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 2)

        // Ideias da equipa inteira
        const teamIdeias = p.equipa_numero
          ? h2Data.filter(i => {
              const author = allParticipants.find(pp => pp.id === i.participant_id)
              return author?.equipa_numero === p.equipa_numero
            })
          : h2Data.filter(i => i.participant_id === p.id)

        // Evitar duplicar as ideias — só mostrar na primeira ficha de cada equipa
        const teammates = p.equipa_numero
          ? participants.filter(pp => pp.equipa_numero === p.equipa_numero)
          : []
        const isFirstInTeam = !p.equipa_numero || teammates[0]?.id === p.id

        const caminho = p.caminho || 'explorando'
        const respostasCaminho = Array.isArray(h4?.respostas_caminho) ? h4.respostas_caminho : []
        const progresso = ['h1_completo', 'h2_completo', 'h3_completo', 'h4_completo'].filter(k => p[k]).length

        return (
          <div
            key={p.id}
            className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none mt-4 print:mt-0 p-10 print:p-8 text-[10pt] leading-snug print-page"
          >
            {/* Header participante */}
            <div className="flex items-start justify-between border-b border-gray-200 pb-4 mb-5">
              <div>
                <div className="text-[9px] text-alfa-orange uppercase tracking-widest font-semibold mb-1">
                  Ficha individual · New Generation AGEBROKERS 2026
                </div>
                <h2 className="text-2xl font-display text-navy">{p.nome_completo}</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                  {p.entidade_nome && <span>{p.entidade_nome}</span>}
                  {p.relacao_parentesco && <span>· {p.relacao_parentesco}</span>}
                  {p.mediador_responsavel && <span>· Mediador: {p.mediador_responsavel}</span>}
                  {p.equipa_numero && <span>· Equipa {p.equipa_numero}</span>}
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${CAMINHO_COLORS[caminho]}`}>
                  {CAMINHO_LABELS[caminho]}
                </span>
                {h4?.prazo_pronto && (
                  <div className="text-xs text-gray-500">
                    Pronto/a em: <strong>{PRAZO_LABELS[h4.prazo_pronto] || h4.prazo_pronto}</strong>
                  </div>
                )}
                <div className="text-[9px] text-gray-400 mt-1">
                  Progresso: {progresso}/4 módulos
                </div>
              </div>
            </div>

            {/* Competências */}
            {competencias.length > 0 && (
              <div className="mb-5">
                <SectionTitle>Roda das competências</SectionTitle>
                <div className="grid grid-cols-2 gap-x-8 mb-3">
                  <div>
                    <div className="text-[9px] uppercase font-semibold text-alfa-blue tracking-wider mb-1.5">Pontos fortes</div>
                    {top3.map(c => (
                      <CompRow key={c.key} c={c} highlight="strong" />
                    ))}
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-semibold text-alfa-orange tracking-wider mb-1.5">A desenvolver</div>
                    {gaps.map(c => (
                      <CompRow key={c.key} c={c} highlight="gap" />
                    ))}
                  </div>
                </div>
                {competencias.length > 5 && (
                  <details className="mt-1">
                    <summary className="text-[9px] text-gray-400 cursor-pointer select-none print:hidden">
                      Ver todas as competências ({competencias.length})
                    </summary>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-2">
                      {[...competencias].sort((a, b) => (b.score || 0) - (a.score || 0)).map(c => (
                        <CompRow key={c.key} c={c} small />
                      ))}
                    </div>
                  </details>
                )}
                {/* Print version: show all */}
                <div className="hidden print:block mt-2">
                  <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                    {[...competencias].sort((a, b) => (b.score || 0) - (a.score || 0)).map(c => (
                      <CompRow key={c.key} c={c} small />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* H1 narrativa */}
            {h1?.olhar_geracional && (
              <div className="mb-4">
                <SectionTitle>Como vê o negócio familiar</SectionTitle>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{h1.olhar_geracional}</p>
              </div>
            )}

            {/* H2 ideias — só na primeira ficha de cada equipa */}
            {isFirstInTeam && teamIdeias.length > 0 && (
              <div className="mb-5">
                <SectionTitle>
                  Ideias do Brainstorming
                  {p.equipa_numero
                    ? ` — Equipa ${p.equipa_numero} (${teammates.map(t => t.nome_completo.split(' ')[0]).join(' & ')})`
                    : ''}
                  {' '}({teamIdeias.length})
                </SectionTitle>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {teamIdeias.map((ideia, i) => {
                    const author = allParticipants.find(pp => pp.id === ideia.participant_id)
                    return (
                      <div key={ideia.id || i} className="border-b border-gray-100 pb-2 last:border-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-navy text-xs">{ideia.ideia_titulo}</span>
                          <span className="text-[8px] uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                            {ideia.categoria}
                          </span>
                        </div>
                        {ideia.ideia_descricao && (
                          <p className="text-[10px] text-gray-600 mt-0.5 whitespace-pre-wrap">{ideia.ideia_descricao}</p>
                        )}
                        {author && (
                          <p className="text-[9px] text-gray-400 mt-0.5">por {author.nome_completo.split(' ')[0]}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {/* Equipa 2+ membros e não é o primeiro: nota de referência */}
            {p.equipa_numero && !isFirstInTeam && (
              <div className="mb-5 text-xs text-gray-400 italic border border-gray-100 rounded p-3">
                As ideias da Equipa {p.equipa_numero} estão detalhadas na ficha de {teammates[0]?.nome_completo?.split(' ')[0]}.
              </div>
            )}

            {/* H3 — 4 quadrantes */}
            {h3 && (
              <div className="mb-5">
                <SectionTitle accent>Pitch individual — 4 quadrantes</SectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'valencias', label: 'O que traz para o negócio' },
                    { key: 'o_que_gosto', label: 'O que mais aprecia' },
                    { key: 'o_que_nao_gosto', label: 'O que mudaria' },
                    { key: 'solucoes_propostas', label: 'Soluções que propõe' },
                  ].map(q => h3[q.key]?.trim() && (
                    <div key={q.key} className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="text-[9px] font-semibold text-alfa-blue uppercase tracking-wider mb-1">{q.label}</div>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{h3[q.key]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* H4 — Plano de ação */}
            {h4 && (
              <div className="mb-5">
                <SectionTitle>Plano de ação pessoal</SectionTitle>
                <div className="space-y-3">
                  {h4.execucao_imediata && (
                    <div>
                      <div className="text-[9px] font-semibold text-gray-500 uppercase mb-0.5">Vai fazer já (esta semana)</div>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{h4.execucao_imediata}</p>
                    </div>
                  )}
                  {h4.desenvolvimento_6m && (
                    <div>
                      <div className="text-[9px] font-semibold text-gray-500 uppercase mb-0.5">Desenvolvimento a 6 meses</div>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{h4.desenvolvimento_6m}</p>
                    </div>
                  )}
                  {h4.compromisso_lideranca && (
                    <div>
                      <div className="text-[9px] font-semibold text-gray-500 uppercase mb-0.5">Compromisso que pede à liderança</div>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{h4.compromisso_lideranca}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Respostas do caminho */}
            {respostasCaminho.length > 0 && (
              <div className="mb-5">
                <SectionTitle>Respostas às perguntas do caminho "{CAMINHO_LABELS[caminho]}"</SectionTitle>
                <div className="space-y-2">
                  {respostasCaminho.map((r, i) => (
                    <div key={i} className="border-l-2 border-alfa-blue/30 pl-3">
                      <div className="text-[9px] font-semibold text-gray-400 uppercase mb-0.5">{r.label}</div>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap">{r.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback workshop */}
            {(h4?.feedback_workshop || h4?.rating_workshop) && (
              <div className="mb-4 flex items-start gap-4">
                {h4.rating_workshop && (
                  <div className="shrink-0 text-center">
                    <div className="text-2xl font-display text-alfa-blue">{h4.rating_workshop}<span className="text-sm text-gray-400">/10</span></div>
                    <div className="text-[9px] text-gray-400">satisfação</div>
                  </div>
                )}
                {h4.feedback_workshop && (
                  <div>
                    <div className="text-[9px] font-semibold text-gray-400 uppercase mb-0.5">O que disse sobre o workshop</div>
                    <p className="text-xs text-gray-600 italic whitespace-pre-wrap">"{h4.feedback_workshop}"</p>
                  </div>
                )}
              </div>
            )}

            {/* Não disse — só se autorizado */}
            {h4?.nao_disse_partilhar && h4?.nao_disse && (
              <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 mb-4">
                <div className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider mb-1">
                  O que não disse em grupo (autorizado a partilhar com líderes)
                </div>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{h4.nao_disse}</p>
              </div>
            )}
          </div>
        )
      })}

      {/* Print styles */}
      <style>{`
        @media print {
          .print-page { page-break-after: always; }
          .print-page:last-child { page-break-after: auto; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  )
}

function SectionTitle({ children, accent }) {
  return (
    <div className={`text-[9px] font-semibold uppercase tracking-wider mb-2 pb-1 border-b ${accent ? 'text-alfa-blue border-alfa-blue/20' : 'text-gray-500 border-gray-100'}`}>
      {children}
    </div>
  )
}

function CompRow({ c, highlight, small }) {
  const scoreColor = c.score >= 7 ? 'text-alfa-blue' : c.score <= 4 ? 'text-alfa-orange' : 'text-gray-500'
  return (
    <div className={`flex items-center justify-between border-b border-gray-50 last:border-0 ${small ? 'py-0.5' : 'py-1'}`}>
      <span className={`${small ? 'text-[9px]' : 'text-xs'} font-semibold text-navy`}>{c.label}</span>
      <span className={`font-display ${small ? 'text-xs' : 'text-sm'} tabular-nums ${scoreColor}`}>{c.score}</span>
    </div>
  )
}
