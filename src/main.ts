import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import ru from 'element-plus/es/locale/lang/ru'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'

const app = createApp(App)
dayjs.locale('ru')

app.use(createPinia())
app.use(ElementPlus, { locale: ru })
app.mount('#app')
