<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import ToggleSwitch from 'primevue/toggleswitch'
import JsonBlock from './JsonBlock.vue'
import {
  partnerApi,
  type Area,
  type AreaPricing,
  type CurrencyOption,
  type WeekDay,
} from '../api/partner'
import { session } from '../stores/session'
import { notifyError, notifySuccess } from '../utils/feedback'

const toast = useToast()

const activeTab = ref('areas')
const areas = ref<Area[]>([])
const pricing = ref<AreaPricing[]>([])
const currencies = ref<CurrencyOption[]>([])
const loading = ref(false)
const saving = ref(false)
const areaVisible = ref(false)
const pricingVisible = ref(false)
const created = ref<unknown>(null)
const createdVisible = ref(false)

const DAYS = [
  { dayWeek: '1', label: 'Segunda' },
  { dayWeek: '2', label: 'Terça' },
  { dayWeek: '3', label: 'Quarta' },
  { dayWeek: '4', label: 'Quinta' },
  { dayWeek: '5', label: 'Sexta' },
  { dayWeek: '6', label: 'Sábado' },
  { dayWeek: '7', label: 'Domingo' },
]

interface EditorDay {
  enabled: boolean
  startHour: string
  endHour: string
}

const availabilityAreaId = ref('')
const availability = reactive<Record<string, EditorDay>>(
  Object.fromEntries(DAYS.map((day) => [day.dayWeek, { enabled: false, startHour: '00:00', endHour: '23:59' }])),
)
const availabilityLoading = ref(false)
const availabilitySaving = ref(false)

const areaForm = reactive({
  name: '',
  areaCategoryName: '',
  areaCategoryId: '',
  areaTypeId: '',
  description: '',
  capacity: 1,
  quantity: 1,
  floor: null as number | null,
  address: '',
  addressNumber: '',
  district: '',
  city: '',
  state: '',
  zipcode: '',
  addressComplement: '',
})

const pricingForm = reactive({
  name: '',
  manual: false,
  basePrice: 0,
  baseInterval: 'hour',
  unitId: '',
  areaIds: [] as string[],
  priceMinute: 0,
  priceHour: 0,
  priceDay: 0,
  priceWeek: 0,
  priceMonth: 0,
  priceYear: 0,
})

const intervals = [
  { label: 'Minuto', value: 'minute' },
  { label: 'Hora', value: 'hour' },
  { label: 'Dia', value: 'day' },
  { label: 'Semana', value: 'week' },
  { label: 'Mês', value: 'month' },
  { label: 'Ano', value: 'year' },
]

const areaOptions = computed(() => areas.value.map((area) => ({ label: area.name, value: area.id })))
const selectedArea = computed(() => areas.value.find((area) => area.id === availabilityAreaId.value) ?? null)

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
    const [areaList, pricingList, options] = await Promise.all([
      partnerApi.listAreas(workspaceId),
      partnerApi.listAreaPricing(workspaceId),
      partnerApi.listContractOptions(workspaceId),
    ])
    areas.value = areaList
    pricing.value = pricingList
    currencies.value = options.currencies
  } catch (error) {
    notifyError(toast, error)
  } finally {
    loading.value = false
  }
}

function openArea(): void {
  areaForm.name = ''
  areaForm.areaCategoryName = ''
  areaForm.areaCategoryId = ''
  areaForm.areaTypeId = ''
  areaForm.description = ''
  areaForm.capacity = 1
  areaForm.quantity = 1
  areaForm.floor = null
  areaForm.address = ''
  areaForm.addressNumber = ''
  areaForm.district = ''
  areaForm.city = ''
  areaForm.state = ''
  areaForm.zipcode = ''
  areaForm.addressComplement = ''
  areaVisible.value = true
}

async function saveArea(): Promise<void> {
  if (!areaForm.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Validação', detail: 'name é obrigatório.' })
    return
  }
  saving.value = true
  try {
    const result = await partnerApi.createArea(session.workspaceId.trim(), {
      name: areaForm.name.trim(),
      areaCategoryId: areaForm.areaCategoryId.trim() || undefined,
      areaCategoryName: areaForm.areaCategoryName.trim() || undefined,
      areaTypeId: areaForm.areaTypeId.trim() || undefined,
      description: areaForm.description.trim() || undefined,
      capacity: areaForm.capacity ?? 1,
      quantity: areaForm.quantity ?? 1,
      floor: areaForm.floor ?? undefined,
      address: areaForm.address.trim() || undefined,
      addressNumber: areaForm.addressNumber.trim() || undefined,
      district: areaForm.district.trim() || undefined,
      city: areaForm.city.trim() || undefined,
      state: areaForm.state.trim() || undefined,
      zipcode: areaForm.zipcode.trim() || undefined,
      addressComplement: areaForm.addressComplement.trim() || undefined,
    })
    areaVisible.value = false
    created.value = result
    createdVisible.value = true
    notifySuccess(toast, 'Área criada.')
    await load()
  } catch (error) {
    notifyError(toast, error)
  } finally {
    saving.value = false
  }
}

