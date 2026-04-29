import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Save, Star, Heart, Ban, Lightbulb } from 'lucide-react'
import Layout from '../components/Layout'
import ModuleHeader from '../components/ModuleHeader'
import { supabase } from '../lib/supabase'
import { useParticipant } from '../lib/ParticipantContext'

const QUADRANTES = [
  {
    key: 'valencias',
    icon: Star,
    color: 'blue',
    title: 'Valências',
    subtitle: 'O que trago para a mesa',
    placeholder: 'Marketing, gestão, tecnologia, vendas, design... O que sabes fazer melhor que os outros?',
  },
  {
    key: 'o_que_gosto',
    icon: Heart,
    color: 'orange',
    title: 'O que gosto',
    subtitle: 'Paixões profissionais',
    placeholder: 'O que te dá energia? Que tarefas farias mesmo sem ganhar nada?',
  },
  {
    key: 'o_que_nao_gosto',
    icon: Ban,
    color: 'blue',
    title: 'O que não gosto',
    subtitle: 'Barreiras e travões',
    placeholder: 'Que processos te tiram energia? O que evitas no negócio atual?',
  },
  {
    key: 'solucoes_propostas',
    icon: Lightbulb,
    color: 'orange',
    title: 'Soluções propostas',
    subtitle: 'A tua proposta de melhoria',
    placeholder: 'Como vais usar as tuas valências para acrescentar valor ao negócio dos teus pais e à rede Ageas?',
  },
]

export default function H3Pitch() {
  const { participantId, refresh } = useParticipant()
  const navigate = useNavigate()
  const [data, setData] = useState({
    valencias: '',
    o_que_gosto: '',
    o_que_nao_gosto: '',
    solucoes_propostas: '',
  })
  const [recordId, setRecordId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!participantId) return
    loadExisting()
  }, [participantId])

  async function loadExisting() {
    const { data: existing } = await supabase
      .from('h3_pitch_individual')
      .select('*')
      .eq('participant_id', participantId)
      .maybeSingle()

    if (existing) {
      setRecordId(existing.id)
      setData({
        valencias: existing.valencias || '',
        o_que_gosto: existing.o_que_gosto || '',
        o_que_nao_gosto: existing.o_que_nao_gosto || '',
        solucoes_propostas: existing.solucoes_propostas || '',
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
      await supabase.from('h3_pitch_individual').update(payload).eq('id', recordId)
    } else {
      const { data: inserted } = await supabase
        .from('h3_pitch_individual')
        .insert([payload])
        .select()
        .single()
      if (inserted) setRecordId(inserted.id)
    }

    await supabase
      .from('workshop_participants')
      .update({ h3_completo: true, updated_at: new Date().toISOString() })
      .eq('id', participantId)
    await refresh()
    navigate('/journey')
  }

  return (
    <Layout>
      <div className="animate-fade-in max-w-5xl">
        <ModuleHeader
          label="H3 · Partilha & Pitch"
          title="Os teus 4 quadrantes"
          description="Reflete em cada área. Não tem de ser perfeito, tem de ser verdadeiro."
          color="blue"
        />

        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {QUADRANTES.map((q) => {
            const Icon = q.icon
            const borderColor = q.color === 'blue' ? 'border-l-alfa-blue' : 'border-l-alfa-orange'
            const iconColor = q.color === 'blue' ? 'text-alfa-blue' : 'text-alfa-orange'

            return (
              <div key={q.key} className={`card border-l-4 ${borderColor}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={iconColor} size={20} />
                  <h3 className="font-display text-xl text-navy">{q.title}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">{q.subtitle}</p>
                <textarea
                  value={data[q.key]}
                  onChange={(e) => update(q.key, e.target.value)}
                  rows={5}
                  className="input-field resize-none text-sm"
                  placeholder={q.placeholder}
                />
              </div>
            )
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={20} /> A guardar...</>
          ) : (
            <><Save size={20} /> Guardar e voltar à jornada</>
          )}
        </button>
      </div>
    </Layout>
  )
}
