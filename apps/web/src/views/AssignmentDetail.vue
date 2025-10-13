<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { dummyParentAssignments, dummyTutorProfiles } from '../data/dummyData'
import { getAssignmentById } from '../services/firebase'
// import { getTutorApplications, selectTutor } from '../services/firebase'

const route = useRoute()
const router = useRouter()
const assignment = ref(null)
const loading = ref(true)
const selectedTutorId = ref(null)

const loadAssignment = async () => {
  loading.value = true
  try {
    const assignmentId = route.params.id
    // Try Firestore first
    const remote = await getAssignmentById(assignmentId)
    if (remote) {
      assignment.value = remote
    } else {
      // fallback to local dummy data for development
      assignment.value = dummyParentAssignments.find(a => a.id === assignmentId) || null
    }

    // Load tutor profiles for applicants (if present)
    if (assignment.value && assignment.value.applicants) {
      assignment.value.applicants = (assignment.value.applicants || []).map(app => {
        // If applicant has an id, try enrich from dummy tutor profiles (development only)
        const profile = dummyTutorProfiles.find(t => t.id === app.id)
        return { ...app, ...profile }
      })
    }
    
    loading.value = false
  } catch (error) {
    console.error('Error loading assignment:', error)
    loading.value = false
  }
}

const getStatusBadgeClass = (status) => {
  const classes = {
    open: 'bg-success',
    pending: 'bg-warning text-dark',
    closed: 'bg-secondary'
  }
  return classes[status] || 'bg-secondary'
}

const downloadFile = (file) => {
  // TODO: Implement actual file download
  console.log('Downloading file:', file.name)
  alert(`Downloading ${file.name}...`)
}

const downloadAllFiles = () => {
  // TODO: Implement zip download
  console.log('Downloading all files as zip')
  alert('Downloading all files as ZIP...')
}

const viewTutorProfile = (tutorId) => {
  // TODO: Navigate to tutor profile view
  console.log('Viewing tutor profile:', tutorId)
}

const selectTutorForAssignment = async (tutorId) => {
  if (!confirm('Are you sure you want to select this tutor? This action cannot be undone.')) {
    return
  }
  
  try {
    // TODO: Replace with Firebase call
    // await selectTutor(assignment.value.id, tutorId)
    
    console.log('Selecting tutor:', tutorId)
    alert('Tutor selected successfully!')
    router.push('/parent-dashboard')
  } catch (error) {
    console.error('Error selecting tutor:', error)
    alert('Failed to select tutor. Please try again.')
  }
}

