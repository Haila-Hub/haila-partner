<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import { PartnerApiError, partnerApi } from '../api/partner'
import { session } from '../stores/session'
import { notifyError, notifySuccess } from '../utils/feedback'

const toast = useToast()
const testing = ref(false)

async function testKey(): Promise<void> {
  if (!session.apiKey.trim()) {
    toast.add({ severity: 'warn', summary: 'API key', detail: 'Informe a X-Api-Key antes de testar.' })
    return
  }
  testing.value = true
  try {
    await partnerApi.login('teste-de-conexao@invalid.local', 'senha-invalida')
    notifySuccess(toast, 'O engine respondeu ao login de teste.')
  } catch (error) {
    if (
      error instanceof PartnerApiError &&
      error.code === 'UNAUTHORIZED' &&
      error.messages.some((message) => message.includes('invalid credentials'))
    ) {
      notifySuccess(toast, 'API key aceita pelo engine.')
    } else {
      notifyError(toast, error)
    }
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <div class="panel">
    <h2>Conexão</h2>

    <div class="field-grid">
      <label for="base-url">URL do engine</label>
      <InputText id="base-url" v-model="session.baseUrl" placeholder="https://haila-java.haila.app" fluid />

      <label for="api-key">X-Api-Key</label>
      <Password
        id="api-key"
        v-model="session.apiKey"
        :feedback="false"
        toggle-mask
        placeholder="chave do parceiro"
        fluid
      />
    </div>

    <div class="actions">
      <Button label="Testar chave" icon="pi pi-bolt" :loading="testing" @click="testKey" />
    </div>

    <Message severity="secondary" :closable="false">
      O cliente chama <code>/api/partner/v1</code> com <code>X-Api-Key</code> em todas as rotas
      (inclusive login e registro). Reservas, disponibilidade e preço também enviam
      <code>Authorization: Bearer</code>. Na URL do engine pode colar com ou sem
      <code>/api/partner/v1</code>. O teste de chave usa um login inválido de propósito: se a
      resposta for <code>invalid credentials</code>, a chave foi aceita.
    </Message>
  </div>
</template>
