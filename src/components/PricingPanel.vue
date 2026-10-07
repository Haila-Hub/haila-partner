<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import DatePicker from 'primevue/datepicker'
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
  areaId: '',
  startDate: null as Date | null,
  endDate: null as Date | null,
})

async function submit(): Promise<void> {
  if (!session.token) {
    toast.add({ severity: 'warn', summary: 'Autenticação', detail: 'Faça login primeiro.' })
    return
  }
  if (!form.workspaceId.trim() || !form.areaId.trim() || !form.startDate || !form.endDate) {
    toast.add({
      severity: 'warn',
      summary: 'Validação',
      detail: 'workspaceId, areaId, startDate e endDate são obrigatórios.',
    })
    return
  }
  loading.value = true
  try {
    result.value = await partnerApi.pricing({
      workspaceId: form.workspaceId.trim(),
      areaId: form.areaId.trim(),
      startDate: form.startDate.toISOString(),
      endDate: form.endDate.toISOString(),
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
    <h2>Preço</h2>
    <Message severity="secondary" :closable="false">
      Com contrato, o cálculo usa o usuário do token quando ele já é cliente da loja
      (<code>calculatelinkvaluesjson</code>); sem vínculo, usa <code>calculatelinkvalue</code>.
    </Message>

    <div class="form-grid">
      <div class="field">
        <label for="pr-workspace">workspaceId *</label>
        <InputText id="pr-workspace" v-model="form.workspaceId" placeholder="uuid da loja" fluid />
      </div>
      <div class="field">
        <label for="pr-area">areaId *</label>
        <InputText id="pr-area" v-model="form.areaId" placeholder="uuid da área" fluid />
      </div>
      <div class="field">
        <label for="pr-start">startDate *</label>
        <DatePicker
          id="pr-start"
          v-model="form.startDate"
          show-time
          hour-format="24"
          date-format="dd/mm/yy"
          show-icon
          fluid
        />
      </div>
      <div class="field">
        <label for="pr-end">endDate *</label>
        <DatePicker
          id="pr-end"
          v-model="form.endDate"
          show-time
          hour-format="24"
          date-format="dd/mm/yy"
          show-icon
          fluid
        />
      </div>
    </div>

    <div class="actions">
      <Button label="Calcular" icon="pi pi-dollar" :loading="loading" @click="submit" />
    </div>

    <JsonBlock :value="result" />
  </div>
</template>
