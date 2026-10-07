import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

import 'primeicons/primeicons.css'
import './style.css'

import App from './App.vue'
import { DraculaPreset } from './theme/dracula'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: DraculaPreset,
    options: {
      darkModeSelector: '.app-dark',
    },
  },
  ripple: true,
})
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
