import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useParticipant } from '../lib/ParticipantContext'

export default function Onboarding() {
  const navigate = useNavigate()
  const { setActive } = useParticipant()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nome_completo: '',
    email: '',
    telefone: '',
    entidade_nome: '',
    mediador_responsavel: '',
    relacao_parentesco: '',
    caminho: 'explorando',
  })

  function update(field, value) {
    setForm({ ...form, [field]: value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.nome_completo.trim()) {
      setError('O nome completo é obrigatório.')
      return
    }

    setLoading(true)

    const { data, error: insertError } = await supabase
      .from('workshop_participants')
      .insert([form])
      .select()
      .single()

    setLoading(false)

    if (insertError) {
      setError('Erro ao guardar os dados. Tenta novamente.')
      console.error(insertError)
      return
    }

    setActive(data.id, data)
    navigate('/journey')
  }

  return (
    <Layout showLogout={false}>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <span className="text-alfa-orange font-display text-sm uppercase tracking-wider">
              Workshop
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-display text-alfa-blue mb-4">
            New Generation AGEBROKERS
          </h1>
          <p className="text-lg text-gray-600">
            Bem-vindo ao New Generation AGEBROKERS. Antes de começar, deixa os teus dados.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <h2 className="text-xl font-display text-navy mb-1">Os teus dados</h2>
            <div className="accent-bar" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">
              Nome completo *
            </label>
            <input
              type="text"
              value={form.nome_completo}
              onChange={(e) => update('nome_completo', e.target.value)}
              className="input-field"
              placeholder="O teu nome"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className="input-field"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => update('telefone', e.target.value)}
                className="input-field"
                placeholder="912 345 678"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-display text-navy mb-3">
              Entidade que representas
            </h3>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">
              Nome da entidade / mediador
            </label>
            <input
              type="text"
              value={form.entidade_nome}
              onChange={(e) => update('entidade_nome', e.target.value)}
              className="input-field"
              placeholder="Ex: Mediação Silva, Lda."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">
              Mediador responsável (pai, mãe, tio...)
            </label>
            <input
              type="text"
              value={form.mediador_responsavel}
              onChange={(e) => update('mediador_responsavel', e.target.value)}
              className="input-field"
              placeholder="Nome da pessoa que representa a entidade"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-2">
              Relação / parentesco
            </label>
            <select
              value={form.relacao_parentesco}
              onChange={(e) => update('relacao_parentesco', e.target.value)}
              className="input-field"
            >
              <option value="">Seleciona...</option>
              <option value="filho/a">Filho / Filha</option>
              <option value="sobrinho/a">Sobrinho / Sobrinha</option>
              <option value="neto/a">Neto / Neta</option>
              <option value="conjuge">Cônjuge</option>
              <option value="colaborador">Colaborador / Colaboradora</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-display text-navy mb-1">
              O teu caminho
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Sê honesto. Não há resposta certa — o workshop adapta-se a ti.
            </p>
            <div className="space-y-2">
              {[
                { value: 'sucessor', label: 'Quero liderar o negócio', desc: 'Vou assumir o dia-a-dia da mediadora.' },
                { value: 'apoiante', label: 'Quero apoiar sem liderar', desc: 'Ficar ligado como board, consultor ou embaixador.' },
                { value: 'independente', label: 'Quero o meu próprio caminho', desc: 'Construir uma carreira/projeto fora do negócio familiar.' },
                { value: 'explorando', label: 'Ainda estou a descobrir', desc: 'Quero usar o workshop para ganhar clareza.' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    form.caminho === opt.value
                      ? 'border-alfa-blue bg-alfa-blue/5'
                      : 'border-gray-200 hover:border-alfa-blue/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="caminho"
                    value={opt.value}
                    checked={form.caminho === opt.value}
                    onChange={(e) => update('caminho', e.target.value)}
                    className="mt-1 accent-alfa-blue"
                  />
                  <div>
                    <div className="font-semibold text-navy text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                A guardar...
              </>
            ) : (
              <>
                Começar a jornada
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Os teus dados são usados apenas para o workshop e debriefing final.
          </p>
        </form>
      </div>
    </Layout>
  )
}
