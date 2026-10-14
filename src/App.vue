<script setup lang="ts">
import { computed, ref } from 'vue'
import Toast from 'primevue/toast'
import Tag from 'primevue/tag'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import ConnectionPanel from './components/ConnectionPanel.vue'
import AuthPanel from './components/AuthPanel.vue'
import ReservationsPanel from './components/ReservationsPanel.vue'
import AvailabilityPanel from './components/AvailabilityPanel.vue'
import PricingPanel from './components/PricingPanel.vue'
import ClientsPanel from './components/ClientsPanel.vue'
import ContractsPanel from './components/ContractsPanel.vue'
import AreasPanel from './components/AreasPanel.vue'
import AuthorizationsPanel from './components/AuthorizationsPanel.vue'
import GroupsPanel from './components/GroupsPanel.vue'
import AccessesPanel from './components/AccessesPanel.vue'
import UsagePanel from './components/UsagePanel.vue'
import { session, tokenIsActive } from './stores/session'

const activeTab = ref('connection')
const tokenActive = computed(() => tokenIsActive())
</script>

<template>
  <div class="app-shell">
    <Toast position="top-right" />

    <header class="app-header">
      <div class="brand">
        <i class="pi pi-key" />
        <div>
          <h1>Haila Partner API</h1>
          <small>cliente de teste dos endpoints /api/partner/v1</small>
        </div>
      </div>
      <div class="status">
        <Tag severity="info" :value="session.baseUrl || 'sem URL'" />
        <Tag
          :severity="session.apiKey ? 'success' : 'danger'"
          :value="session.apiKey ? 'API key' : 'sem API key'"
        />
        <Tag
          :severity="tokenActive ? 'success' : 'warn'"
          :value="tokenActive ? 'token ativo' : 'sem token'"
        />
      </div>
    </header>

    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="connection">Conexão</Tab>
        <Tab value="auth">Autenticação</Tab>
        <Tab value="reservations">Reservas</Tab>
        <Tab value="availability">Disponibilidade</Tab>
        <Tab value="pricing">Preço</Tab>
        <Tab value="clients">Clientes</Tab>
        <Tab value="contracts">Contratos</Tab>
        <Tab value="areas">Áreas</Tab>
        <Tab value="authorizations">Autorizações</Tab>
        <Tab value="groups">Grupos</Tab>
        <Tab value="accesses">Acessos</Tab>
        <Tab value="usage">Uso</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="connection"><ConnectionPanel /></TabPanel>
        <TabPanel value="auth"><AuthPanel /></TabPanel>
        <TabPanel value="reservations"><ReservationsPanel /></TabPanel>
        <TabPanel value="availability"><AvailabilityPanel /></TabPanel>
        <TabPanel value="pricing"><PricingPanel /></TabPanel>
        <TabPanel value="clients"><ClientsPanel /></TabPanel>
        <TabPanel value="contracts"><ContractsPanel /></TabPanel>
        <TabPanel value="areas"><AreasPanel /></TabPanel>
        <TabPanel value="authorizations"><AuthorizationsPanel /></TabPanel>
        <TabPanel value="groups"><GroupsPanel /></TabPanel>
        <TabPanel value="accesses"><AccessesPanel /></TabPanel>
        <TabPanel value="usage"><UsagePanel /></TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>
