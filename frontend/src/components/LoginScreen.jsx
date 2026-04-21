import { useState } from 'react'
import { APP_IMAGES } from '../constants/images'
import { api } from '../lib/api'
import { getFriendlyErrorMessage } from '../lib/errorMessages'
import { FormError } from './FormError'
import { TextField } from './ui/TextField'

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <img src="/logo.svg" alt="Humanit" className="h-8 w-auto" />
    </div>
  )
}

function FeaturePill({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-300">
      {children}
    </span>
  )
}

export function LoginScreen({ connectionError, onLoggedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  function validateFields() {
    const next = {}
    if (!email.trim()) next.email = 'Email is required.'
    if (!password.trim()) next.password = 'Password is required.'
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!validateFields()) return
    setBusy(true)
    setError('')
    try {
      await api.login({ email, password })
      onLoggedIn()
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'login'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main
      className="login-shell relative grid min-h-full w-full overflow-hidden bg-slate-50 lg:grid-cols-[1fr_minmax(420px,480px)]"
      id="login-main"
    >
      {/* —— Brand column (desktop) —— */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 px-12 py-14 text-white lg:flex">
        <img
          src={APP_IMAGES.springHero}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="login-brand-aurora pointer-events-none absolute inset-0" />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full text-white/[0.04]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <pattern id="login-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)" />
        </svg>

        <div className="relative z-[1] reveal-up" style={{ '--reveal-delay': '90ms' }}>
          <img src="/logo.svg" alt="Humanit" className="h-8 w-auto brightness-0 invert" />
          <p className="font-display mt-6 max-w-lg text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl">
            Client care,
            <span className="block bg-gradient-to-r from-accent via-white to-accent bg-clip-text text-transparent">
              beautifully organized.
            </span>
          </p>
          <p className="mt-8 max-w-md text-base leading-relaxed text-slate-400">
            One calm place for profiles, contacts, and documents that expire—so nothing slips through the cracks.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            <FeaturePill>Secure session</FeaturePill>
            <FeaturePill>Team-ready</FeaturePill>
            <FeaturePill>Document renewals</FeaturePill>
          </div>
        </div>

        <p className="relative z-[1] text-xs text-slate-500 reveal-up" style={{ '--reveal-delay': '190ms' }}>
          Built for teams who value clarity.
        </p>
      </aside>

      {/* —— Form column —— */}
      <div className="relative flex flex-col justify-center px-5 py-12 sm:px-10 lg:px-14 lg:py-16">
        <div className="login-form-ambient pointer-events-none absolute inset-0 lg:hidden" aria-hidden />
        <div className="relative z-[1] mx-auto w-full max-w-md">
          <div className="mb-10 flex items-center justify-center lg:mb-12 reveal-up" style={{ '--reveal-delay': '120ms' }}>
            <BrandMark />
          </div>

          <div
            className="rounded-2xl border border-slate-200/90 bg-white/95 px-6 py-8 sm:px-8 sm:py-9 lg:border-slate-200 lg:bg-white reveal-up"
            style={{ '--reveal-delay': '220ms' }}
          >
            <div className="mb-2 h-1 w-14 rounded-full bg-[#9be5f0]" aria-hidden />
            <h1 className="font-display mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome back</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Enter your credentials to open your client directory. Nothing leaves this workspace without your action.
            </p>

            {connectionError ? (
              <div
                className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                role="status"
                aria-live="polite"
              >
                {connectionError}
              </div>
            ) : null}

            <form className="mt-8 space-y-5 reveal-up" style={{ '--reveal-delay': '320ms' }} onSubmit={onSubmit} noValidate>
              <TextField
                id="login-email"
                label="Email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setFieldErrors((prev) => ({ ...prev, email: '' }))
                }}
                error={fieldErrors.email}
              />
              <TextField
                id="login-password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setFieldErrors((prev) => ({ ...prev, password: '' }))
                }}
                autoComplete="current-password"
                required
                error={fieldErrors.password}
              />
              <FormError id="login-form-error" message={error} />
              <button
                className="btn-primary mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold tracking-wide"
                type="submit"
                disabled={busy}
              >
                {busy ? (
                  'Signing in…'
                ) : (
                  <>
                    <span>Continue to directory</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-slate-500 reveal-up" style={{ '--reveal-delay': '420ms' }}>
            By signing in you agree this session is for authorized team use only.
          </p>
        </div>
      </div>
    </main>
  )
}
