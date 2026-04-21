export function FormField({ id, label, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
