<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { partnerApi, type PartnerToken } from '../api/partner'
import { applyToken, clearToken, session } from '../stores/session'
import { notifyError, notifySuccess } from '../utils/feedback'

const toast = useToast()
const activeTab = ref('login')
const loading = ref(false)
const now = ref(Date.now())

let timer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})

const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  code: '',
})
const accessCodeForm = reactive({ email: '' })

const secondsLeft = computed(() =>
  Math.max(0, Math.floor((session.tokenExpiresAt - now.value) / 1000)),
)

function afterToken(payload: PartnerToken, email: string): void {
  applyToken(payload.token, payload.expiresIn, email)
  notifySuccess(toast, `Token emitido, válido por ${payload.expiresIn}s.`)
}

async function doLogin(): Promise<void> {
  if (!loginForm.email.trim() || !loginForm.password) {
    toast.add({ severity: 'warn', summary: 'Login', detail: 'Informe e-mail e senha.' })
    return
  }
  loading.value = true
  try {
    const result = await partnerApi.login(loginForm.email.trim(), loginForm.password)
    afterToken(result, loginForm.email.trim())
  } catch (error) {
    notifyError(toast, error)
  } finally {
    loading.value = false
  }
}

async function doRegister(): Promise<void> {
  if (
    !registerForm.email.trim() ||
    !registerForm.password ||
    !registerForm.firstName.trim() ||
    !registerForm.code.trim()
  ) {
    toast.add({
      severity: 'warn',
      summary: 'Registro',
      detail: 'email, password, firstName e code são obrigatórios.',
    })
    return
  }
  loading.value = true
  try {
    const result = await partnerApi.register({
      email: registerForm.email.trim(),
      password: registerForm.password,
      firstName: registerForm.firstName.trim(),
      lastName: registerForm.lastName.trim(),
      phoneNumber: registerForm.phoneNumber.trim(),
      code: registerForm.code.trim(),
    })
    afterToken(result, registerForm.email.trim())
  } catch (error) {
    notifyError(toast, error)
  } finally {
    loading.value = false
  }
}

async function doAccessCode(): Promise<void> {
  if (!accessCodeForm.email.trim()) {
    toast.add({ severity: 'warn', summary: 'Código', detail: 'Informe o e-mail.' })
    return
  }
  loading.value = true
  try {
    await partnerApi.accessCode(accessCodeForm.email.trim())
    notifySuccess(toast, 'Código de acesso enviado para o e-mail.')
  } catch (error) {
    notifyError(toast, error)
  } finally {
    loading.value = false
  }
}

async function copyToken(): Promise<void> {
  try {
    await navigator.clipboard.writeText(session.token)
    notifySuccess(toast, 'Token copiado.')
  } catch {
    toast.add({ severity: 'warn', summary: 'Token', detail: 'Não foi possível copiar.' })
  }
}

function logout(): void {
  clearToken()
  toast.add({ severity: 'info', summary: 'Sessão', detail: 'Token removido.' })
}
</script>

<template>
  <div class="panel">
    <h2>Autenticação</h2>

    <Tabs v-model:value="activeTab">
      <TabList>
        <Tab value="login">Login</Tab>
        <Tab value="register">Registro</Tab>
        <Tab value="code">Código de acesso</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="login">
          <div class="field-grid">
            <label for="login-email">E-mail</label>
            <InputText
              id="login-email"
              v-model="loginForm.email"
              type="email"
              autocomplete="username"
              fluid
            />
            <label for="login-password">Senha</label>
            <Password
              id="login-password"
              v-model="loginForm.password"
              :feedback="false"
              toggle-mask
              autocomplete="current-password"
              fluid
            />
          </div>
          <div class="actions">
            <Button label="Entrar" icon="pi pi-sign-in" :loading="loading" @click="doLogin" />
          </div>
        </TabPanel>

        <TabPanel value="register">
          <div class="form-grid">
            <div class="field">
              <label for="register-first">firstName *</label>
              <InputText id="register-first" v-model="registerForm.firstName" fluid />
            </div>
            <div class="field">
              <label for="register-last">lastName</label>
              <InputText id="register-last" v-model="registerForm.lastName" fluid />
            </div>
            <div class="field">
              <label for="register-phone">phoneNumber</label>
              <InputText id="register-phone" v-model="registerForm.phoneNumber" fluid />
            </div>
            <div class="field">
              <label for="register-email">email *</label>
              <InputText id="register-email" v-model="registerForm.email" type="email" fluid />
            </div>
            <div class="field">
              <label for="register-password">password *</label>
              <Password
                id="register-password"
                v-model="registerForm.password"
                :feedback="false"
                toggle-mask
                fluid
              />
            </div>
            <div class="field">
              <label for="register-code">code *</label>
              <InputText id="register-code" v-model="registerForm.code" fluid />
            </div>
          </div>
          <div class="actions">
            <Button
              label="Registrar"
              icon="pi pi-user-plus"
              :loading="loading"
              @click="doRegister"
            />
          </div>
          <Message severity="secondary" :closable="false">
            Envie o código na aba "Código de acesso" antes de registrar.
          </Message>
        </TabPanel>

        <TabPanel value="code">
          <div class="field-grid">
            <label for="code-email">E-mail</label>
            <InputText id="code-email" v-model="accessCodeForm.email" type="email" fluid />
          </div>
          <div class="actions">
            <Button
              label="Enviar código"
              icon="pi pi-envelope"
              :loading="loading"
              @click="doAccessCode"
            />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <div v-if="session.token" class="section">
      <Message severity="success" :closable="false">
        Token ativo para {{ session.email || 'usuário' }} — expira em {{ secondsLeft }}s.
      </Message>
      <div class="token-row">
        <InputText :model-value="session.token" readonly fluid />
        <Button icon="pi pi-copy" severity="secondary" outlined @click="copyToken" />
        <Button label="Sair" icon="pi pi-sign-out" severity="danger" outlined @click="logout" />
      </div>
    </div>
    <Message v-else severity="warn" :closable="false">
      Sem token. Faça login ou registre-se para usar reservas, disponibilidade e preço.
    </Message>
  </div>
</template>