const formatDate = (date) => {
  if (!date) return 'Unknown date'

  // Firestore Timestamp objects may have toDate() or seconds property
  try {
    let d = date
    if (typeof d.toDate === 'function') {
      d = d.toDate()
    } else if (d && typeof d.seconds === 'number') {
      d = new Date(d.seconds * 1000)
    } else {
      d = new Date(d)
    }

    if (isNaN(d.getTime())) return 'Unknown date'

    return d.toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (e) {
    return 'Unknown date'
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const goBack = () => {
  router.push('/parent-dashboard')
}

onMounted(async () => {
  await loadAssignment()
})
</script>

<template>
  <div class="assignment-detail">
    <div class="container py-4">
      <button class="btn btn-outline-secondary mb-4" @click="goBack">
        <i class="bi bi-arrow-left me-2"></i>
        Back to Dashboard
      </button>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else-if="!assignment" class="text-center py-5">
        <i class="bi bi-exclamation-circle fs-1 text-muted mb-3"></i>
        <h5 class="text-muted">Assignment not found</h5>
      </div>

      <div v-else>
        <div class="row g-4">
          <div class="col-lg-8">
            <div class="card shadow-sm mb-4">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <h2 class="fw-bold mb-0">{{ assignment.title }}</h2>
                  <span class="badge" :class="getStatusBadgeClass(assignment.status)">
                    {{ (assignment.status || 'unknown').toUpperCase() }}
                  </span>
                </div>

                <div class="assignment-meta mb-4">
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

                <div class="mb-4">
                  <h5 class="fw-semibold mb-2">Description</h5>
                  <p class="text-muted">{{ assignment.description }}</p>
                </div>

                <div class="mb-4">
                  <h5 class="fw-semibold mb-2">Requirements</h5>
                  <ul class="text-muted">
                    <li v-for="(req, index) in (assignment.requirements || [])" :key="index">
                      {{ req }}
                    </li>
                  </ul>
                </div>

                <div class="row g-3 mb-4">
                  <div class="col-md-4">
                    <div class="detail-box">
                      <i class="bi bi-calendar-week text-primary me-2"></i>
                      <div>
                        <small class="text-muted d-block">Sessions per Week</small>
                        <strong>{{ assignment.sessionsPerWeek }}x</strong>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="detail-box">
                      <i class="bi bi-clock text-warning me-2"></i>
                      <div>
                        <small class="text-muted d-block">Duration</small>
                        <strong>{{ assignment.duration }}</strong>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="detail-box">
                      <i class="bi bi-person text-info me-2"></i>
                      <div>
                        <small class="text-muted d-block">Student Grade</small>
                        <strong>{{ assignment.studentGrade }}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-if="(assignment.files || []).length > 0" class="mb-4">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="fw-semibold mb-0">
                      <i class="bi bi-paperclip me-2"></i>
                      Assignment Materials
                    </h5>
                    <button class="btn btn-sm btn-outline-primary" @click="downloadAllFiles">
                      <i class="bi bi-download me-2"></i>
                      Download All (ZIP)
                    </button>
                  </div>
                  <div class="list-group">
                    <div 
                      v-for="(file, index) in (assignment.files || [])" 
                      :key="index"
                      class="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div class="d-flex align-items-center">
                        <i class="bi bi-file-earmark-pdf text-danger me-3 fs-4"></i>
                        <div>
                          <div class="fw-semibold">{{ file.name }}</div>
                          <small class="text-muted">{{ formatFileSize(file.size) }}</small>
                        </div>
                      </div>
                      <button class="btn btn-sm btn-outline-primary" @click="downloadFile(file)">
                        <i class="bi bi-download"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="assignment.status === 'pending' && (assignment.applicants || []).length > 0" class="card shadow-sm">
              <div class="card-body">
                <h5 class="fw-semibold mb-4">
                  <i class="bi bi-people me-2"></i>
                  Tutor Applications ({{ (assignment.applicants || []).length }})
                </h5>

                <div 
                  v-for="applicant in (assignment.applicants || [])" 
                  :key="applicant.id"
                  class="applicant-card mb-3"
                >
                  <div class="row align-items-center">
                    <div class="col-md-2 text-center">
                      <img 
                        :src="applicant.avatar" 
                        alt="Tutor" 
                        class="rounded-circle img-fluid mb-2"
                        style="width: 80px; height: 80px; object-fit: cover;"
                      >
                      <div class="rating">
                        <small class="text-warning">★ {{ applicant.rating }}</small>
                      </div>
                    </div>
                    <div class="col-md-7">
                      <h6 class="fw-bold mb-1">{{ applicant.name }}</h6>
                      <p class="text-muted small mb-2">{{ applicant.bio }}</p>
                      <div class="mb-2">
                        <span class="badge bg-light text-dark me-1" v-for="subject in applicant.subjects" :key="subject">
                          {{ subject }}
                        </span>
                      </div>
                      <div class="mb-2">
                        <small class="text-muted">
                          <i class="bi bi-briefcase me-1"></i>
                          {{ applicant.experience }} years experience
                        </small>
                        <small class="text-muted ms-3">
                          <i class="bi bi-people me-1"></i>
                          {{ applicant.totalStudents }} students taught
                        </small>
                      </div>
                      <div class="mb-2">
                        <strong class="text-success">{{ applicant.rate }}</strong>
                      </div>
                      <details class="mt-2">
                        <summary class="text-primary" style="cursor: pointer;">View Cover Letter</summary>
                        <p class="text-muted small mt-2 ps-3">{{ applicant.coverLetter }}</p>
                      </details>
                    </div>
                    <div class="col-md-3 text-md-end mt-3 mt-md-0">
                      <button 
                        class="btn btn-sm btn-outline-primary mb-2 w-100"
                        @click="viewTutorProfile(applicant.id)"
                      >
                        <i class="bi bi-person me-1"></i>
                        View Profile
                      </button>
                      <button 
                        class="btn btn-sm btn-success w-100"
                        @click="selectTutorForAssignment(applicant.id)"
                      >
                        <i class="bi bi-check-circle me-1"></i>
                        Select Tutor
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="assignment.status === 'open'" class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              This assignment is open and waiting for tutor applications.
            </div>

            <div v-else-if="assignment.status === 'closed'" class="alert alert-success">
              <i class="bi bi-check-circle me-2"></i>
              This assignment has been closed. Tutor selected: <strong>{{ assignment.selectedTutor ? assignment.selectedTutor.name : 'Unknown' }}</strong>
            </div>
          </div>

          <div class="col-lg-4">
            <div class="card shadow-sm sticky-top" style="top: 90px;">
              <div class="card-body">
                <h6 class="fw-semibold mb-3">Assignment Info</h6>
                <div class="info-item mb-3">
                  <small class="text-muted d-block">Posted On</small>
                  <strong>{{ formatDate(assignment.createdAt) }}</strong>
                </div>
                <div class="info-item mb-3">
                  <small class="text-muted d-block">Status</small>
                  <span class="badge" :class="getStatusBadgeClass(assignment.status)">
                    {{ (assignment.status || 'unknown').toUpperCase() }}
                  </span>
                </div>
                <div v-if="assignment.status === 'pending'" class="info-item mb-3">
                  <small class="text-muted d-block">Applications Received</small>
                  <strong>{{ (assignment.applicants || []).length }}</strong>
                </div>
                <hr>
                <div class="d-grid gap-2">
                  <button class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-pencil me-2"></i>
                    Edit Assignment
                  </button>
                  <button class="btn btn-outline-danger btn-sm">
                    <i class="bi bi-trash me-2"></i>
                    Delete Assignment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border: none;
  border-radius: 0.75rem;
}

.assignment-meta .badge {
  font-weight: 500;
  padding: 0.4rem 0.6rem;
}

.detail-box {
  display: flex;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.5rem;
}

.detail-box i {
  font-size: 1.5rem;
}

.applicant-card {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
}

.applicant-card:hover {
  background-color: #e9ecef;
  transform: translateY(-2px);
}

.info-item {
  padding-bottom: 0.5rem;
}

@media (max-width: 991px) {
  .sticky-top {
    position: relative !important;
    top: 0 !important;
    margin-top: 1rem;
  }
}
</style>
