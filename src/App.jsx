import { Routes, Route, Navigate } from 'react-router-dom'
import { ParticipantProvider, useParticipant } from './lib/ParticipantContext'
import Onboarding from './pages/Onboarding'
import Journey from './pages/Journey'
import H1Identidade from './pages/H1Identidade'
import H2Brainstorming from './pages/H2Brainstorming'
import H3Pitch from './pages/H3Pitch'
import H4Acao from './pages/H4Acao'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import Apresentacao from './pages/Apresentacao'
import Briefing from './pages/Briefing'

function ProtectedRoute({ children }) {
  const { participantId, loading } = useParticipant()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }
  if (!participantId) return <Navigate to="/" replace />
  return children
}

function PublicRoute({ children }) {
  const { participantId, loading } = useParticipant()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }
  if (participantId) return <Navigate to="/journey" replace />
  return children
}

export default function App() {
  return (
    <ParticipantProvider>
      <Routes>
        {/* Participant routes */}
        <Route path="/" element={<PublicRoute><Onboarding /></PublicRoute>} />
        <Route path="/journey" element={<ProtectedRoute><Journey /></ProtectedRoute>} />
        <Route path="/h1" element={<ProtectedRoute><H1Identidade /></ProtectedRoute>} />
        <Route path="/h2" element={<ProtectedRoute><H2Brainstorming /></ProtectedRoute>} />
        <Route path="/h3" element={<ProtectedRoute><H3Pitch /></ProtectedRoute>} />
        <Route path="/h4" element={<ProtectedRoute><H4Acao /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/apresentacao" element={<Apresentacao />} />
        <Route path="/admin/briefing/:participantId" element={<Briefing />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ParticipantProvider>
  )
}
