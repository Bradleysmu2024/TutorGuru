<template>
  <div class="home-page">
    <HeroSearch />
    <HeroSection />

    <Features />

    <section class="cta-section py-5 bg-primary text-white">
      <div class="container text-center">
        <h2 class="fw-bold mb-3">Ready to Start Your Tutoring Journey?</h2>
        <p class="lead mb-4">
          Join hundreds of tutors already making a difference
        </p>
        <div class="d-flex justify-content-center gap-3 flex-wrap">
          <router-link to="/register" class="btn btn-light btn-lg px-4">
            <i class="bi bi-person-plus me-2"></i>
            Get Started
          </router-link>
          <router-link
            to="/dashboard"
            class="btn btn-outline-light btn-lg px-4"
          >
            <i class="bi bi-grid me-2"></i>
            Browse Opportunities
          </router-link>
        </div>
      </div>
    </section>

    <TestimonialsStrip />

    <TrustedBy />
  </div>
</template>

<script setup>
import HeroSection from "../components/HeroSection.vue";
import HeroSearch from "../components/HeroSearch.vue";
import TestimonialsStrip from "../components/TestimonialsStrip.vue";
import TrustedBy from "../components/TrustedBy.vue";
import Features from "../components/Features.vue";
</script>

<style scoped>
.cta-section {
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
}
</style>
