import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getFriendlyErrorMessage } from '../lib/errorMessages'

export function useClientDirectory({ active, onUnauthorized }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.listClients({ page: 1, limit: 50 })
      setClients(data.items || [])
    } catch (e) {
      if (e.status === 401) {
        onUnauthorized?.()
      } else {
        setError(getFriendlyErrorMessage(e, 'client-list'))
      }
    } finally {
      setLoading(false)
    }
  }, [onUnauthorized])

  useEffect(() => {
    if (!active) return
    queueMicrotask(() => {
      void refresh()
    })
  }, [active, refresh])

  const removeClient = useCallback(
    async (client) => {
      try {
        await api.deleteClient(client.id)
        await refresh()
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'client-delete'))
      }
    },
    [refresh],
  )

  const bulkRemoveClients = useCallback(
    async (selectedClients) => {
      if (!selectedClients.length) return
      try {
        await Promise.all(selectedClients.map((client) => api.deleteClient(client.id)))
        await refresh()
      } catch (e) {
        setError(getFriendlyErrorMessage(e, 'client-delete'))
      }
    },
    [refresh],
  )

  return { clients, loading, error, setError, refresh, removeClient, bulkRemoveClients }
}
