<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import Tag from 'primevue/tag'
import JsonBlock from './JsonBlock.vue'
import {
  partnerApi,
  type ClientSummary,
  type ContractOptions,
  type ContractSummary,
  type ContractTemplate,
} from '../api/partner'
import { session } from '../stores/session'
import { notifyError, notifySuccess } from '../utils/feedback'

const toast = useToast()

const activeTab = ref('contracts')
const templates = ref<ContractTemplate[]>([])
const contracts = ref<ContractSummary[]>([])
const clients = ref<ClientSummary[]>([])
const options = ref<ContractOptions>({ cycleTypes: [], paymentTypes: [], currencies: [] })
const loading = ref(false)
const saving = ref(false)
const templateVisible = ref(false)
const contractVisible = ref(false)
const created = ref<unknown>(null)
const createdVisible = ref(false)

const modes = [
  { label: 'member', value: 'member' },
  { label: 'membersExtended', value: 'membersExtended' },
]

const behaviours = [
  { label: 'NO_FORCE', value: 'NO_FORCE' },
  { label: 'FORCE', value: 'FORCE' },
]

const intervals = [
  { label: 'Mensal (P1M)', value: 'P1M' },
  { label: 'Anual (P1Y)', value: 'P1Y' },
  { label: 'Diário (P1D)', value: 'P1D' },
]

interface CreditRow {
  currencyUnitId: string
  value: number
  priority: number
  overLimitAllowed: boolean
}

const templateForm = reactive({
  name: '',
  value: 0,
  payDay: 5,
  mode: 'member',
  autoRenew: true,
  autoRenewPeriod: 'P1M',
  cycleTypeId: '',
  paymentTypeId: '',
  extendedContractBehaviour: 'NO_FORCE',
  dependentsLimit: -1,
})

const credits = ref<CreditRow[]>([])

const contractForm = reactive({
  templateId: '',
  clientId: '',
  startDate: null as Date | null,
  endDate: null as Date | null,
  priority: 1,
  responsibleWorkspaceId: '',
})

function clientName(client: ClientSummary): string {
  const person = [client.firstName, client.lastName].filter(Boolean).join(' ').trim()
  return client.brandingName?.trim() || client.legalName?.trim() || person || client.email || client.id
}

const clientOptions = computed(() =>
  clients.value.map((client) => ({ label: clientName(client), value: client.id })),
)

function contractClientName(contract: ContractSummary): string {
  const client = contract.workspace_client
  if (!client) return '—'
  const person = [client.firstName, client.lastName].filter(Boolean).join(' ').trim()
  return client.brandingName?.trim() || person || client.email || client.id
}

function statusSeverity(status: string | null | undefined): 'success' | 'danger' | 'warn' | 'secondary' {
  switch (status) {
    case 'ACTIVE':
    case 'ACCEPTED':
      return 'success'
    case 'CANCELLED':
    case 'INACTIVE':
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
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR')
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
    const [templateList, contractPage, optionList, clientPage] = await Promise.all([
      partnerApi.listContractTemplates(workspaceId),
      partnerApi.listContracts(workspaceId),
      partnerApi.listContractOptions(workspaceId),
      partnerApi.listClients(workspaceId),
    ])
    templates.value = templateList
    contracts.value = contractPage.items
    options.value = optionList
    clients.value = clientPage.items
  } catch (error) {
    notifyError(toast, error)
  } finally {
    loading.value = false
  }
}

function openTemplate(): void {
  templateForm.name = ''
  templateForm.value = 0
  templateForm.payDay = 5
  templateForm.mode = 'member'
  templateForm.autoRenew = true
  templateForm.autoRenewPeriod = 'P1M'
  templateForm.cycleTypeId = options.value.cycleTypes[0]?.id ?? ''
  templateForm.paymentTypeId = options.value.paymentTypes[0]?.id ?? ''
  templateForm.extendedContractBehaviour = 'NO_FORCE'
  templateForm.dependentsLimit = -1
  credits.value = [
    {
      currencyUnitId: options.value.currencies[0]?.id ?? '',
      value: 0,
      priority: 1,
      overLimitAllowed: false,
    },
  ]
  templateVisible.value = true
}

function addCredit(): void {
  credits.value.push({
    currencyUnitId: options.value.currencies[0]?.id ?? '',
    value: 0,
    priority: credits.value.length + 1,
    overLimitAllowed: false,
  })
}

function removeCredit(index: number): void {
  credits.value.splice(index, 1)
}

