import { FormField } from './FormField'

export function TextField({ id, label, className, inputClassName = 'field', ...inputProps }) {
  const error = inputProps.error
  const describedBy = [inputProps['aria-describedby'], error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined
  return (
    <FormField id={id} label={label} className={className} error={error}>
      <input
        id={id}
        className={`${inputClassName} ${error ? 'border-rose-300 bg-rose-50/70' : ''}`}
        {...inputProps}
        aria-invalid={inputProps['aria-invalid'] ?? Boolean(error)}
        aria-describedby={describedBy}
      />
    </FormField>
  )
}
