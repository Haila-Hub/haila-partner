<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import JsonBlock from './JsonBlock.vue'
import { partnerApi } from '../api/partner'
import { session } from '../stores/session'
import { notifyError } from '../utils/feedback'

const toast = useToast()
const loading = ref(false)
const result = ref<unknown>(null)

const form = reactive({
  workspaceId: '',
  startDate: null as Date | null,
  endDate: null as Date | null,
  areaCategoryId: '',
  capacity: null as number | null,
  specificDurationId: '',
  areaId: '',
})

async function submit(): Promise<void> {
  if (!session.token) {
    toast.add({ severity: 'warn', summary: 'Autenticação', detail: 'Faça login primeiro.' })
    return
  }
  if (!form.workspaceId.trim() || !form.startDate || !form.endDate) {
    toast.add({
      severity: 'warn',
      summary: 'Validação',
      detail: 'workspaceId, startDate e endDate são obrigatórios.',
    })
    return
  }
  if (form.areaId.trim() && !form.specificDurationId.trim()) {
    toast.add({
      severity: 'warn',
      summary: 'Validação',
      detail: 'specificDurationId é obrigatório quando areaId é informado.',
    })
    return
  }
  loading.value = true
  try {
    result.value = await partnerApi.availability({
      workspaceId: form.workspaceId.trim(),
      startDate: form.startDate.toISOString(),
      endDate: form.endDate.toISOString(),
      areaCategoryId: form.areaCategoryId.trim() || null,
      capacity: form.capacity,
      specificDurationId: form.specificDurationId.trim() || null,
      areaId: form.areaId.trim() || null,
    })
  } catch (error) {
    notifyError(toast, error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="panel">
    <h2>Disponibilidade</h2>
    <Message severity="secondary" :closable="false">
      Sem <code>areaId</code>: retorna as áreas disponíveis no período
      (<code>getavailableareasjson</code>). Com <code>areaId</code> +
      <code>specificDurationId</code>: retorna os horários do dia
      (<code>getavailabletimeslotsbydayjson</code>).
    </Message>

    <div class="form-grid">
      <div class="field">
        <label for="av-workspace">workspaceId *</label>
        <InputText id="av-workspace" v-model="form.workspaceId" placeholder="uuid da loja" fluid />
      </div>
      <div class="field">
        <label for="av-start">startDate *</label>
        <DatePicker
          id="av-start"
          v-model="form.startDate"
          show-time
          hour-format="24"
          date-format="dd/mm/yy"
          show-icon
          fluid
        />
      </div>
      <div class="field">
        <label for="av-end">endDate *</label>
        <DatePicker
          id="av-end"
          v-model="form.endDate"
          show-time
          hour-format="24"
          date-format="dd/mm/yy"
          show-icon
          fluid
        />
      </div>
      <div class="field">
        <label for="av-category">areaCategoryId</label>
        <InputText id="av-category" v-model="form.areaCategoryId" placeholder="opcional" fluid />
      </div>
      <div class="field">
        <label for="av-capacity">capacity</label>
        <InputNumber id="av-capacity" v-model="form.capacity" :min="0" show-buttons fluid />
      </div>
      <div class="field">
        <label for="av-duration">specificDurationId</label>
        <InputText
          id="av-duration"
          v-model="form.specificDurationId"
          placeholder="obrigatório com areaId"
          fluid
        />
      </div>
      <div class="field">
        <label for="av-area">areaId</label>
        <InputText id="av-area" v-model="form.areaId" placeholder="opcional" fluid />
      </div>
    </div>

    <div class="actions">
      <Button label="Consultar" icon="pi pi-calendar" :loading="loading" @click="submit" />
    </div>

    <JsonBlock :value="result" />
  </div>
</template>
