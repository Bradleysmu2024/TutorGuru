<template>
  <!-- Floating reopen button -->
  <button
    v-if="!showSearchBar"
    class="open-search-btn shadow"
    @click="showSearchBar = true"
  >
    🔍 Search
  </button>

  <!-- Search overlay -->
  <div v-if="showSearchBar" class="tutor-search-bar shadow">
    <!-- Header row for close -->
    <div class="bar-header">
      <span class="fw-semibold small text-muted">Tutor Search</span>
      <button class="close-btn" @click="showSearchBar = false">&times;</button>
    </div>

    <!-- Main content -->
    <div class="input-group mb-2">
      <input
        v-model="postalCode"
        type="text"
        class="form-control"
        placeholder="Enter your postal code (e.g. 650123)"
      />
      <button class="btn btn-primary" @click="emitSearch">Search</button>
    </div>

    <div class="filter-group">
      <Multiselect
        v-model="selectedSubject"
        :options="subjects"
        :multiple="true"
        :close-on-select="false"
        :clear-on-select="false"
        :show-labels="false"
        placeholder="Select subjects (optional)"
        class="compact-select"
      />
      <Multiselect
        v-model="selectedLevel"
        :options="levels"
        :multiple="true"
        :close-on-select="false"
        :clear-on-select="false"
        :show-labels="false"
        placeholder="Select levels (optional)"
        class="compact-select"
      />
      <button class="btn btn-secondary compact-btn" @click="applyFilter">
        Apply Filter
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { getSubjects, getLevels } from "../services/firebase";
import Multiselect from "vue-multiselect";
import "vue-multiselect/dist/vue-multiselect.css";

const emit = defineEmits(["search", "filter"]);

const showSearchBar = ref(true);
const postalCode = ref("");
const subjects = ref([]);
const levels = ref([]);
const selectedSubject = ref([]);
const selectedLevel = ref([]);

// Load subject/level options
Promise.all([getSubjects(), getLevels()])
  .then(([sList, lList]) => {
    subjects.value = sList;
    levels.value = lList;
  })
  .catch((err) => console.error("Failed to load subjects/levels:", err));

function emitSearch() {
  if (!postalCode.value.trim()) return;
  emit("search", postalCode.value.trim());
}

function applyFilter() {
  let subjectsVal = selectedSubject?.value || [];
  const levelsVal = selectedLevel?.value || [];
  if (!subjectsVal.length && !levelsVal.length) {
    subjectsVal = ["All Subjects"];
    selectedSubject.value = subjectsVal;
  }
  emit("filter", { subjects: subjectsVal, levels: levelsVal });
}
</script>

<style scoped>

.tutor-search-bar {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  width: 90%;
  max-width: 520px;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 10px;
  padding: 14px 16px 16px 16px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(5px);
}


.bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}


.close-btn {
  background: transparent;
  border: none;
  font-size: 1.3rem;
  color: #666;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s ease;
}
.close-btn:hover {
  color: #000;
}


.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.compact-select {
  width: 170px;
  font-size: 0.85rem;
}
.compact-select .multiselect__tags {
  min-height: 28px;
  padding: 3px 6px;
}
.compact-select .multiselect__option {
  padding: 4px 8px;
  font-size: 0.85rem;
}
.compact-btn {
  font-size: 0.85rem;
  padding: 4px 10px;
}


.open-search-btn {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: #0d6efd;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 14px;
  font-weight: 500;
  cursor: pointer;
  z-index: 1050;
  transition: background 0.2s ease, transform 0.1s;
}
.open-search-btn:hover {
  background: #0b5ed7;
  transform: translateX(-50%) scale(1.03);
}
</style>
