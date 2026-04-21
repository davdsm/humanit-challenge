import { useCallback, useRef } from 'react'

/** Remembers the active element when opening a modal and restores focus after close. */
export function useFocusReturn() {
  const triggerRef = useRef(null)

  const captureTrigger = useCallback(() => {
    triggerRef.current = document.activeElement
  }, [])

  const restoreTrigger = useCallback(() => {
    queueMicrotask(() => {
      const el = triggerRef.current
      if (el && typeof el.focus === 'function') el.focus()
      triggerRef.current = null
    })
  }, [])

  return { captureTrigger, restoreTrigger }
}
