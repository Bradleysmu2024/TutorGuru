<template>
  <div class="tutor-dashboard">
    <div class="container py-4">
      <div class="dashboard-header mb-4">
        <h1 class="fw-bold mb-2">
          <i class="bi bi-grid me-2"></i>
          Tutor Dashboard
        </h1>
        <p class="text-muted">Browse and apply to tutoring opportunities</p>
      </div>
      
      <SearchFilter 
        :filters="filters"
        :result-count="filteredJobs.length"
        @update:filters="updateFilters"
      />
      
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted mt-3">Loading opportunities...</p>
      </div>
      
      <div v-else-if="filteredJobs.length === 0" class="text-center py-5">
        <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
        <h5 class="text-muted">No opportunities found</h5>
        <p class="text-muted">Try adjusting your filters</p>
      </div>
      
      <div v-else class="row g-4">
        <div 
          v-for="job in filteredJobs" 
          :key="job.id"
          class="col-md-6 col-lg-4"
        >
          <JobCard :job="job" @apply="handleApply" />
        </div>
      </div>
    </div>
    
     Application Modal 
    <div 
      class="modal fade" 
      id="applicationModal" 
      tabindex="-1" 
      aria-labelledby="applicationModalLabel" 
      aria-hidden="true"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="applicationModalLabel">
              <i class="bi bi-send me-2"></i>
              Apply for Position
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedJob">
              <h6 class="fw-semibold mb-3">{{ selectedJob.title }}</h6>
              <form @submit.prevent="submitApplication">
                <div class="mb-3">
                  <label class="form-label">Cover Letter</label>
                  <textarea 
                    v-model="application.coverLetter"
                    class="form-control" 
                    rows="4"
                    placeholder="Tell the student why you're a great fit..."
                    required
                  ></textarea>
                </div>
                <div class="mb-3">
                  <label class="form-label">Expected Rate (per hour)</label>
                  <input 
                    v-model="application.rate"
                    type="text" 
                    class="form-control"
                    placeholder="e.g., $40"
                    required
                  >
                </div>
                <div class="mb-3">
                  <label class="form-label">Available Start Date</label>
                  <input 
                    v-model="application.startDate"
                    type="date" 
                    class="form-control"
                    required
                  >
                </div>
              </form>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" @click="submitApplication">
              <i class="bi bi-send me-2"></i>
              Submit Application
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Modal } from 'bootstrap'
import SearchFilter from '../components/SearchFilter.vue'
import JobCard from '../components/JobCard.vue'
import { dummyJobPostings } from '../data/dummyData'
// import { getJobPostings, applyToJob } from '../services/firebase'

const loading = ref(false)
const jobs = ref([])
const filters = ref({
  subject: '',
  level: '',
  location: '',
  search: ''
})

const selectedJob = ref(null)
const application = ref({
  coverLetter: '',
  rate: '',
  startDate: ''
})

let applicationModal = null

onMounted(async () => {
  // Initialize Bootstrap modal
  const modalElement = document.getElementById('applicationModal')
  applicationModal = new Modal(modalElement)
  
  // Load job postings
  await loadJobs()
})

const loadJobs = async () => {
  loading.value = true
  try {
    // TODO: Replace with Firebase call
    // jobs.value = await getJobPostings()
    
    // Using dummy data for now
    setTimeout(() => {
      jobs.value = dummyJobPostings
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('Error loading jobs:', error)
    loading.value = false
  }
}

const filteredJobs = computed(() => {
  return jobs.value.filter(job => {
    const matchesSubject = !filters.value.subject || job.subject === filters.value.subject
    const matchesLevel = !filters.value.level || job.level === filters.value.level
    const matchesLocation = !filters.value.location || job.location === filters.value.location
    const matchesSearch = !filters.value.search || 
      job.title.toLowerCase().includes(filters.value.search.toLowerCase()) ||
      job.description.toLowerCase().includes(filters.value.search.toLowerCase())
    
    return matchesSubject && matchesLevel && matchesLocation && matchesSearch
  })
})

const updateFilters = (newFilters) => {
  filters.value = { ...newFilters }
}

const handleApply = (jobId) => {
  selectedJob.value = jobs.value.find(job => job.id === jobId)
  application.value = {
    coverLetter: '',
    rate: '',
    startDate: ''
  }
  applicationModal.show()
}

const submitApplication = async () => {
  try {
    // TODO: Replace with Firebase call
    // const result = await applyToJob(selectedJob.value.id, 'currentUserId', application.value)
    
    console.log('Submitting application:', {
      jobId: selectedJob.value.id,
      ...application.value
    })
    
    // Simulate API call
    setTimeout(() => {
      alert('Application submitted successfully!')
      applicationModal.hide()
    }, 500)
  } catch (error) {
    console.error('Error submitting application:', error)
    alert('Failed to submit application. Please try again.')
  }
}
</script>

<style scoped>
.dashboard-header {
  padding: 1rem 0;
}

@media (max-width: 768px) {
  .dashboard-header h1 {
    font-size: 1.75rem;
  }
}
</style>
