import { TextField } from '../ui/TextField'
import { DEFAULT_PHONE_DIAL_CODE, PHONE_COUNTRIES } from '../../constants/phoneCountries'

export function ClientFormFields({ form, onChange, taxIdDisabled, errors = {} }) {
  function patch(patch) {
    onChange({ ...form, ...patch })
  }

  function patchPhone(next = {}) {
    const dialCode = String(next.phoneDialCode ?? form.phoneDialCode ?? DEFAULT_PHONE_DIAL_CODE).trim()
    const local = String(next.phoneLocalNumber ?? form.phoneLocalNumber ?? '').trim()
    const phoneNumber = local ? `${dialCode} ${local}`.trim() : dialCode
    patch({
      phoneDialCode: dialCode,
      phoneLocalNumber: local,
      phoneNumber,
    })
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <TextField
        id="client-firstName"
        label="First name"
        value={form.firstName}
        onChange={(e) => patch({ firstName: e.target.value })}
        error={errors.firstName}
      />
      <TextField
        id="client-lastName"
        label="Last name"
        value={form.lastName}
        onChange={(e) => patch({ lastName: e.target.value })}
        error={errors.lastName}
      />
      <TextField
        id="client-taxIdentifier"
        label="Tax ID or national identifier"
        value={form.taxIdentifier}
        onChange={(e) => patch({ taxIdentifier: e.target.value })}
        disabled={taxIdDisabled}
        error={errors.taxIdentifier}
      />
      <TextField
        id="client-email"
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => patch({ email: e.target.value })}
        error={errors.email}
      />
      <div className="md:col-span-2">
        <div>
          <label htmlFor="client-phoneLocalNumber" className="mb-1 block text-sm font-medium text-slate-700">
            Phone number
          </label>
          <div className="grid gap-2 sm:grid-cols-[180px_1fr]">
            <select
              id="client-phoneDialCode"
              className={`field ${errors.phoneNumber ? 'border-rose-300 bg-rose-50/70' : ''}`}
              value={form.phoneDialCode || DEFAULT_PHONE_DIAL_CODE}
              onChange={(e) => patchPhone({ phoneDialCode: e.target.value })}
            >
              {PHONE_COUNTRIES.map((c) => (
                <option key={c.iso} value={c.dialCode}>
                  {c.label} ({c.dialCode})
                </option>
              ))}
            </select>
            <input
              id="client-phoneLocalNumber"
              type="tel"
              className={`field ${errors.phoneNumber ? 'border-rose-300 bg-rose-50/70' : ''}`}
              value={form.phoneLocalNumber || ''}
              onChange={(e) => patchPhone({ phoneLocalNumber: e.target.value })}
              placeholder="912 345 678"
            />
          </div>
          {errors.phoneNumber ? <p className="mt-1 text-sm text-rose-700">{errors.phoneNumber}</p> : null}
        </div>
      </div>
    </div>
  )
}
