import type { ReservationCharge } from '../api/partner'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function formatChargeValue(charge: ReservationCharge): string {
  const unitType = (charge.unitType ?? '').toUpperCase()
  const symbol = (charge.unitSymbol ?? charge.unit ?? '').trim()
  const value = Number(charge.value)
  if (!Number.isFinite(value)) return '—'
  if (unitType === 'TIME') {
    const hours = Math.round(value / 60)
    return `${hours} ${symbol}`.trim()
  }
  const amount = Number.isInteger(value)
    ? String(value)
    : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return charge.symbolBeforeValue === false
    ? `${amount} ${symbol}`.trim()
    : `${symbol} ${amount}`.trim()
}

export function formatChargeDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const day = String(date.getDate()).padStart(2, '0')
  const month = MONTHS[date.getMonth()] ?? ''
  return `${day} ${month} ${date.getFullYear()}`
}
