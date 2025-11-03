<template>
  <div class="tutor-search-bar shadow">
    <div class="input-group">
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
      <button class="btn btn-secondary" @click="applyFilter">
        Apply Filter
      </button>
    </div>
  </div>
</template>

<script setup async>
import { ref } from "vue";
import { getSubjects, getLevels, getLocations } from "../services/firebase";
import {
  collection,
  getDocs,
  collectionGroup,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { getCurrentUser } from "../services/firebase";
import Multiselect from "vue-multiselect";
import "vue-multiselect/dist/vue-multiselect.css";

const postalCode = ref("");
const emit = defineEmits(["search", "filter"]); // event to tell parent user searched
const subjects = ref([]);
const levels = ref([]);

Promise.all([getSubjects(), getLevels()])
  .then(([subjectsList, levelsList]) => {
    subjects.value = subjectsList;
    levels.value = levelsList;
  })
  .catch((err) => console.error("Failed to load subjects/levels:", err));

function emitSearch() {
  if (!postalCode.value.trim()) return;
  emit("search", postalCode.value.trim());
}

const selectedSubject = ref([]);
const selectedLevel = ref([]);

function applyFilter() {
  let subjects = selectedSubject?.value || [];
  const levels = selectedLevel?.value || [];

  // If both empty, auto-select "All Subjects" in the UI and treat as no-op filter
  if (!subjects.length && !levels.length) {
    subjects = ["All Subjects"];
    selectedSubject.value = subjects;
  }

  emit("filter", {
    subjects,
    levels,
  });
}
</script>

<style scoped>
.tutor-search-bar {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1020;
  width: 90%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.filter-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* make each multiselect smaller */
.compact-select {
  width: 170px;
  font-size: 0.85rem; /* smaller font */
}

/* make multiselect tags look slimmer */
.compact-select .multiselect__tags {
  min-height: 28px;
  padding: 2px 6px;
  z-index: 1;
}

/* tighten dropdown menu spacing */
.compact-select .multiselect__option {
  padding: 4px 8px;
  font-size: 0.85rem;
}

/* compact the button to match size */
.compact-btn {
  font-size: 0.85rem;
  padding: 4px 10px;
}
</style>
