<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import JsonBlock from './JsonBlock.vue'
import { partnerApi, type ClientGroup, type ClientSummary } from '../api/partner'
import { session } from '../stores/session'
import { notifyError, notifySuccess } from '../utils/feedback'

const toast = useToast()

const groups = ref<ClientGroup[]>([])
const clients = ref<ClientSummary[]>([])
const loading = ref(false)
const saving = ref(false)
const editorVisible = ref(false)
const detail = ref<ClientGroup | null>(null)
const detailVisible = ref(false)
const created = ref<unknown>(null)
const createdVisible = ref(false)

const form = reactive({
  name: '',
  typeId: '',
  categoryId: '',
  complement: '',
  members: [] as string[],
})

function clientLabel(client: ClientSummary): string {
  const person = [client.firstName, client.lastName].filter(Boolean).join(' ').trim()
  return client.brandingName?.trim() || client.legalName?.trim() || person || client.email || client.id
}

const clientOptions = computed(() =>
  clients.value.map((client) => ({ label: clientLabel(client), value: client.id })),
)

function memberNames(group: ClientGroup): string {
  return group.members?.map((member) => member.clientName ?? member.workspaceClientId).join(', ') || '—'
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
    const [groupPage, clientPage] = await Promise.all([
      partnerApi.listGroups(workspaceId),
      partnerApi.listClients(workspaceId),
    ])
    groups.value = groupPage.items
    clients.value = clientPage.items
  } catch (error) {
    notifyError(toast, error)
  } finally {
    loading.value = false
  }
}

function openCreate(): void {
  form.name = ''
  form.typeId = ''
  form.categoryId = ''
  form.complement = ''
  form.members = []
  editorVisible.value = true
}

async function save(): Promise<void> {
  if (!form.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Validação', detail: 'name é obrigatório.' })
    return
  }
  saving.value = true
  try {
    const result = await partnerApi.createGroup(session.workspaceId.trim(), {
      name: form.name.trim(),
      typeId: form.typeId.trim() || null,
      categoryId: form.categoryId.trim() || null,
      complement: form.complement.trim() || null,
      members: form.members,
    })
    editorVisible.value = false
    created.value = result
    createdVisible.value = true
    notifySuccess(toast, `Grupo ${form.name} criado.`)
    await load()
  } catch (error) {
    notifyError(toast, error)
  } finally {
    saving.value = false
  }
}

function showDetail(row: ClientGroup): void {
  detail.value = row
  detailVisible.value = true
}

onMounted(load)
</script>

<template>
  <div class="panel">
    <h2>Grupos</h2>
    <Message severity="secondary" :closable="false">
      Grupos de clientes (<code>client-group</code>). Membros entram como
      <code>client-group-dependent</code> na hierarquia do grupo.
    </Message>

    <div class="field-grid">
      <label for="gr-workspace">workspaceId</label>
      <InputText id="gr-workspace" v-model="session.workspaceId" placeholder="uuid da loja" fluid />
    </div>

    <div class="actions">
      <Button label="Atualizar" icon="pi pi-refresh" :loading="loading" @click="load" />
      <Button label="Novo grupo" icon="pi pi-plus" @click="openCreate" />
    </div>

    <DataTable :value="groups" data-key="id" :loading="loading" paginator :rows="10" striped-rows size="small" scrollable>
      <template #empty>Nenhum grupo encontrado.</template>
      <Column field="name" header="Nome" />
      <Column field="complement" header="Complemento" />
      <Column header="Status">
        <template #body="{ data }">
          <Tag :value="data.status ?? '—'" />
        </template>
      </Column>
      <Column header="Membros">
        <template #body="{ data }">{{ data.members?.length ?? 0 }}</template>
      </Column>
      <Column header="Quem">
        <template #body="{ data }">{{ memberNames(data) }}</template>
      </Column>
      <Column header="Ações" style="width: 6rem">
        <template #body="{ data }">
          <Button icon="pi pi-search" size="small" severity="secondary" outlined @click="showDetail(data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="editorVisible" header="Novo grupo" modal :style="{ width: '42rem', maxWidth: '95vw' }">
      <div class="form-grid">
        <div class="field">
          <label for="gr-name">name *</label>
          <InputText id="gr-name" v-model="form.name" fluid />
        </div>
        <div class="field">
          <label for="gr-type">typeId</label>
          <InputText id="gr-type" v-model="form.typeId" placeholder="uuid do tipo (opcional)" fluid />
        </div>
        <div class="field">
          <label for="gr-category">categoryId</label>
          <InputText id="gr-category" v-model="form.categoryId" placeholder="uuid da categoria (opcional)" fluid />
        </div>
        <div class="field">
          <label for="gr-complement">complement</label>
          <InputText id="gr-complement" v-model="form.complement" fluid />
        </div>
        <div class="field">
          <label for="gr-members">members</label>
          <MultiSelect
            id="gr-members"
            v-model="form.members"
            :options="clientOptions"
            option-label="label"
            option-value="value"
            filter
            fluid
          />
        </div>
      </div>
      <template #footer>
        <Button label="Fechar" severity="secondary" text @click="editorVisible = false" />
        <Button label="Criar" icon="pi pi-check" :loading="saving" @click="save" />
      </template>
    </Dialog>

    <Dialog v-model:visible="detailVisible" header="Grupo" modal :style="{ width: '42rem', maxWidth: '95vw' }">
      <JsonBlock :value="detail" />
    </Dialog>

    <Dialog v-model:visible="createdVisible" header="Resposta" modal :style="{ width: '42rem', maxWidth: '95vw' }">
      <JsonBlock :value="created" />
    </Dialog>
  </div>
</template>
