<template>
  <v-app>
    <div id="app">
      <NavBar />
      <main class="main-content">
        <router-view />
      </main>
      <Footer v-if="!isChatPage" />
    </div>
  </v-app>
</template>

<script setup>
import NavBar from "./components/NavBar.vue";
import Footer from "./components/Footer.vue";
import { useRoute } from "vue-router";
import { computed, onMounted } from "vue";
import { useTheme } from "vuetify";

const emu = document.getElementsByClassName("firebase-emulator-warning");
if (emu.length > 0) {
  Array.from(emu).forEach((ele) => {
    ele.remove();
  });
}

const route = useRoute();
const isChatPage = computed(() => route.path === "/chat");

const theme = useTheme();

// Load saved theme preference and apply dark mode class
onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "customDarkTheme") {
    theme.global.name.value = "customDarkTheme";
    document.body.classList.add("dark-mode");
  }
});
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-top: 76px;
}
</style>
