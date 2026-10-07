import { reactive, watch } from 'vue'

const STORAGE_KEY = 'haila-partner-api-client'

export interface PartnerSessionState {
  baseUrl: string
  apiKey: string
  token: string
  tokenExpiresAt: number
  email: string
}

const defaults: PartnerSessionState = {
  baseUrl: 'http://localhost:8080',
  apiKey: '',
  token: '',
  tokenExpiresAt: 0,
  email: '',
}

function load(): PartnerSessionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    return { ...defaults, ...(JSON.parse(raw) as Partial<PartnerSessionState>) }
  } catch {
    return { ...defaults }
  }
}

export const session = reactive<PartnerSessionState>(load())

watch(
  session,
  () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  },
  { deep: true },
)

export function applyToken(token: string, expiresIn: number, email: string): void {
  session.token = token
  session.tokenExpiresAt = Date.now() + Math.max(0, expiresIn) * 1000
  session.email = email
}

export function clearToken(): void {
  session.token = ''
  session.tokenExpiresAt = 0
}

export function tokenIsActive(): boolean {
  return Boolean(session.token) && session.tokenExpiresAt > Date.now()
}
