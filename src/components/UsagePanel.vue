<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import JsonBlock from './JsonBlock.vue'
import { partnerApi } from '../api/partner'
import type { PartnerUsage, PartnerUsageCounters } from '../api/partner'
import { session } from '../stores/session'
import { notifyError } from '../utils/feedback'

const toast = useToast()
const loading = ref(false)
const usage = ref<PartnerUsage | null>(null)

const counters = computed<PartnerUsageCounters | null>(() => usage.value?.usage ?? null)

function requireKey(): boolean {
  if (!session.apiKey.trim()) {
    toast.add({ severity: 'warn', summary: 'API key', detail: 'Informe a X-Api-Key na aba Conexão.' })
    return false
  }
  return true
}

function number(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return value.toLocaleString('pt-BR')
}

function limit(value: number | null | undefined): string {
  return value === null || value === undefined ? 'ilimitado' : number(value)
}

function percent(used: number | null | undefined, max: number | null | undefined): number | null {
  if (max === null || max === undefined || max <= 0) return null
  return Math.min(100, Math.round(((used ?? 0) / max) * 100))
}

async function load(): Promise<void> {
  if (!requireKey()) return
  loading.value = true
  try {
    usage.value = await partnerApi.usage()
  } catch (error) {
    notifyError(toast, error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="panel">
    <h2>Uso e limites</h2>

    <div class="actions">
      <Button label="Consultar uso" icon="pi pi-chart-line" :loading="loading" @click="load" />
    </div>

    <Message severity="secondary" :closable="false">
      <code>GET /usage</code> usa apenas <code>X-Api-Key</code> e devolve os limites e o consumo
      do dia/mês da chave. Limite <code>null</code> = ilimitado; com <code>hardLimit: true</code>
      o engine responde <code>429 QUOTA_EXCEEDED</code> ao passar do limite. A consulta conta
      como requisição na cota.
    </Message>

    <template v-if="usage && counters">
      <div class="usage-head">
        <Tag severity="info" :value="usage.client.name || usage.client.id" />
        <Tag
          :severity="usage.client.active ? 'success' : 'danger'"
          :value="usage.client.active ? 'chave ativa' : 'chave inativa'"
        />
        <Tag
          :severity="counters.exceeded ? 'danger' : 'success'"
          :value="counters.exceeded ? 'acima do limite' : 'dentro do limite'"
        />
        <Tag
          :severity="counters.hardLimit ? 'warn' : 'secondary'"
          :value="counters.hardLimit ? 'hard limit' : 'soft limit'"
        />
      </div>

      <p class="usage-line">
        Mês {{ counters.month }} · dia {{ counters.day }} · virada em {{ counters.resetAt }} ·
        {{ usage.client.workspaceIds.length }} loja(s) na chave
      </p>

      <div class="section">
        <h3>Dia</h3>
        <p class="usage-line">
          {{ number(counters.dailyUsed) }} de {{ limit(counters.dailyLimit) }} · restante
          {{ number(counters.dailyRemaining) }}
        </p>
        <ProgressBar
          v-if="percent(counters.dailyUsed, counters.dailyLimit) !== null"
          :value="percent(counters.dailyUsed, counters.dailyLimit) ?? 0"
          :show-value="false"
        />
      </div>

      <div class="section">
        <h3>Mês</h3>
        <p class="usage-line">
          {{ number(counters.monthlyUsed) }} de {{ limit(counters.monthlyLimit) }} · restante
          {{ number(counters.monthlyRemaining) }} · overage
          {{ number(counters.overageUsed) }}/{{ number(counters.overageLimit) }}
        </p>
        <ProgressBar
          v-if="percent(counters.monthlyUsed, counters.monthlyLimit) !== null"
          :value="percent(counters.monthlyUsed, counters.monthlyLimit) ?? 0"
          :show-value="false"
        />
      </div>

      <Message v-if="counters.reason" severity="warn" :closable="false">
        {{ counters.reason }}
      </Message>

      <h3>Resposta</h3>
      <JsonBlock :value="usage" />
    </template>
  </div>
</template>
