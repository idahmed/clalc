import '@fontsource/syne/600.css'
import '@fontsource/syne/700.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import { registerSW } from 'virtual:pwa-register'
import { createApp } from 'vue'
import '@/style.css'
import App from '@/App.vue'

registerSW({ immediate: true })
createApp(App).mount('#app')
