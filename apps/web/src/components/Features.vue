<template>
  <section class="features-section py-5">
    <div class="container">
      <div class="text-center mb-5">
        <h2 class="fw-bold mb-3">Why Choose TutorGuru?</h2>
        <p class="text-muted">
          Everything you need to find the perfect tutoring opportunity
        </p>
      </div>

      <div class="row g-4">
        <div class="col-md-6 col-lg-3">
          <div class="feature-card text-center p-4">
            <div class="feature-icon mb-3">
              <i class="bi bi-search fs-1 text-primary"></i>
            </div>
            <h5 class="fw-semibold mb-2">Smart Search</h5>
            <p class="text-muted small">
              Advanced filters to find opportunities that match your expertise
              and schedule
            </p>
          </div>
        </div>

        <div class="col-md-6 col-lg-3">
          <div class="feature-card text-center p-4">
            <div class="feature-icon mb-3">
              <i class="bi bi-shield-check fs-1 text-success"></i>
            </div>
            <h5 class="fw-semibold mb-2">Verified Postings</h5>
            <p class="text-muted small">
              All job postings are verified to ensure quality and legitimacy
            </p>
          </div>
        </div>

        <div class="col-md-6 col-lg-3">
          <div class="feature-card text-center p-4">
            <div class="feature-icon mb-3">
              <i class="bi bi-clock-history fs-1 text-warning"></i>
            </div>
            <h5 class="fw-semibold mb-2">Flexible Schedule</h5>
            <p class="text-muted small">
              Choose opportunities that fit your availability and preferences
            </p>
          </div>
        </div>

        <div class="col-md-6 col-lg-3">
          <div class="feature-card text-center p-4">
            <div class="feature-icon mb-3">
              <i class="bi bi-cash-stack fs-1 text-info"></i>
            </div>
            <h5 class="fw-semibold mb-2">Competitive Rates</h5>
            <p class="text-muted small">
              Fair compensation for your expertise and time
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features-section {
  background-image: url("/src/assets/images/bg-feature.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
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

/* Optional: Add overlay for better text readability */
.features-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.467); /* light overlay for light mode */
  z-index: 0;
}

/* Darker overlay in dark mode */
:global(.dark-mode) .features-section::before {
  background: rgba(0, 0, 0, 0.6); /* darker overlay for dark mode */
}

.features-section .container {
  position: relative;
  z-index: 1;
}
</style>
