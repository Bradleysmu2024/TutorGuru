<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerUser } from '../services/firebase'
import { db } from '../services/firebase'
import { doc, setDoc } from 'firebase/firestore'

const router = useRouter()

const registerForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

const handleRegister = async () => {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    alert('Passwords do not match!')
    return
  }

  try {
    //Create user in Firebase Authentication
    const result = await registerUser(registerForm.value.email, registerForm.value.password)

    if (!result.success) {
      alert(`Registration failed: ${result.error}`)
      return
    }

    const user = result.user
    //create Firebase tutorProfile collection
    await setDoc(doc(db, "tutorProfile", user.uid), {
      username: user.uid,
      name: `${registerForm.value.firstName} ${registerForm.value.lastName}`,
      email: registerForm.value.email,
      phone: "",
      location: "",
      bio: "",
      teaching: [{ subject: "", levels: [] }],
      experience: 0,
      avatar: "",
      role: "T",
      createdAt: new Date().toISOString(),
    })

    console.log("✅ Tutor profile created in Firestore for:", user.email)

    localStorage.setItem('user', JSON.stringify({
      uid: user.uid,
      email: user.email,
      name: `${registerForm.value.firstName} ${registerForm.value.lastName}`
    }))

    alert('Registration successful! Please complete your tutor profile.')
    router.push('/Profile')  // make sure route matches your TutorProfile.vue path

  } catch (error) {
    console.error('Registration error:', error)
    alert('Unexpected error. Please try again.')
  }
}
</script>


<template>
  <div class="register-page">
    <div class="container">
      <div class="row justify-content-center align-items-center min-vh-100 py-5">
        <div class="col-md-8 col-lg-6">
          <div class="card shadow-lg border-0">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <i class="bi bi-person-plus text-primary fs-1 mb-3"></i>
                <h2 class="fw-bold mb-2">Join TutorConnect</h2>
                <p class="text-muted">Create your tutor account and start teaching</p>
              </div>

              <form @submit.prevent="handleRegister">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">First Name</label>
                    <input v-model="registerForm.firstName" type="text" class="form-control" required>
                  </div>

                  <div class="col-md-6">
                    <label class="form-label">Last Name</label>
                    <input v-model="registerForm.lastName" type="text" class="form-control" required>
                  </div>

                  <div class="col-12">
                    <label class="form-label">Email Address</label>
                    <input v-model="registerForm.email" type="email" class="form-control" required>
                  </div>

                  <div class="col-12">
                    <label class="form-label">Password</label>
                    <input v-model="registerForm.password" type="password" class="form-control" required minlength="6">
                    <small class="text-muted">Minimum 6 characters</small>
                  </div>

                  <div class="col-12">
                    <label class="form-label">Confirm Password</label>
                    <input v-model="registerForm.confirmPassword" type="password" class="form-control" required>
                  </div>

                  <div class="col-12">
                    <div class="form-check">
                      <input v-model="registerForm.agreeTerms" type="checkbox" class="form-check-input" id="agreeTerms"
                        required>
                      <label class="form-check-label" for="agreeTerms">
                        I agree to the Terms of Service and Privacy Policy
                      </label>
                    </div>
                  </div>
                </div>

                <div class="d-grid mt-4 mb-3">
                  <button type="submit" class="btn btn-primary btn-lg text-light">
                    <i class="bi bi-person-check me-2"></i>
                    Create Account
                  </button>
                </div>

                <div class="text-center">
                  <p class="text-muted mb-0">
                    Already have an account?
                    <router-link to="/login" class="text-primary text-decoration-none fw-semibold">
                      Login
                    </router-link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  min-height: 100vh;
}

.card {
  border-radius: 1rem;
}
</style>