async function saveTemplate(): Promise<void> {
  if (!templateForm.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Validação', detail: 'name é obrigatório.' })
    return
  }
  if (!templateForm.cycleTypeId || !templateForm.paymentTypeId) {
    toast.add({ severity: 'warn', summary: 'Validação', detail: 'Escolha o ciclo e o pagamento.' })
    return
  }
  if (credits.value.some((credit) => !credit.currencyUnitId)) {
    toast.add({ severity: 'warn', summary: 'Validação', detail: 'Todo crédito precisa de uma moeda.' })
    return
  }
  saving.value = true
  try {
    const result = await partnerApi.createContractTemplate(session.workspaceId.trim(), {
      name: templateForm.name.trim(),
      value: templateForm.value ?? 0,
      payDay: templateForm.payDay ?? 1,
      mode: templateForm.mode,
      autoRenew: templateForm.autoRenew,
      autoRenewPeriod: templateForm.autoRenewPeriod,
      cycleTypeId: templateForm.cycleTypeId,
      paymentTypeId: templateForm.paymentTypeId,
      extendedContractBehaviour: templateForm.extendedContractBehaviour,
      dependentsLimit: templateForm.dependentsLimit ?? -1,
      credits: credits.value.map((credit) => ({
        value: credit.value ?? 0,
        priority: credit.priority,
        overLimitAllowed: credit.overLimitAllowed,
        currencyUnit: { id: credit.currencyUnitId },
      })),
    })
    templateVisible.value = false
    created.value = result
    createdVisible.value = true
    notifySuccess(toast, 'Modelo de contrato criado.')
    await load()
  } catch (error) {
    notifyError(toast, error)
  } finally {
    saving.value = false
  }
}

function openContract(): void {
  contractForm.templateId = templates.value[0]?.id ?? ''
  contractForm.clientId = clients.value[0]?.id ?? ''
  contractForm.startDate = new Date()
  contractForm.endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  contractForm.priority = 1
  contractForm.responsibleWorkspaceId = ''
  contractVisible.value = true
}

