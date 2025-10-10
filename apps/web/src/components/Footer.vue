<template>
  <footer class="footer bg-dark text-light py-4 mt-5">
    <div class="container">
      <div class="row">
        <div class="col-md-4 mb-3 mb-md-0">
          <h5 class="mb-3">
            <i class="bi bi-book-half me-2"></i>
            TutorGuru
          </h5>
          <p>Connecting passionate tutors with eager learners for a brighter future.</p>
        </div>
        
        <div class="col-md-4 mb-3 mb-md-0">
          <h6 class="mb-3">Quick Links</h6>
          <ul class="list-unstyled">
            <li><router-link to="/" class="text-light text-decoration-none">Home</router-link></li>
            <li><router-link to="/dashboard" class="text-light text-decoration-none">Dashboard</router-link></li>
            <li><router-link to="/profile" class="text-light text-decoration-none">Profile</router-link></li>
          </ul>
        </div>
        
        <div class="col-md-4">
          <h6 class="mb-3">Contact Us</h6>
          <p class="mb-2">
            <i class="bi bi-envelope me-2"></i>
            support@tutorguru.com
          </p>
          <p>
            <i class="bi bi-telephone me-2"></i>
            +65 1234 5678
          </p>
        </div>
      </div>
      
      <hr class="my-4 bg-secondary">
      
      <div class="row">
        <div class="col-12 text-center">
          <p class="mb-0">&copy; 2025 TutorGuru. All rights reserved.</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style scoped>
.footer {
  margin-top: auto;
}

.footer a:hover {
  color: #0d6efd !important;
  transition: color 0.3s ease;
}
</style>
