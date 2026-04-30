import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { ArrowLeft, Printer, Lock, Sparkles, AlertCircle, MessageSquare } from 'lucide-react'
import Logo from '../components/Logo'
import { supabase } from '../lib/supabase'
import { isAdminAuth } from './AdminLogin'
import { CAMINHO_LABELS, CAMINHO_COLORS } from '../lib/workshop-utils'

const PRAZO_LABELS = {
  '3m': '3 meses',
  '6m': '6 meses',
  '12m': '12 meses',
  '24m': '24 meses',
  '+24m': 'Mais de 2 anos',
  'nao_sei': 'Ainda a definir',
}

const CONVERSAS_POR_CAMINHO = {
  sucessor: [
    'O que te entusiasma mais em assumir o negócio?',
    'Que decisões nossas te incomodam e nunca disseste?',
    'O que precisas de mim para te sentires pronto/a?',
  ],
  apoiante: [
    'Que tipo de envolvimento te faz sentido?',
    'Há alguma decisão grande em que queres ser ouvido/a antes?',
    'Como podemos formalizar este papel sem complicar relação?',
  ],
  independente: [
    'Como vês a tua relação futura com a nossa empresa?',
    'O que precisas de nós para construires o teu próprio caminho?',
    'Em que aspetos podemos ser-te útil — financeiro, mentoria, contactos?',
  ],
  explorando: [
    'O que te ajudaria a ganhar clareza no próximo ano?',
    'Há experiência aqui que queres testar antes de decidir?',
    'O que receias dizer-nos sobre os teus dúvidas?',
  ],
}

