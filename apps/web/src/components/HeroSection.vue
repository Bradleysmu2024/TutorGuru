<template>
  <section class="hero-section">
    <div class="container">
      <div class="row align-items-center min-vh-75">
        <div class="col-lg-6 mb-5 mb-lg-0">
          <div class="hero-content">
            <h1 class="display-4 fw-bold mb-4 animate-fade-in">
              Find Your Perfect <span class="text-primary">Tutoring Opportunity</span>
            </h1>
            <p class="lead text-muted mb-4 animate-fade-in-delay">
              Connect with students who need your expertise. Browse hundreds of tutoring opportunities tailored to your skills and schedule.
            </p>
            <div class="d-flex flex-wrap gap-3 animate-fade-in-delay-2">
              <router-link to="/dashboard" class="btn btn-primary btn-lg px-4">
                <i class="bi bi-search me-2"></i>
                Browse Opportunities
              </router-link>
              <router-link to="/register" class="btn btn-outline-primary btn-lg px-4">
                <i class="bi bi-person-plus me-2"></i>
                Sign Up as Tutor
              </router-link>
            </div>
            
            <div class="stats-row mt-5">
              <div class="row g-4">
                <div class="col-4">
                  <div class="stat-item">
                    <h3 class="fw-bold text-primary mb-0">500+</h3>
                    <p class="text-muted small mb-0">Active Tutors</p>
                  </div>
                </div>
                <div class="col-4">
                  <div class="stat-item">
                    <h3 class="fw-bold text-primary mb-0">1000+</h3>
                    <p class="text-muted small mb-0">Students Helped</p>
                  </div>
                </div>
                <div class="col-4">
                  <div class="stat-item">
                    <h3 class="fw-bold text-primary mb-0">50+</h3>
                    <p class="text-muted small mb-0">Subjects</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="carousel-container">
            <Carousel />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import Carousel from './Carousel.vue'
</script>

<style scoped>
.hero-section {
  padding: 4rem 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.min-vh-75 {
  min-height: 75vh;
}

/* Added carousel container with fixed height to match content */
.carousel-container {
  height: 500px;
  width: 100%;
}

.hero-content h1 {
  line-height: 1.2;
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-in;
}

.animate-fade-in-delay {
  animation: fadeIn 0.8s ease-in 0.2s both;
}

.animate-fade-in-delay-2 {
  animation: fadeIn 0.8s ease-in 0.4s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

@media (max-width: 991px) {
  .hero-section {
    padding: 2rem 0;
  }
  
  .hero-content h1 {
    font-size: 2rem;
  }
  
  .stats-row {
    margin-top: 2rem !important;
  }
  
  /* Adjusted carousel height for mobile */

}
</style>
