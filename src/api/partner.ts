import { session } from '../stores/session'

export interface PartnerEnvelope<T = unknown> {
  success: boolean
  code: string
  payload: T | null
  errorMessages: string[]
}

export interface PartnerToken {
  token: string
  expiresIn: number
}

export interface ReservationCharge {
  id: string
  type: string | null
  value: number
  unit: string | null
  unitType: string | null
  unitSymbol: string | null
  symbolBeforeValue: boolean | null
  payDay: string | null
  paidDay: string | null
  description: string | null
  templateName: string | null
}

export interface Reservation {
  id: string
  workspaceId: string
  workspaceName: string | null
  areaId: string | null
  areaName: string | null
  startDate: string | null
  endDate: string | null
  status: string | null
  price: number | null
  charges: ReservationCharge[]
}

export interface CreateReservationInput {
  workspaceId: string
  areaId: string
  startDate: string
  endDate: string
  dependents: number
}

export interface UpdateReservationInput {
  startDate: string | null
  endDate: string | null
  dependents: number | null
}

export interface AvailabilityInput {
  workspaceId: string
  startDate: string
  endDate: string
  areaCategoryId?: string | null
  capacity?: number | null
  specificDurationId?: string | null
  areaId?: string | null
}

export interface PricingInput {
  workspaceId: string
  areaId: string
  startDate: string
  endDate: string
}

export class PartnerApiError extends Error {
  readonly status: number
  readonly code: string
  readonly messages: string[]

  constructor(status: number, code: string, messages: string[]) {
    super(messages[0] ?? `HTTP ${status}`)
    this.name = 'PartnerApiError'
    this.status = status
    this.code = code
    this.messages = messages
  }
}

function engineBase(): string {
  return session.baseUrl
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api\/partner\/v1$/i, '')
    .replace(/\/+$/, '')
}

function apiBase(): string {
  return `${engineBase()}/api/partner/v1`
}

async function send<T>(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: unknown,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new PartnerApiError(0, 'NETWORK', ['não foi possível falar com o servidor'])
  }

  let envelope: PartnerEnvelope<T>
  try {
    envelope = (await response.json()) as PartnerEnvelope<T>
  } catch {
    throw new PartnerApiError(response.status, 'INVALID_RESPONSE', [
      `resposta inválida do servidor (HTTP ${response.status})`,
    ])
  }

  if (!response.ok || !envelope.success) {
    const messages =
      Array.isArray(envelope.errorMessages) && envelope.errorMessages.length > 0
        ? envelope.errorMessages
        : [`HTTP ${response.status}`]
    throw new PartnerApiError(response.status, envelope.code || 'FAILED', messages)
  }
  return envelope.payload as T
}

function partnerHeaders(auth: boolean): Record<string, string> {
  const headers: Record<string, string> = { 'X-Api-Key': session.apiKey.trim() }
  if (auth) {
    if (!session.token) {
      throw new PartnerApiError(401, 'UNAUTHORIZED', ['faça login para usar esta rota'])
    }
    headers.Authorization = `Bearer ${session.token}`
  }
  return headers
}

function jsonHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/json' }
}

export const partnerApi = {
  accessCode(email: string) {
    return send<{ sent: boolean }>(
      `${apiBase()}/auth/access-code`,
      'POST',
      { ...partnerHeaders(false), ...jsonHeaders() },
      { email },
    )
  },

  register(input: {
    email: string
    password: string
    firstName: string
    lastName?: string
    phoneNumber?: string
    code: string
  }) {
    return send<PartnerToken>(
      `${apiBase()}/auth/register`,
      'POST',
      { ...partnerHeaders(false), ...jsonHeaders() },
      input,
    )
  },

  login(email: string, password: string) {
    return send<PartnerToken>(
      `${apiBase()}/auth/login`,
      'POST',
      { ...partnerHeaders(false), ...jsonHeaders() },
      { email, password },
    )
  },

  listReservations() {
    return send<Reservation[]>(`${apiBase()}/reservations`, 'GET', partnerHeaders(true))
  },

  getReservation(id: string) {
    return send<Reservation>(
      `${apiBase()}/reservations/${encodeURIComponent(id)}`,
      'GET',
      partnerHeaders(true),
    )
  },

  createReservation(input: CreateReservationInput) {
    return send<Reservation>(
      `${apiBase()}/reservations`,
      'POST',
      { ...partnerHeaders(true), ...jsonHeaders() },
      input,
    )
  },

  updateReservation(id: string, input: UpdateReservationInput) {
    return send<Reservation>(
      `${apiBase()}/reservations/${encodeURIComponent(id)}`,
      'PATCH',
      { ...partnerHeaders(true), ...jsonHeaders() },
      input,
    )
  },

  cancelReservation(id: string) {
    return send<Reservation>(
      `${apiBase()}/reservations/${encodeURIComponent(id)}/cancel`,
      'POST',
      partnerHeaders(true),
    )
  },

  availability(input: AvailabilityInput) {
    return send<unknown>(
      `${apiBase()}/availability`,
      'POST',
      { ...partnerHeaders(true), ...jsonHeaders() },
      input,
    )
  },

  pricing(input: PricingInput) {
    return send<unknown>(
      `${apiBase()}/pricing`,
      'POST',
      { ...partnerHeaders(true), ...jsonHeaders() },
      input,
    )
  },
}
