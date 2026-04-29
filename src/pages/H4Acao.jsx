import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Save, CheckCircle2, TrendingUp, Briefcase, MessageSquare, Compass } from 'lucide-react'
import Layout from '../components/Layout'
import ModuleHeader from '../components/ModuleHeader'
import { supabase } from '../lib/supabase'
import { useParticipant } from '../lib/ParticipantContext'

const PERGUNTAS_CAMINHO = {
  sucessor: [
    { key: 'preocupacao_lideranca', label: 'Que aspeto da liderança te preocupa mais?' },
    { key: 'aprender_pais', label: 'O que precisas de aprender com os teus pais antes da transição?' },
  ],
  apoiante: [
    { key: 'tipo_envolvimento', label: 'Que tipo de envolvimento te faz mais sentido — board, consultor pontual, embaixador?' },
    { key: 'comunicacao_pais', label: 'Como vais comunicar este papel aos teus pais?' },
  ],
  independente: [
    { key: 'carreira_propria', label: 'Que carreira ou projeto estás a construir (ou queres construir)?' },
    { key: 'relacao_negocio', label: 'Como vês a tua relação futura com o negócio familiar — zero, cliente, referenciador, outro?' },
  ],
  explorando: [
    { key: 'atrai_sucessao', label: 'O que te atrai no caminho da sucessão?' },
    { key: 'assusta_sucessao', label: 'O que te assusta ou repele?' },
    { key: 'conversa_pais', label: 'Que conversa precisas ter com os teus pais para ganhares clareza?' },
  ],
}

const CAMINHO_LABELS = {
  sucessor: 'Sucessor',
  apoiante: 'Apoiante',
  independente: 'Independente',
  explorando: 'A explorar',
}

