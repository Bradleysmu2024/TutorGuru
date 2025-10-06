import { createApp } from "vue"
import App from "./App.vue"
import router from "./router/routes.js"

// Import Bootstrap CSS and JS
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap/dist/js/bootstrap.bundle.min.js"
import "bootstrap-icons/font/bootstrap-icons.css"

// Import global styles
import "./assets/styles/global.css"

const app = createApp(App)
app.use(router)
app.mount("#app")