function openPricing(): void {
  pricingForm.name = ''
  pricingForm.manual = false
  pricingForm.basePrice = 0
  pricingForm.baseInterval = 'hour'
  pricingForm.unitId = currencies.value[0]?.id ?? ''
  pricingForm.areaIds = []
  pricingForm.priceMinute = 0
  pricingForm.priceHour = 0
  pricingForm.priceDay = 0
  pricingForm.priceWeek = 0
  pricingForm.priceMonth = 0
  pricingForm.priceYear = 0
  pricingVisible.value = true
}

async function savePricing(): Promise<void> {
  if (!pricingForm.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Validação', detail: 'name é obrigatório.' })
    return
  }
  saving.value = true
  try {
    const base = {
      name: pricingForm.name.trim(),
      unitId: pricingForm.unitId || null,
      areaIds: pricingForm.areaIds,
    }
    const input = pricingForm.manual
      ? {
          ...base,
          priceMinute: pricingForm.priceMinute ?? 0,
          priceHour: pricingForm.priceHour ?? 0,
          priceDay: pricingForm.priceDay ?? 0,
          priceWeek: pricingForm.priceWeek ?? 0,
          priceMonth: pricingForm.priceMonth ?? 0,
          priceYear: pricingForm.priceYear ?? 0,
        }
      : {
          ...base,
          basePrice: pricingForm.basePrice ?? 0,
          baseInterval: pricingForm.baseInterval,
        }
    const result = await partnerApi.createAreaPricing(session.workspaceId.trim(), input)
    pricingVisible.value = false
    created.value = result
    createdVisible.value = true
    notifySuccess(toast, 'Preço cadastrado.')
    await load()
  } catch (error) {
    notifyError(toast, error)
  } finally {
    saving.value = false
  }
}

async function loadAvailability(): Promise<void> {
  if (!availabilityAreaId.value) return
  availabilityLoading.value = true
  try {
    const result = await partnerApi.listAreaAvailability(session.workspaceId.trim(), availabilityAreaId.value)
    for (const day of DAYS) {
      availability[day.dayWeek] = { enabled: false, startHour: '00:00', endHour: '23:59' }
    }
    for (const day of result.days) {
      availability[day.dayWeek] = {
        enabled: true,
        startHour: day.startHour,
        endHour: day.endHour,
      }
    }
  } catch (error) {
    notifyError(toast, error)
  } finally {
    availabilityLoading.value = false
  }
}

async function saveAvailability(): Promise<void> {
  if (!availabilityAreaId.value) {
    toast.add({ severity: 'warn', summary: 'Validação', detail: 'Escolha uma área.' })
    return
  }
  availabilitySaving.value = true
  try {
    const days: WeekDay[] = DAYS.filter((day) => availability[day.dayWeek].enabled).map((day) => ({
      dayWeek: day.dayWeek,
      startHour: availability[day.dayWeek].startHour,
      endHour: availability[day.dayWeek].endHour,
    }))
    await partnerApi.setAreaAvailability(session.workspaceId.trim(), availabilityAreaId.value, days)
    notifySuccess(toast, 'Disponibilidade salva.')
  } catch (error) {
    notifyError(toast, error)
  } finally {
    availabilitySaving.value = false
  }
}

function areaName(areaId: string): string {
  return areas.value.find((area) => area.id === areaId)?.name ?? areaId
}

watch(availabilityAreaId, loadAvailability)
onMounted(load)
</script>

