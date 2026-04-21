import { TextField } from '../ui/TextField'

export function ClientFormFields({ form, onChange, taxIdDisabled, errors = {} }) {
  function patch(patch) {
    onChange({ ...form, ...patch })
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
        <TextField
          id="client-phoneNumber"
          label="Phone number"
          type="tel"
          value={form.phoneNumber}
          onChange={(e) => patch({ phoneNumber: e.target.value })}
          error={errors.phoneNumber}
        />
      </div>
    </div>
  )
}
