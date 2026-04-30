import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function ModuleHeader({ label, title, description, color = 'blue' }) {
  const accentColor = color === 'orange' ? 'text-alfa-orange' : 'text-alfa-blue'

  return (
    <div className="mb-8">
      <Link
        to="/journey"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-alfa-blue mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar à jornada
      </Link>
      <div className="flex items-baseline gap-3 mb-2">
        <span className={`font-display text-sm uppercase tracking-wider ${accentColor}`}>
          {label}
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <h1 className="text-2xl md:text-4xl font-display text-navy mb-3">{title}</h1>
      <p className="text-gray-600 text-base md:text-lg max-w-2xl">{description}</p>
    </div>
  )
}
