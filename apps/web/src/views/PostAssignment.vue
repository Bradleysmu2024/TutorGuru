<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FileUpload from '../components/FileUpload.vue'
import { getSubjects, getLevels, getLocations, createAssignment } from '../services/firebase'
import { getCurrentUser } from '../router/routes'
// import { createAssignment, uploadAssignmentFiles } from '../services/firebase'

const router = useRouter()
const fileUploadRef = ref(null)
const selectedFiles = ref([])
const submitting = ref(false)

// Firebase data
const subjects = ref([])
const levels = ref([])
const locations = ref([])

const formData = ref({
  title: '',
  subject: '',
  level: '',
  studentGrade: '',
  description: '',
  requirements: '',
  sessionsPerWeek: 2,
  duration: '',
  rate: '',
  location: '',
  postalCode: '',
})

// Load data from Firebase on component mount
onMounted(async () => {
  try {
    subjects.value = await getSubjects()
    levels.value = await getLevels()
    locations.value = await getLocations()
  } catch (error) {
    console.error('Error loading form data:', error)
  }
})

const handleFilesSelected = (files) => {
  selectedFiles.value = files
}

const submitAssignment = async () => {
  if (!validateForm()) return
  
  submitting.value = true
  
  try {
    const user = await getCurrentUser()
    if (!user || !user.uid) {
      alert('You must be logged in as a parent to post an assignment')
      submitting.value = false
      return
    }

    const assignmentData = {
      ...formData.value,
      requirements: formData.value.requirements ? formData.value.requirements.split('\n').filter(r => r.trim()) : [],
      files: []
    }

    const result = await createAssignment(user.uid, assignmentData)
    if (!result.success) {
      throw new Error(result.error || 'Failed to create assignment')
    }

    // TODO: handle file uploads and attach storage URLs to the assignment doc

  submitting.value = false
  alert('Assignment posted successfully!')
  // Navigate with a refresh query param so the dashboard reloads assignments
  router.push({ path: '/parent-dashboard', query: { refresh: Date.now().toString() } })
  } catch (error) {
    console.error('Error posting assignment:', error)
    alert('Failed to post assignment. Please try again.')
    submitting.value = false
  }
}

const validateForm = () => {
  if (!formData.value.title || !formData.value.subject || !formData.value.level) {
    alert('Please fill in all required fields')
    return false
  }
  return true
}

const cancel = () => {
  router.push('/parent-dashboard')
}
</script>

