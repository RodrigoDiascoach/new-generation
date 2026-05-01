import { useEffect, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, X, Eye, EyeOff, Printer,
  Heart, Lightbulb, Compass,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase } from '../lib/supabase'
import { isAdminAuth } from './AdminLogin'
import Logo from '../components/Logo'
import {
  CAMINHOS, CAMINHO_LABELS, CAMINHO_COLORS,
  aggregateCompetencias, buildAnonMap, getTeamLabel,
} from '../lib/workshop-utils'

export default function Apresentacao() {
  const adminOK = isAdminAuth()
  const navigate = useNavigate()
  const [participants, setParticipants] = useState([])
  const [h1Data, setH1Data] = useState([])
  const [h2Data, setH2Data] = useState([])
  const [h3Data, setH3Data] = useState([])
  const [h4Data, setH4Data] = useState([])
  const [loading, setLoading] = useState(true)
  const [slideIdx, setSlideIdx] = useState(0)
  const [anon, setAnon] = useState(false)
  const [printMode, setPrintMode] = useState(false)

  useEffect(() => {
    if (!adminOK) return
    Promise.all([
      supabase.from('workshop_participants').select('*').order('created_at'),
      supabase.from('h1_competencias').select('*'),
      supabase.from('h2_ideias_equipa').select('*'),
      supabase.from('h3_pitch_individual').select('*'),
      supabase.from('h4_plano_acao').select('*'),
    ]).then(([p, h1, h2, h3, h4]) => {
      setParticipants(p.data || [])
      setH1Data(h1.data || [])
      setH2Data(h2.data || [])
      setH3Data(h3.data || [])
      setH4Data(h4.data || [])
      setLoading(false)
    })
  }, [adminOK])

  const slides = [
    SlideCapa,
    SlideQuemVeio,
    SlideForcas,
    SlideGaps,
    SlideOlharGeracional,
    SlideVisaoCliente,
    SlideIdeiasPorCategoria,
    SlidePropostasConcretas,
    SlideImplementacaoImediata,
    SlideLadoEmocional,
    SlideCompromissos,
    SlidePedidoSeniors,
  ]
  const total = slides.length

  useEffect(() => {
    if (printMode) return
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setSlideIdx(i => Math.min(i + 1, total - 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setSlideIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Escape') {
        navigate('/admin/dashboard')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, total, printMode])

  if (!adminOK) return <Navigate to="/admin" replace />

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  const activeParticipants = participants.filter(p => p.incluir_analise !== false && !p.is_test)
  const activeIds = new Set(activeParticipants.map(p => p.id))
  const activeH1 = h1Data.filter(h => activeIds.has(h.participant_id))
  const activeH2 = h2Data.filter(h => activeIds.has(h.participant_id) && !h.oculta)
  const activeH3 = h3Data.filter(h => activeIds.has(h.participant_id))
  const activeH4 = h4Data.filter(h => activeIds.has(h.participant_id))
  const compStats = aggregateCompetencias(activeH1)
  const anonMap = buildAnonMap(activeParticipants)
  const ctx = {
    participants: activeParticipants,
    h1Data: activeH1,
    h2Data: activeH2,
    h3Data: activeH3,
    h4Data: activeH4,
    compStats,
    anon,
    anonMap,
  }

  function handlePrint() {
    setPrintMode(true)
    setTimeout(() => {
      window.print()
      setTimeout(() => setPrintMode(false), 500)
    }, 150)
  }

  if (printMode) {
    return (
      <div className="bg-white">
        {slides.map((Slide, i) => (
          <div key={i} className="page-break print-slide">
            <Slide {...ctx} />
          </div>
        ))}
      </div>
    )
  }

  const SlideComp = slides[slideIdx]

  return (
    <div className="fixed inset-0 bg-white text-navy z-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100">
        <div className="brand-bar" />
        <div className="px-6 py-2 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 font-display">{slideIdx + 1} / {total}</span>
            <button
              onClick={() => setAnon(a => !a)}
              className={`px-3 py-1.5 rounded-lg border-2 flex items-center gap-2 text-xs font-semibold transition-colors ${
                anon
                  ? 'border-alfa-blue bg-alfa-blue/10 text-alfa-blue'
                  : 'border-gray-200 hover:border-alfa-blue text-gray-600'
              }`}
              title={anon ? 'Mostrar nomes' : 'Esconder nomes'}
            >
              {anon ? <EyeOff size={14} /> : <Eye size={14} />}
              {anon ? 'Anónimo' : 'Nomes visíveis'}
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border-2 border-gray-200 hover:border-alfa-blue flex items-center gap-2 text-xs font-semibold text-gray-600"
              title="Imprimir / guardar como PDF"
            >
              <Printer size={14} />
              Imprimir
            </button>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-3 py-1.5 rounded-lg text-gray-500 hover:text-red-600 flex items-center gap-1 text-xs font-semibold"
              title="Voltar ao dashboard (Esc)"
            >
              <X size={14} />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Slide content */}
      <main className="flex-1 overflow-y-auto">
        <SlideComp {...ctx} />
      </main>

      {/* Nav arrows */}
      <button
        onClick={() => setSlideIdx(i => Math.max(i - 1, 0))}
        disabled={slideIdx === 0}
        className="fixed left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow-lg border-2 border-gray-200 hover:border-alfa-blue disabled:opacity-30 disabled:cursor-not-allowed transition"
        aria-label="Slide anterior"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={() => setSlideIdx(i => Math.min(i + 1, total - 1))}
        disabled={slideIdx === total - 1}
        className="fixed right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow-lg border-2 border-gray-200 hover:border-alfa-blue disabled:opacity-30 disabled:cursor-not-allowed transition"
        aria-label="Próximo slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Slide indicator dots */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlideIdx(i)}
            className={`h-2 rounded-full transition-all ${
              i === slideIdx ? 'w-8 bg-alfa-blue' : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Ir para slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

// ============ SLIDES ============

function SlideCapa({ participants }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center p-12 text-center">
      <Logo size="lg" />
      <div className="mt-12 max-w-4xl">
        <div className="text-alfa-orange font-display text-base uppercase tracking-widest mb-4">
          Resultados do Workshop
        </div>
        <h1 className="text-5xl md:text-7xl font-display text-alfa-blue mb-6 leading-tight">
          New Generation<br />AGEBROKERS
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          3ª Convenção · Amendoeiras Golf Resort · 1 Maio 2026
        </p>
        <div className="inline-block bg-alfa-blue/5 border-2 border-alfa-blue/20 rounded-2xl px-12 py-6">
          <div className="text-7xl font-display text-alfa-blue tabular-nums">{participants.length}</div>
          <div className="text-lg text-gray-600 mt-1">jovens da próxima geração</div>
        </div>
      </div>
      <div className="mt-12 text-gray-400 text-sm">
        Premir <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">→</kbd> para começar
      </div>
    </div>
  )
}

function SlideQuemVeio({ participants }) {
  const counts = CAMINHOS.map(c => ({
    caminho: c,
    count: participants.filter(p => p.caminho === c).length,
  }))
  const total = participants.length || 1
  return (
    <div className="min-h-full p-12">
      <SlideHeader
        title="Quem esteve aqui hoje"
        subtitle="Nem todos querem suceder — e isso é saudável."
        note="Os jovens escolheram o seu caminho antes de fazerem qualquer exercício. Não há resposta certa — cada caminho é legítimo. O que importa é a consciência da escolha, não o resultado."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto mt-12">
        {counts.map(c => (
          <div key={c.caminho} className={`p-8 rounded-2xl border-2 text-center ${CAMINHO_COLORS[c.caminho]}`}>
            <div className="font-display text-7xl tabular-nums">{c.count}</div>
            <div className="text-xl font-semibold mt-2">{CAMINHO_LABELS[c.caminho]}</div>
            <div className="text-sm opacity-70 mt-1">{Math.round(c.count / total * 100)}%</div>
          </div>
        ))}
      </div>
      <p className="text-center text-xl text-gray-600 mt-12 max-w-3xl mx-auto leading-relaxed">
        Cada caminho é legítimo. O nosso papel não é forçar — é{' '}
        <span className="text-alfa-blue font-semibold">criar espaço para cada um descobrir o seu</span>.
      </p>
    </div>
  )
}

function SlideForcas({ compStats }) {
  const top5 = compStats.slice(0, 5)
  return (
    <div className="min-h-full p-12">
      <SlideHeader
        title="Onde se sentem fortes"
        subtitle="Eles sabem onde brilham. Aproveitem."
        note="Estas são as competências onde o grupo se autoavalia melhor. São o ponto de partida para conversas sobre quem pode assumir o quê — e para distribuição de responsabilidades que faça sentido para ambas as gerações."
      />
      <div className="max-w-4xl mx-auto mt-12 space-y-4">
        {top5.length === 0 && <p className="text-center text-gray-400">Sem dados de competências ainda.</p>}
        {top5.map((c, i) => (
          <div key={c.label} className="bg-white border-2 border-gray-100 rounded-xl p-6 flex items-center gap-6">
            <div className="text-5xl font-display text-alfa-blue tabular-nums w-16 text-center">{i + 1}</div>
            <div className="flex-1">
              <div className="font-display text-2xl text-navy">{c.label}</div>
              <div className="text-sm text-gray-500">
                Escolhida por {c.count} pessoa{c.count !== 1 ? 's' : ''}
                {c.hasCustom && <span className="ml-2 text-[10px] uppercase bg-alfa-orange/10 text-alfa-orange px-1.5 py-0.5 rounded">custom</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl text-alfa-orange tabular-nums">{c.avg}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">média / 10</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideGaps({ compStats }) {
  // Competências escolhidas com média mais baixa = gaps auto-identificados
  const gaps = [...compStats]
    .filter(c => c.count >= 1)
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 5)
  return (
    <div className="min-h-full p-12">
      <SlideHeader
        title="Onde precisam de vocês"
        subtitle="Áreas que escolheram, mas onde se sentem fracos. Espaço para mentoria."
        note="Não é fraqueza — é autoconsciência. Cada gap aqui identificado é uma oportunidade concreta de mentoria ou formação conjunta. O facto de a terem escolhido significa que já sabem que é importante."
      />
      <div className="max-w-4xl mx-auto mt-12 space-y-4">
        {gaps.length === 0 && <p className="text-center text-gray-400">Sem dados de competências ainda.</p>}
        {gaps.map((c, i) => (
          <div key={c.label} className="bg-orange-50 border-2 border-orange-100 rounded-xl p-6 flex items-center gap-6">
            <div className="text-5xl font-display text-alfa-orange tabular-nums w-16 text-center">{i + 1}</div>
            <div className="flex-1">
              <div className="font-display text-2xl text-navy">{c.label}</div>
              <div className="text-sm text-gray-500">Escolhida por {c.count} · sentem-se em {c.avg}/10</div>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl text-orange-600 tabular-nums">{c.avg}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">média / 10</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlideOlharGeracional({ h1Data, participants, anon, anonMap }) {
  const quotes = h1Data
    .filter(h => h.olhar_geracional?.trim())
    .map(h => buildQuote(h.participant_id, h.olhar_geracional, participants))
  return (
    <div className="min-h-full p-12">
      <SlideHeader
        title="Como veem o vosso negócio"
        subtitle="Vejam pelos olhos da próxima geração."
        note="Leiam com atenção — esta é a perspetiva que raramente ouvem em reuniões de família. Os jovens percebem o negócio de fora para dentro, e esse olhar é um ativo que muitas empresas familiares ignoram até ser tarde."
      />
      <QuoteGrid quotes={quotes} anon={anon} anonMap={anonMap} />
    </div>
  )
}

function SlideVisaoCliente({ h1Data, h3Data, h2Data, participants, anon, anonMap }) {
  const quotes = h3Data
    .filter(h => h.valencias?.trim())
    .map(h => buildQuote(h.participant_id, h.valencias, participants))
    .slice(0, 4)
  const cats = h2Data.reduce((acc, i) => {
    if (i.categoria) acc[i.categoria] = (acc[i.categoria] || 0) + 1
    return acc
  }, {})
  const catData = Object.entries(cats)
    .map(([categoria, count]) => ({ categoria, count }))
    .sort((a, b) => b.count - a.count)
  return (
    <div className="min-h-full p-12">
      <SlideHeader
        title="Quem são e o que trazem"
        subtitle="As valências de cada um — e as ideias que geraram em equipa."
        note="As valências mostram o que cada um considera a sua força. Cruzem com as ideias do brainstorming — é onde há alinhamento entre o que sabem fazer e o que querem construir."
      />
      <div className="max-w-7xl mx-auto mt-8 grid lg:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
            Quem são — o que trazem para a mesa
          </div>
          {quotes.length === 0 && <p className="text-gray-400 text-sm">Sem respostas ainda.</p>}
          {quotes.map((q, i) => <QuoteCard key={i} q={q} anon={anon} anonMap={anonMap} />)}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
            Ideias por categoria
          </div>
          {catData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={catData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="categoria" type="category" width={130} tick={{ fontSize: 13, fill: '#050A26' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#F39237" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm">Sem ideias ainda.</p>
          )}
          <div className="mt-6 p-6 bg-alfa-blue/5 border-2 border-alfa-blue/20 rounded-xl text-center">
            <div className="font-display text-5xl text-alfa-blue tabular-nums">{h2Data.length}</div>
            <div className="text-sm text-gray-600 uppercase tracking-wider mt-1">Total de ideias geradas</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SlideLadoEmocional({ h3Data, participants, anon, anonMap }) {
  const comMove = h3Data.filter(h => h.o_que_gosto?.trim())
  const querMudar = h3Data.filter(h => h.o_que_nao_gosto?.trim())

  return (
    <div className="min-h-full p-10">
      <SlideHeader
        title="O que os move — e o que querem mudar"
        subtitle="Energia e frustração. As duas faces do mesmo envolvimento."
        note="O que os move mostra onde investir atenção. O que querem mudar mostra onde há dor — e oportunidade. Escutem os dois com a mesma seriedade."
      />
      <div className="max-w-7xl mx-auto mt-8 grid md:grid-cols-2 gap-6">
        {/* O que os move */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-8 bg-alfa-orange rounded" />
            <h3 className="font-display text-xl text-navy">O que os move</h3>
            <span className="text-sm text-gray-400">({comMove.length})</span>
          </div>
          <div className="space-y-3">
            {comMove.length === 0 && <p className="text-gray-400 text-sm">Sem respostas ainda.</p>}
            {comMove.map((h, i) => {
              const p = participants.find(pp => pp.id === h.participant_id)
              const display = anon ? (anonMap[h.participant_id] || '—') : getTeamLabel(h.participant_id, participants)
              return (
                <div key={i} className="bg-orange-50 border-2 border-orange-100 rounded-xl p-4">
                  <p className="text-sm text-gray-800 leading-relaxed mb-2">{h.o_que_gosto}</p>
                  <div className="flex items-center gap-2">
                    {p?.caminho && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${CAMINHO_COLORS[p.caminho]}`}>
                        {CAMINHO_LABELS[p.caminho]}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{display}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* O que querem mudar */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1 w-8 bg-alfa-blue rounded" />
            <h3 className="font-display text-xl text-navy">O que querem transformar</h3>
            <span className="text-sm text-gray-400">({querMudar.length})</span>
          </div>
          <div className="space-y-3">
            {querMudar.length === 0 && <p className="text-gray-400 text-sm">Sem respostas ainda.</p>}
            {querMudar.map((h, i) => {
              const p = participants.find(pp => pp.id === h.participant_id)
              const display = anon ? (anonMap[h.participant_id] || '—') : getTeamLabel(h.participant_id, participants)
              return (
                <div key={i} className="bg-alfa-blue/5 border-2 border-alfa-blue/10 rounded-xl p-4">
                  <p className="text-sm text-gray-800 leading-relaxed mb-2">{h.o_que_nao_gosto}</p>
                  <div className="flex items-center gap-2">
                    {p?.caminho && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${CAMINHO_COLORS[p.caminho]}`}>
                        {CAMINHO_LABELS[p.caminho]}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{display}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function SlideCompromissos({ h4Data, participants, anon, anonMap }) {
  const quotes = h4Data
    .filter(h => h.compromisso_lideranca?.trim())
    .map(h => buildQuote(h.participant_id, h.compromisso_lideranca, participants))
  return (
    <div className="min-h-full p-12">
      <SlideHeader
        title="Comprometeram-se a..."
        subtitle="O futuro que querem construir, nas próprias palavras."
        note="Estes compromissos foram escritos de forma livre, sem sugestões. São os mais honestos e os mais frágeis — precisam de acompanhamento nas semanas seguintes para não se perderem na rotina."
      />
      <QuoteGrid quotes={quotes} anon={anon} anonMap={anonMap} />
    </div>
  )
}

function SlidePedidoSeniors() {
  const pedidos = [
    {
      icon: Heart,
      title: 'Ouvir antes de aconselhar',
      desc: 'Na maioria das vezes não querem soluções — querem ser ouvidos. Pratiquem fazer 3 perguntas antes de qualquer conselho.',
    },
    {
      icon: Compass,
      title: 'Agendar uma conversa esta semana',
      desc: 'Sem agenda, sem pressão. Apenas perguntar: "como te sentes em relação ao futuro do negócio?". E calar.',
    },
    {
      icon: Lightbulb,
      title: 'Criar espaço para errar',
      desc: 'A próxima geração precisa de testar. Definam um budget para experiências e respeitem-no — mesmo quando vos parece arriscado.',
    },
  ]
  return (
    <div className="min-h-full p-12 flex flex-col">
      <SlideHeader
        title="O que precisam de vocês"
        subtitle="Três pedidos concretos da próxima geração para os seniors."
        note="Não é uma crítica — é um pedido. A próxima geração precisa de estrutura e de espaço ao mesmo tempo. O vosso papel é criar os dois — e começar esta semana, não depois da próxima convenção."
      />
      <div className="max-w-5xl mx-auto mt-12 grid md:grid-cols-3 gap-6 flex-1">
        {pedidos.map((p, i) => {
          const Icon = p.icon
          return (
            <div key={i} className="bg-alfa-blue/5 border-2 border-alfa-blue/20 rounded-2xl p-8 text-center">
              <div className="inline-flex p-4 bg-alfa-blue text-white rounded-full mb-4">
                <Icon size={32} />
              </div>
              <h3 className="font-display text-2xl text-navy mb-3">{p.title}</h3>
              <p className="text-gray-600 leading-relaxed">{p.desc}</p>
            </div>
          )
        })}
      </div>
      <div className="text-center mt-12 max-w-3xl mx-auto">
        <p className="text-2xl text-gray-700 italic leading-relaxed">
          "Os negócios familiares que sobrevivem 3 gerações são aqueles em que os pais aprenderam a escutar."
        </p>
      </div>
    </div>
  )
}

const CATEGORIAS_LABELS = {
  atendimento: 'Atendimento ao cliente',
  automacao: 'Automação e IA',
  produto: 'Novo produto / serviço',
  marketing: 'Marketing e captação',
  gestao: 'Gestão interna',
  outro: 'Outro',
}

const CATEGORIAS_ORDER = ['marketing', 'automacao', 'atendimento', 'produto', 'gestao', 'outro']

function SlideIdeiasPorCategoria({ h2Data, participants, anon, anonMap }) {
  const porCategoria = CATEGORIAS_ORDER
    .map(cat => ({
      cat,
      label: CATEGORIAS_LABELS[cat] || cat,
      ideias: h2Data.filter(i => i.categoria === cat),
    }))
    .filter(g => g.ideias.length > 0)

  return (
    <div className="min-h-full p-10">
      <SlideHeader
        title="As ideias que geraram"
        subtitle={`${h2Data.length} ideias organizadas por tema — prontas para debater.`}
        note="Cada ideia aqui representa um problema que identificaram ou uma oportunidade que querem explorar. Escolham 2 a 3 para aprofundar em equipa com os líderes."
      />
      <div className="max-w-7xl mx-auto mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {porCategoria.map(({ cat, label, ideias }) => (
          <div key={cat} className="bg-white border-2 border-gray-100 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-navy">{label}</h3>
              <span className="font-display text-2xl text-alfa-orange tabular-nums">{ideias.length}</span>
            </div>
            <div className="h-0.5 w-12 bg-alfa-orange rounded mb-3" />
            <div className="space-y-3 flex-1">
              {ideias.map(i => {
                const label = anon
                  ? (anonMap[i.participant_id] || '—')
                  : getTeamLabel(i.participant_id, participants)
                return (
                  <div key={i.id} className="border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                    <p className="text-sm font-semibold text-navy leading-snug">{i.ideia_titulo}</p>
                    {i.ideia_descricao && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{i.ideia_descricao}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SlidePropostasConcretas({ h3Data, participants, anon, anonMap }) {
  const propostas = h3Data
    .filter(h => h.solucoes_propostas?.trim())
    .map(h => ({
      ...buildQuote(h.participant_id, h.solucoes_propostas, participants),
      valencias: h.valencias,
      o_que_nao_gosto: h.o_que_nao_gosto,
    }))

  return (
    <div className="min-h-full p-10">
      <SlideHeader
        title="O que cada um propõe"
        subtitle="Propostas concretas para o negócio — nas palavras deles."
        note="Estas propostas saíram do H3 — cada um preparou uma ideia concreta para subir ao palco. São o ponto de partida para conversas sobre quem lidera o quê."
      />
      <div className="max-w-7xl mx-auto mt-8 grid md:grid-cols-2 gap-4">
        {propostas.length === 0 && <p className="text-gray-400 col-span-2 text-center">Sem propostas submetidas ainda.</p>}
        {propostas.map((q, i) => {
          const display = anon ? (anonMap[q.participantId] || '—') : q.name
          return (
            <div key={i} className="bg-white border-2 border-gray-100 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3 gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${CAMINHO_COLORS[q.caminho]}`}>
                  {CAMINHO_LABELS[q.caminho]}
                </span>
                <span className="text-sm font-semibold text-navy truncate">{display}</span>
              </div>
              {q.o_que_nao_gosto?.trim() && (
                <div className="mb-2">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">O que quer transformar</div>
                  <p className="text-xs text-gray-600 leading-snug">{q.o_que_nao_gosto}</p>
                </div>
              )}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-alfa-orange font-semibold mb-0.5">A proposta</div>
                <p className="text-sm text-gray-800 leading-relaxed">{q.text}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SlideImplementacaoImediata({ h4Data, participants, anon, anonMap }) {
  const acoes = h4Data
    .filter(h => h.execucao_imediata?.trim() || h.desenvolvimento_6m?.trim())

  const prazoStats = ['3m', '6m', '12m', '24m', '+24m', 'nao_sei'].map(v => ({
    label: { '3m': '3 meses', '6m': '6 meses', '12m': '12 meses', '24m': '24 meses', '+24m': '+2 anos', 'nao_sei': 'A definir' }[v],
    count: h4Data.filter(h => h.prazo_pronto === v).length,
  })).filter(s => s.count > 0)

  return (
    <div className="min-h-full p-10">
      <SlideHeader
        title="O que começa esta semana"
        subtitle="Comprometeram-se. Em público. Com prazo."
        note="Cada linha aqui é um compromisso voluntário — não foi sugerido, foi escolhido. O acompanhamento nas próximas semanas é o que converte intenção em resultado."
      />
      <div className="max-w-7xl mx-auto mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {acoes.length === 0 && <p className="text-gray-400">Sem respostas ainda.</p>}
          {acoes.map(h => {
            const p = participants.find(pp => pp.id === h.participant_id)
            const display = anon ? (anonMap[h.participant_id] || '—') : getTeamLabel(h.participant_id, participants)
            return (
              <div key={h.id} className="bg-white border-2 border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="text-sm font-bold text-navy">{display}</span>
                  {p?.caminho && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${CAMINHO_COLORS[p.caminho]}`}>
                      {CAMINHO_LABELS[p.caminho]}
                    </span>
                  )}
                </div>
                {h.execucao_imediata?.trim() && (
                  <div className="mb-2">
                    <div className="text-[10px] uppercase tracking-wider text-alfa-orange font-semibold mb-0.5">Esta semana</div>
                    <p className="text-sm text-gray-700 leading-snug whitespace-pre-line">{h.execucao_imediata}</p>
                  </div>
                )}
                {h.desenvolvimento_6m?.trim() && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-alfa-blue font-semibold mb-0.5">Próximos 6 meses</div>
                    <p className="text-sm text-gray-600 leading-snug whitespace-pre-line">{h.desenvolvimento_6m}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="space-y-4">
          <div className="bg-alfa-blue/5 border-2 border-alfa-blue/20 rounded-2xl p-5">
            <h3 className="font-display text-lg text-navy mb-3">Quando se sentem prontos</h3>
            <div className="space-y-2">
              {prazoStats.map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{s.label}</span>
                  <span className="font-display text-xl text-alfa-blue tabular-nums">{s.count}</span>
                </div>
              ))}
              {prazoStats.length === 0 && <p className="text-sm text-gray-400">Sem respostas ainda.</p>}
            </div>
          </div>
          {h4Data.length > 0 && (
            <div className="bg-alfa-orange/5 border-2 border-alfa-orange/20 rounded-2xl p-5 text-center">
              <div className="font-display text-5xl text-alfa-orange tabular-nums">
                {(h4Data.reduce((s, h) => s + (h.rating_workshop || 0), 0) / h4Data.length).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Avaliação média do workshop</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============ Helpers ============

function SlideHeader({ title, subtitle, note }) {
  return (
    <div className="text-center pt-8">
      <h1 className="font-display text-5xl md:text-6xl text-alfa-blue mb-3 leading-tight">{title}</h1>
      <div className="h-1 w-20 bg-alfa-orange rounded-full mx-auto mb-4" />
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">{subtitle}</p>
      {note && (
        <p className="mt-4 text-sm text-gray-500 max-w-2xl mx-auto bg-gray-50 border border-gray-200 rounded-lg px-5 py-3 leading-relaxed italic">
          {note}
        </p>
      )}
    </div>
  )
}

function buildQuote(participantId, text, participants) {
  const p = participants.find(pp => pp.id === participantId)
  return {
    participantId,
    caminho: p?.caminho || 'explorando',
    name: getTeamLabel(participantId, participants),
    text,
  }
}

function QuoteGrid({ quotes, anon, anonMap }) {
  if (quotes.length === 0) {
    return <p className="text-center text-gray-400 mt-12">Sem respostas ainda.</p>
  }
  return (
    <div className="max-w-7xl mx-auto mt-8 grid md:grid-cols-2 gap-4">
      {quotes.map((q, i) => <QuoteCard key={i} q={q} anon={anon} anonMap={anonMap} />)}
    </div>
  )
}

function QuoteCard({ q, anon, anonMap }) {
  const display = anon ? (anonMap[q.participantId] || CAMINHO_LABELS[q.caminho]) : q.name
  return (
    <div className="bg-white border-2 border-gray-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3 gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${CAMINHO_COLORS[q.caminho]}`}>
          {CAMINHO_LABELS[q.caminho]}
        </span>
        <span className="text-xs text-gray-500 truncate">{display}</span>
      </div>
      <p className="text-gray-800 leading-relaxed">{q.text}</p>
    </div>
  )
}
