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

export interface PartnerUsageClient {
  id: string
  name: string
  active: boolean
  createdAt: string | null
  workspaceIds: string[]
}

export interface PartnerUsageCounters {
  day: string
  month: string
  resetAt: string
  dailyLimit: number | null
  dailyUsed: number
  dailyRemaining: number | null
  monthlyLimit: number | null
  monthlyUsed: number
  monthlyRemaining: number | null
  overageLimit: number
  overageUsed: number
  hardLimit: boolean
  exceeded: boolean
  allowed: boolean
  reason: string | null
}

export interface PartnerUsage {
  client: PartnerUsageClient
  usage: PartnerUsageCounters
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

export interface ClientSummary {
  id: string
  type: string | null
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  brandingName: string | null
  legalName: string | null
  address: string | null
  number: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  complement: string | null
  neighborhood: string | null
  country: string | null
  description: string | null
  logoPath: string | null
  createdAt: string | null
  updatedAt: string | null
  primaryLinkId: string | null
  primaryLinkStatus: string | null
  primaryWorkspaceId: string | null
}

export interface ClientPage {
  items: ClientSummary[]
  limit: number
  offset: number
}

export interface CreateClientInput {
  type: string
  email?: string
  phoneNumber?: string
  firstName?: string
  lastName?: string
  legalName?: string
  brandingName?: string
  address?: string
  number?: string
  city?: string
  state?: string
  zipCode?: string
  complement?: string
  neighborhood?: string
  country?: string
  description?: string
}

export interface ContractOption {
  id: string
  name: string
}

export interface CurrencyOption extends ContractOption {
  symbol: string | null
  type: string | null
  symbolBeforeValue: boolean | null
}

export interface ContractOptions {
  cycleTypes: ContractOption[]
  paymentTypes: ContractOption[]
  currencies: CurrencyOption[]
}

export interface ContractTemplateCredit {
  id?: string
  value: number
  priority?: number
  overLimitAllowed?: boolean
  currencyUnit?: { id: string } | null
  flags?: { id: string; name: string }[]
}

export interface ContractTemplate {
  id: string
  name: string
  value: number
  autoRenew: boolean
  payDay: number
  cycleType: ContractOption | null
  paymentType: ContractOption | null
  workspaceLinkContractTemplateCredits: ContractTemplateCredit[]
  workspaceLinkContractsAggregate?: { aggregate: { count: number } } | null
}

export interface CreateContractTemplateInput {
  name: string
  value: number
  payDay: number
  mode: string
  autoRenew: boolean
  autoRenewPeriod: string
  cycleTypeId: string
  paymentTypeId: string
  extendedContractBehaviour?: string
  dependentsLimit?: number
  credits: ContractTemplateCredit[]
}

export interface ContractSummary {
  id: string
  status: string | null
  priority: number | null
  startDate: string | null
  endDate: string | null
  payDay: number | null
  workspace_client?: {
    id: string
    email: string | null
    type: string | null
    brandingName: string | null
    firstName: string | null
    lastName: string | null
  } | null
  workspace_link_contract_template?: { id: string; name: string | null; value: number | null } | null
}

export interface ContractPage {
  items: ContractSummary[]
  limit: number
  offset: number
}

export interface CreateContractInput {
  templateId: string
  clientId: string
  startDate: string
  endDate: string
  responsibleWorkspaceId?: string | null
  priority?: number
}

export interface WeekDay {
  id?: string | null
  dayWeek: string
  startHour: string
  endHour: string
}

export interface Area {
  id: string
  name: string
  nameAbbreviation: string | null
  description: string | null
  quantity: number | null
  capacity: number | null
  address: string | null
  addressNumber: string | null
  district: string | null
  city: string | null
  state: string | null
  zipcode: string | null
  addressComplement: string | null
  floor: number | null
  lat: number | null
  lng: number | null
  workspaceId: string
  areaCategoryId: string
  areaTypeId: string
  areaParentId: string | null
  areaCategory?: { id: string; name: string } | null
  areaType?: { id: string; name: string } | null
  area_week_days?: WeekDay[]
  weekDays?: WeekDay[]
}

export interface CreateAreaInput {
  name: string
  areaCategoryId?: string
  areaCategoryName?: string
  areaTypeId?: string
  nameAbbreviation?: string
  description?: string
  quantity?: number
  capacity?: number
  floor?: number
  address?: string
  addressNumber?: string
  district?: string
  city?: string
  state?: string
  zipcode?: string
  addressComplement?: string
  lat?: number | null
  lng?: number | null
  areaParentId?: string
  weekDays?: WeekDay[]
}

export interface AreaAvailability {
  areaId: string
  days: WeekDay[]
}

export interface AreaPricing {
  id: string
  name: string
  priceMinute: number
  priceHour: number
  priceDay: number
  priceWeek: number
  priceMonth: number
  priceYear: number
  unitId: string | null
  unitName: string | null
  unitSymbol: string | null
  symbolBeforeValue: boolean | null
  areaIds: string[]
}

export interface CreateAreaPricingInput {
  name: string
  basePrice?: number
  baseInterval?: string
  priceMinute?: number
  priceHour?: number
  priceDay?: number
  priceWeek?: number
  priceMonth?: number
  priceYear?: number
  unitId?: string | null
  areaIds?: string[]
}

export interface AuthorizationArea {
  id: string
  name: string
}

export interface AuthorizationKey {
  id: string
  copies: number | null
  startDate: string | null
  endDate: string | null
  areas: AuthorizationArea[]
  passages: { id: string; name: string; areaId: string | null }[]
}

export interface Authorization {
  id: string
  status: string | null
  startDate: string | null
  endDate: string | null
  createdAt: string | null
  senderWorkspace: { id: string; name?: string | null; firstName?: string | null; lastName?: string | null; brandingName?: string | null; legalName?: string | null; email?: string | null } | null
  recipientWorkspace: { id: string; type?: string | null; firstName?: string | null; lastName?: string | null; brandingName?: string | null; legalName?: string | null; email?: string | null } | null
  creatorWorkspace: { id: string; firstName?: string | null; lastName?: string | null; brandingName?: string | null; legalName?: string | null; email?: string | null } | null
  areas: AuthorizationArea[] | null
  workspace_client_keys: AuthorizationKey[] | null
}

export interface CreateAuthorizationInput {
  clients: string[]
  areas: string[]
  passages?: string[]
  startDate: string
  endDate?: string | null
  uses?: number
  permissionRoleId?: string | null
}

export interface ClientGroupMember {
  linkId: string
  workspaceClientId: string
  clientName: string | null
  status: string | null
}

export interface ClientGroup {
  id: string
  name: string | null
  typeId: string | null
  categoryId: string | null
  complement: string | null
  status: string | null
  createdAt: string | null
  members: ClientGroupMember[]
}

export interface ClientGroupPage {
  items: ClientGroup[]
  limit: number
  offset: number
}

export interface CreateClientGroupInput {
  name: string
  typeId?: string | null
  categoryId?: string | null
  complement?: string | null
  members?: string[]
}

export interface AccessDeviceFeature {
  id: string | null
  name: string | null
  deviceConnection: string | null
}

export interface AccessDevice {
  id: string
  name: string | null
  externalApiKey: string | null
  workspaceId: string | null
  passageType?: string | null
  deviceFeatures: AccessDeviceFeature[]
}

export interface AccessKey {
  id: string
  startDate: string | null
  endDate: string | null
  lastDirection: string | null
}

export interface AccessPassage {
  id: string
  name: string | null
  devices: AccessDevice[]
  keys: AccessKey[]
  area: { id: string; name: string | null } | null
}

export interface ActiveAccess {
  name: string | null
  linkId: string
  arrivalStatusId: string | null
  devices: AccessDevice[]
  passages: AccessPassage[]
  createdAt: string | null
  mainPhotoPath: string | null
  recipient: string | null
  senderWorkspaceId: string | null
}

export interface DashboardAccesses {
  active: ActiveAccess[]
}

export interface OpenAccessInput {
  passageId?: string | null
  deviceId?: string | null
  mode?: 'BLE' | 'REMOTE' | null
}

export interface OpenAccessBleConnection {
  format: 'nano' | 'atmega'
  hash: string
  date: string
  payload: string
}

export interface OpenAccessResult {
  mode: 'BLE' | 'REMOTE'
  linkId: string | null
  passageId: string | null
  passageName: string | null
  areaId: string | null
  areaName: string | null
  deviceId: string
  deviceName: string | null
  externalApiKey: string | null
  deviceWorkspaceId: string | null
  bleTouch?: boolean
  connection?: OpenAccessBleConnection
  opened?: boolean
  status?: string
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

