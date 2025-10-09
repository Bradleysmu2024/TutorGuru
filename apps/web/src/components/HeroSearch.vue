<template>
  <section class="text-center py-5 bg-white border-bottom">
    <div class="container py-5">
      <h1 class="fw-bold display-5 mb-4" style="color: var(--tg-navy)">
        You're one search away<br />from the right tutor
      </h1>

      <div class="mx-auto mb-4 position-relative" style="max-width: 600px;">
        <input
          v-model="q"
          type="text"
          class="form-control form-control-lg rounded-pill ps-4 pe-5"
          placeholder="Find tutors across 700+ subjects"
          @keyup.enter="emitSearch"
        />
        <button
          type="button"
          class="btn p-0 border-0 bg-transparent position-absolute end-0 top-50 translate-middle-y pe-4"
          aria-label="Search"
          @click="emitSearch"
        >
          <i class="bi bi-arrow-right-circle-fill fs-4 text-primary"></i>
        </button>
      </div>

      <div class="d-flex justify-content-center flex-wrap gap-3">
        <span class="badge tile rounded-pill px-3 py-2">P3 Physical Science</span>
        <span class="badge tile rounded-pill px-3 py-2">
          O-Level Chinese <span class="badge bg-dark text-white ms-1 small">POPULAR</span>
        </span>
        <span class="badge tile rounded-pill px-3 py-2">JC H2 Math</span>
        <span class="badge tile rounded-pill px-3 py-2">Primary English</span>
        <span class="badge tile rounded-pill px-3 py-2">
          Essay Writing <span class="badge bg-dark text-white ms-1 small">TRENDING</span>
        </span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
const q = ref('')
const emit = defineEmits(['search'])
const emitSearch = () => emit('search', q.value.trim())
</script>
