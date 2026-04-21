export function SessionLoading() {
  return (
    <div className="flex min-h-full items-center justify-center text-sm text-slate-600">
      <div className="glass-panel reveal-up px-6 py-4" style={{ '--reveal-delay': '100ms' }} role="status" aria-live="polite">
        Checking your session…
      </div>
    </div>
  )
}
