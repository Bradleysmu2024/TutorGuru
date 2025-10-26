import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/routes.js";

// Import Bootstrap CSS and JS
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";

// Import global styles
import "./assets/styles/global.css";
import "./assets/styles/dark-mode.css";

// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VCalendar } from "vuetify/labs/VCalendar";
import "@mdi/font/css/materialdesignicons.css";

// Dark mode theme configuration
const customLightTheme = {
  dark: false,
  colors: {
    primary: "#1976D2",
    secondary: "#424242",
    accent: "#82B1FF",
    error: "#FF5252",
    info: "#2196F3",
    success: "#4CAF50",
    warning: "#FB8C00",
  },
};

const customDarkTheme = {
  dark: true,
  colors: {
    primary: "#2196F3",
    secondary: "#424242",
    accent: "#FF4081",
    error: "#FF5252",
    info: "#2196F3",
    success: "#4CAF50",
    warning: "#FB8C00",
  },
};

// Vuefire
import { VueFire, VueFireAuth } from "vuefire";
import { firebaseApp } from "./services/firebase"; // Export your app from firebase.js

// PrimeVue
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import Aura from "@primeuix/themes/aura";

// Text area Auto size
// import TextareaAutosize from 'vue-textarea-autosize'

const vuetify = createVuetify({
  components: { ...components, VCalendar },
  directives,
  theme: {
    defaultTheme: "customLightTheme",
    themes: {
      customLightTheme,
      customDarkTheme,
    },
  },
});

const app = createApp(App);
app.use(router);
app.use(vuetify);
app.use(PrimeVue, {
  theme: {
    preset: Aura, // follow docs, for PrimeVue components
    options: {
      darkModeSelector: ".dark-mode", // CSS class selector for automatic dark mode switching
    },
  },
});
app.use(ToastService);
app.use(VueFire, {
  firebaseApp,
  modules: [VueFireAuth()],
});
// app.component('TextareaAutosize', TextareaAutosize)
app.mount("#app");
