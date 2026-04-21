import { APP_IMAGES } from '../../constants/images'

export function ClientPageHeader({ view, onSwitchView, onAddClient, onRefresh, loading, onLogout, trashCount = 0 }) {
  return (
    <header className="glass-panel relative overflow-hidden p-6 md:p-7">
      <img
        src={APP_IMAGES.humanTouch}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/85" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
        <img src="/logo.svg" alt="Humanit" className="h-5 w-auto" />
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Client directory</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Keep client profiles, contact details, and expiring documents together so your team always knows what needs
          attention.
        </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`icon-btn h-10 w-10 ${view === 'directory' ? 'icon-btn--active' : ''}`}
            onClick={() => onSwitchView('directory')}
            aria-label="Directory view"
            title="Directory"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M3 10h18M3 6h18M3 14h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            className={`icon-btn relative h-10 w-10 ${view === 'trash' ? 'icon-btn--active' : ''}`}
            onClick={() => onSwitchView('trash')}
            aria-label="Trash view"
            title="Trash"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {trashCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                {trashCount > 99 ? '99+' : trashCount}
              </span>
            ) : null}
          </button>
          <button type="button" className="btn-primary h-10 w-10 p-0" onClick={onAddClient} aria-label="Add client" title="Add client">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn h-10 w-10"
            onClick={onRefresh}
            disabled={loading}
            aria-label={loading ? 'Refreshing' : 'Refresh list'}
            title={loading ? 'Refreshing' : 'Refresh list'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M20 6v6h-6M4 18v-6h6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 12a8 8 0 0 0-13.66-5.66M4 12a8 8 0 0 0 13.66 5.66" strokeLinecap="round" />
            </svg>
          </button>
          <button type="button" className="icon-btn h-10 w-10" onClick={onLogout} aria-label="Sign out" title="Sign out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 17l5-5-5-5M20 12H9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 4H5v16h7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