  usage() {
    return send<PartnerUsage>(`${apiBase()}/usage`, 'GET', partnerHeaders(false))
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

  listClients(workspaceId: string) {
    return send<ClientPage>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/clients`,
      'GET',
      partnerHeaders(true),
    )
  },

  createClient(workspaceId: string, input: CreateClientInput) {
    return send<ClientSummary>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/clients`,
      'POST',
      { ...partnerHeaders(true), ...jsonHeaders() },
      input,
    )
  },

  listContractTemplates(workspaceId: string) {
    return send<ContractTemplate[]>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/contract-templates`,
      'GET',
      partnerHeaders(true),
    )
  },

  listContractOptions(workspaceId: string) {
    return send<ContractOptions>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/contract-options`,
      'GET',
      partnerHeaders(true),
    )
  },

  createContractTemplate(workspaceId: string, input: CreateContractTemplateInput) {
    return send<{ id: string }>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/contract-templates`,
      'POST',
      { ...partnerHeaders(true), ...jsonHeaders() },
      input,
    )
  },

  listContracts(workspaceId: string) {
    return send<ContractPage>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/contracts`,
      'GET',
      partnerHeaders(true),
    )
  },

  createContract(workspaceId: string, input: CreateContractInput) {
    return send<Record<string, unknown>>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/contracts`,
      'POST',
      { ...partnerHeaders(true), ...jsonHeaders() },
      input,
    )
  },

  listAreas(workspaceId: string) {
    return send<Area[]>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/areas`,
      'GET',
      partnerHeaders(true),
    )
  },

  createArea(workspaceId: string, input: CreateAreaInput) {
    return send<Area>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/areas`,
      'POST',
      { ...partnerHeaders(true), ...jsonHeaders() },
      input,
    )
  },

  listAreaAvailability(workspaceId: string, areaId: string) {
    return send<AreaAvailability>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/areas/${encodeURIComponent(areaId)}/availability`,
      'GET',
      partnerHeaders(true),
    )
  },

  setAreaAvailability(workspaceId: string, areaId: string, days: WeekDay[]) {
    return send<AreaAvailability>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/areas/${encodeURIComponent(areaId)}/availability`,
      'POST',
      { ...partnerHeaders(true), ...jsonHeaders() },
      { days },
    )
  },

  listAreaPricing(workspaceId: string) {
    return send<AreaPricing[]>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/area-pricing`,
      'GET',
      partnerHeaders(true),
    )
  },

  createAreaPricing(workspaceId: string, input: CreateAreaPricingInput) {
    return send<AreaPricing>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/area-pricing`,
      'POST',
      { ...partnerHeaders(true), ...jsonHeaders() },
      input,
    )
  },

  listAuthorizations(workspaceId: string) {
    return send<Authorization[]>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/authorizations`,
      'GET',
      partnerHeaders(true),
    )
  },

  createAuthorization(workspaceId: string, input: CreateAuthorizationInput) {
    return send<Authorization[]>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/authorizations`,
      'POST',
      { ...partnerHeaders(true), ...jsonHeaders() },
      input,
    )
  },

  listGroups(workspaceId: string) {
    return send<ClientGroupPage>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/groups`,
      'GET',
      partnerHeaders(true),
    )
  },

  createGroup(workspaceId: string, input: CreateClientGroupInput) {
    return send<ClientGroup>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/groups`,
      'POST',
      { ...partnerHeaders(true), ...jsonHeaders() },
      input,
    )
  },

  listAccesses(workspaceId: string) {
    return send<DashboardAccesses>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/accesses`,
      'GET',
      partnerHeaders(true),
    )
  },

  openAccess(workspaceId: string, input: OpenAccessInput) {
    return send<OpenAccessResult>(
      `${apiBase()}/workspaces/${encodeURIComponent(workspaceId)}/accesses/open`,
      'POST',
      { ...partnerHeaders(true), ...jsonHeaders() },
      input,
    )
  },
}
