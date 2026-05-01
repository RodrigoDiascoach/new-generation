import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  Users, Lightbulb, CheckCircle2, Star, Download, LogOut,
  RefreshCw, Award, Heart, Ban, TrendingUp, Play, FileText, EyeOff,
  Pencil, Trash2, X, AlertTriangle
} from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import Logo from '../components/Logo'
import { supabase } from '../lib/supabase'
import { isAdminAuth } from './AdminLogin'
import { CAMINHOS, CAMINHO_LABELS, CAMINHO_COLORS, aggregateCompetencias, getTeamLabel } from '../lib/workshop-utils'

const STORAGE_KEY = 'agebrokers_admin_auth'
const RADAR_TOP_N = 8

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [participants, setParticipants] = useState([])
  const [h1Data, setH1Data] = useState([])
  const [h2Data, setH2Data] = useState([])
  const [h3Data, setH3Data] = useState([])
  const [h4Data, setH4Data] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [exportOpen, setExportOpen] = useState(false)
  const [editParticipant, setEditParticipant] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [saving, setSaving] = useState(false)

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

  async function saveEdit(id, fields) {
    setSaving(true)
    await supabase.from('workshop_participants').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p))
    setSaving(false)
    setEditParticipant(null)
  }

  async function deleteParticipant(id) {
    await supabase.from('workshop_participants').delete().eq('id', id)
    setParticipants(prev => prev.filter(p => p.id !== id))
    setH1Data(prev => prev.filter(h => h.participant_id !== id))
    setH2Data(prev => prev.filter(h => h.participant_id !== id))
    setH3Data(prev => prev.filter(h => h.participant_id !== id))
    setH4Data(prev => prev.filter(h => h.participant_id !== id))
    setDeleteConfirm(null)
  }

  async function toggleIncluir(id, current) {
    await supabase
      .from('workshop_participants')
      .update({ incluir_analise: !current })
      .eq('id', id)
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, incluir_analise: !current } : p))
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    navigate('/admin')
  }

  // Participantes ativos nas análises (excluídos: is_test ou incluir_analise=false)
  const activeParticipants = participants.filter(p => p.incluir_analise !== false && !p.is_test)
  const activeIds = new Set(activeParticipants.map(p => p.id))
  const activeH1 = h1Data.filter(h => activeIds.has(h.participant_id))
  const activeH2 = h2Data.filter(h => activeIds.has(h.participant_id))
  const activeH3 = h3Data.filter(h => activeIds.has(h.participant_id))
  const activeH4 = h4Data.filter(h => activeIds.has(h.participant_id))

  // Agregação das competências
  const compStats = aggregateCompetencias(activeH1)
  const avgCompetencias = compStats.slice(0, RADAR_TOP_N).map(s => ({
    competencia: s.label,
    media: s.avg,
    count: s.count,
  }))

  // Distribuição por caminho
  const caminhoStats = CAMINHOS.map(c => ({
    caminho: c,
    label: CAMINHO_LABELS[c],
    count: activeParticipants.filter(p => p.caminho === c).length,
  }))
  const caminhoSemResposta = activeParticipants.filter(p => !p.caminho).length

  // Ideias por equipa
  const ideiasPorEquipa = [1, 2, 3, 4].map(n => ({
    equipa: `Equipa ${n}`,
    ideias: activeH2.filter(i => i.equipa_numero === n).length,
  }))

  // Categorias de ideias
  const categoriasCount = activeH2.reduce((acc, i) => {
    acc[i.categoria] = (acc[i.categoria] || 0) + 1
    return acc
  }, {})

  // Rating médio
  const ratingMedio = activeH4.length > 0
    ? (activeH4.reduce((s, h) => s + (h.rating_workshop || 0), 0) / activeH4.length).toFixed(1)
    : 0

  function exportJSON() {
    const exportObj = {
      generated_at: new Date().toISOString(),
      workshop: 'New Generation AGEBROKERS',
      total_participants: activeParticipants.length,
      participants: activeParticipants,
      h1_competencias: activeH1,
      h2_ideias: activeH2,
      h3_pitch: activeH3,
      h4_acao: activeH4,
    }
    download(
      JSON.stringify(exportObj, null, 2),
      `agebrokers-${new Date().toISOString().slice(0,10)}.json`,
      'application/json',
    )
  }

  function exportCSV() {
    const headers = [
      'nome', 'email', 'telefone', 'entidade', 'mediador_responsavel',
      'relacao', 'caminho', 'equipa', 'criado_em',
      'progresso (0-4)',
      'competencias_escolhidas', 'top_3_competencias',
      'olhar_geracional', 'experiencia_cliente', 'sucessao_emocional',
      'num_ideias', 'categorias_ideias',
      'valencias', 'o_que_gosto', 'o_que_nao_gosto', 'solucoes_propostas',
      'execucao_imediata', 'desenvolvimento_6m', 'compromisso_pessoal',
      'prazo_pronto',
      'nao_disse_partilhar', 'nao_disse',
      'respostas_caminho',
      'feedback_workshop', 'rating_workshop',
    ]

    const rows = activeParticipants.map(p => {
      const h1 = activeH1.find(h => h.participant_id === p.id) || {}
      const h3 = activeH3.find(h => h.participant_id === p.id) || {}
      const h4 = activeH4.find(h => h.participant_id === p.id) || {}
      const ideias = activeH2.filter(i => i.participant_id === p.id)
      const comps = Array.isArray(h1.competencias) ? h1.competencias : []
      const top3 = [...comps].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3)
      const respCam = Array.isArray(h4.respostas_caminho) ? h4.respostas_caminho : []
      const progresso = ['h1_completo', 'h2_completo', 'h3_completo', 'h4_completo'].filter(k => p[k]).length

      return [
        p.nome_completo || '',
        p.email || '',
        p.telefone || '',
        p.entidade_nome || '',
        p.mediador_responsavel || '',
        p.relacao_parentesco || '',
        p.caminho || '',
        p.equipa_numero || '',
        p.created_at || '',
        progresso,
        comps.map(c => `${c.label}:${c.score}${c.custom ? '*' : ''}`).join(' | '),
        top3.map(c => `${c.label} (${c.score})`).join(' | '),
        h1.olhar_geracional || '',
        h1.experiencia_cliente || '',
        h1.sucessao_emocional || '',
        ideias.length,
        ideias.map(i => i.categoria).filter(Boolean).join(' | '),
        h3.valencias || '',
        h3.o_que_gosto || '',
        h3.o_que_nao_gosto || '',
        h3.solucoes_propostas || '',
        h4.execucao_imediata || '',
        h4.desenvolvimento_6m || '',
        h4.compromisso_lideranca || '',
        h4.prazo_pronto || '',
        h4.nao_disse_partilhar ? 'sim' : 'não',
        h4.nao_disse || '',
        respCam.map(r => `${r.label}: ${r.answer}`).join('\n---\n'),
        h4.feedback_workshop || '',
        h4.rating_workshop ?? '',
      ]
    })

    const csv = '﻿' +
      [headers, ...rows]
        .map(row => row.map(cell => csvEscape(cell)).join(','))
        .join('\r\n')

    download(csv, `agebrokers-${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8')
  }

  function exportCSVIdeias() {
    const headers = ['equipa', 'autor', 'caminho', 'categoria', 'titulo', 'descricao', 'criado_em']
    const rows = activeH2.map(i => {
      const p = activeParticipants.find(pp => pp.id === i.participant_id)
      return [
        i.equipa_numero || '',
        p?.nome_completo || '',
        p?.caminho || '',
        i.categoria || '',
        i.ideia_titulo || '',
        i.ideia_descricao || '',
        i.created_at || '',
      ]
    })
    const csv = '﻿' +
      [headers, ...rows]
        .map(row => row.map(cell => csvEscape(cell)).join(','))
        .join('\r\n')
    download(csv, `agebrokers-ideias-${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8')
  }

  function csvEscape(value) {
    const s = String(value ?? '')
    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  function download(content, filename, mime) {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const excludedCount = participants.filter(p => p.incluir_analise === false || p.is_test).length

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
            <button
              onClick={() => navigate('/admin/apresentacao')}
              className="bg-alfa-blue text-white font-semibold py-2 px-3 text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Play size={16} />
              <span className="hidden sm:inline">Apresentação</span>
            </button>
            <button onClick={loadAll} className="btn-secondary py-2 px-3 text-sm">
              <RefreshCw size={16} />
            </button>
            <div className="relative">
              <button
                onClick={() => setExportOpen(o => !o)}
                onBlur={() => setTimeout(() => setExportOpen(false), 150)}
                className="btn-orange py-2 px-3 text-sm flex items-center gap-2"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    onMouseDown={(e) => { e.preventDefault(); exportCSV(); setExportOpen(false) }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100"
                  >
                    <div className="font-semibold text-navy text-sm flex items-center gap-2">
                      📊 CSV — participantes ativos
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Excel/Sheets · 1 linha por pessoa</div>
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); exportCSVIdeias(); setExportOpen(false) }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100"
                  >
                    <div className="font-semibold text-navy text-sm flex items-center gap-2">
                      💡 CSV — ideias H2
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">1 linha por ideia, com autor e equipa</div>
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); exportJSON(); setExportOpen(false) }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="font-semibold text-navy text-sm flex items-center gap-2">
                      📦 JSON — backup técnico
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Tudo cru, para arquivo</div>
                  </button>
                </div>
              )}
            </div>
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
              <KPI icon={Users} label="Na análise" value={activeParticipants.length} color="blue" />
              <KPI
                icon={CheckCircle2}
                label="Concluíram tudo"
                value={activeParticipants.filter(p => p.h1_completo && p.h2_completo && p.h3_completo && p.h4_completo).length}
                color="green"
              />
              <KPI icon={Lightbulb} label="Ideias geradas" value={activeH2.length} color="orange" />
              <KPI icon={Star} label="Rating médio" value={ratingMedio} color="blue" suffix="/10" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { id: 'overview', label: 'Visão geral' },
                { id: 'participants', label: `Participantes (${activeParticipants.length}${excludedCount > 0 ? `+${excludedCount}` : ''})` },
                { id: 'h1', label: 'H1 · Competências' },
                { id: 'h2', label: `H2 · Ideias (${activeH2.length})` },
                { id: 'h3', label: 'H3 · Pitches' },
                { id: 'h4', label: 'H4 · Plano de ação' },
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
                  <h3 className="font-display text-lg text-navy mb-1">Top {RADAR_TOP_N} competências mais escolhidas</h3>
                  <p className="text-xs text-gray-500 mb-2">Média de score apenas entre os participantes que escolheram cada competência.</p>
                  <div className="accent-bar mb-4" />
                  {avgCompetencias.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={avgCompetencias}>
                        <PolarGrid stroke="#E5E7EB" />
                        <PolarAngleAxis dataKey="competencia" tick={{ fontSize: 11, fill: '#050A26' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
                        <Radar name="Média" dataKey="media" stroke="#1C3BD7" fill="#1C3BD7" fillOpacity={0.3} />
                        <Tooltip formatter={(v, _n, p) => [`${v} (escolhida por ${p?.payload?.count || 0})`, 'Média']} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">
                      Sem dados de competências ainda.
                    </div>
                  )}
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

                <div className="card lg:col-span-2">
                  <h3 className="font-display text-lg text-navy mb-1">Distribuição por caminho</h3>
                  <p className="text-xs text-gray-500 mb-3">Quantos participantes em cada perfil profissional.</p>
                  <div className="accent-bar mb-4" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {caminhoStats.map(s => (
                      <div key={s.caminho} className={`p-4 rounded-lg border ${CAMINHO_COLORS[s.caminho]}`}>
                        <div className="font-display text-3xl">{s.count}</div>
                        <div className="text-sm font-semibold">{s.label}</div>
                      </div>
                    ))}
                    {caminhoSemResposta > 0 && (
                      <div className="p-4 rounded-lg border bg-gray-50 text-gray-400 border-gray-200">
                        <div className="font-display text-3xl">{caminhoSemResposta}</div>
                        <div className="text-sm font-semibold">Sem resposta</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'participants' && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-navy">Lista de participantes</h3>
                  {excludedCount > 0 && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <EyeOff size={12} /> {excludedCount} excluído{excludedCount > 1 ? 's' : ''} da análise
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3">Nome</th>
                        <th className="text-left p-3">Entidade</th>
                        <th className="text-left p-3">Relação</th>
                        <th className="text-left p-3">Caminho</th>
                        <th className="text-center p-3">Equipa</th>
                        <th className="text-center p-3">Progresso</th>
                        <th className="text-center p-3">Análise</th>
                        <th className="text-center p-3">Briefing</th>
                        <th className="text-center p-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map(p => {
                        const excluded = p.incluir_analise === false || p.is_test
                        const active = !excluded
                        const done = ['h1_completo', 'h2_completo', 'h3_completo', 'h4_completo']
                          .filter(k => p[k]).length
                        return (
                          <tr key={p.id} className={`border-t border-gray-100 transition-opacity ${excluded ? 'opacity-40' : ''}`}>
                            <td className="p-3 font-semibold">{p.nome_completo}</td>
                            <td className="p-3 text-gray-600">{p.entidade_nome || '—'}</td>
                            <td className="p-3 text-gray-600">{p.relacao_parentesco || '—'}</td>
                            <td className="p-3">
                              {p.caminho ? (
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${CAMINHO_COLORS[p.caminho]}`}>
                                  {CAMINHO_LABELS[p.caminho]}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
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
                            <td className="p-3 text-center">
                              <button
                                onClick={() => !p.is_test && toggleIncluir(p.id, active)}
                                disabled={p.is_test}
                                title={p.is_test ? 'Conta de teste — sempre excluída' : active ? 'Excluir da análise' : 'Incluir na análise'}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  p.is_test ? 'bg-gray-200 cursor-not-allowed' :
                                  active ? 'bg-alfa-blue cursor-pointer' : 'bg-gray-300 cursor-pointer'
                                }`}
                              >
                                <span className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                                  active ? 'translate-x-5' : 'translate-x-1'
                                }`} />
                              </button>
                            </td>
                            <td className="p-3 text-center">
                              <a
                                href={`/admin/briefing/${p.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-alfa-blue hover:text-blue-700 px-2 py-1 rounded border border-alfa-blue/30 hover:bg-alfa-blue/5"
                              >
                                <FileText size={12} /> Abrir
                              </a>
                            </td>
                            <td className="p-3 text-center">
                              <div className="inline-flex gap-1">
                                <button
                                  onClick={() => setEditParticipant(p)}
                                  title="Editar"
                                  className="p-1.5 text-gray-400 hover:text-alfa-blue hover:bg-alfa-blue/5 rounded transition-colors"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(p)}
                                  title="Eliminar"
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                      {participants.length === 0 && (
                        <tr><td colSpan="9" className="p-8 text-center text-gray-400">Sem participantes ainda.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'h1' && (
              <div className="space-y-4">
                {compStats.length > 0 && (
                  <div className="card">
                    <h3 className="font-display text-lg text-navy mb-1">Ranking de competências</h3>
                    <p className="text-xs text-gray-500 mb-3">Quantos participantes escolheram cada uma e a média do score deles.</p>
                    <div className="accent-bar mb-4" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">Competência</th>
                            <th className="text-center p-2">Escolhida por</th>
                            <th className="text-center p-2">Média</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compStats.map((s, i) => (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="p-2 font-semibold text-navy flex items-center gap-2">
                                {s.label}
                                {s.hasCustom && (
                                  <span className="text-[10px] uppercase tracking-wider bg-alfa-orange/10 text-alfa-orange px-1.5 py-0.5 rounded">
                                    custom
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-center text-gray-600">{s.count}</td>
                              <td className="p-2 text-center font-display text-alfa-blue">{s.avg}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {activeH1.map(h => {
                  const part = activeParticipants.find(p => p.id === h.participant_id)
                  return (
                    <div key={h.id} className="card">
                      <h4 className="font-display text-lg text-navy mb-3">{part?.nome_completo || '—'}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {(Array.isArray(h.competencias) ? h.competencias : []).map((c, i) => (
                          <div key={c.key || i} className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              {c.label}
                              {c.custom && (
                                <span className="text-[10px] uppercase tracking-wider bg-alfa-orange/10 text-alfa-orange px-1.5 py-0.5 rounded">
                                  custom
                                </span>
                              )}
                            </div>
                            <div className="font-display text-2xl text-alfa-blue">{c.score ?? '—'}</div>
                          </div>
                        ))}
                      </div>
                      {h.olhar_geracional && (
                        <div className="mb-3">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Olhar geracional</div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{h.olhar_geracional}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
                {activeH1.length === 0 && <EmptyState text="Sem submissões em H1 ainda." />}
              </div>
            )}

            {activeTab === 'h2' && (
              <div className="space-y-6">
                {[1, 2, 3, 4].map(eqNum => {
                  const ideias = activeH2.filter(i => i.equipa_numero === eqNum)
                  if (ideias.length === 0) return null
                  return (
                    <div key={eqNum} className="card">
                      <h3 className="font-display text-xl text-navy mb-1">Equipa {eqNum}</h3>
                      <div className="accent-bar mb-4" />
                      <div className="space-y-3">
                        {ideias.map(i => {
                          const part = activeParticipants.find(p => p.id === i.participant_id)
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
                              <p className="text-xs text-gray-400">— {getTeamLabel(i.participant_id, activeParticipants)}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {activeH2.length === 0 && <EmptyState text="Sem ideias submetidas ainda." />}
              </div>
            )}

            {activeTab === 'h3' && (
              <div className="space-y-4">
                {activeH3.map(h => {
                  const part = activeParticipants.find(p => p.id === h.participant_id)
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
                {activeH3.length === 0 && <EmptyState text="Sem pitches submetidos ainda." />}
              </div>
            )}

            {activeTab === 'h4' && (
              <div className="space-y-4">
                {activeH4.map(h => {
                  const part = activeParticipants.find(p => p.id === h.participant_id)
                  const respostasCaminho = Array.isArray(h.respostas_caminho) ? h.respostas_caminho : []
                  return (
                    <div key={h.id} className="card">
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display text-lg text-navy">{part?.nome_completo || '—'}</h4>
                          {part?.caminho && (
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${CAMINHO_COLORS[part.caminho]}`}>
                              {CAMINHO_LABELS[part.caminho]}
                            </span>
                          )}
                        </div>
                        {h.rating_workshop && (
                          <div className="bg-alfa-blue text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                            {h.rating_workshop}/10
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <ActionBlock icon={CheckCircle2} label="Execução imediata" text={h.execucao_imediata} />
                        <ActionBlock icon={TrendingUp} label="Desenvolvimento — 6 meses" text={h.desenvolvimento_6m} />
                        <ActionBlock icon={Award} label="Compromisso pessoal" text={h.compromisso_lideranca} />
                        {respostasCaminho.length > 0 && (
                          <div className="bg-alfa-blue/5 border border-alfa-blue/20 p-3 rounded-lg">
                            <div className="text-xs font-semibold text-alfa-blue uppercase tracking-wider mb-2">
                              Respostas do caminho · {part?.caminho ? CAMINHO_LABELS[part.caminho] : '—'}
                            </div>
                            <div className="space-y-3">
                              {respostasCaminho.map((r, i) => (
                                <div key={r.key || i}>
                                  <div className="text-xs font-semibold text-gray-600 mb-1">{r.label}</div>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {r.answer || <span className="text-gray-400 italic">— vazio —</span>}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {h.feedback_workshop && (
                          <ActionBlock icon={Star} label="Feedback" text={h.feedback_workshop} />
                        )}
                      </div>
                    </div>
                  )
                })}
                {activeH4.length === 0 && <EmptyState text="Sem planos de ação submetidos ainda." />}
              </div>
            )}
          </>
        )}
      </main>

      {editParticipant && (
        <EditModal
          participant={editParticipant}
          onSave={saveEdit}
          onClose={() => setEditParticipant(null)}
          saving={saving}
        />
      )}
      {deleteConfirm && (
        <DeleteModal
          participant={deleteConfirm}
          onConfirm={deleteParticipant}
          onClose={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

function EditModal({ participant, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    nome_completo: participant.nome_completo || '',
    email: participant.email || '',
    telefone: participant.telefone || '',
    entidade_nome: participant.entidade_nome || '',
    mediador_responsavel: participant.mediador_responsavel || '',
    relacao_parentesco: participant.relacao_parentesco || '',
    caminho: participant.caminho || '',
    equipa_numero: participant.equipa_numero || '',
  })

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-display text-xl text-navy">Editar participante</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { key: 'nome_completo', label: 'Nome completo' },
            { key: 'email', label: 'Email' },
            { key: 'telefone', label: 'Telefone' },
            { key: 'entidade_nome', label: 'Entidade / Agência' },
            { key: 'mediador_responsavel', label: 'Mediador responsável' },
            { key: 'relacao_parentesco', label: 'Relação de parentesco' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
              <input
                type="text"
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                className="input-field text-sm"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Caminho</label>
              <select value={form.caminho} onChange={e => set('caminho', e.target.value)} className="input-field text-sm">
                <option value="">— nenhum —</option>
                <option value="sucessor">Sucessor</option>
                <option value="apoiante">Apoiante</option>
                <option value="independente">Independente</option>
                <option value="explorando">A explorar</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Equipa</label>
              <select value={form.equipa_numero} onChange={e => set('equipa_numero', e.target.value ? Number(e.target.value) : '')} className="input-field text-sm">
                <option value="">— nenhuma —</option>
                {[1,2,3,4].map(n => <option key={n} value={n}>Equipa {n}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancelar</button>
          <button
            onClick={() => onSave(participant.id, form)}
            disabled={saving}
            className="btn-primary flex-1 text-sm"
          >
            {saving ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ participant, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <h2 className="font-display text-xl text-navy mb-2">Eliminar participante?</h2>
          <p className="text-gray-600 text-sm mb-1">
            Vais eliminar <strong>{participant.nome_completo}</strong> e todos os dados associados.
          </p>
          <p className="text-xs text-gray-400 mb-6">Esta ação é irreversível.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button
              onClick={() => onConfirm(participant.id)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
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
