<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import DatePicker from 'primevue/datepicker'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import JsonBlock from './JsonBlock.vue'
import { partnerApi, type Reservation } from '../api/partner'
import { session } from '../stores/session'
import { notifyError, notifySuccess } from '../utils/feedback'
import { formatChargeDate, formatChargeValue } from '../utils/format'

const toast = useToast()
const confirm = useConfirm()

const reservations = ref<Reservation[]>([])
const loading = ref(false)
const saving = ref(false)
const detail = ref<Reservation | null>(null)
const detailVisible = ref(false)
const editorVisible = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({
  workspaceId: '',
  areaId: '',
  startDate: null as Date | null,
  endDate: null as Date | null,
  dependents: 0,
})

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR')
}

function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
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

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null
}

async function load(): Promise<void> {
  if (!session.token) {
    toast.add({
      severity: 'warn',
      summary: 'Autenticação',
      detail: 'Faça login para listar reservas.',
    })
    return
  }
  loading.value = true
  try {
    reservations.value = await partnerApi.listReservations()
  } catch (error) {
    notifyError(toast, error)
  } finally {
    loading.value = false
  }
}

function openCreate(): void {
  editingId.value = null
  form.workspaceId = ''
  form.areaId = ''
  form.startDate = null
  form.endDate = null
  form.dependents = 0
  editorVisible.value = true
}

function openEdit(row: Reservation): void {
  editingId.value = row.id
  form.workspaceId = row.workspaceId ?? ''
  form.areaId = row.areaId ?? ''
  form.startDate = row.startDate ? new Date(row.startDate) : null
  form.endDate = row.endDate ? new Date(row.endDate) : null
  form.dependents = 0
  editorVisible.value = true
}

async function save(): Promise<void> {
  if (!form.workspaceId.trim() || !form.areaId.trim() || !form.startDate || !form.endDate) {
    toast.add({
      severity: 'warn',
      summary: 'Validação',
      detail: 'workspaceId, areaId, startDate e endDate são obrigatórios.',
    })
    return
  }
  saving.value = true
  const editing = editingId.value
  try {
    if (editing) {
      await partnerApi.updateReservation(editing, {
        startDate: toIso(form.startDate),
        endDate: toIso(form.endDate),
        dependents: form.dependents,
      })
    } else {
      await partnerApi.createReservation({
        workspaceId: form.workspaceId.trim(),
        areaId: form.areaId.trim(),
        startDate: toIso(form.startDate) ?? '',
        endDate: toIso(form.endDate) ?? '',
        dependents: form.dependents ?? 0,
      })
    }
    editorVisible.value = false
    notifySuccess(toast, editing ? 'Reserva atualizada.' : 'Reserva criada.')
    await load()
  } catch (error) {
    notifyError(toast, error)
  } finally {
    saving.value = false
  }
}

async function showDetail(row: Reservation): Promise<void> {
  try {
    detail.value = await partnerApi.getReservation(row.id)
    detailVisible.value = true
  } catch (error) {
    notifyError(toast, error)
  }
}

function cancelReservation(row: Reservation): void {
  confirm.require({
    header: 'Cancelar reserva',
    message: `Cancelar a reserva ${row.id}?`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Cancelar reserva',
    rejectLabel: 'Voltar',
    accept: async () => {
      try {
        await partnerApi.cancelReservation(row.id)
        notifySuccess(toast, 'Reserva cancelada.')
        await load()
      } catch (error) {
        notifyError(toast, error)
      }
    },
  })
}

onMounted(load)
</script>

