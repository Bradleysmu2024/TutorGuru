<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { dummyParentAssignments } from '../data/dummyData'
// import { getParentAssignments } from '../services/firebase'

const router = useRouter()
const loading = ref(false)
const assignments = ref([])
const filterStatus = ref('all')

const loadAssignments = async () => {
  loading.value = true
  try {
    // TODO: Replace with Firebase call
    // const parentId = 'currentParentId'
    // assignments.value = await getParentAssignments(parentId)
    
    setTimeout(() => {
      assignments.value = dummyParentAssignments
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('Error loading assignments:', error)
    loading.value = false
  }
}

onMounted(async () => {
  await loadAssignments()
})

const filteredAssignments = computed(() => {
  if (filterStatus.value === 'all') return assignments.value
  return assignments.value.filter(a => a.status === filterStatus.value)
})

const getStatusBadgeClass = (status) => {
  const classes = {
    open: 'bg-success',
    pending: 'bg-warning',
    closed: 'bg-secondary'
  }
  return classes[status] || 'bg-secondary'
}

const getStatusIcon = (status) => {
  const icons = {
    open: 'bi-circle',
    pending: 'bi-clock-history',
    closed: 'bi-check-circle'
  }
  return icons[status] || 'bi-circle'
}

const viewAssignment = (assignmentId) => {
  router.push(`/assignment/${assignmentId}`)
}

const createNewAssignment = () => {
  router.push('/post-assignment')
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-SG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="parent-dashboard">
    <div class="container py-4">
      <div class="dashboard-header mb-4">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h1 class="fw-bold mb-2">
              <i class="bi bi-house-door me-2"></i>
              Parent Dashboard
            </h1>
            <p class="text-muted">Manage your assignment postings and tutor applications</p>
          </div>
          <button class="btn btn-primary" @click="createNewAssignment">
            <i class="bi bi-plus-circle me-2"></i>
            Post New Assignment
          </button>
        </div>
      </div>

      <div class="stats-row row g-3 mb-4">
        <div class="col-md-4">
          <div class="stat-card card shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Total Postings</p>
                  <h3 class="fw-bold mb-0">{{ assignments.length }}</h3>
                </div>
                <i class="bi bi-file-text fs-1 text-primary"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card card shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Pending Review</p>
                  <h3 class="fw-bold mb-0">{{ assignments.filter(a => a.status === 'pending').length }}</h3>
                </div>
                <i class="bi bi-clock-history fs-1 text-warning"></i>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stat-card card shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <p class="text-muted mb-1">Active Tutors</p>
                  <h3 class="fw-bold mb-0">{{ assignments.filter(a => a.status === 'closed').length }}</h3>
                </div>
                <i class="bi bi-person-check fs-1 text-success"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="filter-section mb-4">
        <div class="btn-group" role="group">
          <button 
            type="button" 
            class="btn btn-outline-primary"
            :class="{ active: filterStatus === 'all' }"
            @click="filterStatus = 'all'"
          >
            All
          </button>
          <button 
            type="button" 
            class="btn btn-outline-success"
            :class="{ active: filterStatus === 'open' }"
            @click="filterStatus = 'open'"
          >
            Open
          </button>
          <button 
            type="button" 
            class="btn btn-outline-warning"
            :class="{ active: filterStatus === 'pending' }"
            @click="filterStatus = 'pending'"
          >
            Pending
          </button>
          <button 
            type="button" 
            class="btn btn-outline-secondary"
            :class="{ active: filterStatus === 'closed' }"
            @click="filterStatus = 'closed'"
          >
            Closed
          </button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="text-muted mt-3">Loading assignments...</p>
      </div>

      <div v-else-if="filteredAssignments.length === 0" class="text-center py-5">
        <i class="bi bi-inbox fs-1 text-muted mb-3"></i>
        <h5 class="text-muted">No assignments found</h5>
        <p class="text-muted">Create your first assignment posting</p>
        <button class="btn btn-primary mt-3" @click="createNewAssignment">
          <i class="bi bi-plus-circle me-2"></i>
          Post Assignment
        </button>
      </div>

      <div v-else class="assignments-list">
        <div 
          v-for="assignment in filteredAssignments" 
          :key="assignment.id"
          class="assignment-card card shadow-sm mb-3"
          @click="viewAssignment(assignment.id)"
        >
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-md-8">
                <div class="d-flex align-items-start mb-2">
                  <h5 class="card-title mb-0 me-3">{{ assignment.title }}</h5>
                  <span class="badge" :class="getStatusBadgeClass(assignment.status)">
                    <i :class="getStatusIcon(assignment.status)" class="me-1"></i>
                    {{ assignment.status.toUpperCase() }}
                  </span>
                </div>
                <p class="text-muted mb-2">{{ assignment.description }}</p>
                <div class="assignment-meta">
                  <span class="badge bg-primary me-2">
                    <i class="bi bi-book me-1"></i>
                    {{ assignment.subject }}
                  </span>
                  <span class="badge bg-info me-2">
                    <i class="bi bi-mortarboard me-1"></i>
                    {{ assignment.level }}
                  </span>
                  <span class="badge bg-secondary me-2">
                    <i class="bi bi-geo-alt me-1"></i>
                    {{ assignment.location }}
                  </span>
                  <span class="badge bg-success">
                    <i class="bi bi-cash me-1"></i>
                    {{ assignment.rate }}
                  </span>
                </div>
              </div>
              <div class="col-md-4 text-md-end mt-3 mt-md-0">
                <div class="mb-2">
                  <small class="text-muted">
                    <i class="bi bi-calendar3 me-1"></i>
                    Posted {{ formatDate(assignment.createdAt) }}
                  </small>
                </div>
                <div v-if="assignment.status === 'pending'" class="mb-2">
                  <span class="badge bg-warning text-dark">
                    <i class="bi bi-people me-1"></i>
                    {{ assignment.applicants.length }} Applicant{{ assignment.applicants.length !== 1 ? 's' : '' }}
                  </span>
                </div>
                <div v-if="assignment.files && assignment.files.length > 0" class="mb-2">
                  <small class="text-muted">
                    <i class="bi bi-paperclip me-1"></i>
                    {{ assignment.files.length }} file{{ assignment.files.length !== 1 ? 's' : '' }}
                  </small>
                </div>
                <button class="btn btn-sm btn-outline-primary">
                  View Details
                  <i class="bi bi-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-header {
  padding: 1rem 0;
}

.stat-card {
  border: none;
  border-radius: 0.75rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.assignment-card {
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.assignment-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

.assignment-meta .badge {
  font-weight: 500;
  padding: 0.4rem 0.6rem;
}

.filter-section .btn-group .btn {
  min-width: 100px;
}

@media (max-width: 768px) {
  .dashboard-header h1 {
    font-size: 1.5rem;
  }
  
  .dashboard-header .btn {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
  }
}
</style>
