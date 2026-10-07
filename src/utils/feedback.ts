import type { ToastServiceMethods } from 'primevue/toastservice'
import { PartnerApiError } from '../api/partner'

export function notifySuccess(toast: ToastServiceMethods, detail: string, summary = 'OK'): void {
  toast.add({ severity: 'success', summary, detail, life: 3500 })
}

export function notifyError(toast: ToastServiceMethods, error: unknown): void {
  if (error instanceof PartnerApiError) {
    toast.add({
      severity: 'error',
      summary: error.code || 'ERRO',
      detail: error.messages.join(' '),
      life: 7000,
    })
    return
  }
  toast.add({
    severity: 'error',
    summary: 'ERRO',
    detail: error instanceof Error ? error.message : String(error),
    life: 7000,
  })
}