<template>
  <div class="panel">
    <h2>Áreas</h2>
    <Message severity="secondary" :closable="false">
      Cadastro de áreas, disponibilidade (horários por dia da semana) e preços de reserva
      (<code>area_booking_pricing</code>). Áreas novas nascem abertas todos os dias quando nenhum
      horário é informado.
    </Message>

    <div class="field-grid">
      <label for="ar-workspace">workspaceId</label>
      <InputText id="ar-workspace" v-model="session.workspaceId" placeholder="uuid da loja" fluid />
    </div>

    <div class="actions">
      <Button label="Atualizar" icon="pi pi-refresh" :loading="loading" @click="load" />
      <Button label="Nova área" icon="pi pi-plus" @click="openArea" />
      <Button label="Novo preço" icon="pi pi-dollar" @click="openPricing" />
    </div>

    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="areas">Áreas</Tab>
        <Tab value="availability">Disponibilidade</Tab>
        <Tab value="pricing">Preços</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="areas">
          <DataTable :value="areas" data-key="id" :loading="loading" paginator :rows="10" striped-rows size="small" scrollable>
            <template #empty>Nenhuma área encontrada.</template>
            <Column field="name" header="Nome" />
            <Column header="Categoria">
              <template #body="{ data }">{{ data.area_category?.name ?? data.areaCategoryId ?? '—' }}</template>
            </Column>
            <Column header="Tipo">
              <template #body="{ data }">{{ data.area_type?.name ?? data.areaTypeId ?? '—' }}</template>
            </Column>
            <Column field="capacity" header="Capacidade" />
            <Column header="Endereço">
              <template #body="{ data }">
                {{ [data.address, data.addressNumber, data.city].filter(Boolean).join(', ') || '—' }}
              </template>
            </Column>
          </DataTable>
        </TabPanel>

        <TabPanel value="availability">
          <div class="field-grid">
            <label for="av2-area">areaId</label>
            <Select
              id="av2-area"
              v-model="availabilityAreaId"
              :options="areaOptions"
              option-label="label"
              option-value="value"
              filter
              placeholder="selecione a área"
              fluid
            />
          </div>
          <div v-if="availabilityAreaId" class="availability-grid" :class="{ busy: availabilityLoading }">
            <div v-for="day in DAYS" :key="day.dayWeek" class="availability-row">
              <Checkbox v-model="availability[day.dayWeek].enabled" binary :input-id="`av2-${day.dayWeek}`" />
              <label :for="`av2-${day.dayWeek}`">{{ day.label }}</label>
              <InputText v-model="availability[day.dayWeek].startHour" placeholder="08:00" :disabled="!availability[day.dayWeek].enabled" />
              <InputText v-model="availability[day.dayWeek].endHour" placeholder="18:00" :disabled="!availability[day.dayWeek].enabled" />
            </div>
          </div>
          <div class="actions">
            <Button label="Salvar horários" icon="pi pi-check" :loading="availabilitySaving" :disabled="!availabilityAreaId" @click="saveAvailability" />
          </div>
          <Message v-if="selectedArea" severity="secondary" :closable="false">
            {{ selectedArea.name }} — dias marcados definem a janela em que a área aceita reservas.
          </Message>
        </TabPanel>

        <TabPanel value="pricing">
          <DataTable :value="pricing" data-key="id" :loading="loading" paginator :rows="10" striped-rows size="small" scrollable>
            <template #empty>Nenhum preço cadastrado.</template>
            <Column field="name" header="Nome" />
            <Column header="Unidade">
              <template #body="{ data }">{{ data.unitSymbol ?? data.unitName ?? '—' }}</template>
            </Column>
            <Column field="priceHour" header="Hora" />
            <Column field="priceDay" header="Dia" />
            <Column field="priceMonth" header="Mês" />
            <Column header="Áreas">
              <template #body="{ data }">
                {{ data.areaIds?.map(areaName).join(', ') || '—' }}
              </template>
            </Column>
          </DataTable>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <Dialog v-model:visible="areaVisible" header="Nova área" modal :style="{ width: '42rem', maxWidth: '95vw' }">
      <div class="form-grid">
        <div class="field">
          <label for="ar-name">name *</label>
          <InputText id="ar-name" v-model="areaForm.name" fluid />
        </div>
        <div class="field">
          <label for="ar-category-name">areaCategoryName</label>
          <InputText id="ar-category-name" v-model="areaForm.areaCategoryName" placeholder="cria se não existir" fluid />
        </div>
        <div class="field">
          <label for="ar-category">areaCategoryId</label>
          <InputText id="ar-category" v-model="areaForm.areaCategoryId" placeholder="ou use o nome" fluid />
        </div>
        <div class="field">
          <label for="ar-type">areaTypeId</label>
          <InputText id="ar-type" v-model="areaForm.areaTypeId" placeholder="padrão: Unidade privativa" fluid />
        </div>
        <div class="field">
          <label for="ar-capacity">capacity</label>
          <InputNumber id="ar-capacity" v-model="areaForm.capacity" :min="1" show-buttons fluid />
        </div>
        <div class="field">
          <label for="ar-quantity">quantity</label>
          <InputNumber id="ar-quantity" v-model="areaForm.quantity" :min="1" show-buttons fluid />
        </div>
        <div class="field">
          <label for="ar-floor">floor</label>
          <InputNumber id="ar-floor" v-model="areaForm.floor" show-buttons fluid />
        </div>
        <div class="field">
          <label for="ar-address">address</label>
          <InputText id="ar-address" v-model="areaForm.address" fluid />
        </div>
        <div class="field">
          <label for="ar-number">addressNumber</label>
          <InputText id="ar-number" v-model="areaForm.addressNumber" fluid />
        </div>
        <div class="field">
          <label for="ar-district">district</label>
          <InputText id="ar-district" v-model="areaForm.district" fluid />
        </div>
        <div class="field">
          <label for="ar-city">city</label>
          <InputText id="ar-city" v-model="areaForm.city" fluid />
        </div>
        <div class="field">
          <label for="ar-state">state</label>
          <InputText id="ar-state" v-model="areaForm.state" fluid />
        </div>
        <div class="field">
          <label for="ar-zip">zipcode</label>
          <InputText id="ar-zip" v-model="areaForm.zipcode" fluid />
        </div>
        <div class="field">
          <label for="ar-complement">addressComplement</label>
          <InputText id="ar-complement" v-model="areaForm.addressComplement" fluid />
        </div>
        <div class="field">
          <label for="ar-description">description</label>
          <InputText id="ar-description" v-model="areaForm.description" fluid />
        </div>
      </div>
      <template #footer>
        <Button label="Fechar" severity="secondary" text @click="areaVisible = false" />
        <Button label="Criar" icon="pi pi-check" :loading="saving" @click="saveArea" />
      </template>
    </Dialog>

    <Dialog v-model:visible="pricingVisible" header="Novo preço de área" modal :style="{ width: '42rem', maxWidth: '95vw' }">
      <div class="form-grid">
        <div class="field">
          <label for="pr-name">name *</label>
          <InputText id="pr-name" v-model="pricingForm.name" fluid />
        </div>
        <div class="field">
          <label for="pr-unit">unitId</label>
          <Select
            id="pr-unit"
            v-model="pricingForm.unitId"
            :options="currencies"
            option-label="name"
            option-value="id"
            show-clear
            fluid
          />
        </div>
        <div class="field">
          <label for="pr-areas">areaIds</label>
          <MultiSelect
            id="pr-areas"
            v-model="pricingForm.areaIds"
            :options="areaOptions"
            option-label="label"
            option-value="value"
            filter
            fluid
          />
        </div>
        <div class="field checkbox-field">
          <ToggleSwitch v-model="pricingForm.manual" input-id="pr-manual" />
          <label for="pr-manual">Informar valores manuais</label>
        </div>
      </div>

      <div v-if="!pricingForm.manual" class="form-grid">
        <div class="field">
          <label for="pr-base">basePrice</label>
          <InputNumber id="pr-base" v-model="pricingForm.basePrice" :min="0" :max-fraction-digits="2" fluid />
        </div>
        <div class="field">
          <label for="pr-interval">baseInterval</label>
          <Select
            id="pr-interval"
            v-model="pricingForm.baseInterval"
            :options="intervals"
            option-label="label"
            option-value="value"
            fluid
          />
        </div>
      </div>

      <div v-else class="form-grid">
        <div class="field">
          <label for="pr-minute">priceMinute</label>
          <InputNumber id="pr-minute" v-model="pricingForm.priceMinute" :min="0" :max-fraction-digits="2" fluid />
        </div>
        <div class="field">
          <label for="pr-hour">priceHour</label>
          <InputNumber id="pr-hour" v-model="pricingForm.priceHour" :min="0" :max-fraction-digits="2" fluid />
        </div>
        <div class="field">
          <label for="pr-day">priceDay</label>
          <InputNumber id="pr-day" v-model="pricingForm.priceDay" :min="0" :max-fraction-digits="2" fluid />
        </div>
        <div class="field">
          <label for="pr-week">priceWeek</label>
          <InputNumber id="pr-week" v-model="pricingForm.priceWeek" :min="0" :max-fraction-digits="2" fluid />
        </div>
        <div class="field">
          <label for="pr-month">priceMonth</label>
          <InputNumber id="pr-month" v-model="pricingForm.priceMonth" :min="0" :max-fraction-digits="2" fluid />
        </div>
        <div class="field">
          <label for="pr-year">priceYear</label>
          <InputNumber id="pr-year" v-model="pricingForm.priceYear" :min="0" :max-fraction-digits="2" fluid />
        </div>
      </div>

      <template #footer>
        <Button label="Fechar" severity="secondary" text @click="pricingVisible = false" />
        <Button label="Criar" icon="pi pi-check" :loading="saving" @click="savePricing" />
      </template>
    </Dialog>

    <Dialog v-model:visible="createdVisible" header="Resposta" modal :style="{ width: '42rem', maxWidth: '95vw' }">
      <JsonBlock :value="created" />
    </Dialog>
  </div>
</template>

<style scoped>
.availability-grid {
  display: grid;
  gap: 0.5rem;
  margin: 1rem 0;
}

.availability-grid.busy {
  opacity: 0.6;
}

.availability-row {
  display: grid;
  grid-template-columns: auto 7rem 7rem 7rem;
  align-items: center;
  gap: 0.75rem;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
