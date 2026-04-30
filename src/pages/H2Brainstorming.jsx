import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, Trash2, Users, Info, Save } from 'lucide-react'
import Layout from '../components/Layout'
import ModuleHeader from '../components/ModuleHeader'
import { supabase } from '../lib/supabase'
import { useParticipant } from '../lib/ParticipantContext'

const CATEGORIAS = [
  { value: 'atendimento', label: 'Atendimento ao cliente' },
  { value: 'automacao', label: 'Automação e IA' },
  { value: 'produto', label: 'Novo produto / serviço' },
  { value: 'marketing', label: 'Marketing e captação' },
  { value: 'gestao', label: 'Gestão interna' },
  { value: 'outro', label: 'Outro' },
]

export default function H2Brainstorming() {
  const { participant, participantId, refresh } = useParticipant()
  const navigate = useNavigate()
  const [equipa, setEquipa] = useState(participant?.equipa_numero || 1)
  const [ideias, setIdeias] = useState([])
  const [novaIdeia, setNovaIdeia] = useState({ titulo: '', descricao: '', categoria: 'atendimento' })
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)

  // Reflexão individual
  const [reflexaoId, setReflexaoId] = useState(null)
  const [reflexao, setReflexao] = useState({ desafio: '', oportunidade: '', tendencia: '' })
  const [savingReflexao, setSavingReflexao] = useState(false)
  const [reflexaoSaved, setReflexaoSaved] = useState(false)

  useEffect(() => {
    if (!participantId) return
    loadIdeias()
    loadReflexao()
  }, [participantId])

  async function loadIdeias() {
    const { data } = await supabase
      .from('h2_ideias_equipa')
      .select('*')
      .eq('participant_id', participantId)
      .order('created_at', { ascending: true })
    setIdeias(data || [])
  }

  async function loadReflexao() {
    const { data } = await supabase
      .from('h2_reflexao')
      .select('*')
      .eq('participant_id', participantId)
      .maybeSingle()
    if (data) {
      setReflexaoId(data.id)
      setReflexao({ desafio: data.desafio || '', oportunidade: data.oportunidade || '', tendencia: data.tendencia || '' })
    }
  }

  async function saveReflexao() {
    setSavingReflexao(true)
    const payload = { participant_id: participantId, ...reflexao, updated_at: new Date().toISOString() }
    if (reflexaoId) {
      await supabase.from('h2_reflexao').update(payload).eq('id', reflexaoId)
    } else {
      const { data } = await supabase.from('h2_reflexao').insert([payload]).select().single()
      if (data) setReflexaoId(data.id)
    }
    setSavingReflexao(false)
    setReflexaoSaved(true)
    setTimeout(() => setReflexaoSaved(false), 2000)
  }

  async function adicionarIdeia() {
    if (!novaIdeia.titulo.trim()) return
    setAdding(true)
    const { data, error } = await supabase
      .from('h2_ideias_equipa')
      .insert([{
        participant_id: participantId,
        equipa_numero: equipa,
        ideia_titulo: novaIdeia.titulo,
        ideia_descricao: novaIdeia.descricao,
        categoria: novaIdeia.categoria,
      }])
      .select()
      .single()
    if (!error && data) {
      setIdeias([...ideias, data])
      setNovaIdeia({ titulo: '', descricao: '', categoria: 'atendimento' })
    }
    setAdding(false)
  }

  async function removerIdeia(id) {
    await supabase.from('h2_ideias_equipa').delete().eq('id', id)
    setIdeias(ideias.filter(i => i.id !== id))
  }

  async function concluirH2() {
    setLoading(true)
    await supabase
      .from('workshop_participants')
      .update({ equipa_numero: equipa, h2_completo: true, updated_at: new Date().toISOString() })
      .eq('id', participantId)
    await refresh()
    navigate('/journey')
  }

  return (
    <Layout>
      <div className="animate-fade-in max-w-4xl mx-auto">
        <ModuleHeader
          label="H2 · Brainstorming em Equipa"
          title="Como tornar os seguros indispensáveis?"
          description="Primeiro reflete individualmente. Depois, em equipa, encontrem soluções práticas para as novas gerações de clientes."
          color="orange"
        />

        <div className="mb-6 flex gap-3 p-4 bg-alfa-orange/5 border border-alfa-orange/20 rounded-xl">
          <Info className="text-alfa-orange shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-navy/80 leading-relaxed">
            A tua geração vê o que os outros já não conseguem ver — isso é a tua maior vantagem. Começa por pensar sozinho. Depois leva essas ideias para a equipa. É quando perspetivas diferentes se encontram que nascem as soluções que ficam.
          </p>
        </div>

        {/* Reflexão individual */}
        <div className="card mb-6 border-l-4 border-l-alfa-orange">
          <h2 className="font-display text-xl text-navy mb-1">Reflexão individual</h2>
          <p className="text-sm text-gray-500 mb-1">Responde antes de começar o brainstorming em equipa.</p>
          <div className="accent-bar mb-5" />

          <div className="space-y-5">
            <div>
              <label className="block font-semibold text-navy mb-2">
                Que desafio no negócio da tua família mais te preocupa?
              </label>
              <textarea
                value={reflexao.desafio}
                onChange={e => { setReflexao({ ...reflexao, desafio: e.target.value }); setReflexaoSaved(false) }}
                rows={3}
                className="input-field resize-none"
                placeholder="Ex: a captação de clientes jovens, a presença digital, o processo de atendimento..."
              />
            </div>

            <div>
              <label className="block font-semibold text-navy mb-2">
                Onde vês a maior oportunidade de melhoria ou inovação?
              </label>
              <textarea
                value={reflexao.oportunidade}
                onChange={e => { setReflexao({ ...reflexao, oportunidade: e.target.value }); setReflexaoSaved(false) }}
                rows={3}
                className="input-field resize-none"
                placeholder="Ex: automatizar o seguimento de clientes, criar conteúdo nas redes sociais, simplificar a comunicação das apólices..."
              />
            </div>

            <div>
              <label className="block font-semibold text-navy mb-2">
                Que ferramenta, tendência ou competência da tua geração poderia ser aplicada ao negócio?
              </label>
              <textarea
                value={reflexao.tendencia}
                onChange={e => { setReflexao({ ...reflexao, tendencia: e.target.value }); setReflexaoSaved(false) }}
                rows={3}
                className="input-field resize-none"
                placeholder="Ex: IA para triagem de sinistros, vídeos curtos para explicar seguros, WhatsApp para atendimento rápido..."
              />
            </div>
          </div>

          <button
            type="button"
            onClick={saveReflexao}
            disabled={savingReflexao}
            className="btn-secondary mt-5 flex items-center gap-2 text-sm"
          >
            {savingReflexao ? (
              <Loader2 className="animate-spin" size={16} />
            ) : reflexaoSaved ? (
              <>✓ Guardado</>
            ) : (
              <><Save size={16} /> Guardar reflexão</>
            )}
          </button>
        </div>

        {/* Seleção de equipa */}
        <div className="card mb-6 bg-gradient-to-br from-orange-50 to-white border-alfa-orange/20">
          <div className="flex items-center gap-3 mb-3">
            <Users className="text-alfa-orange" size={20} />
            <h2 className="font-display text-lg text-navy">A tua equipa</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setEquipa(n)}
                className={`py-3 rounded-lg font-display text-base md:text-lg transition-all ${
                  equipa === n
                    ? 'bg-alfa-orange text-white shadow-md'
                    : 'bg-white text-navy border-2 border-gray-200 hover:border-alfa-orange'
                }`}
              >
                Equipa {n}
              </button>
            ))}
          </div>
        </div>

        {/* Adicionar ideia */}
        <div className="card mb-6">
          <h2 className="font-display text-xl text-navy mb-1">A minha ideia para a equipa</h2>
          <div className="accent-bar mb-5" />

          <div className="space-y-4">
            <input
              type="text"
              value={novaIdeia.titulo}
              onChange={(e) => setNovaIdeia({ ...novaIdeia, titulo: e.target.value })}
              className="input-field"
              placeholder="Título da ideia (ex: WhatsApp automatizado para sinistros)"
            />
            <textarea
              value={novaIdeia.descricao}
              onChange={(e) => setNovaIdeia({ ...novaIdeia, descricao: e.target.value })}
              rows={3}
              className="input-field resize-none"
              placeholder="Descreve a ideia: como funciona, que problema resolve..."
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={novaIdeia.categoria}
                onChange={(e) => setNovaIdeia({ ...novaIdeia, categoria: e.target.value })}
                className="input-field sm:flex-1"
              >
                {CATEGORIAS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <button
                onClick={adicionarIdeia}
                disabled={adding || !novaIdeia.titulo.trim()}
                className="btn-orange flex items-center justify-center gap-2 sm:px-8"
              >
                {adding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                Adicionar
              </button>
            </div>
          </div>
        </div>

        {/* Lista de ideias */}
        {ideias.length > 0 && (
          <div className="mb-6">
            <h3 className="font-display text-lg text-navy mb-3">
              As tuas ideias ({ideias.length})
            </h3>
            <div className="space-y-3">
              {ideias.map((ideia) => {
                const cat = CATEGORIAS.find(c => c.value === ideia.categoria)
                return (
                  <div key={ideia.id} className="card border-l-4 border-l-alfa-orange">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-alfa-orange uppercase tracking-wider">
                            {cat?.label}
                          </span>
                        </div>
                        <h4 className="font-display text-lg text-navy mb-1">{ideia.ideia_titulo}</h4>
                        {ideia.ideia_descricao && (
                          <p className="text-sm text-gray-600">{ideia.ideia_descricao}</p>
                        )}
                      </div>
                      <button
                        onClick={() => removerIdeia(ideia.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <button
          onClick={concluirH2}
          disabled={loading || ideias.length === 0}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="animate-spin" size={20} /> A guardar...</>
          ) : (
            <>Concluir H2 e voltar à jornada</>
          )}
        </button>

        {ideias.length === 0 && (
          <p className="text-center text-sm text-gray-500 mt-3">
            Adiciona pelo menos uma ideia antes de concluir.
          </p>
        )}
      </div>
    </Layout>
  )
}
