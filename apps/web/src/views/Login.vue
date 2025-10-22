<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginUser, signInWithGoogle, getUserRole, db } from '../services/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

const router = useRouter()

const loginForm = ref({
  email: '',
  password: '',
  remember: false
})

const showPassword = ref(false)

const handleLogin = async () => {
  try {
    const response = await loginUser(loginForm.value.email, loginForm.value.password)

    if (!response.success) {
      alert(`Login failed: ${response.error}`)
      return
    }

    const user = response.user
    localStorage.setItem("user", JSON.stringify({
      uid: user.uid,
      email: user.email
    }))

    // route based on role
    const role = await getUserRole(user.uid)
    console.log('Login successful:', user, 'role=', role)
    alert('Login successful!')
    if (role === 'parent') {
      router.push('/parent-dashboard')
    } else {
      // default to tutor dashboard
      router.push('/dashboard')
    }

  } catch (error) {
    console.error('Login error:', error)
    alert('Unexpected error during login.')
  }
}

const handleGoogleLogin = async () => {
  try {
    const response = await signInWithGoogle()

    if (!response.success) {
      alert(`Google login failed: ${response.error}`)
      return
    }

    const user = response.user
    const normalizedEmail = user.email.trim().toLowerCase();

    // query check if email exists
    const q = query(collection(db, "users"), where("email", "==", normalizedEmail));
    const querySnapshot = await getDocs(q);

    // email does not exist
    if (querySnapshot.empty) {
      console.log("Google email does not exist");
      alert('Google email does not exist. Please register in the Sign Up page.')
      return
    }

    localStorage.setItem("user", JSON.stringify({
      uid: user.uid,
      email: user.email,
      token: response.token, // google token
      expiry: response.expiry // google api token expiry
    }))

    // route based on role
    const role = await getUserRole(user.uid)
    console.log('Google Login successful:', user, 'role=', role)
    alert('Google login successful!')
    if (role === 'parent') {
      router.push('/parent-dashboard')
    } else {
      router.push('/dashboard')
    }

  } catch (error) {
    console.error('Google Login error:', error)
    alert('Unexpected error during Google login.')
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
                  <button type="submit" class="btn btn-primary btn-lg text-light">
                    <i class="bi bi-box-arrow-in-right me-2"></i>
                    Login
                  </button>
                  <button type="button" class="google-btn btn btn-lg" @click="handleGoogleLogin">
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google logo"
                      height="20px"
                    />
                    Sign in with Google
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
