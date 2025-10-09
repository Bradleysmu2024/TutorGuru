<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white fixed-top shadow-sm">
    <div class="container">
      <router-link to="/" class="navbar-brand d-flex align-items-center">
        <i class="bi bi-book-half text-primary me-2 fs-4"></i>
        <span class="fw-bold">TutorConnect</span>
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
      <div 
        class="navbar-collapse" 
        :class="{ 'show': isOpen }"
        id="navbarNav"
      >
        <ul class="navbar-nav ms-auto align-items-lg-center">
          <li class="nav-item">
            <router-link to="/" class="nav-link" active-class="active" @click="closeNavbar">
              <i class="bi bi-house-door me-1"></i>
              Home
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/dashboard" class="nav-link" active-class="active" @click="closeNavbar">
              <i class="bi bi-grid me-1"></i>
              Dashboard
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/profile" class="nav-link" active-class="active" @click="closeNavbar">
              <i class="bi bi-person me-1"></i>
              Profile
            </router-link>
          </li>
          <li class="nav-item ms-lg-3">
            <router-link to="/login" class="btn btn-outline-primary btn-sm" @click="closeNavbar">
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
import { ref } from 'vue'

const isOpen = ref(false)

const toggleNavbar = () => {
  isOpen.value = !isOpen.value
}

const closeNavbar = () => {
  isOpen.value = false
}
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

@media (max-width: 991px) {
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
