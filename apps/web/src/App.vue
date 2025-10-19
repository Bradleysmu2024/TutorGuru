<template>
  <div id="app">
    <NavBar />
    <main class="main-content">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'

const emu = document.getElementsByClassName("firebase-emulator-warning");
if (emu.length > 0) {
  Array.from(emu).forEach(ele => {
    ele.remove();
  });
}
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
  /* allow children to shrink/scroll correctly inside a flex container */
  min-height: 0;
  padding-top: 76px; /* Account for fixed navbar */
}
</style>
