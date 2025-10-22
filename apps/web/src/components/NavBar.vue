<template>
  <nav
    class="navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm"
  >
    <div class="container">
      <router-link to="/" class="navbar-brand d-flex align-items-center">
        <i class="bi bi-book-half text-primary me-2 fs-4"></i>
        <span class="fw-bold">TutorGuru</span>
      </router-link>

      <!-- Removed Bootstrap data attributes, added manual click handler -->
      <button
        class="navbar-toggler"
        type="button"
        @click="toggleNavbar"
        aria-controls="navbarNav"
        :aria-expanded="isOpen"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Added dynamic class binding for show state -->
      <div class="navbar-collapse" :class="{ show: isOpen }" id="navbarNav">
        <ul class="navbar-nav ms-auto align-items-lg-center">
          <li class="nav-item">
            <router-link
              to="/"
              class="nav-link"
              active-class="active"
              @click="closeNavbar"
            >
              <i class="bi bi-house-door me-1"></i>
              Home
            </router-link>
          </li>

          <!-- Tutor/Parent Navigation (show only when authenticated) -->
          <template v-if="loginStatus">
            <template v-if="currentRole === 'tutor'">
              <li class="nav-item">
                <router-link
                  to="/dashboard"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-grid me-1"></i>
                  Dashboard
                </router-link>
              </li>
              <li class="nav-item">
                <router-link
                  to="/top-tutors"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-trophy me-1"></i>
                  Leaderboard
                </router-link>
              </li>
              <li class="nav-item">
                <router-link
                  to="/calendar"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-person me-1"></i>
                  Calendar
                </router-link>
              </li>
              <li class="nav-item">
                <router-link
                  to="/profile"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-person me-1"></i>
                  Profile
                </router-link>
              </li>
              <li class="nav-item">
                <router-link
                  to="/tutor-maps"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-person me-1"></i>
                  Assignment Map
                </router-link>
              </li>
              <li class="nav-item">
                <router-link
                  to="/chat"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-chat-left-text me-1"></i>
                  Messages
                </router-link>
              </li>
            </template>
            <template v-else>
              <li class="nav-item">
                <router-link
                  to="/parent-dashboard"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-grid me-1"></i>
                  Dashboard
                </router-link>
              </li>
              <li class="nav-item">
                <router-link
                  to="/top-tutors"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-trophy me-1"></i>
                  Top Tutor
                </router-link>
              </li>
              <li class="nav-item">
                <router-link
                  to="/post-assignment"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-plus-circle me-1"></i>
                  Post Assignment
                </router-link>
              </li>
              <li class="nav-item">
                <router-link
                  to="/calendar"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-person me-1"></i>
                  Calendar
                </router-link>
              </li>
              <li class="nav-item">
                <router-link
                  to="/profile"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-person me-1"></i>
                  Profile
                </router-link>
              </li>
              <li class="nav-item">
                <router-link
                  to="/chat"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-chat-left-text me-1"></i>
                  Messages
                </router-link>
              </li>
            </template>
          </template>

          <li class="nav-item ms-lg-3" v-if="!loginStatus">
            <router-link
              to="/login"
              class="btn btn-outline-primary btn-sm"
              @click="closeNavbar"
            >
              <i class="bi bi-box-arrow-in-right me-1"></i>
              Login
            </router-link>
          </li>
          <li class="nav-item ms-lg-3" v-else>
            <router-link
              to="/logout"
              class="btn btn-outline-primary btn-sm"
              @click="closeNavbar"
            >
              <i class="bi bi-box-arrow-in-right me-1"></i>
              Logout
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { loginStatus, getCurrentUser } from '../services/firebase'
import { getDoc, doc as fsDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const route = useRoute();
const isOpen = ref(false);
const dropdownOpen = ref(false);
const currentRole = ref("parent"); // 'tutor' or 'parent'

const toggleNavbar = () => {
  isOpen.value = !isOpen.value;
  dropdownOpen.value = false;
};

const closeNavbar = () => {
  isOpen.value = false;
  dropdownOpen.value = false;
};

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

// Local switch (keeps behavior for unauthenticated demo/testing)
const switchRole = (role) => {
  currentRole.value = role;
  dropdownOpen.value = false;
  closeNavbar();
};

// Fetch the user's role from Firestore when logged in
const fetchUserRole = async () => {
  try {
    const user = await getCurrentUser();
    if (user && user.uid) {
      const userSnap = await getDoc(fsDoc(db, "users", user.uid));
      if (userSnap.exists()) {
        const data = userSnap.data() || {};
        // Expect role to be 'tutor' or 'parent'
        currentRole.value = data.role === "tutor" ? "tutor" : "parent";
        return;
      }
    }
    // default
    currentRole.value = "parent";
  } catch (err) {
    console.error("Error fetching user role:", err);
    currentRole.value = "parent";
  }
};

// react to login status changes
watch(loginStatus, (isLoggedIn) => {
  if (isLoggedIn) {
    fetchUserRole();
  } else {
    // reset to default for unauthenticated users
    currentRole.value = "parent";
  }
});

// initial check on mount (in case listener set before this component)
onMounted(() => {
  if (loginStatus.value) {
    fetchUserRole();
  }
});

// Watch for route changes and close navbar
watch(
  () => route.fullPath,
  () => {
    closeNavbar();
  }
);
</script>

<style scoped>
.navbar {
  padding: 1rem 0;
  transition: all 0.3s ease;
}

.navbar-brand {
  font-size: 1.5rem;
  color: #2c3e50;
  transition: color 0.3s ease;
}

.navbar-brand:hover {
  color: #0d6efd;
}

.nav-link {
  padding: 0.5rem 1rem;
  color: #6c757d;
  transition: color 0.3s ease;
  font-weight: 500;
}

.nav-link:hover {
  color: #0d6efd;
}

.nav-link.active {
  color: #0d6efd;
}

/* Added manual collapse styles */
.navbar-collapse {
  transition: height 0.35s ease;
}

@media (max-width: 992px) {
  .navbar-collapse:not(.show) {
    display: none;
  }

  .navbar-collapse.show {
    display: block;
  }

  .nav-item {
    margin: 0.5rem 0;
  }

  .nav-item.ms-lg-3 {
    margin-left: 0 !important;
    margin-top: 1rem;
  }
}
</style>
