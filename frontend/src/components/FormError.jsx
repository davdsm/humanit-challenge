export function FormError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} className="text-sm text-rose-700" role="alert">
      {message}
    </p>
  )
}