async function saveContract(): Promise<void> {
  if (!contractForm.templateId || !contractForm.clientId || !contractForm.startDate || !contractForm.endDate) {
    toast.add({
      severity: 'warn',
      summary: 'Validação',
      detail: 'templateId, clientId, startDate e endDate são obrigatórios.',
    })
    return
  }
  saving.value = true
  try {
    const result = await partnerApi.createContract(session.workspaceId.trim(), {
      templateId: contractForm.templateId,
      clientId: contractForm.clientId,
      startDate: contractForm.startDate.toISOString(),
      endDate: contractForm.endDate.toISOString(),
      priority: contractForm.priority ?? 1,
      responsibleWorkspaceId: contractForm.responsibleWorkspaceId.trim() || null,
    })
    contractVisible.value = false
    created.value = result
    createdVisible.value = true
    notifySuccess(toast, 'Contrato criado.')
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
    <h2>Contratos</h2>
    <Message severity="secondary" :closable="false">
      Modelos (<code>contract-templates</code>) e contratos de clientes (<code>contracts</code>).
      Contratos usam <code>createcontractbytemplate</code>: o cliente precisa ter workspace
      vinculado.
    </Message>

    <div class="field-grid">
      <label for="ct-workspace">workspaceId</label>
      <InputText id="ct-workspace" v-model="session.workspaceId" placeholder="uuid da loja" fluid />
    </div>

    <div class="actions">
      <Button label="Atualizar" icon="pi pi-refresh" :loading="loading" @click="load" />
      <Button label="Novo modelo" icon="pi pi-file-plus" @click="openTemplate" />
      <Button label="Novo contrato" icon="pi pi-plus" @click="openContract" />
    </div>

    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="contracts">Contratos</Tab>
        <Tab value="templates">Modelos</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="contracts">
          <DataTable :value="contracts" data-key="id" :loading="loading" paginator :rows="10" striped-rows size="small" scrollable>
            <template #empty>Nenhum contrato encontrado.</template>
            <Column header="Cliente">
              <template #body="{ data }">{{ contractClientName(data) }}</template>
            </Column>
            <Column header="Modelo">
              <template #body="{ data }">{{ data.workspace_link_contract_template?.name ?? '—' }}</template>
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
            <Column field="payDay" header="Dia pgto" />
          </DataTable>
        </TabPanel>
        <TabPanel value="templates">
          <DataTable :value="templates" data-key="id" :loading="loading" paginator :rows="10" striped-rows size="small" scrollable>
            <template #empty>Nenhum modelo de contrato encontrado.</template>
            <Column field="name" header="Nome" />
            <Column field="value" header="Valor" />
            <Column header="Ciclo">
              <template #body="{ data }">{{ data.cycleType?.name ?? '—' }}</template>
            </Column>
            <Column header="Pagamento">
              <template #body="{ data }">{{ data.paymentType?.name ?? '—' }}</template>
            </Column>
            <Column field="payDay" header="Dia pgto" />
            <Column header="Créditos">
              <template #body="{ data }">{{ data.workspaceLinkContractTemplateCredits?.length ?? 0 }}</template>
            </Column>
            <Column header="Contratos">
              <template #body="{ data }">
                {{ data.workspaceLinkContractsAggregate?.aggregate?.count ?? 0 }}
              </template>
            </Column>
          </DataTable>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <Dialog
      v-model:visible="templateVisible"
      header="Novo modelo de contrato"
      modal
      :style="{ width: '46rem', maxWidth: '95vw' }"
    >
      <div class="form-grid">
        <div class="field">
          <label for="tpl-name">name *</label>
          <InputText id="tpl-name" v-model="templateForm.name" fluid />
        </div>
        <div class="field">
          <label for="tpl-value">value *</label>
          <InputNumber id="tpl-value" v-model="templateForm.value" :min="0" :max-fraction-digits="2" fluid />
        </div>
        <div class="field">
          <label for="tpl-payday">payDay</label>
          <InputNumber id="tpl-payday" v-model="templateForm.payDay" :min="1" :max="31" show-buttons fluid />
        </div>
        <div class="field">
          <label for="tpl-mode">mode</label>
          <Select id="tpl-mode" v-model="templateForm.mode" :options="modes" option-label="label" option-value="value" fluid />
        </div>
        <div class="field">
          <label for="tpl-cycle">cycleTypeId *</label>
          <Select
            id="tpl-cycle"
            v-model="templateForm.cycleTypeId"
            :options="options.cycleTypes"
            option-label="name"
            option-value="id"
            fluid
          />
        </div>
        <div class="field">
          <label for="tpl-payment">paymentTypeId *</label>
          <Select
            id="tpl-payment"
            v-model="templateForm.paymentTypeId"
            :options="options.paymentTypes"
            option-label="name"
            option-value="id"
            fluid
          />
        </div>
        <div class="field">
          <label for="tpl-period">autoRenewPeriod</label>
          <Select
            id="tpl-period"
            v-model="templateForm.autoRenewPeriod"
            :options="intervals"
            option-label="label"
            option-value="value"
            fluid
          />
        </div>
        <div class="field">
          <label for="tpl-behaviour">extendedContractBehaviour</label>
          <Select
            id="tpl-behaviour"
            v-model="templateForm.extendedContractBehaviour"
            :options="behaviours"
            option-label="label"
            option-value="value"
            fluid
          />
        </div>
        <div class="field">
          <label for="tpl-dependents">dependentsLimit</label>
          <InputNumber id="tpl-dependents" v-model="templateForm.dependentsLimit" :min="-1" show-buttons fluid />
        </div>
        <div class="field checkbox-field">
          <Checkbox id="tpl-renew" v-model="templateForm.autoRenew" binary />
          <label for="tpl-renew">autoRenew</label>
        </div>
      </div>

      <h3>Créditos</h3>
      <div v-for="(credit, index) in credits" :key="index" class="credit-row">
        <Select
          v-model="credit.currencyUnitId"
          :options="options.currencies"
          option-label="name"
          option-value="id"
          placeholder="moeda"
          fluid
        />
        <InputNumber v-model="credit.value" :min="0" :max-fraction-digits="2" placeholder="valor" fluid />
        <InputNumber v-model="credit.priority" :min="1" show-buttons fluid />
        <div class="checkbox-field">
          <Checkbox v-model="credit.overLimitAllowed" binary />
          <label>overLimitAllowed</label>
        </div>
        <Button icon="pi pi-trash" severity="danger" text @click="removeCredit(index)" />
      </div>
      <div class="actions">
        <Button label="Adicionar crédito" icon="pi pi-plus" size="small" text @click="addCredit" />
      </div>

      <template #footer>
        <Button label="Fechar" severity="secondary" text @click="templateVisible = false" />
        <Button label="Criar" icon="pi pi-check" :loading="saving" @click="saveTemplate" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="contractVisible"
      header="Novo contrato"
      modal
      :style="{ width: '40rem', maxWidth: '95vw' }"
    >
      <div class="form-grid">
        <div class="field">
          <label for="ct-template">templateId *</label>
          <Select
            id="ct-template"
            v-model="contractForm.templateId"
            :options="templates"
            option-label="name"
            option-value="id"
            fluid
          />
        </div>
        <div class="field">
          <label for="ct-client">clientId *</label>
          <Select
            id="ct-client"
            v-model="contractForm.clientId"
            :options="clientOptions"
            option-label="label"
            option-value="value"
            placeholder="selecione"
            fluid
          />
        </div>
        <div class="field">
          <label for="ct-start">startDate *</label>
          <DatePicker id="ct-start" v-model="contractForm.startDate" date-format="dd/mm/yy" show-icon fluid />
        </div>
        <div class="field">
          <label for="ct-end">endDate *</label>
          <DatePicker id="ct-end" v-model="contractForm.endDate" date-format="dd/mm/yy" show-icon fluid />
        </div>
        <div class="field">
          <label for="ct-priority">priority</label>
          <InputNumber id="ct-priority" v-model="contractForm.priority" :min="0" show-buttons fluid />
        </div>
        <div class="field">
          <label for="ct-responsible">responsibleWorkspaceId</label>
          <InputText id="ct-responsible" v-model="contractForm.responsibleWorkspaceId" placeholder="padrão: loja" fluid />
        </div>
      </div>
      <template #footer>
        <Button label="Fechar" severity="secondary" text @click="contractVisible = false" />
        <Button label="Criar" icon="pi pi-check" :loading="saving" @click="saveContract" />
      </template>
    </Dialog>

    <Dialog v-model:visible="createdVisible" header="Resposta" modal :style="{ width: '42rem', maxWidth: '95vw' }">
      <JsonBlock :value="created" />
    </Dialog>
  </div>
</template>

<style scoped>
.credit-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr auto auto auto;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