<template>
  <div class="panel">
    <ConfirmDialog />

    <div class="actions">
      <Button label="Atualizar" icon="pi pi-refresh" :loading="loading" @click="load" />
      <Button label="Nova reserva" icon="pi pi-plus" @click="openCreate" />
      <Message v-if="!session.token" severity="warn" :closable="false" icon="pi pi-lock">
        Faça login primeiro.
      </Message>
    </div>

    <DataTable
      :value="reservations"
      data-key="id"
      :loading="loading"
      paginator
      :rows="10"
      striped-rows
      size="small"
      scrollable
    >
      <template #empty>Nenhuma reserva para este usuário e chave.</template>
      <Column field="workspaceName" header="Loja" />
      <Column field="areaName" header="Área" />
      <Column header="Início">
        <template #body="{ data }">{{ formatDate(data.startDate) }}</template>
      </Column>
      <Column header="Fim">
        <template #body="{ data }">{{ formatDate(data.endDate) }}</template>
      </Column>
      <Column header="Status">
        <template #body="{ data }">
          <Tag :value="data.status ?? '—'" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column header="Cobrança">
        <template #body="{ data }">
          <span v-if="data.charges?.length" class="charge-cell">
            {{ data.charges.map(formatChargeValue).join('\n') }}
          </span>
          <span v-else>{{ formatPrice(data.price) }}</span>
        </template>
      </Column>
      <Column header="Ações" style="width: 11rem">
        <template #body="{ data }">
          <div class="actions">
            <Button
              icon="pi pi-search"
              size="small"
              severity="secondary"
              outlined
              @click="showDetail(data)"
            />
            <Button
              icon="pi pi-pencil"
              size="small"
              severity="secondary"
              outlined
              @click="openEdit(data)"
            />
            <Button
              icon="pi pi-ban"
              size="small"
              severity="danger"
              outlined
              @click="cancelReservation(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="editorVisible"
      :header="editingId ? 'Editar reserva' : 'Nova reserva'"
      modal
      :style="{ width: '34rem', maxWidth: '95vw' }"
    >
      <div class="form-grid">
        <div class="field">
          <label for="res-workspace">workspaceId *</label>
          <InputText id="res-workspace" v-model="form.workspaceId" placeholder="uuid da loja" fluid />
        </div>
        <div class="field">
          <label for="res-area">areaId *</label>
          <InputText id="res-area" v-model="form.areaId" placeholder="uuid da área" fluid />
        </div>
        <div class="field">
          <label for="res-start">startDate *</label>
          <DatePicker
            id="res-start"
            v-model="form.startDate"
            show-time
            hour-format="24"
            date-format="dd/mm/yy"
            show-icon
            fluid
          />
        </div>
        <div class="field">
          <label for="res-end">endDate *</label>
          <DatePicker
            id="res-end"
            v-model="form.endDate"
            show-time
            hour-format="24"
            date-format="dd/mm/yy"
            show-icon
            fluid
          />
        </div>
        <div class="field">
          <label for="res-dependents">dependents</label>
          <InputNumber id="res-dependents" v-model="form.dependents" :min="0" show-buttons fluid />
        </div>
      </div>
      <template #footer>
        <Button label="Fechar" severity="secondary" text @click="editorVisible = false" />
        <Button
          :label="editingId ? 'Salvar' : 'Criar'"
          icon="pi pi-check"
          :loading="saving"
          @click="save"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="detailVisible"
      header="Reserva"
      modal
      :style="{ width: '42rem', maxWidth: '95vw' }"
    >
      <div v-if="detail?.charges?.length" class="billing-list">
        <div v-for="(charge, index) in detail.charges" :key="charge.id" class="billing-entry">
          <div class="billing-row">
            <span>Valor</span>
            <strong>{{ formatChargeValue(charge) }}</strong>
          </div>
          <div class="billing-row">
            <span>Contrato</span>
            <strong>{{ charge.templateName?.trim() || '—' }}</strong>
          </div>
          <div class="billing-row">
            <span>Descrição</span>
            <strong>{{ charge.description?.trim() || '—' }}</strong>
          </div>
          <div class="billing-row">
            <span>Ciclo de débito</span>
            <strong>{{ formatChargeDate(charge.payDay) }}</strong>
          </div>
          <div class="billing-row">
            <span>Data de pagamento</span>
            <strong>{{ charge.paidDay ? formatChargeDate(charge.paidDay) : 'Pagamento não informado' }}</strong>
          </div>
          <Divider v-if="index < detail.charges.length - 1" />
        </div>
      </div>
      <Message v-else severity="secondary" :closable="false">
        Sem cobranças registradas para esta reserva.
      </Message>
      <Divider />
      <JsonBlock :value="detail" />
    </Dialog>
  </div>
</template>
