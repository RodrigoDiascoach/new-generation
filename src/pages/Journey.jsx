import { Link } from 'react-router-dom'
import { Compass, Lightbulb, Mic, Target, Check, ChevronRight } from 'lucide-react'
import Layout from '../components/Layout'
import { useParticipant } from '../lib/ParticipantContext'

const MODULES = [
  {
    id: 'h1',
    label: 'H1',
    title: 'Identidade & Potencial',
    description: 'Roda de competências, valências e o que te move.',
    icon: Compass,
    color: 'blue',
    field: 'h1_completo',
    path: '/h1',
  },
  {
    id: 'h2',
    label: 'H2',
    title: 'Brainstorming em Equipa',
    description: 'Reflexão individual e ideias para tornar os seguros indispensáveis.',
    icon: Lightbulb,
    color: 'orange',
    field: 'h2_completo',
    path: '/h2',
  },
  {
    id: 'h3',
    label: 'H3',
    title: 'Apresentação em Palco',
    description: 'Prepara quem és e a tua proposta para apresentar ao grupo.',
    icon: Mic,
    color: 'blue',
    field: 'h3_completo',
    path: '/h3',
  },
  {
    id: 'h4',
    label: 'H4',
    title: 'Plano de Ação',
    description: 'Competências a desenvolver e o que implementar no negócio agora.',
    icon: Target,
    color: 'orange',
    field: 'h4_completo',
    path: '/h4',
  },
]

export default function Journey() {
  const { participant } = useParticipant()
  const completedCount = MODULES.filter(m => participant?.[m.field]).length
  const progress = (completedCount / MODULES.length) * 100

  return (
    <Layout>
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="mb-8 md:mb-10">
          <span className="text-alfa-orange font-display text-sm uppercase tracking-wider">
            A tua jornada
          </span>
          <h1 className="text-2xl md:text-4xl font-display text-alfa-blue mt-2 mb-3">
            Olá, {participant?.nome_completo?.split(' ')[0]}
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl">
            Quatro horas para mapear o teu potencial, criar soluções e definir o teu compromisso.
            Podes navegar livremente entre os módulos.
          </p>

          {/* Progress bar */}
          <div className="mt-6 max-w-2xl">
            <div className="flex justify-between text-sm font-semibold text-navy mb-2">
              <span>Progresso</span>
              <span>{completedCount} de {MODULES.length} módulos</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-alfa-blue to-alfa-orange transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {MODULES.map((mod, idx) => {
            const Icon = mod.icon
            const completed = participant?.[mod.field]
            const colorClasses = mod.color === 'blue'
              ? 'border-alfa-blue/20 hover:border-alfa-blue'
              : 'border-alfa-orange/20 hover:border-alfa-orange'
            const iconBg = mod.color === 'blue' ? 'bg-alfa-blue' : 'bg-alfa-orange'

            return (
              <Link
                key={mod.id}
                to={mod.path}
                className={`group card border-2 ${colorClasses} hover:shadow-lg transition-all duration-300 relative overflow-hidden`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {completed && (
                  <div className="absolute top-4 right-4 bg-green-100 text-green-700 rounded-full p-1.5">
                    <Check size={16} strokeWidth={3} />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className={`${iconBg} text-white p-3 rounded-lg flex-shrink-0`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-display text-gray-500 uppercase tracking-wider">
                        {mod.label}
                      </span>
                    </div>
                    <h3 className="font-display text-xl text-navy mb-2 group-hover:text-alfa-blue transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {mod.description}
                    </p>
                    <div className="mt-4 flex items-center text-sm font-semibold text-alfa-blue group-hover:gap-2 transition-all">
                      {completed ? 'Rever' : 'Começar'}
                      <ChevronRight size={16} className="ml-1 group-hover:ml-2 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {completedCount === MODULES.length && (
          <div className="mt-10 p-6 bg-gradient-to-r from-alfa-blue to-blue-700 text-white rounded-xl text-center animate-slide-up">
            <h3 className="font-display text-2xl mb-2">Concluíste a tua jornada</h3>
            <p className="text-blue-100">
              O Rodrigo vai apresentar as conclusões coletivas no debriefing final.
            </p>
          </div>
        )}

        <div className="mt-10 p-5 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-600 italic">
            "O que diferencia um sucessor de um herdeiro é o compromisso de executar com
            profissionalismo e honrar o legado com inovação."
          </p>
        </div>
      </div>
    </Layout>
  )
}
