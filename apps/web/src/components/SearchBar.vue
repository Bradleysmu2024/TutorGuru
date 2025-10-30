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
    <div class="filter-group">
      <select v-model="selectedSubject">
        <option value="">All Subjects</option>
        <option
            v-for="subject in subjects"
            :key="subject"
            :value="subject"
          >
            {{ subject }}
        </option>
      </select>

      <select v-model="selectedLevel">
        <option value="">All Levels</option>
          <option
            v-for="level in levels"
            :key="level"
            :value="level"
          >
            {{ level }}
          </option>

      </select>
      <button class="btn btn-secondary" @click="applyFilter">Apply Filter</button>
    </div>
  </div>
</template>

<script setup async>
import { ref } from "vue"
import {
  getSubjects,
  getLevels,
  getLocations,

} from "../services/firebase";
import {
  collection,
  getDocs,
  collectionGroup,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { getCurrentUser } from "../services/firebase";
const postalCode = ref("")
const emit = defineEmits(["search", "filter"]) // event to tell parent user searched
const subjects = ref([]);
const levels = ref([]);

Promise.all([getSubjects(), getLevels()])
  .then(([subjectsList, levelsList]) => {
    subjects.value = subjectsList
    levels.value = levelsList
  })
  .catch(err => console.error("Failed to load subjects/levels:", err))

function emitSearch() {
  if (!postalCode.value.trim()) return
  emit("search", postalCode.value.trim())
}

const selectedSubject = ref("")
const selectedLevel = ref("")

function applyFilter() {
  if (!selectedSubject.value.trim() || !selectedLevel.value.trim()) return
  emit("filter", {
    subject: selectedSubject.value,
    level: selectedLevel.value
  })
}



</script>

<style scoped>
.tutor-search-bar {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: 90%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.filter-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>