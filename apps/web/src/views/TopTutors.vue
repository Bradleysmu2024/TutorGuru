<template>
  <div class="top-tutors">
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold mb-0">Top Tutors</h2>
          <p class="text-muted mb-0">Sorted by rating</p>
        </div>
        <div style="min-width: 280px; max-width: 420px; width: 40%;">
          <div class="input-group">
            <input v-model="query" type="search" class="form-control" placeholder="Search tutors by name or username" aria-label="Search tutors">
            <button v-if="query" class="btn btn-outline-secondary" type="button" @click="query = ''">Clear</button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-center py-5">
        <LoadingState :loading="loading" message="Loading tutors..." color="primary" padding="py-5" />
      </div>

      <div v-else-if="tutors.length === 0" class="text-center py-5 text-muted">
        No tutors found.
      </div>

      <div v-else class="row g-4">
        <div v-for="t in filteredTutors" :key="t.id" class="col-md-6 col-lg-4">
          <div class="card shadow-sm h-100 hover-lift hover-shadow">
            <div class="card-body d-flex flex-column">
              <div class="d-flex align-items-center mb-3">
                <img :src="t.avatar || '/src/assets/images/profileplaceholder.JPG'" class="rounded-circle me-3" width="64" height="64" />
                <div>
                  <h5 class="mb-0">{{ t.name }}</h5>
                  <small class="text-muted">{{ t.location || '' }}</small>
                </div>
                <div class="ms-auto text-end">
                  <div class="fw-semibold">{{ t.rating ?? '—' }} ⭐</div>
                </div>
              </div>
              <p class="text-muted flex-grow-1">{{ t.bio || 'No bio available' }}</p>
              <div class="mt-3 text-end">
                <router-link :to="`/tutor/${t.username || t.id}`" class="btn btn-outline-primary btn-sm">View Profile</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { listAllUsers } from '../services/firebase'
import LoadingState from '../components/LoadingState.vue'

const tutors = ref([])
const loading = ref(false)
const query = ref('')

const filteredTutors = computed(() => {
  if (!query.value) return tutors.value
  const q = query.value.trim().toLowerCase()
  return tutors.value.filter(t => {
    const name = (t.name || '').toLowerCase()
    const username = (t.username || '').toLowerCase()
    return name.includes(q) || username.includes(q)
  })
})

onMounted(async () => {
  loading.value = true
  try {
    const items = await listAllUsers('tutor')
    items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    tutors.value = items
  } catch (err) {
    console.error('Error loading tutors:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.card img { object-fit: cover; }
</style>