export default function H4Acao() {
  const { participant, participantId, refresh } = useParticipant()
  const navigate = useNavigate()
  const [data, setData] = useState({
    execucao_imediata: '',
    desenvolvimento_6m: '',
    compromisso_lideranca: '',
    feedback_workshop: '',
    rating_workshop: 8,
  })
  const [respostasCaminho, setRespostasCaminho] = useState({})
  const [recordId, setRecordId] = useState(null)
  const [loading, setLoading] = useState(false)

  const caminho = participant?.caminho || 'explorando'
  const perguntasCaminho = PERGUNTAS_CAMINHO[caminho] || PERGUNTAS_CAMINHO.explorando

  useEffect(() => {
    if (!participantId) return
    loadExisting()
  }, [participantId])

  async function loadExisting() {
    const { data: existing } = await supabase
      .from('h4_plano_acao')
      .select('*')
      .eq('participant_id', participantId)
      .maybeSingle()

    if (existing) {
      setRecordId(existing.id)
      setData({
        execucao_imediata: existing.execucao_imediata || '',
        desenvolvimento_6m: existing.desenvolvimento_6m || '',
        compromisso_lideranca: existing.compromisso_lideranca || '',
        feedback_workshop: existing.feedback_workshop || '',
        rating_workshop: existing.rating_workshop || 8,
      })
      const respostas = {}
      ;(existing.respostas_caminho || []).forEach(r => {
        respostas[r.key] = r.answer || ''
      })
      setRespostasCaminho(respostas)
    }
  }

  function update(key, value) {
    setData({ ...data, [key]: value })
  }

  function updateCaminho(key, value) {
    setRespostasCaminho({ ...respostasCaminho, [key]: value })
  }

  async function handleSave() {
    setLoading(true)
    const respostas_caminho = perguntasCaminho.map(p => ({
      key: p.key,
      label: p.label,
      answer: respostasCaminho[p.key] || '',
    }))
    const payload = { participant_id: participantId, ...data, respostas_caminho }

    if (recordId) {
      await supabase.from('h4_plano_acao').update(payload).eq('id', recordId)
    } else {
      const { data: inserted } = await supabase
        .from('h4_plano_acao')
        .insert([payload])
        .select()
        .single()
      if (inserted) setRecordId(inserted.id)
    }

    await supabase
      .from('workshop_participants')
      .update({ h4_completo: true, updated_at: new Date().toISOString() })
      .eq('id', participantId)
    await refresh()
    navigate('/journey')
  }

  return (
    <Layout>
      <div className="animate-fade-in max-w-3xl">
        <ModuleHeader
          label="H4 · Execução & Próximos Passos"
          title="O teu plano de ação"
          description="O que distingue um sucessor de um herdeiro é a execução. Define o teu compromisso."
          color="orange"
        />

        <div className="space-y-5">
          <div className="card border-l-4 border-l-alfa-orange">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="text-alfa-orange" size={20} />
              <h3 className="font-display text-xl text-navy">Execução imediata</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Que tarefas vais fazer já amanhã?
            </p>
            <textarea
              value={data.execucao_imediata}
              onChange={(e) => update('execucao_imediata', e.target.value)}
              rows={4}
              className="input-field resize-none text-sm"
              placeholder="Ex: 1. Falar com o pai sobre criar o Instagram. 2. Listar os top 20 clientes. 3. Pesquisar 3 ferramentas de IA..."
            />
          </div>

          <div className="card border-l-4 border-l-alfa-blue">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="text-alfa-blue" size={20} />
              <h3 className="font-display text-xl text-navy">Desenvolvimento — 6 meses</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Que competências vais aprimorar nos próximos 6 meses?
            </p>
            <textarea
              value={data.desenvolvimento_6m}
              onChange={(e) => update('desenvolvimento_6m', e.target.value)}
              rows={4}
              className="input-field resize-none text-sm"
              placeholder="Ex: tirar curso de marketing digital, estudar IA aplicada a seguros, fazer formação em vendas..."
            />
          </div>

          <div className="card border-l-4 border-l-alfa-orange">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="text-alfa-orange" size={20} />
              <h3 className="font-display text-xl text-navy">Compromisso pessoal</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Como queres ser visto pelos clientes ou pela tua área profissional daqui a 3 anos?
            </p>
            <textarea
              value={data.compromisso_lideranca}
              onChange={(e) => update('compromisso_lideranca', e.target.value)}
              rows={4}
              className="input-field resize-none text-sm"
              placeholder="Quer assumas o negócio, fiques ligado, ou sigas outro caminho — o teu compromisso por escrito."
            />
          </div>

          <div className="card border-l-4 border-l-alfa-blue">
            <div className="flex items-center gap-2 mb-1">
              <Compass className="text-alfa-blue" size={20} />
              <h3 className="font-display text-xl text-navy">O teu caminho</h3>
              <span className="ml-auto text-[10px] uppercase tracking-wider bg-alfa-blue/10 text-alfa-blue px-2 py-0.5 rounded">
                {CAMINHO_LABELS[caminho]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Estas perguntas adaptam-se ao caminho que escolheste no início. Sê honesto.
            </p>
            <div className="space-y-4">
              {perguntasCaminho.map(p => (
                <div key={p.key}>
                  <label className="block font-semibold text-navy text-sm mb-2">
                    {p.label}
                  </label>
                  <textarea
                    value={respostasCaminho[p.key] || ''}
                    onChange={(e) => updateCaminho(p.key, e.target.value)}
                    rows={3}
                    className="input-field resize-none text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card bg-gray-50">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="text-navy" size={20} />
              <h3 className="font-display text-xl text-navy">Feedback do workshop</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              O que mais te marcou? O que melhorarias?
            </p>
            <textarea
              value={data.feedback_workshop}
              onChange={(e) => update('feedback_workshop', e.target.value)}
              rows={3}
              className="input-field resize-none text-sm"
              placeholder="Partilha o teu feedback honesto..."
            />

            <div className="mt-5">
              <div className="flex justify-between items-baseline mb-2">
                <label className="font-semibold text-navy text-sm">
                  Avaliação geral do workshop
                </label>
                <span className="font-display text-2xl text-alfa-blue tabular-nums">
                  {data.rating_workshop} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={data.rating_workshop}
                onChange={(e) => update('rating_workshop', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-alfa-blue"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={20} /> A guardar...</>
          ) : (
            <><Save size={20} /> Concluir a jornada</>
          )}
        </button>
      </div>
    </Layout>
  )
}
