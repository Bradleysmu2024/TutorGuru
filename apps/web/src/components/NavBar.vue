<template>
  <nav
    class="navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm"
  >
    <div class="container">
      <router-link to="/" class="navbar-brand d-flex align-items-center">
        <img
          src="../assets/images/tutorguru.png"
          alt="TutorGuru Logo"
          class="logo-image me-2"
        />
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

          <!-- Role-based Navigation (show only when authenticated) -->
          <template v-if="loginStatus">
            <!-- Admin Navigation -->
            <template v-if="currentRole === 'admin'">
              <li class="nav-item">
                <router-link
                  to="/admin"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-shield-lock me-1"></i>
                  Admin
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
                  Top Tutors
                </router-link>
              </li>
              <!-- Assignments dropdown -->
              <li class="nav-item dropdown" v-if="currentRole !== 'parent'">
                <a
                  class="nav-link dropdown-toggle"
                  href="#"
                  @click.prevent="toggleAssignments"
                  role="button"
                  :aria-expanded="assignmentsOpen"
                >
                  <i class="bi bi-journal-bookmark me-1"></i>
                  Assignments
                </a>
                <ul
                  class="dropdown-menu dropdown-menu-end"
                  :class="{ show: assignmentsOpen }"
                >
                <li v-if="currentRole === 'admin'">
                    <router-link
                      to="/parent-dashboard"
                      class="dropdown-item"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-grid me-2"></i>
                      Parent Dashboard
                    </router-link>
                  </li>
                  <li v-if="currentRole === 'admin'">
                    <router-link
                      to="/dashboard"
                      class="dropdown-item"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-speedometer2 me-2"></i>
                      Tutor Dashboard
                    </router-link>
                  </li>
                  <li
                    v-if="currentRole === 'admin' || currentRole === 'parent'"
                  >
                    <router-link
                      to="/post-assignment"
                      class="dropdown-item"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-plus-circle me-2"></i>
                      Post Assignment
                    </router-link>
                  </li>
                  <li v-if="currentRole === 'admin' || currentRole === 'tutor'">
                    <router-link
                      to="/tutor-maps"
                      class="dropdown-item"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-geo-alt me-2"></i>
                      Assignment Map
                    </router-link>
                  </li>
                </ul>
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

              <!-- Account Dropdown -->
              <li class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle"
                  href="#"
                  @click.prevent="toggleDropdown"
                  role="button"
                  :aria-expanded="dropdownOpen"
                >
                  <i class="bi bi-person-circle me-1"></i>
                  Account
                </a>
                <ul
                  class="dropdown-menu dropdown-menu-end"
                  :class="{ show: dropdownOpen }"
                >
                  <li>
                    <router-link
                      to="/profile"
                      class="dropdown-item"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-person me-2"></i>
                      My Profile
                    </router-link>
                  </li>
                  <li>
                    <router-link
                      to="/calendar"
                      class="dropdown-item"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-calendar3 me-2"></i>
                      Calendar
                    </router-link>
                  </li>
                  <li><hr class="dropdown-divider" /></li>
                  <li>
                    <router-link
                      to="/logout"
                      class="dropdown-item text-danger"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </router-link>
                  </li>
                </ul>
              </li>
            </template>
            <!-- tutor Navigation -->
            <template v-else-if="currentRole === 'tutor'">
            
              <!-- Assignments dropdown for tutor -->
              <li class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle"
                  href="#"
                  @click.prevent="toggleAssignments"
                  role="button"
                  :aria-expanded="assignmentsOpen"
                >
                  <i class="bi bi-journal-bookmark me-1"></i>
                  Assignments
                </a>
                <ul
                  class="dropdown-menu dropdown-menu-end"
                  :class="{ show: assignmentsOpen }"
                >
                  <li v-if="currentRole === 'tutor' || currentRole === 'admin'">
                  <router-link
                    to="/dashboard"
                    class="dropdown-item"
                    @click="closeNavbar"
                  >
                    <i class="bi bi-grid me-2"></i>
                    Dashboard
                  </router-link>
                  </li>
                  <li v-if="currentRole === 'admin' || currentRole === 'tutor'">
                    <router-link
                      to="/tutor-maps"
                      class="dropdown-item"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-geo-alt me-2"></i>
                      Assignment Map
                    </router-link>
                  </li>
                </ul>
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
                  to="/chat"
                  class="nav-link"
                  active-class="active"
                  @click="closeNavbar"
                >
                  <i class="bi bi-chat-left-text me-1"></i>
                  Messages
                </router-link>
              </li>

              <!-- Account Dropdown -->
              <li class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle"
                  href="#"
                  @click.prevent="toggleDropdown"
                  role="button"
                  :aria-expanded="dropdownOpen"
                >
                  <i class="bi bi-person-circle me-1"></i>
                  Account
                </a>
                <ul
                  class="dropdown-menu dropdown-menu-end"
                  :class="{ show: dropdownOpen }"
                >
                  <li>
                    <router-link
                      to="/profile"
                      class="dropdown-item"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-person me-2"></i>
                      My Profile
                    </router-link>
                  </li>
                  <!-- removed duplicate tutor-maps (now available via Assignments dropdown) -->
                  <li>
                    <router-link
                      to="/calendar"
                      class="dropdown-item"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-calendar3 me-2"></i>
                      Calendar
                    </router-link>
                  </li>
                  <li><hr class="dropdown-divider" /></li>
                  <li>
                    <router-link
                      to="/logout"
                      class="dropdown-item text-danger"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </router-link>
                  </li>
                </ul>
              </li>
            </template>
            <template v-else>
              <!-- Parent Navigation - Streamlined -->
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
                  Top Tutors
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

              <!-- Profile Dropdown -->
              <li class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle"
                  href="#"
                  @click.prevent="toggleDropdown"
                  role="button"
                  :aria-expanded="dropdownOpen"
                >
                  <i class="bi bi-person-circle me-1"></i>
                  Account
                </a>
                <ul
                  class="dropdown-menu dropdown-menu-end"
                  :class="{ show: dropdownOpen }"
                >
                  <li>
                    <router-link
                      to="/profile"
                      class="dropdown-item"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-person me-2"></i>
                      My Profile
                    </router-link>
                  </li>
                  <li>
                    <router-link
                      to="/calendar"
                      class="dropdown-item"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-calendar3 me-2"></i>
                      Calendar
                    </router-link>
                  </li>
                  <li><hr class="dropdown-divider" /></li>
                  <li>
                    <router-link
                      to="/logout"
                      class="dropdown-item text-danger"
                      @click="closeNavbar"
                    >
                      <i class="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </router-link>
                  </li>
                </ul>
              </li>
            </template>
          </template>

          <li class="nav-item ms-lg-2">
            <ThemeToggle />
          </li>

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
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { loginStatus, getCurrentUser } from "../services/firebase";
import { getDoc, doc as fsDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import ThemeToggle from "./ThemeToggle.vue";

const route = useRoute();
const isOpen = ref(false);
const dropdownOpen = ref(false);
const assignmentsOpen = ref(false);
const currentRole = ref("parent"); // 'tutor' or 'parent' or 'admin'

const toggleNavbar = () => {
  isOpen.value = !isOpen.value;
  dropdownOpen.value = false;
  assignmentsOpen.value = false;
};

const closeNavbar = () => {
  isOpen.value = false;
  dropdownOpen.value = false;
  assignmentsOpen.value = false;
};

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const toggleAssignments = () => {
  assignmentsOpen.value = !assignmentsOpen.value;
  // close other dropdowns
  dropdownOpen.value = false;
};

// Local switch (keeps behavior for unauthenticated demo/testing)
const switchRole = (role) => {
  currentRole.value = role;
  dropdownOpen.value = false;
  assignmentsOpen.value = false;
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
        // Preserve stored role (tutor, parent, admin, etc.) so admin can be detected
        currentRole.value = data.role || "parent";
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

.logo-image {
  height: 35px;
  width: 35px;
  object-fit: contain;
}

.nav-link {
  padding: 0.5rem 1rem;
  color: #6c757d;
  transition: color 0.3s ease;
  font-weight: 500;
}

.nav-link:hover,
.nav-link.active {
  color: #0d6efd;
}

/* Dropdown styles */
.dropdown-toggle::after {
  margin-left: 0.3rem;
}

.dropdown-menu {
  min-width: 200px;
  border-radius: 0.5rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  border: none;
  margin-top: 0.5rem;
}

.dropdown-item {
  padding: 0.6rem 1rem;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
  color: #0d6efd;
}

.dropdown-item.text-danger:hover {
  background-color: #fff5f5;
  color: #dc3545;
}

.dropdown-item i {
  width: 20px;
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

  /* Mobile dropdown styling */
  .dropdown-menu {
    position: static !important;
    transform: none !important;
    border: none;
    box-shadow: none;
    background-color: #f8f9fa;
    border-radius: 0.5rem;
    margin-top: 0.5rem;
  }

  .dropdown-item {
    padding: 0.75rem 1.5rem;
  }
}
</style>
