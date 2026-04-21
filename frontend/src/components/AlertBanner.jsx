export function AlertBanner({ message, tone = 'danger' }) {
  if (!message) return null
  const styles =
    tone === 'danger'
      ? 'border-rose-200/70 bg-rose-50/95 text-rose-800'
      : 'border-amber-200/80 bg-amber-50 text-amber-900'

  return (
    <div className={`glass-panel border px-4 py-3 text-sm ${styles}`} role="alert" aria-live="assertive">
      {message}
    </div>
  )
}
