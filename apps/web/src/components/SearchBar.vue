<template>
  <div class="tutor-search-bar shadow">
    <div class="input-group">
      <input
        v-model="postalCode"
        type="text"
        class="form-control"
        placeholder="Enter your postal code (e.g. 650123)"
      />
      <button class="btn btn-primary" @click="emitSearch">
        Search
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"

const postalCode = ref("")
const emit = defineEmits(["search"]) // event to tell parent user searched

function emitSearch() {
  if (!postalCode.value.trim()) return
  emit("search", postalCode.value.trim())
}
</script>

<style scoped>
.tutor-search-bar {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 90%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 8px;
}
</style>