export default function Briefing() {
  const adminOK = isAdminAuth()
  const { participantId } = useParams()
  const navigate = useNavigate()
  const [participant, setParticipant] = useState(null)
  const [h1, setH1] = useState(null)
  const [h2, setH2] = useState([])
  const [h3, setH3] = useState(null)
  const [h4, setH4] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!adminOK) return
    Promise.all([
      supabase.from('workshop_participants').select('*').eq('id', participantId).maybeSingle(),
      supabase.from('h1_competencias').select('*').eq('participant_id', participantId).maybeSingle(),
      supabase.from('h2_ideias_equipa').select('*').eq('participant_id', participantId).order('created_at'),
      supabase.from('h3_pitch_individual').select('*').eq('participant_id', participantId).maybeSingle(),
      supabase.from('h4_plano_acao').select('*').eq('participant_id', participantId).maybeSingle(),
    ]).then(([p, q1, q2, q3, q4]) => {
      if (!p.data) {
        setNotFound(true)
      } else {
        setParticipant(p.data)
        setH1(q1.data)
        setH2(q2.data || [])
        setH3(q3.data)
        setH4(q4.data)
      }
      setLoading(false)
    })
  }, [adminOK, participantId])

  if (!adminOK) return <Navigate to="/admin" replace />
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p className="text-gray-500">Participante não encontrado.</p>
        <button onClick={() => navigate('/admin/dashboard')} className="btn-secondary">Voltar</button>
      </div>
    )
  }

  const caminho = participant.caminho || 'explorando'
  const competencias = Array.isArray(h1?.competencias) ? h1.competencias : []
  const top3Fortes = [...competencias].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3)
  const top3Gaps = [...competencias].sort((a, b) => (a.score || 0) - (b.score || 0)).slice(0, 3)
  const respostasCaminho = Array.isArray(h4?.respostas_caminho) ? h4.respostas_caminho : []
  const conversas = CONVERSAS_POR_CAMINHO[caminho] || CONVERSAS_POR_CAMINHO.explorando

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Top bar (hidden on print) */}
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
            Briefing pessoal · {participant.nome_completo}
          </div>
          <button
            onClick={() => window.print()}
            className="bg-alfa-blue text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Briefing page (A4 width) */}
      <div className="max-w-[210mm] mx-auto bg-white shadow-lg print:shadow-none my-6 print:my-0 p-10 print:p-8 text-[11pt] leading-snug">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 pb-4 mb-5">
          <div>
            <div className="text-xs text-alfa-orange uppercase tracking-widest font-semibold mb-1">
              Briefing pessoal · New Generation AGEBROKERS
            </div>
            <h1 className="text-3xl font-display text-navy mb-1">{participant.nome_completo}</h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {participant.entidade_nome && <span>{participant.entidade_nome}</span>}
              {participant.relacao_parentesco && <span>· {participant.relacao_parentesco}</span>}
              {participant.equipa_numero && <span>· Equipa {participant.equipa_numero}</span>}
            </div>
          </div>
          <div className="text-right">
            <Logo size="sm" />
            <div className="mt-2 inline-block">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${CAMINHO_COLORS[caminho]}`}>
                {CAMINHO_LABELS[caminho]}
              </span>
            </div>
            {h4?.prazo_pronto && (
              <div className="text-xs text-gray-500 mt-1">
                Pronto/a em: <span className="font-semibold text-navy">{PRAZO_LABELS[h4.prazo_pronto] || h4.prazo_pronto}</span>
              </div>
            )}
          </div>
        </div>


        {/* H1 — Competências completas */}
        {competencias.length > 0 && (
          <Section title="Roda das competências — avaliação completa" subtle>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {[...competencias].sort((a, b) => (b.score || 0) - (a.score || 0)).map(c => (
                <div key={c.key} className="flex items-center justify-between py-0.5 border-b border-gray-100 last:border-0">
                  <div className="text-sm flex items-center gap-1">
                    <span className="font-semibold text-navy">{c.label}</span>
                    {c.custom && <span className="text-[9px] uppercase bg-alfa-orange/10 text-alfa-orange px-1 rounded">custom</span>}
                  </div>
                  <span className={`font-display text-base tabular-nums ${c.score >= 7 ? 'text-alfa-blue' : c.score <= 4 ? 'text-alfa-orange' : 'text-gray-500'}`}>
                    {c.score}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* H1 — Perguntas abertas */}
        <div className="space-y-4 mb-5 mt-4">
          {h1?.olhar_geracional && (
            <Section title="Como vê o vosso negócio">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{h1.olhar_geracional}</p>
            </Section>
          )}
          {h1?.experiencia_cliente && (
            <Section title="A experiência de cliente que imagina">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{h1.experiencia_cliente}</p>
            </Section>
          )}
          {h1?.sucessao_emocional && (
            <Section title="Entusiasmos e medos">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{h1.sucessao_emocional}</p>
            </Section>
          )}
        </div>

        {/* H2 — Ideias do brainstorming */}
        {h2.length > 0 && (
          <Section title={`H2 · Ideias do brainstorming (${h2.length})`}>
            <div className="space-y-2">
              {h2.map((ideia, i) => (
                <div key={ideia.id || i} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-navy text-sm">{ideia.ideia_titulo}</span>
                    <span className="text-[10px] uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded whitespace-nowrap">{ideia.categoria}</span>
                  </div>
                  {ideia.ideia_descricao && (
                    <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">{ideia.ideia_descricao}</p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* H3 — 4 Quadrantes */}
        {h3 && (
          <Section title="H3 · Pitch individual — 4 quadrantes" accent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'valencias', label: 'Valências' },
                { key: 'o_que_gosto', label: 'O que gosta' },
                { key: 'o_que_nao_gosto', label: 'O que não gosta' },
                { key: 'solucoes_propostas', label: 'Soluções propostas' },
              ].map(q => h3[q.key]?.trim() && (
                <div key={q.key}>
                  <div className="text-[10px] font-semibold text-alfa-blue uppercase tracking-wider mb-1">{q.label}</div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{h3[q.key]}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* H4 — Plano de ação */}
        <Section title="H4 · Plano de ação">
          <div className="space-y-3">
            {h4?.execucao_imediata && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Execução imediata</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{h4.execucao_imediata}</p>
              </div>
            )}
            {h4?.desenvolvimento_6m && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Desenvolvimento — 6 meses</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{h4.desenvolvimento_6m}</p>
              </div>
            )}
            {h4?.compromisso_lideranca && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Compromisso pessoal</div>
                <p className="text-sm text-gray-700 italic whitespace-pre-wrap">"{h4.compromisso_lideranca}"</p>
              </div>
            )}
          </div>
        </Section>

        {/* H4 — Respostas específicas do caminho */}
        {respostasCaminho.length > 0 && (
          <Section title={`Respostas específicas · ${CAMINHO_LABELS[caminho]}`} accent>
            <div className="space-y-3">
              {respostasCaminho.map((r, i) => r.answer?.trim() && (
                <div key={r.key || i}>
                  <div className="text-xs font-semibold text-alfa-blue mb-1">{r.label}</div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.answer}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* H4 — "Não disse" (sempre visível para o admin) */}
        {h4?.nao_disse?.trim() && (
          <div className={`rounded-lg p-4 mb-5 border-2 ${h4.nao_disse_partilhar ? 'bg-orange-50 border-alfa-orange/30' : 'bg-gray-50 border-gray-300'}`}>
            <div className="flex items-start gap-2">
              {h4.nao_disse_partilhar
                ? <AlertCircle className="text-alfa-orange flex-shrink-0 mt-0.5" size={16} />
                : <Lock className="text-gray-400 flex-shrink-0 mt-0.5" size={16} />
              }
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${h4.nao_disse_partilhar ? 'text-alfa-orange' : 'text-gray-400'}`}>
                  O que ainda não tinha dito {!h4.nao_disse_partilhar && '· Privado (só visível aqui)'}
                </div>
                <p className="text-sm text-navy italic leading-relaxed">"{h4.nao_disse}"</p>
              </div>
            </div>
          </div>
        )}

        {/* H4 — Feedback do workshop */}
        {(h4?.feedback_workshop || h4?.rating_workshop) && (
          <Section title="Feedback do workshop" subtle>
            {h4.rating_workshop && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500">Avaliação geral:</span>
                <span className="font-display text-xl text-alfa-blue tabular-nums">{h4.rating_workshop}<span className="text-gray-400 text-sm"> / 10</span></span>
              </div>
            )}
            {h4.feedback_workshop && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{h4.feedback_workshop}</p>
            )}
          </Section>
        )}

        {/* Footer: próxima conversa */}
        <div className="mt-6 pt-5 border-t-2 border-alfa-orange/30 break-inside-avoid">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="text-alfa-orange" size={18} />
            <h3 className="font-display text-lg text-navy">A próxima conversa em casa</h3>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Agendem 1 hora calma. Sem agenda. Façam estas 3 perguntas e <span className="font-semibold">apenas escutem</span>.
          </p>
          <ol className="space-y-1.5">
            {conversas.map((q, i) => (
              <li key={i} className="text-sm text-navy flex items-start gap-2">
                <span className="font-display text-alfa-orange flex-shrink-0">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </div>


        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-gray-100 text-[9pt] text-gray-400 text-center">
          New Generation AGEBROKERS · Workshop 1 Maio 2026 · Idealizado por Rodrigo Dias · Alfa Academy
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, accent, subtle }) {
  const bg = accent ? 'bg-alfa-blue/5 border-alfa-blue/20' : subtle ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
  return (
    <section className={`border rounded-lg p-3 ${bg} break-inside-avoid`}>
      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${accent ? 'text-alfa-blue' : 'text-gray-500'}`}>
        {title}
      </h3>
      {children}
    </section>
  )
}
