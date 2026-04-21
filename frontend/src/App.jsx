import { useCallback } from 'react'
import { LoginScreen } from './components/LoginScreen'
import { SessionLoading } from './components/SessionLoading'
import { ClientDirectoryPage } from './components/clients/ClientDirectoryPage'
import { useAuthSession } from './hooks/useAuthSession'
import { useDocumentTitle } from './hooks/useDocumentTitle'

export default function App() {
  const { ready, authed, setAuthed, probeError } = useAuthSession()

  const phase = !ready ? 'loading' : !authed ? 'login' : 'app'
  useDocumentTitle(phase)

  const handleSessionExpired = useCallback(() => {
    setAuthed(false)
  }, [setAuthed])

  const handleLogout = useCallback(() => {
    setAuthed(false)
  }, [setAuthed])

  if (!ready) {
    return <SessionLoading />
  }

  if (!authed) {
    return <LoginScreen connectionError={probeError} onLoggedIn={() => setAuthed(true)} />
  }

  return <ClientDirectoryPage onLogout={handleLogout} onSessionExpired={handleSessionExpired} />
}
