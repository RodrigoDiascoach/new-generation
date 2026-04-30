import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Save, Plus, X, ArrowLeft, ArrowRight, Info } from 'lucide-react'
import Layout from '../components/Layout'
import ModuleHeader from '../components/ModuleHeader'
import { supabase } from '../lib/supabase'
import { useParticipant } from '../lib/ParticipantContext'

const TOTAL_REQUIRED = 8

const SUGGESTIONS = [
  { key: 'vendas', label: 'Vendas', desc: 'Capacidade de vender e fechar negócios' },
  { key: 'marketing_digital', label: 'Marketing Digital', desc: 'Redes sociais, conteúdo, anúncios' },
  { key: 'tecnologia_ia', label: 'Tecnologia & IA', desc: 'Ferramentas digitais, automação, IA' },
  { key: 'gestao_clientes', label: 'Gestão de Clientes', desc: 'Relação, retenção, atendimento' },
  { key: 'comunicacao', label: 'Comunicação', desc: 'Falar, escrever, apresentar' },
  { key: 'lideranca', label: 'Liderança', desc: 'Gerir equipas e tomar decisões' },
  { key: 'analise_dados', label: 'Análise de Dados', desc: 'Excel, relatórios, KPIs' },
  { key: 'conhecimento_seguros', label: 'Conhecimento de Seguros', desc: 'Produtos, regulação, mercado' },
  { key: 'negociacao', label: 'Negociação', desc: 'Fechar deals e lidar com objeções' },
  { key: 'networking', label: 'Networking', desc: 'Construir e manter relações profissionais' },
  { key: 'empreendedorismo', label: 'Empreendedorismo', desc: 'Pensar como dono, criar valor novo' },
  { key: 'resiliencia', label: 'Resiliência', desc: 'Lidar com pressão e adversidade' },
  { key: 'resolucao_problemas', label: 'Resolução de Problemas', desc: 'Pensamento crítico e analítico' },
  { key: 'gestao_financeira', label: 'Gestão Financeira', desc: 'Cashflow, margens, investimento' },
  { key: 'inovacao', label: 'Inovação', desc: 'Criar produtos e serviços novos' },
  { key: 'storytelling', label: 'Storytelling', desc: 'Contar histórias que vendem' },
  { key: 'gestao_tempo', label: 'Gestão do Tempo', desc: 'Produtividade, foco, prioridades' },
  { key: 'adaptabilidade', label: 'Adaptabilidade', desc: 'Mudar de abordagem rapidamente' },
  { key: 'visao_estrategica', label: 'Visão Estratégica', desc: 'Pensar a longo prazo' },
  { key: 'trabalho_equipa', label: 'Trabalho em Equipa', desc: 'Colaborar e contribuir' },
]

