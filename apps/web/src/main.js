import { createApp } from "vue"
import App from "./App.vue"
import router from "./router/routes.js"

// Import Bootstrap CSS and JS
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import "bootstrap-icons/font/bootstrap-icons.css"

// Import global styles
import "./assets/styles/global.css"

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { VCalendar } from 'vuetify/labs/VCalendar'
import '@mdi/font/css/materialdesignicons.css'

// Vuefire
import { VueFire, VueFireAuth } from 'vuefire'
import { firebaseApp } from './services/firebase' // Export your app from firebase.js

// Text area Auto size
// import TextareaAutosize from 'vue-textarea-autosize'

const vuetify = createVuetify({ components:{...components, VCalendar}, directives })

const app = createApp(App)
app.use(router)
app.use(vuetify)
app.use(VueFire, {
  firebaseApp,
  modules: [VueFireAuth()],
})
// app.component('TextareaAutosize', TextareaAutosize)
app.mount("#app")
