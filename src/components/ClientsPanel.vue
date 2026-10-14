<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import JsonBlock from './JsonBlock.vue'
import { partnerApi, type ClientSummary } from '../api/partner'
import { session } from '../stores/session'
import { notifyError, notifySuccess } from '../utils/feedback'

const toast = useToast()

const clients = ref<ClientSummary[]>([])
const loading = ref(false)
const saving = ref(false)
const editorVisible = ref(false)
const detail = ref<ClientSummary | null>(null)
const detailVisible = ref(false)

const types = [
  { label: 'Pessoa física', value: 'PERSON' },
  { label: 'Pessoa jurídica', value: 'LEGAL_PERSON' },
]

const form = reactive({
  type: 'PERSON',
  email: '',
  phoneNumber: '',
  firstName: '',
  lastName: '',
  legalName: '',
  brandingName: '',
  address: '',
  number: '',
  city: '',
  state: '',
  zipCode: '',
  complement: '',
  neighborhood: '',
  country: '',
  description: '',
})

function displayName(client: ClientSummary): string {
  const person = [client.firstName, client.lastName].filter(Boolean).join(' ').trim()
  return client.brandingName?.trim() || client.legalName?.trim() || person || client.email || client.id
}

function statusSeverity(status: string | null | undefined): 'success' | 'danger' | 'warn' | 'secondary' {
  switch (status) {
    case 'ACCEPTED':
      return 'success'
    case 'CANCELLED':
      return 'danger'
    case 'PENDING':
      return 'warn'
    default:
      return 'secondary'
  }
}

async function load(): Promise<void> {
  if (!session.token) {
    toast.add({ severity: 'warn', summary: 'Autenticação', detail: 'Faça login primeiro.' })
    return
  }
  if (!session.workspaceId.trim()) {
    toast.add({ severity: 'warn', summary: 'Workspace', detail: 'Informe o workspaceId da loja.' })
    return
  }
  loading.value = true
  try {
    const page = await partnerApi.listClients(session.workspaceId.trim())
    clients.value = page.items
  } catch (error) {
    notifyError(toast, error)
  } finally {
    loading.value = false
  }
}

function openCreate(): void {
  form.type = 'PERSON'
  form.email = ''
  form.phoneNumber = ''
  form.firstName = ''
  form.lastName = ''
  form.legalName = ''
  form.brandingName = ''
  form.address = ''
  form.number = ''
  form.city = ''
  form.state = ''
  form.zipCode = ''
  form.complement = ''
  form.neighborhood = ''
  form.country = ''
  form.description = ''
  editorVisible.value = true
}

async function save(): Promise<void> {
  if (form.type === 'LEGAL_PERSON' && !form.brandingName.trim() && !form.legalName.trim()) {
    toast.add({ severity: 'warn', summary: 'Validação', detail: 'Informe legalName ou brandingName.' })
    return
  }
  if (form.type === 'PERSON' && !form.firstName.trim()) {
    toast.add({ severity: 'warn', summary: 'Validação', detail: 'firstName é obrigatório.' })
    return
  }
  if (!form.email.trim() && !form.phoneNumber.trim()) {
    toast.add({ severity: 'warn', summary: 'Validação', detail: 'Informe email ou phoneNumber.' })
    return
  }
  saving.value = true
  try {
    const created = await partnerApi.createClient(session.workspaceId.trim(), {
      type: form.type,
      email: form.email.trim() || undefined,
      phoneNumber: form.phoneNumber.trim() || undefined,
      firstName: form.firstName.trim() || undefined,
      lastName: form.lastName.trim() || undefined,
      legalName: form.legalName.trim() || undefined,
      brandingName: form.brandingName.trim() || undefined,
      address: form.address.trim() || undefined,
      number: form.number.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      zipCode: form.zipCode.trim() || undefined,
      complement: form.complement.trim() || undefined,
      neighborhood: form.neighborhood.trim() || undefined,
      country: form.country.trim() || undefined,
      description: form.description.trim() || undefined,
    })
    editorVisible.value = false
    notifySuccess(toast, `Cliente ${displayName(created)} salvo.`)
    await load()
  } catch (error) {
    notifyError(toast, error)
  } finally {
    saving.value = false
  }
}

function showDetail(row: ClientSummary): void {
  detail.value = row
  detailVisible.value = true
}

onMounted(load)
</script>

