import { Link, useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import Logo from './Logo'
import { useParticipant } from '../lib/ParticipantContext'

export default function Layout({ children, showLogout = true }) {
  const { participant, logout } = useParticipant()
  const navigate = useNavigate()

  function handleLogout() {
    if (confirm('Tens a certeza que queres sair? O teu progresso fica guardado.')) {
      logout()
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="brand-bar" />
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={participant ? '/journey' : '/'}>
            <Logo size="sm" />
          </Link>
          {participant && showLogout && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <User size={16} />
                <span className="font-medium">{participant.nome_completo}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 transition-colors p-2"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-gray-100 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          New Generation AGEBROKERS · Workshop 1 Maio 2026
        </div>
      </footer>
    </div>
  )
}
