<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// import { loginUser } from '../services/firebase'

const router = useRouter()

const loginForm = ref({
  email: '',
  password: '',
  remember: false
})

const showPassword = ref(false)

const handleLogin = async () => {
  try {
    console.log('Login attempt:', loginForm.value)
    alert('Login successful! (Demo mode)')
    router.push('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
    alert('Login failed. Please check your credentials.')
  }
}
</script>

<template>
  <div class="login-page">
    <div class="container">
      <div class="row justify-content-center align-items-center min-vh-100 py-5">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow-lg border-0">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <i class="bi bi-book-half text-primary fs-1 mb-3"></i>
                <h2 class="fw-bold mb-2">Welcome Back</h2>
                <p class="text-muted">Login to access your tutor dashboard</p>
              </div>
              
              <form @submit.prevent="handleLogin">
                <div class="mb-3">
                  <label class="form-label">Email Address</label>
                  <div class="input-group">
                    <span class="input-group-text">
                      <i class="bi bi-envelope"></i>
                    </span>
                    <input 
                      v-model="loginForm.email"
                      type="email" 
                      class="form-control"
                      placeholder="your@email.com"
                      required
                    >
                  </div>
                </div>
                
                <div class="mb-3">
                  <label class="form-label">Password</label>
                  <div class="input-group">
                    <span class="input-group-text">
                      <i class="bi bi-lock"></i>
                    </span>
                    <input 
                      v-model="loginForm.password"
                      :type="showPassword ? 'text' : 'password'"
                      class="form-control"
                      placeholder="Enter your password"
                      required
                    >
                    <button 
                      class="btn btn-outline-secondary" 
                      type="button"
                      @click="showPassword = !showPassword"
                    >
                      <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                </div>
                
                <div class="mb-3 form-check">
                  <input 
                    v-model="loginForm.remember"
                    type="checkbox" 
                    class="form-check-input" 
                    id="rememberMe"
                  >
                  <label class="form-check-label" for="rememberMe">
                    Remember me
                  </label>
                </div>
                
                <div class="d-grid mb-3">
                  <button type="submit" class="btn btn-primary btn-lg">
                    <i class="bi bi-box-arrow-in-right me-2"></i>
                    Login
                  </button>
                </div>
                
                <div class="text-center">
                  <p class="text-muted mb-0">
                    Don't have an account? 
                    <router-link to="/register" class="text-primary text-decoration-none fw-semibold">
                      Sign up
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
.login-page {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  min-height: 100vh;
}

.card {
  border-radius: 1rem;
}

.input-group-text {
  background-color: #f8f9fa;
  border-right: none;
}

.input-group .form-control {
  border-left: none;
}

.input-group .form-control:focus {
  border-color: #dee2e6;
  box-shadow: none;
}

.input-group:focus-within .input-group-text {
  border-color: #0d6efd;
}
</style>
