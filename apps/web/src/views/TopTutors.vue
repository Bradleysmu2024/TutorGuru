<template>
  <div class="top-tutors">
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="fw-bold mb-0">Top Tutors</h2>
        <p class="text-muted mb-0">Sorted by rating</p>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="tutors.length === 0" class="text-center py-5 text-muted">
        No tutors found.
      </div>

      <div v-else class="row g-4">
        <div v-for="t in tutors" :key="t.id" class="col-md-6 col-lg-4">
          <div class="card shadow-sm h-100">
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
import { ref, onMounted } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'

const tutors = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
  const snap = await getDocs(collection(db, 'users'))
  const items = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }))
  // filter to only tutors
  const tutorsOnly = items.filter(i => i.role === 'tutor')
    // sort by rating desc (missing rating => 0)
  tutorsOnly.sort((a,b) => (b.rating ?? 0) - (a.rating ?? 0))
  tutors.value = tutorsOnly
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
