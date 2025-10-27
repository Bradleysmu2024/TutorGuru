<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { registerUser, signInWithGoogle } from "../services/firebase";
import { db } from "../services/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { useToast } from "../composables/useToast";

const toast = useToast();
const router = useRouter();

const registerForm = ref({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreeTerms: false,
  role: "parent",
});

const loading = ref(false);

const handleRegister = async () => {
  if (loading.value) return;
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    toast.warning("Passwords do not match!", "Password Mismatch");
    return;
  }

  loading.value = true;
  try {
    //Create user in Firebase Authentication
    const result = await registerUser(
      registerForm.value.email,
      registerForm.value.password
    );

    if (!result.success) {
      toast.error(
        `Registration failed: ${result.error}`,
        "Registration Failed"
      );
      loading.value = false;
      return;
    }

    const user = result.user;

    // create Firebase user collection (defines role of the user for storage)
    await setDoc(doc(db, "users", user.uid), {
      username: user.uid,
      name: `${registerForm.value.firstName} ${registerForm.value.lastName}`,
      email: registerForm.value.email,
      createdAt: new Date().toISOString(),
      role: registerForm.value.role,
    });

    if (registerForm.value.role === "tutor") {
      // add tutor-specific fields into users/{uid}
      await setDoc(
        doc(db, "users", user.uid),
        {
          username: user.uid,
          name: `${registerForm.value.firstName} ${registerForm.value.lastName}`,
          email: registerForm.value.email,
          phone: "",
          location: "",
          bio: "",
          teaching: [{ subject: "", levels: [] }],
          experience: 0,
          avatar: "",
          role: "tutor",
          createdAt: new Date().toISOString(),
          verified: false,
        },
        { merge: true }
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: `${registerForm.value.firstName} ${registerForm.value.lastName}`,
        })
      );

      toast.success(
        "Registration successful! Please complete your tutor profile",
        "Welcome"
      );
      router.push("/editprofile");
    } else if (registerForm.value.role === "parent") {
      // add parent-specific fields into users/{uid}
      await setDoc(
        doc(db, "users", user.uid),
        {
          username: user.uid,
          name: `${registerForm.value.firstName} ${registerForm.value.lastName}`,
          email: registerForm.value.email,
          phone: "",
          children: [],
          role: "parent",
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      localStorage.setItem(
        "parent",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: `${registerForm.value.firstName} ${registerForm.value.lastName}`,
        })
      );

      toast.success(
        "Registration successful! Please complete your parent profile",
        "Welcome"
      );
      router.push("/editprofile");
    }
  } catch (error) {
    console.error("Registration error:", error);
    toast.error("Unexpected error. Please try again", "Registration Error");
  } finally {
    loading.value = false;
  }
};

