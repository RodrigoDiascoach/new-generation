import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Loader2 } from 'lucide-react'
import Logo from '../components/Logo'

const STORAGE_KEY = 'agebrokers_admin_auth'

export function isAdminAuth() {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export default function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'AGELegacy2026'

    setTimeout(() => {
      if (password === correctPassword) {
        localStorage.setItem(STORAGE_KEY, 'true')
        navigate('/admin/dashboard')
      } else {
        setError('Password incorreta.')
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-blue-900 to-alfa-blue flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-alfa-blue/10 rounded-full mb-3">
            <Lock className="text-alfa-blue" size={24} />
          </div>
          <h1 className="font-display text-2xl text-navy mb-1">Painel de Administração</h1>
          <p className="text-sm text-gray-500">Acesso restrito ao Rodrigo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
