<template>
  <div class="filter-bar">
    <select v-model="selectedSubject">
      <option value="">All Subjects</option>
      <option value="Math">Math</option>
      <option value="English">English</option>
      <option value="Science">Science</option>
    </select>

    <select v-model="selectedLevel">
      <option value="">All Levels</option>
      <option value="Primary">Primary</option>
      <option value="Secondary">Secondary</option>
      <option value="JC">Junior College</option>
    </select>

    <button @click="applyFilter">Apply Filter</button>
  </div>
</template>

<script setup>
import { ref } from "vue"

const emit = defineEmits(["filter"])

const selectedSubject = ref("")
const selectedLevel = ref("")

function applyFilter() {
  emit("filter", {
    subject: selectedSubject.value,
    level: selectedLevel.value
  })
}
</script>

<style scoped>
.filter-bar {
  display: inline-flex;

}
</style>
