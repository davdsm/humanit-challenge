import { useEffect } from 'react'

const TITLES = {
  loading: 'Checking session — Humanit',
  login: 'Sign in — Humanit',
  app: 'Client directory — Humanit',
}

export function useDocumentTitle(phase) {
  useEffect(() => {
    document.title = TITLES[phase] ?? TITLES.app
  }, [phase])
}
