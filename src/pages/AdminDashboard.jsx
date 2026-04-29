import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  Users, Lightbulb, CheckCircle2, Star, Download, LogOut,
  RefreshCw, Award, Heart, Ban, TrendingUp
} from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import Logo from '../components/Logo'
import { supabase } from '../lib/supabase'
import { isAdminAuth } from './AdminLogin'

const STORAGE_KEY = 'agebrokers_admin_auth'

const COMPETENCIAS_LABELS = {
  vendas: 'Vendas',
  marketing_digital: 'Marketing Digital',
  tecnologia_ia: 'Tecnologia & IA',
  gestao_clientes: 'Gestão de Clientes',
  comunicacao: 'Comunicação',
  lideranca: 'Liderança',
  analise_dados: 'Análise de Dados',
  conhecimento_seguros: 'Conhecimento de Seguros',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [participants, setParticipants] = useState([])
  const [h1Data, setH1Data] = useState([])
  const [h2Data, setH2Data] = useState([])
  const [h3Data, setH3Data] = useState([])
  const [h4Data, setH4Data] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  if (!isAdminAuth()) return <Navigate to="/admin" replace />

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [p, h1, h2, h3, h4] = await Promise.all([
      supabase.from('workshop_participants').select('*').order('created_at'),
      supabase.from('h1_competencias').select('*'),
      supabase.from('h2_ideias_equipa').select('*').order('created_at'),
      supabase.from('h3_pitch_individual').select('*'),
      supabase.from('h4_plano_acao').select('*'),
    ])
    setParticipants(p.data || [])
    setH1Data(h1.data || [])
    setH2Data(h2.data || [])
    setH3Data(h3.data || [])
    setH4Data(h4.data || [])
    setLoading(false)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    navigate('/admin')
  }

  // Médias de competências
  const avgCompetencias = Object.keys(COMPETENCIAS_LABELS).map(key => {
    const sum = h1Data.reduce((s, h) => s + (h[key] || 0), 0)
    const avg = h1Data.length > 0 ? sum / h1Data.length : 0
    return {
      competencia: COMPETENCIAS_LABELS[key],
      media: parseFloat(avg.toFixed(1)),
    }
  })

  // Ideias por equipa
  const ideiasPorEquipa = [1, 2, 3, 4].map(n => ({
    equipa: `Equipa ${n}`,
    ideias: h2Data.filter(i => i.equipa_numero === n).length,
  }))

  // Categorias de ideias
  const categoriasCount = h2Data.reduce((acc, i) => {
    acc[i.categoria] = (acc[i.categoria] || 0) + 1
    return acc
  }, {})

  // Rating médio
  const ratingMedio = h4Data.length > 0
    ? (h4Data.reduce((s, h) => s + (h.rating_workshop || 0), 0) / h4Data.length).toFixed(1)
    : 0

  // Export JSON
  function exportData() {
    const exportObj = {
      generated_at: new Date().toISOString(),
      workshop: 'New Generation AGEBROKERS - AGELegacy',
      total_participants: participants.length,
      participants,
      h1_competencias: h1Data,
      h2_ideias: h2Data,
      h3_pitch: h3Data,
      h4_acao: h4Data,
    }
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agebrokers-debriefing-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="brand-bar" />
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span className="hidden md:inline-block px-3 py-1 bg-alfa-orange/10 text-alfa-orange text-xs font-semibold rounded-full">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAll} className="btn-secondary py-2 px-3 text-sm">
              <RefreshCw size={16} />
            </button>
            <button onClick={exportData} className="btn-orange py-2 px-3 text-sm flex items-center gap-2">
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={logout} className="text-gray-500 hover:text-red-600 p-2">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-20">
            <div className="spinner mx-auto" />
            <p className="text-gray-500 mt-3">A carregar dados...</p>
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <KPI icon={Users} label="Participantes" value={participants.length} color="blue" />
              <KPI
                icon={CheckCircle2}
                label="Concluíram tudo"
                value={participants.filter(p => p.h1_completo && p.h2_completo && p.h3_completo && p.h4_completo).length}
                color="green"
              />
              <KPI icon={Lightbulb} label="Ideias geradas" value={h2Data.length} color="orange" />
              <KPI icon={Star} label="Rating médio" value={ratingMedio} color="blue" suffix="/10" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { id: 'overview', label: 'Visão geral' },
                { id: 'participants', label: `Participantes (${participants.length})` },
                { id: 'h1', label: `H1 · Competências` },
                { id: 'h2', label: `H2 · Ideias (${h2Data.length})` },
                { id: 'h3', label: `H3 · Pitches` },
                { id: 'h4', label: `H4 · Plano de ação` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-alfa-blue text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-2 gap-5">
                <div className="card">
                  <h3 className="font-display text-lg text-navy mb-1">Mapa de competências (média do grupo)</h3>
                  <div className="accent-bar mb-4" />
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={avgCompetencias}>
                      <PolarGrid stroke="#E5E7EB" />
                      <PolarAngleAxis dataKey="competencia" tick={{ fontSize: 11, fill: '#050A26' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
                      <Radar name="Média" dataKey="media" stroke="#1C3BD7" fill="#1C3BD7" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h3 className="font-display text-lg text-navy mb-1">Ideias por equipa</h3>
                  <div className="accent-bar mb-4" />
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ideiasPorEquipa}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="equipa" tick={{ fill: '#050A26' }} />
                      <YAxis tick={{ fill: '#050A26' }} />
                      <Tooltip />
                      <Bar dataKey="ideias" fill="#F39237" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card lg:col-span-2">
                  <h3 className="font-display text-lg text-navy mb-1">Categorias de ideias</h3>
                  <div className="accent-bar mb-4" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(categoriasCount).map(([cat, count]) => (
                      <div key={cat} className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-lg border border-orange-100">
                        <div className="font-display text-3xl text-alfa-orange">{count}</div>
                        <div className="text-sm text-gray-600 capitalize">{cat}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'participants' && (
              <div className="card">
                <h3 className="font-display text-lg text-navy mb-4">Lista de participantes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3">Nome</th>
                        <th className="text-left p-3">Entidade</th>
                        <th className="text-left p-3">Relação</th>
                        <th className="text-center p-3">Equipa</th>
                        <th className="text-center p-3">Progresso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map(p => {
                        const done = ['h1_completo', 'h2_completo', 'h3_completo', 'h4_completo']
                          .filter(k => p[k]).length
                        return (
                          <tr key={p.id} className="border-t border-gray-100">
                            <td className="p-3 font-semibold">{p.nome_completo}</td>
                            <td className="p-3 text-gray-600">{p.entidade_nome || '—'}</td>
                            <td className="p-3 text-gray-600">{p.relacao_parentesco || '—'}</td>
                            <td className="p-3 text-center">{p.equipa_numero || '—'}</td>
                            <td className="p-3 text-center">
                              <div className="inline-flex gap-1">
                                {[1,2,3,4].map(n => (
                                  <div
                                    key={n}
                                    className={`w-2 h-6 rounded-sm ${n <= done ? 'bg-alfa-blue' : 'bg-gray-200'}`}
                                  />
                                ))}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {participants.length === 0 && (
                        <tr><td colSpan="5" className="p-8 text-center text-gray-400">Sem participantes ainda.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'h1' && (
              <div className="space-y-4">
                {h1Data.map(h => {
                  const part = participants.find(p => p.id === h.participant_id)
                  return (
                    <div key={h.id} className="card">
                      <h4 className="font-display text-lg text-navy mb-3">{part?.nome_completo || '—'}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {Object.entries(COMPETENCIAS_LABELS).map(([k, label]) => (
                          <div key={k} className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500">{label}</div>
                            <div className="font-display text-2xl text-alfa-blue">{h[k] || '—'}</div>
                          </div>
                        ))}
                      </div>
                      {h.processos_melhoria && (
                        <div className="mb-2">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Processos a melhorar</div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{h.processos_melhoria}</p>
                        </div>
                      )}
                      {h.oportunidades_inovacao && (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Oportunidades</div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{h.oportunidades_inovacao}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
                {h1Data.length === 0 && <EmptyState text="Sem submissões em H1 ainda." />}
              </div>
            )}

            {activeTab === 'h2' && (
              <div className="space-y-6">
                {[1, 2, 3, 4].map(eqNum => {
                  const ideias = h2Data.filter(i => i.equipa_numero === eqNum)
                  if (ideias.length === 0) return null
                  return (
                    <div key={eqNum} className="card">
                      <h3 className="font-display text-xl text-navy mb-1">Equipa {eqNum}</h3>
                      <div className="accent-bar mb-4" />
                      <div className="space-y-3">
                        {ideias.map(i => {
                          const part = participants.find(p => p.id === i.participant_id)
                          return (
                            <div key={i.id} className="bg-gray-50 p-4 rounded-lg border-l-4 border-alfa-orange">
                              <div className="flex items-start justify-between mb-1">
                                <h4 className="font-semibold text-navy">{i.ideia_titulo}</h4>
                                <span className="text-xs bg-white px-2 py-1 rounded text-alfa-orange capitalize">
                                  {i.categoria}
                                </span>
                              </div>
                              {i.ideia_descricao && (
                                <p className="text-sm text-gray-600 mb-2">{i.ideia_descricao}</p>
                              )}
                              <p className="text-xs text-gray-400">— {part?.nome_completo}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {h2Data.length === 0 && <EmptyState text="Sem ideias submetidas ainda." />}
              </div>
            )}

            {activeTab === 'h3' && (
              <div className="space-y-4">
                {h3Data.map(h => {
                  const part = participants.find(p => p.id === h.participant_id)
                  return (
                    <div key={h.id} className="card">
                      <h4 className="font-display text-lg text-navy mb-3">{part?.nome_completo || '—'}</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        <PitchBlock icon={Award} label="Valências" text={h.valencias} color="blue" />
                        <PitchBlock icon={Heart} label="O que gosto" text={h.o_que_gosto} color="orange" />
                        <PitchBlock icon={Ban} label="O que não gosto" text={h.o_que_nao_gosto} color="blue" />
                        <PitchBlock icon={Lightbulb} label="Soluções" text={h.solucoes_propostas} color="orange" />
                      </div>
                    </div>
                  )
                })}
                {h3Data.length === 0 && <EmptyState text="Sem pitches submetidos ainda." />}
              </div>
            )}

            {activeTab === 'h4' && (
              <div className="space-y-4">
                {h4Data.map(h => {
                  const part = participants.find(p => p.id === h.participant_id)
                  return (
                    <div key={h.id} className="card">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-display text-lg text-navy">{part?.nome_completo || '—'}</h4>
                        {h.rating_workshop && (
                          <div className="bg-alfa-blue text-white px-3 py-1 rounded-full text-sm font-bold">
                            {h.rating_workshop}/10
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <ActionBlock icon={CheckCircle2} label="Execução imediata" text={h.execucao_imediata} />
                        <ActionBlock icon={TrendingUp} label="Desenvolvimento — 6 meses" text={h.desenvolvimento_6m} />
                        <ActionBlock icon={Award} label="Compromisso de liderança" text={h.compromisso_lideranca} />
                        {h.feedback_workshop && (
                          <ActionBlock icon={Star} label="Feedback" text={h.feedback_workshop} />
                        )}
                      </div>
                    </div>
                  )
                })}
                {h4Data.length === 0 && <EmptyState text="Sem planos de ação submetidos ainda." />}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function KPI({ icon: Icon, label, value, color, suffix = '' }) {
  const colors = {
    blue: 'bg-alfa-blue/10 text-alfa-blue',
    orange: 'bg-alfa-orange/10 text-alfa-orange',
    green: 'bg-green-100 text-green-600',
  }
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
          <div className="font-display text-2xl text-navy">{value}{suffix}</div>
        </div>
      </div>
    </div>
  )
}

function PitchBlock({ icon: Icon, label, text, color }) {
  const colorClass = color === 'blue' ? 'text-alfa-blue' : 'text-alfa-orange'
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <div className={`flex items-center gap-2 mb-2 ${colorClass}`}>
        <Icon size={16} />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{text || <span className="text-gray-400 italic">— vazio —</span>}</p>
    </div>
  )
}

function ActionBlock({ icon: Icon, label, text }) {
  return (
    <div className="border-l-4 border-alfa-orange pl-3">
      <div className="flex items-center gap-2 mb-1 text-alfa-orange">
        <Icon size={14} />
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{text || <span className="text-gray-400 italic">— vazio —</span>}</p>
    </div>
  )
}

function EmptyState({ text }) {
  return <div className="card text-center py-12 text-gray-400">{text}</div>
}
