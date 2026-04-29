import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './supabase'

const ParticipantContext = createContext(null)

const STORAGE_KEY = 'agebrokers_participant_id'

export function ParticipantProvider({ children }) {
  const [participantId, setParticipantId] = useState(null)
  const [participant, setParticipant] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setParticipantId(stored)
      loadParticipant(stored)
    } else {
      setLoading(false)
    }
  }, [])

  async function loadParticipant(id) {
    const { data, error } = await supabase
      .from('workshop_participants')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      localStorage.removeItem(STORAGE_KEY)
      setParticipantId(null)
      setParticipant(null)
    } else {
      setParticipant(data)
    }
    setLoading(false)
  }

  function setActive(id, data) {
    localStorage.setItem(STORAGE_KEY, id)
    setParticipantId(id)
    setParticipant(data)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setParticipantId(null)
    setParticipant(null)
  }

  async function refresh() {
    if (participantId) await loadParticipant(participantId)
  }

  return (
    <ParticipantContext.Provider
      value={{ participantId, participant, loading, setActive, logout, refresh }}
    >
      {children}
    </ParticipantContext.Provider>
  )
}

export function useParticipant() {
  const ctx = useContext(ParticipantContext)
  if (!ctx) throw new Error('useParticipant deve estar dentro de ParticipantProvider')
  return ctx
}
