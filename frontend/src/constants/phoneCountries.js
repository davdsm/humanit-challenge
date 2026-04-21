import { getCountries, getCountryCallingCode } from 'libphonenumber-js/min'

const regionNames =
  typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null

export const PHONE_COUNTRIES = getCountries()
  .map((iso) => ({
    iso,
    label: regionNames?.of(iso) || iso,
    dialCode: `+${getCountryCallingCode(iso)}`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label))

export const DEFAULT_PHONE_DIAL_CODE = '+351'
