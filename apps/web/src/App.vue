<template>
  <div id="app">
    <NavBar />
    <main class="main-content">
      <router-view />
    </main>
    <Footer v-if="!isChatPage" />
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const emu = document.getElementsByClassName("firebase-emulator-warning");
if (emu.length > 0) {
  Array.from(emu).forEach(ele => {
    ele.remove();
  });
}

const route = useRoute()
const isChatPage = computed(() => route.path === '/chat')
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