<template>
  <div class="post-assignment">
    <div class="container py-4">
      <div class="page-header mb-4">
        <h1 class="fw-bold mb-2">
          <i class="bi bi-plus-circle me-2"></i>
          Post New Assignment
        </h1>
        <p class="text-muted">Create a new tutoring assignment posting</p>
      </div>

      <div class="row">
        <div class="col-lg-8">
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title mb-4">
                <i class="bi bi-info-circle me-2"></i>
                Assignment Details
              </h5>
              
              <form @submit.prevent="submitAssignment">
                <div class="mb-3">
                  <label class="form-label">Assignment Title <span class="text-danger">*</span></label>
                  <input 
                    v-model="formData.title"
                    type="text" 
                    class="form-control"
                    placeholder="e.g., Help with Algebra Homework"
                    required
                  >
                </div>

                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label">Subject <span class="text-danger">*</span></label>
                    <select v-model="formData.subject" class="form-select" required>
                      <option value="">Select subject</option>
                      <option v-for="subject in subjects.slice(1)" :key="subject" :value="subject">
                        {{ subject }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Education Level <span class="text-danger">*</span></label>
                    <select v-model="formData.level" class="form-select" required>
                      <option value="">Select level</option>
                      <option v-for="level in levels.slice(1)" :key="level" :value="level">
                        {{ level }}
                      </option>
                    </select>
                  </div>
                </div>

                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label">Student Grade</label>
                    <input 
                      v-model="formData.studentGrade"
                      type="text" 
                      class="form-control"
                      placeholder="e.g., Grade 9, JC1"
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Location</label>
                    <select v-model="formData.location" class="form-select">
                      <option value="">Select location</option>
                      <option v-for="location in locations.slice(1)" :key="location" :value="location">
                        {{ location }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col-12">
                  <label class="form-label">Key in your postal code</label>
                    <input 
                      v-model="formData.postalCode"
                      type="text" 
                      class="form-control"
                      placeholder="6 digit postal code"
                    >
                  
                </div>
                <div class="mb-3">
                  <label class="form-label">Description <span class="text-danger">*</span></label>
                  <textarea 
                    v-model="formData.description"
                    class="form-control" 
                    rows="4"
                    placeholder="Describe what help your child needs..."
                    required
                  ></textarea>
                </div>

                <div class="mb-3">
                  <label class="form-label">Requirements</label>
                  <textarea 
                    v-model="formData.requirements"
                    class="form-control" 
                    rows="3"
                    placeholder="Enter each requirement on a new line&#10;e.g., Patient and encouraging&#10;Experience with O-Level curriculum"
                  ></textarea>
                  <small class="text-muted">Enter each requirement on a new line</small>
                </div>

                <div class="row g-3 mb-3">
                  <div class="col-md-4">
                    <label class="form-label">Sessions per Week</label>
                    <input 
                      v-model.number="formData.sessionsPerWeek"
                      type="number" 
                      class="form-control"
                      min="1"
                      max="7"
                    >
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Duration</label>
                    <input 
                      v-model="formData.duration"
                      type="text" 
                      class="form-control"
                      placeholder="e.g., 3 months"
                    >
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Hourly Rate</label>
                    <input 
                      v-model="formData.rate"
                      type="text" 
                      class="form-control"
                      placeholder="e.g., $40-50"
                    >
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title mb-4">
                <i class="bi bi-paperclip me-2"></i>
                Assignment Materials (Optional)
              </h5>
              
              <FileUpload 
                ref="fileUploadRef"
                title="Upload Assignment Files"
                description="Upload homework sheets, textbook pages, or other relevant materials"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                :multiple="true"
                :max-size="10485760"
                @files-selected="handleFilesSelected"
              />
              
              <small class="text-muted d-block mt-2">
                <i class="bi bi-info-circle me-1"></i>
                Tutors will be able to download these files to better prepare for the assignment
              </small>
            </div>
          </div>

          <div class="d-flex gap-3">
            <button 
              type="button"
              class="btn btn-primary"
              @click="submitAssignment"
              :disabled="submitting"
            >
              <span v-if="submitting">
                <span class="spinner-border spinner-border-sm me-2"></span>
                Posting...
              </span>
              <span v-else>
                <i class="bi bi-check-circle me-2"></i>
                Post Assignment
              </span>
            </button>
            <button 
              type="button"
              class="btn btn-outline-secondary"
              @click="cancel"
              :disabled="submitting"
            >
              Cancel
            </button>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card shadow-sm sticky-top" style="top: 90px;">
            <div class="card-body">
              <h6 class="fw-semibold mb-3">
                <i class="bi bi-lightbulb me-2"></i>
                Tips for a Great Posting
              </h6>
              <ul class="small text-muted">
                <li class="mb-2">Be specific about what help your child needs</li>
                <li class="mb-2">Mention any upcoming tests or deadlines</li>
                <li class="mb-2">Include your child's current level and learning style</li>
                <li class="mb-2">Upload relevant materials to help tutors prepare</li>
                <li class="mb-2">Set a realistic budget based on the tutor's experience</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  padding: 1rem 0;
}

.card {
  border: none;
  border-radius: 0.75rem;
}

.form-label {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.text-danger {
  color: #dc3545;
}

@media (max-width: 991px) {
  .sticky-top {
    position: relative !important;
    top: 0 !important;
    margin-top: 1rem;
  }
}
</style>
