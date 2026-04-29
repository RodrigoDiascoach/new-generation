import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, Trash2, Users } from 'lucide-react'
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

  useEffect(() => {
    if (!participantId) return
    loadIdeias()
  }, [participantId])

  async function loadIdeias() {
    const { data } = await supabase
      .from('h2_ideias_equipa')
      .select('*')
      .eq('participant_id', participantId)
      .order('created_at', { ascending: true })

    setIdeias(data || [])
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
      .update({
        equipa_numero: equipa,
        h2_completo: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', participantId)
    await refresh()
    navigate('/journey')
  }

  return (
    <Layout>
      <div className="animate-fade-in max-w-4xl">
        <ModuleHeader
          label="H2 · Brainstorming Ativo"
          title="Como tornar os seguros indispensáveis?"
          description="Em equipa, encontrem soluções práticas para as novas gerações de clientes. Cada um regista as suas ideias aqui."
          color="orange"
        />

        {/* Seleção de equipa */}
        <div className="card mb-6 bg-gradient-to-br from-orange-50 to-white border-alfa-orange/20">
          <div className="flex items-center gap-3 mb-3">
            <Users className="text-alfa-orange" size={20} />
            <h2 className="font-display text-lg text-navy">A tua equipa</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setEquipa(n)}
                className={`py-3 rounded-lg font-display text-lg transition-all ${
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
          <h2 className="font-display text-xl text-navy mb-1">Nova ideia</h2>
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
                        <h4 className="font-display text-lg text-navy mb-1">
                          {ideia.ideia_titulo}
                        </h4>
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
