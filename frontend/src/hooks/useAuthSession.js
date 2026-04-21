import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getFriendlyErrorMessage } from '../lib/errorMessages'

/** Probe session via a lightweight authenticated request. */
export function useAuthSession() {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [probeError, setProbeError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await api.listClients({ page: 1, limit: 1 })
        if (!cancelled) setAuthed(true)
      } catch (e) {
        if (!cancelled && e.status !== 401) {
          setProbeError(getFriendlyErrorMessage(e, 'client-list'))
        }
        if (!cancelled) setAuthed(false)
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { ready, authed, setAuthed, probeError }
}