export default function H1Identidade() {
  const { participantId, refresh } = useParticipant()
  const navigate = useNavigate()
  const [phase, setPhase] = useState('select')
  const [selected, setSelected] = useState([])
  const [scores, setScores] = useState({})
  const [customLabel, setCustomLabel] = useState('')
  const [customDesc, setCustomDesc] = useState('')
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [valencias, setValencias] = useState('')
  const [gostos, setGostos] = useState('')
  const [olharGeracional, setOlharGeracional] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [recordId, setRecordId] = useState(null)
  const [bootLoading, setBootLoading] = useState(true)

  useEffect(() => {
    if (!participantId) return
    loadExisting()
  }, [participantId])

  async function loadExisting() {
    const { data } = await supabase
      .from('h1_competencias')
      .select('*')
      .eq('participant_id', participantId)
      .maybeSingle()

    if (data) {
      setRecordId(data.id)
      const comps = Array.isArray(data.competencias) ? data.competencias : []
      setSelected(comps.map(({ key, label, desc, custom }) => ({ key, label, desc, custom: !!custom })))
      const initialScores = {}
      comps.forEach(c => { initialScores[c.key] = c.score ?? 5 })
      setScores(initialScores)
      setValencias(data.valencias || '')
      setGostos(data.gostos || '')
      setOlharGeracional(data.olhar_geracional || '')
      if (comps.length === TOTAL_REQUIRED) setPhase('rate')
    }
    setBootLoading(false)
  }

  function isSelected(key) {
    return selected.some(s => s.key === key)
  }

  function toggleSuggestion(suggestion) {
    if (isSelected(suggestion.key)) {
      setSelected(selected.filter(s => s.key !== suggestion.key))
      const ns = { ...scores }
      delete ns[suggestion.key]
      setScores(ns)
    } else if (selected.length < TOTAL_REQUIRED) {
      setSelected([...selected, { ...suggestion, custom: false }])
      setScores({ ...scores, [suggestion.key]: 5 })
    }
  }

  function addCustom() {
    const label = customLabel.trim()
    if (!label || selected.length >= TOTAL_REQUIRED) return
    const key = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    setSelected([...selected, { key, label, desc: customDesc.trim(), custom: true }])
    setScores({ ...scores, [key]: 5 })
    setCustomLabel('')
    setCustomDesc('')
    setShowCustomForm(false)
  }

  function removeSelected(key) {
    setSelected(selected.filter(s => s.key !== key))
    const ns = { ...scores }
    delete ns[key]
    setScores(ns)
  }

  function updateScore(key, value) {
    setScores({ ...scores, [key]: parseInt(value) })
    setSaved(false)
  }

  async function handleSave() {
    setLoading(true)
    const competencias = selected.map(s => ({
      key: s.key,
      label: s.label,
      desc: s.desc || '',
      custom: !!s.custom,
      score: scores[s.key] ?? 5,
    }))
    const payload = {
      participant_id: participantId,
      competencias,
      valencias,
      gostos,
      olhar_geracional: olharGeracional,
    }

    let result
    if (recordId) {
      result = await supabase.from('h1_competencias').update(payload).eq('id', recordId)
    } else {
      result = await supabase.from('h1_competencias').insert([payload]).select().single()
      if (result.data) setRecordId(result.data.id)
    }

    if (!result.error) {
      await supabase
        .from('workshop_participants')
        .update({ h1_completo: true, updated_at: new Date().toISOString() })
        .eq('id', participantId)
      await refresh()
      setSaved(true)
      setTimeout(() => navigate('/journey'), 1200)
    }
    setLoading(false)
  }

  if (bootLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-alfa-blue" size={32} />
        </div>
      </Layout>
    )
  }

  const customs = selected.filter(s => s.custom)

  return (
    <Layout>
      <div className="animate-fade-in max-w-4xl mx-auto">
        <ModuleHeader
          label="H1 · Identidade & Potencial"
          title="Roda das Competências"
          description={
            phase === 'select'
              ? `Escolhe ${TOTAL_REQUIRED} competências para te avaliares. Podes usar as sugestões ou adicionar as tuas.`
              : 'Avalia-te de 1 a 10 em cada competência. Depois diz-nos as tuas valências e o que te move.'
          }
          color="blue"
        />

        <div className="mb-6 flex gap-3 p-4 bg-alfa-blue/5 border border-alfa-blue/20 rounded-xl">
          <Info className="text-alfa-blue shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-navy/80 leading-relaxed">
            Antes de decidires o teu próximo passo, é preciso saberes de onde partes. A roda de competências revela onde te sentes forte e onde ainda tens espaço para crescer — e essa honestidade é o ponto de partida de qualquer plano que resulte.
          </p>
        </div>

        {phase === 'select' && (
          <>
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-navy">Sugestões</h2>
                <span className="font-display text-lg text-alfa-blue tabular-nums">
                  {selected.length}/{TOTAL_REQUIRED}
                </span>
              </div>
              <div className="accent-bar mb-6" />
              <div className="grid sm:grid-cols-2 gap-3">
                {SUGGESTIONS.map(s => {
                  const active = isSelected(s.key)
                  const disabled = !active && selected.length >= TOTAL_REQUIRED
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleSuggestion(s)}
                      disabled={disabled}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        active
                          ? 'border-alfa-blue bg-alfa-blue/5'
                          : disabled
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-alfa-blue/50'
                      }`}
                    >
                      <div className="font-semibold text-navy text-sm">{s.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="card mb-6">
              <h2 className="font-display text-xl text-navy mb-1">Competência personalizada</h2>
              <div className="accent-bar mb-4" />

              {customs.length > 0 && (
                <div className="space-y-2 mb-4">
                  {customs.map(s => (
                    <div key={s.key} className="flex items-start justify-between p-3 bg-alfa-blue/5 border border-alfa-blue/30 rounded-lg">
                      <div>
                        <div className="font-semibold text-navy text-sm">{s.label}</div>
                        {s.desc && <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelected(s.key)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Remover"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showCustomForm ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customLabel}
                    onChange={e => setCustomLabel(e.target.value)}
                    placeholder="Nome da competência"
                    className="input-field"
                    maxLength={60}
                  />
                  <input
                    type="text"
                    value={customDesc}
                    onChange={e => setCustomDesc(e.target.value)}
                    placeholder="Descrição curta (opcional)"
                    className="input-field"
                    maxLength={120}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addCustom}
                      disabled={!customLabel.trim() || selected.length >= TOTAL_REQUIRED}
                      className="btn-primary py-2 px-4 text-sm"
                    >
                      Adicionar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCustomForm(false); setCustomLabel(''); setCustomDesc('') }}
                      className="btn-secondary py-2 px-4 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCustomForm(true)}
                  disabled={selected.length >= TOTAL_REQUIRED}
                  className="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 hover:border-alfa-blue hover:text-alfa-blue transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} /> Adicionar competência minha
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPhase('rate')}
              disabled={selected.length !== TOTAL_REQUIRED}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Continuar para avaliação <ArrowRight size={20} />
            </button>
          </>
        )}

        {phase === 'rate' && (
          <>
            {/* Avaliação da roda */}
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-display text-xl text-navy">As tuas competências hoje</h2>
                <button
                  type="button"
                  onClick={() => setPhase('select')}
                  className="text-sm text-alfa-blue hover:underline flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Alterar
                </button>
              </div>
              <div className="accent-bar mb-6" />

              <div className="space-y-5">
                {selected.map(comp => (
                  <div key={comp.key}>
                    <div className="flex justify-between items-baseline mb-2">
                      <div>
                        <label className="font-semibold text-navy">{comp.label}</label>
                        {comp.desc && <p className="text-xs text-gray-500">{comp.desc}</p>}
                      </div>
                      <span className="font-display text-2xl text-alfa-blue tabular-nums">
                        {scores[comp.key] ?? 5}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={scores[comp.key] ?? 5}
                      onChange={(e) => updateScore(comp.key, e.target.value)}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-alfa-blue"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1 · Iniciante</span>
                      <span>10 · Especialista</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Valências e Gostos */}
            <div className="card mb-6">
              <h2 className="font-display text-xl text-navy mb-1">As tuas valências e gostos</h2>
              <div className="accent-bar mb-6" />

              <div className="space-y-5">
                <div>
                  <label className="block font-semibold text-navy mb-2">
                    As minhas valências — o que trago para a mesa
                  </label>
                  <textarea
                    value={valencias}
                    onChange={(e) => { setValencias(e.target.value); setSaved(false) }}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="O que fazes melhor que a maioria? Onde as pessoas te pedem ajuda? Pode ser tecnologia, comunicação, vendas, criatividade, organização..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy mb-2">
                    O que me dá energia — o que genuinamente gosto de fazer
                  </label>
                  <textarea
                    value={gostos}
                    onChange={(e) => { setGostos(e.target.value); setSaved(false) }}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Que tarefas ou projetos te fazem perder a noção do tempo? O que farias mesmo sem receber por isso?"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-navy mb-2">
                    Quando olhas para o negócio da tua família com os teus olhos, o que sentes que está a ficar para trás?
                  </label>
                  <textarea
                    value={olharGeracional}
                    onChange={(e) => { setOlharGeracional(e.target.value); setSaved(false) }}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Pode ser tecnologia, comunicação, atendimento, marca, redes sociais... Sê honesto."
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={20} /> A guardar...</>
              ) : saved ? (
                <>✓ Guardado!</>
              ) : (
                <><Save size={20} /> Guardar e voltar à jornada</>
              )}
            </button>
          </>
        )}
      </div>
    </Layout>
  )
}
