<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import JsonBlock from './JsonBlock.vue'
import {
  partnerApi,
  type Area,
  type Authorization,
  type AuthorizationArea,
  type ClientSummary,
} from '../api/partner'
import { session } from '../stores/session'
import { notifyError, notifySuccess } from '../utils/feedback'

const toast = useToast()

const authorizations = ref<Authorization[]>([])
const clients = ref<ClientSummary[]>([])
const areas = ref<Area[]>([])
const loading = ref(false)
const saving = ref(false)
const editorVisible = ref(false)
const created = ref<unknown>(null)
const createdVisible = ref(false)

const form = reactive({
  clients: [] as string[],
  areas: [] as string[],
  startDate: new Date() as Date | null,
  endDate: null as Date | null,
  uses: -1,
  permissionRoleId: '',
})

function clientLabel(client: ClientSummary): string {
  const person = [client.firstName, client.lastName].filter(Boolean).join(' ').trim()
  return client.brandingName?.trim() || client.legalName?.trim() || person || client.email || client.id
}

const clientOptions = computed(() =>
  clients.value.map((client) => ({ label: clientLabel(client), value: client.id })),
)
const areaOptions = computed(() => areas.value.map((area) => ({ label: area.name, value: area.id })))

function workspaceLabel(workspace: Authorization['recipientWorkspace']): string {
  if (!workspace) return '—'
  const person = [workspace.firstName, workspace.lastName].filter(Boolean).join(' ').trim()
  return workspace.brandingName?.trim() || workspace.legalName?.trim() || person || workspace.email || workspace.id
}

function statusSeverity(status: string | null | undefined): 'success' | 'danger' | 'warn' | 'secondary' {
  switch (status) {
    case 'ACCEPTED':
      return 'success'
    case 'CANCELLED':
    case 'DENIED':
      return 'danger'
    case 'PENDING':
      return 'warn'
    default:
      return 'secondary'
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR')
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
    const workspaceId = session.workspaceId.trim()
    const [authorizationList, clientPage, areaList] = await Promise.all([
      partnerApi.listAuthorizations(workspaceId),
      partnerApi.listClients(workspaceId),
      partnerApi.listAreas(workspaceId),
    ])
    authorizations.value = authorizationList
    clients.value = clientPage.items
    areas.value = areaList
  } catch (error) {
    notifyError(toast, error)
  } finally {
    loading.value = false
  }
}

function openCreate(): void {
  form.clients = []
  form.areas = []
  form.startDate = new Date()
  form.endDate = null
  form.uses = -1
  form.permissionRoleId = ''
  editorVisible.value = true
}

async function save(): Promise<void> {
  if (!form.clients.length || !form.areas.length || !form.startDate) {
    toast.add({
      severity: 'warn',
      summary: 'Validação',
      detail: 'Escolha ao menos um cliente, uma área e o início.',
    })
    return
  }
  saving.value = true
  try {
    const result = await partnerApi.createAuthorization(session.workspaceId.trim(), {
      clients: form.clients,
      areas: form.areas,
      startDate: form.startDate.toISOString(),
      endDate: form.endDate ? form.endDate.toISOString() : null,
      uses: form.uses ?? -1,
      permissionRoleId: form.permissionRoleId.trim() || null,
    })
    editorVisible.value = false
    created.value = result
    createdVisible.value = true
    notifySuccess(toast, `${result.length} autorização(ões) criada(s).`)
    await load()
  } catch (error) {
    notifyError(toast, error)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="panel">
    <h2>Autorizações</h2>
    <Message severity="secondary" :closable="false">
      Autorizações de área (<code>workspace_link</code> tipo <code>authorization</code>). A criação
      gera as chaves de acesso (<code>workspace_client_key</code>) por área/passagem.
    </Message>

    <div class="field-grid">
      <label for="au-workspace">workspaceId</label>
      <InputText id="au-workspace" v-model="session.workspaceId" placeholder="uuid da loja" fluid />
    </div>

    <div class="actions">
      <Button label="Atualizar" icon="pi pi-refresh" :loading="loading" @click="load" />
      <Button label="Nova autorização" icon="pi pi-plus" @click="openCreate" />
    </div>

    <DataTable :value="authorizations" data-key="id" :loading="loading" paginator :rows="10" striped-rows size="small" scrollable>
      <template #empty>Nenhuma autorização encontrada.</template>
      <Column header="Cliente">
        <template #body="{ data }">{{ workspaceLabel(data.recipientWorkspace) }}</template>
      </Column>
      <Column header="Status">
        <template #body="{ data }">
          <Tag :value="data.status ?? '—'" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column header="Início">
        <template #body="{ data }">{{ formatDate(data.startDate) }}</template>
      </Column>
      <Column header="Fim">
        <template #body="{ data }">{{ formatDate(data.endDate) }}</template>
      </Column>
      <Column header="Áreas">
        <template #body="{ data }">
          {{ (data.areas as AuthorizationArea[] | null)?.map((area) => area.name).join(', ') || '—' }}
        </template>
      </Column>
      <Column header="Chaves">
        <template #body="{ data }">{{ data.workspace_client_keys?.length ?? 0 }}</template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="editorVisible"
      header="Nova autorização"
      modal
      :style="{ width: '44rem', maxWidth: '95vw' }"
    >
      <div class="form-grid">
        <div class="field">
          <label for="au-clients">clients *</label>
          <MultiSelect
            id="au-clients"
            v-model="form.clients"
            :options="clientOptions"
            option-label="label"
            option-value="value"
            filter
            fluid
          />
        </div>
        <div class="field">
          <label for="au-areas">areas *</label>
          <MultiSelect
            id="au-areas"
            v-model="form.areas"
            :options="areaOptions"
            option-label="label"
            option-value="value"
            filter
            fluid
          />
        </div>
        <div class="field">
          <label for="au-start">startDate *</label>
          <DatePicker
            id="au-start"
            v-model="form.startDate"
            show-time
            hour-format="24"
            date-format="dd/mm/yy"
            show-icon
            fluid
          />
        </div>
        <div class="field">
          <label for="au-end">endDate</label>
          <DatePicker
            id="au-end"
            v-model="form.endDate"
            show-time
            hour-format="24"
            date-format="dd/mm/yy"
            show-icon
            fluid
          />
        </div>
        <div class="field">
          <label for="au-uses">uses</label>
          <InputNumber id="au-uses" v-model="form.uses" :min="-1" show-buttons fluid />
        </div>
        <div class="field">
          <label for="au-role">permissionRoleId</label>
          <InputText id="au-role" v-model="form.permissionRoleId" placeholder="opcional" fluid />
        </div>
      </div>
      <template #footer>
        <Button label="Fechar" severity="secondary" text @click="editorVisible = false" />
        <Button label="Criar" icon="pi pi-check" :loading="saving" @click="save" />
      </template>
    </Dialog>

    <Dialog v-model:visible="createdVisible" header="Resposta" modal :style="{ width: '42rem', maxWidth: '95vw' }">
      <JsonBlock :value="created" />
    </Dialog>
  </div>
</template>
