<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  loginUser,
  signInWithGoogle,
  getUserRole,
  db,
} from "../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useToast } from "../composables/useToast";
import PasswordResetModal from "../components/PasswordResetModal.vue";

// Import background image
const loginBg = new URL("../assets/images/login/loginbg.jpg", import.meta.url)
  .href;

const toast = useToast();
const router = useRouter();

const loginForm = ref({
  email: "",
  password: "",
  remember: false,
});

const loading = ref(false);

const showPassword = ref(false);

const showPasswordResetModal = ref(false);

const handleLogin = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    const response = await loginUser(
      loginForm.value.email,
      loginForm.value.password
    );

    if (!response.success) {
      toast.error(`Login failed: ${response.error}`, "Login Failed");
      loading.value = false;
      return;
    }

    const user = response.user;
    localStorage.setItem(
      "user",
      JSON.stringify({
        uid: user.uid,
        email: user.email,
      })
    );

    // route based on role
    const role = await getUserRole(user.uid);
    toast.success("Login successful!", "Welcome Back");
    if (role === "parent") {
      router.push("/parent-dashboard");
    } else {
      // default to tutor dashboard
      router.push("/dashboard");
    }
  } catch (error) {
    console.error("Login error:", error);
    toast.error("Unexpected error during login", "Login Error");
  } finally {
    loading.value = false;
  }
};

const handleGoogleLogin = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    const response = await signInWithGoogle();

    if (!response.success) {
      toast.error(
        `Google login failed: ${response.error}`,
        "Google Login Failed"
      );
      loading.value = false;
      return;
    }

    const user = response.user;
    const normalizedEmail = user.email.trim().toLowerCase();

    // query check if email exists
    const q = query(
      collection(db, "users"),
      where("email", "==", normalizedEmail)
    );
    const querySnapshot = await getDocs(q);

    // email does not exist
    if (querySnapshot.empty) {
      console.log("Google email does not exist");
      toast.warning(
        "Google email does not exist. Please register in the Sign Up page",
        "Account Not Found"
      );
      return;
    }

    localStorage.setItem(
      "user",
      JSON.stringify({
        uid: user.uid,
        email: user.email,
        token: response.token, // google token
        expiry: response.expiry, // google api token expiry
      })
    );

    // route based on role
    const role = await getUserRole(user.uid);
    console.log("Google Login successful:", user, "role=", role);
    toast.success("Google login successful!", "Welcome Back");
    if (role === "parent") {
      router.push("/parent-dashboard");
    } else {
      router.push("/dashboard");
    }
  } catch (error) {
    console.error("Google Login error:", error);
    toast.error("Unexpected error during Google login", "Login Error");
  } finally {
    loading.value = false;
  }
};

const openPasswordResetModal = () => {
  showPasswordResetModal.value = true;
};
</script>

<template>
  <div class="login-page" :style="{ backgroundImage: `url(${loginBg})` }">
    <div class="container">
      <div
        class="row justify-content-center align-items-center min-vh-100 py-5"
      >
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
                      :disabled="loading"
                    />
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
                      :disabled="loading"
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="showPassword = !showPassword"
                      :disabled="loading"
                    >
                      <i
                        :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"
                      ></i>
                    </button>
                  </div>
                </div>

                <div class="mb-3 form-check clearfix">
                  <input
                    v-model="loginForm.remember"
                    type="checkbox"
                    class="form-check-input"
                    id="rememberMe"
                    :disabled="loading"
                  />
                  <label class="form-check-label" for="rememberMe">
                    Remember me
                  </label>
                  <a
                    @click="openPasswordResetModal"
                    class="text-decoration-none float-end"
                    >Forgot password?</a
                  >
                </div>
                <div class="d-grid mb-3">
                  <button
                    type="submit"
                    class="btn btn-primary btn-lg text-light"
                    :disabled="loading"
                  >
                    <i class="bi bi-box-arrow-in-right me-2"></i>
                    <span v-if="!loading">Login</span>
                    <span v-else>
                      <span
                        class="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Logging in...
                    </span>
                  </button>
                  <button
                    type="button"
                    class="google-btn btn btn-lg"
                    @click="handleGoogleLogin"
                    :disabled="loading"
                  >
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
                    <router-link
                      to="/register"
                      class="text-primary text-decoration-none fw-semibold"
                    >
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
  <!-- Email Change Modal Component -->
  <PasswordResetModal v-model:show="showPasswordResetModal" />
</template>

<style scoped>
.card {
  background-color: rgba(240, 248, 255, 0.68);
}

.login-page {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
  position: relative;
}

.login-page::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.186); /* white overlay */
  z-index: 0;
}

.login-page .container {
  position: relative;
  z-index: 1;
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
