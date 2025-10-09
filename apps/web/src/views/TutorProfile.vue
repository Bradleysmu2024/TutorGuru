<template>
  <div class="tutor-profile">
    <div class="container py-4">
      <div class="profile-header mb-4">
        <h1 class="fw-bold mb-2">
          <i class="bi bi-person-circle me-2"></i>
          Tutor Profile
        </h1>
        <p class="text-muted">Manage your profile and credentials</p>
      </div>
      
      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card shadow-sm">
            <div class="card-body text-center">
              <div class="profile-avatar mb-3">
                <img 
                  :src="profile.avatar || '/placeholder.svg?height=150&width=150'" 
                  alt="Profile" 
                  class="rounded-circle img-fluid"
                  style="width: 150px; height: 150px; object-fit: cover;"
                >
              </div>
              <h4 class="fw-bold mb-1">{{ profile.name }}</h4>
              <p class="text-muted mb-3">{{ profile.email }}</p>
              <span class="badge bg-success mb-3">
                <i class="bi bi-check-circle me-1"></i>
                Verified Tutor
              </span>
              <div class="d-grid">
                <button class="btn btn-outline-primary btn-sm">
                  <i class="bi bi-camera me-2"></i>
                  Change Photo
                </button>
              </div>
            </div>
          </div>
          
          <div class="card shadow-sm mt-4">
            <div class="card-body">
              <h6 class="fw-semibold mb-3">Quick Stats</h6>
              <div class="stat-item d-flex justify-content-between mb-2">
                <span class="text-muted">Applications Sent</span>
                <span class="fw-semibold">12</span>
              </div>
              <div class="stat-item d-flex justify-content-between mb-2">
                <span class="text-muted">Active Students</span>
                <span class="fw-semibold">5</span>
              </div>
              <div class="stat-item d-flex justify-content-between">
                <span class="text-muted">Rating</span>
                <span class="fw-semibold">4.8 ⭐</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-8">
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title mb-4">
                <i class="bi bi-person-badge me-2"></i>
                Personal Information
              </h5>
              <form @submit.prevent="saveProfile">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Full Name</label>
                    <input 
                      v-model="profile.name"
                      type="text" 
                      class="form-control"
                      required
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Email</label>
                    <input 
                      v-model="profile.email"
                      type="email" 
                      class="form-control"
                      required
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Phone</label>
                    <input 
                      v-model="profile.phone"
                      type="tel" 
                      class="form-control"
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Location</label>
                    <input 
                      v-model="profile.location"
                      type="text" 
                      class="form-control"
                    >
                  </div>
                  <div class="col-12">
                    <label class="form-label">Bio</label>
                    <textarea 
                      v-model="profile.bio"
                      class="form-control" 
                      rows="3"
                      placeholder="Tell students about yourself..."
                    ></textarea>
                  </div>
                </div>
                <div class="mt-3">
                  <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save me-2"></i>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div class="card shadow-sm mb-4">
            <div class="card-body">
              <h5 class="card-title mb-4">
                <i class="bi bi-mortarboard me-2"></i>
                Teaching Expertise
              </h5>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Subjects</label>
                  <select v-model="profile.subjects" class="form-select" multiple size="4">
                    <option value="Mathematics">Mathematics</option>
                    <option value="English">English</option>
                    <option value="Science">Science</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                  </select>
                  <small class="text-muted">Hold Ctrl/Cmd to select multiple</small>
                </div>
                <div class="col-md-6">
                  <label class="form-label">Levels</label>
                  <select v-model="profile.levels" class="form-select" multiple size="4">
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Junior College">Junior College</option>
                    <option value="University">University</option>
                  </select>
                  <small class="text-muted">Hold Ctrl/Cmd to select multiple</small>
                </div>
                <div class="col-12">
                  <label class="form-label">Years of Experience</label>
                  <input 
                    v-model="profile.experience"
                    type="number" 
                    class="form-control"
                    min="0"
                  >
                </div>
              </div>
            </div>
          </div>
          
          <div class="card shadow-sm">
            <div class="card-body">
              <h5 class="card-title mb-4">
                <i class="bi bi-file-earmark-text me-2"></i>
                Documents & Credentials
              </h5>
              
              <FileUpload 
                ref="fileUploadRef"
                title="Upload Credentials"
                description="Upload your certificates, degrees, or other credentials (PDF, JPG, PNG)"
                accept=".pdf,.jpg,.jpeg,.png"
                :multiple="true"
                :max-size="5242880"
                @files-selected="handleFilesSelected"
                @upload-complete="handleUploadComplete"
              />
              
              <div v-if="uploadedDocuments.length > 0" class="mt-4">
                <h6 class="small fw-semibold mb-3">Your Documents:</h6>
                <div class="list-group">
                  <div 
                    v-for="(doc, index) in uploadedDocuments" 
                    :key="index"
                    class="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div class="d-flex align-items-center">
                      <i class="bi bi-file-earmark-check text-success me-2 fs-5"></i>
                      <div>
                        <div class="fw-semibold">{{ doc.name }}</div>
                        <small class="text-muted">Uploaded {{ doc.uploadDate }}</small>
                      </div>
                    </div>
                    <div>
                      <button class="btn btn-sm btn-outline-primary me-2">
                        <i class="bi bi-eye"></i>
                      </button>
                      <button class="btn btn-sm btn-outline-danger">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mt-3">
                <button 
                  class="btn btn-primary"
                  @click="uploadDocuments"
                  :disabled="selectedFiles.length === 0"
                >
                  <i class="bi bi-cloud-upload me-2"></i>
                  Upload Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import FileUpload from '../components/FileUpload.vue'
