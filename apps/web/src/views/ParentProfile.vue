<script setup>
import { ref, onMounted } from 'vue'
import { getDoc, doc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { getCurrentUser } from '../router/routes'
import { getParentAssignments } from '../services/firebase'

const profile = ref({
  name: '',
  email: '',
  phone: '',
  location: '',
  children: []
})
const assignments = ref([])

const loadProfile = async () => {
  try {
    const user = await getCurrentUser()
    if (!user || !user.uid) return
    const snap = await getDoc(doc(db, 'parentProfile', user.uid))
    if (snap.exists()) {
      profile.value = { ...profile.value, ...snap.data() }
    } else {
      // If no profile exists, attempt to seed from users/{uid} doc if available
      const userSnap = await getDoc(doc(db, 'users', user.uid))
      if (userSnap.exists()) {
        const u = userSnap.data()
        profile.value.name = u.name || ''
        profile.value.email = u.email || ''
      }
    }
  } catch (err) {
    console.error('Error loading parent profile:', err)
  }
}

const saveProfile = async () => {
  try {
    const user = await getCurrentUser()
    if (!user || !user.uid) {
      alert('You must be logged in to save your profile')
      return
    }
    // Use setDoc to create/overwrite the parentProfile document
    await setDoc(doc(db, 'parentProfile', user.uid), profile.value)
    alert('Profile saved successfully!')
  } catch (err) {
    console.error('Error saving profile:', err)
    alert('Failed to save profile. Please try again.')
  }
}

const addChild = () => {
  profile.value.children.push({ name: '', grade: '', subjects: [] })
}

const removeChild = (index) => {
  profile.value.children.splice(index, 1)
}

onMounted(loadProfile)

// load parent assignments for quick stats
const loadAssignments = async () => {
  try {
    const user = await getCurrentUser()
    if (!user || !user.uid) return
    assignments.value = await getParentAssignments(user.uid)
  } catch (err) {
    console.error('Error loading parent assignments:', err)
  }
}

onMounted(loadAssignments)
</script>

<template>
  <div class="parent-profile">
    <div class="container py-4">
      <div class="profile-header mb-4">
        <h1 class="fw-bold mb-2">
          <i class="bi bi-person-circle me-2"></i>
          Parent Profile
        </h1>
        <p class="text-muted">Manage your profile and children's information</p>
      </div>

      <div class="row g-4">
        <div class="col-lg-4">
          <div class="card shadow-sm">
            <div class="card-body text-center">
              <div class="profile-avatar mb-3">
                <img 
                  src="../assets/images/me.png" 
                  alt="Profile" 
                  class="rounded-circle img-fluid"
                  style="width: 150px; height: 150px; object-fit: cover;"
                >
              </div>
              <h4 class="fw-bold mb-1">{{ profile.name }}</h4>
              <p class="text-muted mb-3">{{ profile.email }}</p>
              <span class="badge bg-primary mb-3">
                <i class="bi bi-shield-check me-1"></i>
                Verified Parent
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
                <span class="text-muted">Active Postings</span>
                <span class="fw-semibold">{{ assignments.length }}</span>
              </div>
              <div class="stat-item d-flex justify-content-between mb-2">
                <span class="text-muted">Active Tutors</span>
                <span class="fw-semibold">{{ /* placeholder for active tutors */ 0 }}</span>
              </div>
              <div class="stat-item d-flex justify-content-between">
                <span class="text-muted">Children</span>
                <span class="fw-semibold">{{ profile.children.length }}</span>
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

          <div class="card shadow-sm">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h5 class="fw-semibold mb-0">
                  <i class="bi bi-people me-2"></i>
                  Children Information
                </h5>
                <button class="btn btn-sm btn-outline-primary" @click="addChild">
                  <i class="bi bi-plus-circle me-2"></i>
                  Add Child
                </button>
              </div>

              <div 
                v-for="(child, index) in profile.children" 
                :key="index"
                class="child-card mb-3"
              >
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <h6 class="fw-semibold mb-0">Child {{ index + 1 }}</h6>
                  <button 
                    class="btn btn-sm btn-outline-danger"
                    @click="removeChild(index)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">Name</label>
                    <input 
                      v-model="child.name"
                      type="text" 
                      class="form-control"
                      placeholder="Child's name"
                    >
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Grade</label>
                    <input 
                      v-model="child.grade"
                      type="text" 
                      class="form-control"
                      placeholder="e.g., Grade 9"
                    >
                  </div>
                  <div class="col-12">
                    <label class="form-label">Subjects Studying</label>
                    <input 
                      v-model="child.subjects"
                      type="text" 
                      class="form-control"
                      placeholder="e.g., Mathematics, Science, English"
                    >
                    <small class="text-muted">Separate subjects with commas</small>
                  </div>
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

.child-card {
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 0.75rem;
}

@media (max-width: 991px) {
  .col-lg-4 {
    margin-bottom: 2rem;
  }
}
</style>
