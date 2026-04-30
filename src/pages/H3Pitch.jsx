import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Save, User, Flame, Wrench, Lightbulb, Info } from 'lucide-react'
import Layout from '../components/Layout'
import ModuleHeader from '../components/ModuleHeader'
import { supabase } from '../lib/supabase'
import { useParticipant } from '../lib/ParticipantContext'

const QUADRANTES = [
  {
    key: 'valencias',
    icon: User,
    color: 'blue',
    title: 'Quem sou eu',
    subtitle: 'A tua apresentação para o palco',
    placeholder: 'Nome, de onde vens, o que estudas ou fazes hoje, a tua ligação ao negócio familiar. Conta a tua história em 4 a 5 frases — é o que vais dizer quando te apresentares ao grupo.',
  },
  {
    key: 'o_que_gosto',
    icon: Flame,
    color: 'orange',
    title: 'O que me move',
    subtitle: 'Paixões e motivações',
    placeholder: 'O que te dá energia? Que projetos ou atividades te fazem esquecer as horas? O que te levaria a trabalhar mesmo sem receber?',
  },
  {
    key: 'o_que_nao_gosto',
    icon: Wrench,
    color: 'blue',
    title: 'O que quero transformar',
    subtitle: 'Oportunidades de melhoria no negócio',
    placeholder: 'O que não está a funcionar no negócio da tua família? Que processos te parecem desatualizados? O que mudarias amanhã se pudesses?',
  },
  {
    key: 'solucoes_propostas',
    icon: Lightbulb,
    color: 'orange',
    title: 'A minha proposta',
    subtitle: 'Ideia concreta para apresentar ao grupo',
    placeholder: 'Que ideia concreta propões para acrescentar valor ao negócio? Pode ser uma ferramenta, um serviço novo, uma forma diferente de comunicar — algo que podes começar a implementar.',
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
      <div className="animate-fade-in max-w-4xl mx-auto">
        <ModuleHeader
          label="H3 · Apresentação em Palco"
          title="Prepara a tua apresentação"
          description="Vais apresentar ao grupo: quem és, o que te move, o que queres transformar e a tua proposta concreta."
          color="blue"
        />

        <div className="mb-6 flex gap-3 p-4 bg-alfa-blue/5 border border-alfa-blue/20 rounded-xl">
          <Info className="text-alfa-blue shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-navy/80 leading-relaxed">
            Saber o que fazes não chega — precisas de comunicar o teu valor de forma clara para os teus pais, para clientes e para parceiros. Usa estes 4 quadrantes para preparares o que vais dizer quando subires ao palco. Não tem de ser perfeito, tem de ser verdadeiro.
          </p>
        </div>

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
