import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Save, CheckCircle2, TrendingUp, Briefcase, MessageSquare } from 'lucide-react'
import Layout from '../components/Layout'
import ModuleHeader from '../components/ModuleHeader'
import { supabase } from '../lib/supabase'
import { useParticipant } from '../lib/ParticipantContext'

export default function H4Acao() {
  const { participantId, refresh } = useParticipant()
  const navigate = useNavigate()
  const [data, setData] = useState({
    execucao_imediata: '',
    desenvolvimento_6m: '',
    compromisso_lideranca: '',
    feedback_workshop: '',
    rating_workshop: 8,
  })
  const [recordId, setRecordId] = useState(null)
  const [loading, setLoading] = useState(false)

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
    }
  }

  function update(key, value) {
    setData({ ...data, [key]: value })
  }

  async function handleSave() {
    setLoading(true)
    const payload = { participant_id: participantId, ...data }

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
              <h3 className="font-display text-xl text-navy">Compromisso de liderança</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Como vais honrar o legado e dar continuidade à carteira familiar?
            </p>
            <textarea
              value={data.compromisso_lideranca}
              onChange={(e) => update('compromisso_lideranca', e.target.value)}
              rows={4}
              className="input-field resize-none text-sm"
              placeholder="O teu compromisso por escrito. Como queres ser visto pelos clientes do teu pai daqui a 3 anos?"
            />
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
