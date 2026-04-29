import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Save } from 'lucide-react'
import Layout from '../components/Layout'
import ModuleHeader from '../components/ModuleHeader'
import { supabase } from '../lib/supabase'
import { useParticipant } from '../lib/ParticipantContext'

const COMPETENCIAS = [
  { key: 'vendas', label: 'Vendas', desc: 'Capacidade de vender e fechar negócios' },
  { key: 'marketing_digital', label: 'Marketing Digital', desc: 'Redes sociais, conteúdo, anúncios' },
  { key: 'tecnologia_ia', label: 'Tecnologia & IA', desc: 'Ferramentas digitais, automação, IA' },
  { key: 'gestao_clientes', label: 'Gestão de Clientes', desc: 'Relação, retenção, atendimento' },
  { key: 'comunicacao', label: 'Comunicação', desc: 'Falar, escrever, apresentar' },
  { key: 'lideranca', label: 'Liderança', desc: 'Gerir equipas e tomar decisões' },
  { key: 'analise_dados', label: 'Análise de Dados', desc: 'Excel, relatórios, KPIs' },
  { key: 'conhecimento_seguros', label: 'Conhecimento de Seguros', desc: 'Produtos, regulação, mercado' },
]

export default function H1Identidade() {
  const { participantId, refresh } = useParticipant()
  const navigate = useNavigate()
  const [scores, setScores] = useState({})
  const [processosMelhoria, setProcessosMelhoria] = useState('')
  const [oportunidadesInovacao, setOportunidadesInovacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [recordId, setRecordId] = useState(null)

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
      const initialScores = {}
      COMPETENCIAS.forEach(c => {
        initialScores[c.key] = data[c.key] || 5
      })
      setScores(initialScores)
      setProcessosMelhoria(data.processos_melhoria || '')
      setOportunidadesInovacao(data.oportunidades_inovacao || '')
    } else {
      const initialScores = {}
      COMPETENCIAS.forEach(c => { initialScores[c.key] = 5 })
      setScores(initialScores)
    }
  }

  function updateScore(key, value) {
    setScores({ ...scores, [key]: parseInt(value) })
    setSaved(false)
  }

  async function handleSave() {
    setLoading(true)
    const payload = {
      participant_id: participantId,
      ...scores,
      processos_melhoria: processosMelhoria,
      oportunidades_inovacao: oportunidadesInovacao,
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

  return (
    <Layout>
      <div className="animate-fade-in max-w-4xl">
        <ModuleHeader
          label="H1 · Identidade & Potencial"
          title="Roda das Competências"
          description="Avalia-te de 1 a 10 em cada competência. Sê honesto — esta é a tua base de partida."
          color="blue"
        />

        <div className="card mb-6">
          <h2 className="font-display text-xl text-navy mb-1">As tuas competências hoje</h2>
          <div className="accent-bar mb-6" />

          <div className="space-y-5">
            {COMPETENCIAS.map((comp) => (
              <div key={comp.key}>
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <label className="font-semibold text-navy">{comp.label}</label>
                    <p className="text-xs text-gray-500">{comp.desc}</p>
                  </div>
                  <span className="font-display text-2xl text-alfa-blue tabular-nums">
                    {scores[comp.key] || 5}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={scores[comp.key] || 5}
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

        <div className="card mb-6">
          <h2 className="font-display text-xl text-navy mb-1">Diagnóstico do negócio atual</h2>
          <div className="accent-bar mb-6" />

          <div className="space-y-5">
            <div>
              <label className="block font-semibold text-navy mb-2">
                Que processos do negócio dos teus pais sentes que podem melhorar?
              </label>
              <textarea
                value={processosMelhoria}
                onChange={(e) => { setProcessosMelhoria(e.target.value); setSaved(false) }}
                rows={4}
                className="input-field resize-none"
                placeholder="Ex: o atendimento por WhatsApp não está organizado, não há automação no follow-up..."
              />
            </div>

            <div>
              <label className="block font-semibold text-navy mb-2">
                Que oportunidades de inovação consegues identificar?
              </label>
              <textarea
                value={oportunidadesInovacao}
                onChange={(e) => { setOportunidadesInovacao(e.target.value); setSaved(false) }}
                rows={4}
                className="input-field resize-none"
                placeholder="Ex: criar Instagram para a mediadora, implementar IA para análise de apólices..."
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
      </div>
    </Layout>
  )
}
