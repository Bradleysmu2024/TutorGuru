<template>
  <div class="home-page">
    <HeroSection />
    
    <section class="features-section py-5">
      <div class="container">
        <div class="text-center mb-5">
          <h2 class="fw-bold mb-3">Why Choose TutorGuru?</h2>
          <p class="text-muted">Everything you need to find the perfect tutoring opportunity</p>
        </div>
        
        <div class="row g-4">
          <div class="col-md-6 col-lg-3">
            <div class="feature-card text-center p-4">
              <div class="feature-icon mb-3">
                <i class="bi bi-search fs-1 text-primary"></i>
              </div>
              <h5 class="fw-semibold mb-2">Smart Search</h5>
              <p class="text-muted small">Advanced filters to find opportunities that match your expertise and schedule</p>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-3">
            <div class="feature-card text-center p-4">
              <div class="feature-icon mb-3">
                <i class="bi bi-shield-check fs-1 text-success"></i>
              </div>
              <h5 class="fw-semibold mb-2">Verified Postings</h5>
              <p class="text-muted small">All job postings are verified to ensure quality and legitimacy</p>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-3">
            <div class="feature-card text-center p-4">
              <div class="feature-icon mb-3">
                <i class="bi bi-clock-history fs-1 text-warning"></i>
              </div>
              <h5 class="fw-semibold mb-2">Flexible Schedule</h5>
              <p class="text-muted small">Choose opportunities that fit your availability and preferences</p>
            </div>
          </div>
          
          <div class="col-md-6 col-lg-3">
            <div class="feature-card text-center p-4">
              <div class="feature-icon mb-3">
                <i class="bi bi-cash-stack fs-1 text-info"></i>
              </div>
              <h5 class="fw-semibold mb-2">Competitive Rates</h5>
              <p class="text-muted small">Fair compensation for your expertise and time</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <section class="cta-section py-5 bg-primary text-white">
      <div class="container text-center">
        <h2 class="fw-bold mb-3">Ready to Start Your Tutoring Journey?</h2>
        <p class="lead mb-4">Join hundreds of tutors already making a difference</p>
        <div class="d-flex justify-content-center gap-3 flex-wrap">
          <router-link to="/register" class="btn btn-light btn-lg px-4">
            <i class="bi bi-person-plus me-2"></i>
            Get Started
          </router-link>
          <router-link to="/dashboard" class="btn btn-outline-light btn-lg px-4">
            <i class="bi bi-grid me-2"></i>
            Browse Opportunities
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import HeroSection from '../components/HeroSection.vue'
</script>

<style scoped>
.features-section {
  background-color: #fff;
}

.feature-card {
  background: #f8f9fa;
  border-radius: 0.75rem;
  transition: all 0.3s ease;
  height: 100%;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1);
  background: white;
}

.cta-section {
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
}
</style>
