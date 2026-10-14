<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import JsonBlock from './JsonBlock.vue'
import { partnerApi } from '../api/partner'
import type { OpenAccessResult } from '../api/partner'
import { session } from '../stores/session'
import { notifyError } from '../utils/feedback'

const toast = useToast()
const loadingList = ref(false)
const loadingOpen = ref(false)
const accesses = ref<unknown>(null)
const opened = ref<OpenAccessResult | null>(null)

const form = reactive({
  workspaceId: '',
  passageId: '',
  deviceId: '',
  mode: '' as '' | 'BLE' | 'REMOTE',
})

const modeOptions = [
  { label: 'Automático (REMOTE se existir)', value: '' },
  { label: 'REMOTE (abertura remota)', value: 'REMOTE' },
  { label: 'BLE (hash temporário)', value: 'BLE' },
]

function requireAuth(): boolean {
  if (!session.token) {
    toast.add({ severity: 'warn', summary: 'Autenticação', detail: 'Faça login primeiro.' })
    return false
  }
  return true
}

async function listAccesses(): Promise<void> {
  if (!requireAuth()) return
  if (!form.workspaceId.trim()) {
    toast.add({ severity: 'warn', summary: 'Validação', detail: 'workspaceId é obrigatório.' })
    return
  }
  loadingList.value = true
  try {
    accesses.value = await partnerApi.listAccesses(form.workspaceId.trim())
    opened.value = null
  } catch (error) {
    notifyError(toast, error)
  } finally {
    loadingList.value = false
  }
}

async function openAccess(): Promise<void> {
  if (!requireAuth()) return
  if (!form.workspaceId.trim()) {
    toast.add({ severity: 'warn', summary: 'Validação', detail: 'workspaceId é obrigatório.' })
    return
  }
  if (!form.passageId.trim() && !form.deviceId.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Validação',
      detail: 'Informe passageId ou deviceId.',
    })
    return
  }
  loadingOpen.value = true
  try {
    opened.value = await partnerApi.openAccess(form.workspaceId.trim(), {
      passageId: form.passageId.trim() || null,
      deviceId: form.deviceId.trim() || null,
      mode: form.mode === '' ? null : form.mode,
    })
    if (opened.value.mode === 'BLE') {
      toast.add({
        severity: 'info',
        summary: 'BLE',
        detail: 'Use connection.payload no handshake Bluetooth do dispositivo.',
      })
    } else {
      toast.add({ severity: 'success', summary: 'REMOTE', detail: 'Abertura remota executada.' })
    }
  } catch (error) {
    notifyError(toast, error)
  } finally {
    loadingOpen.value = false
  }
}
</script>

<template>
  <div class="panel">
    <h2>Acessos e abertura</h2>
    <Message severity="secondary" :closable="false">
      Lista os acessos ativos do usuário na loja (<code>getdashboardaccesses</code>). A abertura
      resolve a passagem/dispositivo: dispositivo <code>REMOTE</code> abre na hora e devolve o
      status; dispositivo BLE devolve o hash temporário (nano ou atmega) para o cliente escrever
      no Bluetooth.
    </Message>

    <div class="form-grid">
      <div class="field">
        <label for="ac-workspace">workspaceId *</label>
        <InputText id="ac-workspace" v-model="form.workspaceId" placeholder="uuid da loja" fluid />
      </div>
    </div>

    <div class="actions">
      <Button label="Listar acessos" icon="pi pi-list" :loading="loadingList" @click="listAccesses" />
    </div>

    <JsonBlock :value="accesses" />

    <h3>Abrir</h3>

    <div class="form-grid">
      <div class="field">
        <label for="ac-passage">passageId</label>
        <InputText id="ac-passage" v-model="form.passageId" placeholder="uuid da passagem" fluid />
      </div>
      <div class="field">
        <label for="ac-device">deviceId</label>
        <InputText id="ac-device" v-model="form.deviceId" placeholder="uuid do dispositivo" fluid />
      </div>
      <div class="field">
        <label for="ac-mode">mode</label>
        <Select id="ac-mode" v-model="form.mode" :options="modeOptions" option-label="label" option-value="value" fluid />
      </div>
    </div>

    <div class="actions">
      <Button label="Abrir acesso" icon="pi pi-lock-open" :loading="loadingOpen" @click="openAccess" />
    </div>

    <JsonBlock :value="opened" />
  </div>
</template>