const handleGoogleRegister = async () => {
  if (loading.value) return;
  loading.value = true;
  try {
    console.log(registerForm.value.role);
    if (registerForm.value.agreeTerms !== true) {
      toast.warning("Please agree to the terms", "Terms Required");
      loading.value = false;
      return;
    }
    if (registerForm.value.role == null) {
      toast.warning("Please select a Role", "Role Required");
      loading.value = false;
      return;
    }
    const response = await signInWithGoogle();
    if (!response.success) {
      toast.error(
        `Google register failed: ${response.error}`,
        "Google Registration Failed"
      );
      loading.value = false;
      return;
    }
    const user = response.user;
    const displayName = user.displayName;
    const normalizedEmail = user.email.trim().toLowerCase();
    // const photoURL = user.photoURL
    const q = query(
      collection(db, "users"),
      where("email", "==", normalizedEmail)
    );
    const querySnapshot = await getDocs(q);
    // email exists
    if (!querySnapshot.empty) {
      console.log("Email already exists");
      toast.warning(
        "Email is already Used. Please Login with the method you have registered with",
        "Email In Use"
      );
      return;
    }
    // create Firebase user collection (defines role of the user for storage)
    await setDoc(doc(db, "users", user.uid), {
      username: user.uid,
      name: user.displayName,
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
      role: registerForm.value.role,
    });
    if (registerForm.value.role === "tutor") {
      // add tutor-specific fields into users/{uid}
      await setDoc(
        doc(db, "users", user.uid),
        {
          username: user.uid,
          name: user.displayName,
          email: normalizedEmail,
          phone: "",
          location: "",
          bio: "",
          teaching: [{ subject: "", levels: [] }],
          experience: 0,
          avatar: "",
          role: "tutor",
          rating: null,
          createdAt: new Date().toISOString(),
          verified: false,
        },
        { merge: true }
      );

      console.log("✅ Tutor user created in Firestore for:", user.email);

      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          token: response.token, // google token
          expiry: response.expiry, // google api token expiry
        })
      );

      toast.success(
        "Registration successful! Please complete your tutor profile",
        "Welcome"
      );
      router.push("/editprofile");
    } else if (registerForm.value.role === "parent") {
      // add parent-specific fields into users/{uid}
      await setDoc(
        doc(db, "users", user.uid),
        {
          username: user.uid,
          name: user.displayName,
          email: normalizedEmail,
          phone: "",
          children: [],
          role: "parent",
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      console.log("✅ Parent user created in Firestore for:", user.email);

      localStorage.setItem(
        "user",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          token: response.token, // google token
          expiry: response.expiry, // google api token expiry
        })
      );

      toast.success(
        "Registration successful! Please complete your parent profile",
        "Welcome"
      );
      router.push("/editprofile");
    }
  } catch (error) {
    console.error("Registration error:", error);
    toast.error("Unexpected error. Please try again", "Registration Error");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="register-page">
    <div class="container">
      <div
        class="row justify-content-center align-items-center min-vh-100 py-5"
      >
        <div class="col-md-8 col-lg-6">
          <div class="card shadow-lg border-0">
            <div class="card-body p-5">
              <div class="text-center mb-4">
                <i class="bi bi-person-plus text-primary fs-1 mb-3"></i>
                <h2 class="fw-bold mb-2">Join TutorGuru</h2>
                <p class="text-muted">Create your account now</p>
              </div>

              <form @submit.prevent="handleRegister">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label">First Name</label>
                    <input
                      v-model="registerForm.firstName"
                      type="text"
                      class="form-control"
                      required
                      :disabled="loading"
                    />
                  </div>

                  <div class="col-md-6">
                    <label class="form-label">Last Name</label>
                    <input
                      v-model="registerForm.lastName"
                      type="text"
                      class="form-control"
                      required
                      :disabled="loading"
                    />
                  </div>

                  <div class="col-12">
                    <label class="form-label">Email Address</label>
                    <input
                      v-model="registerForm.email"
                      type="email"
                      class="form-control"
                      required
                      :disabled="loading"
                    />
                  </div>

                  <div class="col-12">
                    <label class="form-label">Password</label>
                    <input
                      v-model="registerForm.password"
                      type="password"
                      class="form-control"
                      required
                      minlength="6"
                      :disabled="loading"
                    />
                    <small class="text-muted">Minimum 6 characters</small>
                  </div>

                  <div class="col-12">
                    <label class="form-label">Confirm Password</label>
                    <input
                      v-model="registerForm.confirmPassword"
                      type="password"
                      class="form-control"
                      required
                      :disabled="loading"
                    />
                  </div>

                  <div class="col-12">
                    <div class="form-check">
                      <input
                        v-model="registerForm.agreeTerms"
                        type="checkbox"
                        class="form-check-input"
                        id="agreeTerms"
                        required
                        :disabled="loading"
                      />
                      <label class="form-check-label" for="agreeTerms">
                        I agree to the Terms of Service and Privacy Policy
                      </label>
                    </div>
                  </div>

                  <div class="col-12">Please select you role:</div>
                  <div class="col-12 d-flex gap-4">
                    <div class="form-check form-check-inline">
                      <input
                        v-model="registerForm.role"
                        name="role"
                        type="radio"
                        class="form-check-input"
                        id="parent"
                        value="parent"
                        required
                        checked
                        :disabled="loading"
                      />
                      <label class="form-check-label" for="parent">
                        Parent/Guardian
                      </label>
                    </div>
                    <div class="form-check form-check-inline">
                      <input
                        v-model="registerForm.role"
                        name="role"
                        type="radio"
                        class="form-check-input"
                        id="tutor"
                        value="tutor"
                        required
                        :disabled="loading"
                      />
                      <label class="form-check-label" for="tutor">
                        Tutor
                      </label>
                    </div>
                  </div>

                  <div class="d-grid mt-4 mb-3">
                    <button
                      type="submit"
                      class="btn btn-primary btn-lg text-light"
                      :disabled="loading"
                    >
                      <i class="bi bi-person-check me-2"></i>
                      <span v-if="!loading">Create Account</span>
                      <span v-else>
                        <span
                          class="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Creating...
                      </span>
                    </button>
                    <button
                      type="button"
                      class="google-btn btn btn-lg"
                      @click="handleGoogleRegister"
                      :disabled="loading"
                    >
                      <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google logo"
                        height="20px"
                      />
                      Sign Up with Google
                    </button>
                  </div>

                  <div class="text-center">
                    <p class="text-muted mb-0">
                      Already have an account?
                      <router-link
                        to="/login"
                        class="text-primary text-decoration-none fw-semibold"
                      >
                        Login
                      </router-link>
                    </p>
                  </div>
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