// import { uploadFile } from '../services/firebase'

const fileUploadRef = ref(null)
const selectedFiles = ref([])

const profile = ref({
  name: 'Dzaki',
  email: 'dzaki@tutorconnect.com',
  phone: '+65 9123 4567',
  location: 'Singapore',
  bio: 'Passionate educator with 5 years of experience in teaching Mathematics and Science.',
  subjects: ['Mathematics', 'Science'],
  levels: ['Secondary', 'Junior College'],
  experience: 5,
  avatar: ''
})

const uploadedDocuments = ref([
  {
    name: 'Teaching Certificate.pdf',
    uploadDate: '2024-01-10',
    url: '#'
  },
  {
    name: 'Degree Certificate.pdf',
    uploadDate: '2024-01-10',
    url: '#'
  }
])

const saveProfile = () => {
  // TODO: Save to Firebase
  console.log('Saving profile:', profile.value)
  alert('Profile saved successfully!')
}

const handleFilesSelected = (files) => {
  selectedFiles.value = files
}

const uploadDocuments = async () => {
  if (selectedFiles.value.length === 0) return
  
  // TODO: Upload to Firebase Storage
  // for (const file of selectedFiles.value) {
  //   const result = await uploadFile(file, `credentials/${profile.value.email}/${file.name}`)
  //   if (result.success) {
  //     uploadedDocuments.value.push({
  //       name: file.name,
  //       uploadDate: new Date().toISOString().split('T')[0],
  //       url: result.url
  //     })
  //   }
  // }
  
  // Simulate upload
  fileUploadRef.value.simulateUpload()
}

const handleUploadComplete = (files) => {
  files.forEach(file => {
    uploadedDocuments.value.push({
      name: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      url: '#'
    })
  })
  selectedFiles.value = []
  alert('Documents uploaded successfully!')
}
</script>

<style scoped>
.profile-header {
  padding: 1rem 0;
}

.card {
  border: none;
  border-radius: 0.75rem;
}

.profile-avatar {
  margin: 0 auto;
}

.stat-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item:last-child {
  border-bottom: none;
}

@media (max-width: 991px) {
  .col-lg-4 {
    margin-bottom: 2rem;
  }
}
</style>