<template>
  <div class="panel">
    <h2>Clientes</h2>
    <Message severity="secondary" :closable="false">
      Lista e cria clientes da loja (<code>GET/POST /workspaces/{workspaceId}/clients</code>). O
      cliente nasce vinculado à loja e, se já existir uma conta Haila com o mesmo email, o vínculo
      primário é criado automaticamente.
    </Message>

    <div class="field-grid">
      <label for="cl-workspace">workspaceId</label>
      <InputText id="cl-workspace" v-model="session.workspaceId" placeholder="uuid da loja" fluid />
    </div>

    <div class="actions">
      <Button label="Atualizar" icon="pi pi-refresh" :loading="loading" @click="load" />
      <Button label="Novo cliente" icon="pi pi-plus" @click="openCreate" />
    </div>

    <DataTable :value="clients" data-key="id" :loading="loading" paginator :rows="10" striped-rows size="small" scrollable>
      <template #empty>Nenhum cliente encontrado.</template>
      <Column header="Nome">
        <template #body="{ data }">{{ displayName(data) }}</template>
      </Column>
      <Column field="type" header="Tipo" />
      <Column field="email" header="Email" />
      <Column field="phone" header="Telefone" />
      <Column header="Vínculo">
        <template #body="{ data }">
          <Tag :value="data.primaryLinkStatus ?? '—'" :severity="statusSeverity(data.primaryLinkStatus)" />
        </template>
      </Column>
      <Column header="Ações" style="width: 6rem">
        <template #body="{ data }">
          <Button icon="pi pi-search" size="small" severity="secondary" outlined @click="showDetail(data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="editorVisible"
      header="Novo cliente"
      modal
      :style="{ width: '40rem', maxWidth: '95vw' }"
    >
      <div class="form-grid">
        <div class="field">
          <label for="cl-type">type *</label>
          <Select id="cl-type" v-model="form.type" :options="types" option-label="label" option-value="value" fluid />
        </div>
        <div class="field">
          <label for="cl-email">email</label>
          <InputText id="cl-email" v-model="form.email" placeholder="cliente@exemplo.com" fluid />
        </div>
        <div class="field">
          <label for="cl-phone">phoneNumber</label>
          <InputText id="cl-phone" v-model="form.phoneNumber" placeholder="+55..." fluid />
        </div>
        <div class="field">
          <label for="cl-first">firstName</label>
          <InputText id="cl-first" v-model="form.firstName" fluid />
        </div>
        <div class="field">
          <label for="cl-last">lastName</label>
          <InputText id="cl-last" v-model="form.lastName" fluid />
        </div>
        <div class="field">
          <label for="cl-legal">legalName</label>
          <InputText id="cl-legal" v-model="form.legalName" fluid />
        </div>
        <div class="field">
          <label for="cl-branding">brandingName</label>
          <InputText id="cl-branding" v-model="form.brandingName" fluid />
        </div>
        <div class="field">
          <label for="cl-address">address</label>
          <InputText id="cl-address" v-model="form.address" fluid />
        </div>
        <div class="field">
          <label for="cl-number">number</label>
          <InputText id="cl-number" v-model="form.number" fluid />
        </div>
        <div class="field">
          <label for="cl-complement">complement</label>
          <InputText id="cl-complement" v-model="form.complement" fluid />
        </div>
        <div class="field">
          <label for="cl-neighborhood">neighborhood</label>
          <InputText id="cl-neighborhood" v-model="form.neighborhood" fluid />
        </div>
        <div class="field">
          <label for="cl-city">city</label>
          <InputText id="cl-city" v-model="form.city" fluid />
        </div>
        <div class="field">
          <label for="cl-state">state</label>
          <InputText id="cl-state" v-model="form.state" fluid />
        </div>
        <div class="field">
          <label for="cl-zip">zipCode</label>
          <InputText id="cl-zip" v-model="form.zipCode" fluid />
        </div>
        <div class="field">
          <label for="cl-country">country</label>
          <InputText id="cl-country" v-model="form.country" fluid />
        </div>
        <div class="field">
          <label for="cl-description">description</label>
          <InputText id="cl-description" v-model="form.description" fluid />
        </div>
      </div>
      <template #footer>
        <Button label="Fechar" severity="secondary" text @click="editorVisible = false" />
        <Button label="Criar" icon="pi pi-check" :loading="saving" @click="save" />
      </template>
    </Dialog>

    <Dialog v-model:visible="detailVisible" header="Cliente" modal :style="{ width: '42rem', maxWidth: '95vw' }">
      <JsonBlock :value="detail" />
    </Dialog>
  </div>
</template>
