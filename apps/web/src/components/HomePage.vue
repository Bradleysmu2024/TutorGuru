<script setup>
/**
 * HomePage.vue
 * - Landing sections for Hero, Find Tutors, Assignment, Profile.
 * - Minimal “scroll reveal” effect using IntersectionObserver
 *   (adds .reveal-in when an element enters the viewport).
 */
import { onMounted } from 'vue'

onMounted(() => {
  const els = document.querySelectorAll('.reveal')
  const io = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('reveal-in') }),
    { threshold: 0.15 }
  )
  els.forEach(el => io.observe(el))
})
</script>

<template>
  <!-- ========== Hero ========== -->
  <!-- Uses .bg-soft (light gradient) and slide-up animations for text/card -->
  <section class="py-5 py-lg-6 bg-soft position-relative overflow-hidden">
    <div class="container">
      <div class="row align-items-center g-4">
        <div class="col-lg-7">
          <h1 class="display-5 fw-bold slide-up section-title">Find the Right Tutor, Fast.</h1>
          <p class="lead text-secondary mt-3 slide-up delay-1">
            TutorGuru matches students to vetted tutors based on subject, level, availability, and budget.
          </p>
          <div class="mt-4 slide-up delay-2">
            <a href="#find-tutors" class="btn btn-warning btn-lg me-2">Get Started</a>
            <a href="#assignment" class="btn btn-outline-primary btn-lg">Post Assignment</a>
          </div>
        </div>

        <!-- Simple “visual” card so we avoid external assets -->
        <div class="col-lg-5">
          <div class="card border-0 shadow-lg float-lg-end slide-up delay-3" style="max-width:520px">
            <div class="card-body">
              <h5 class="card-title mb-3 text-center">Smart Matching Preview</h5>
              <div class="row row-cols-2 g-2">
                <div class="col"><div class="tile">Math · Sec 3</div></div>
                <div class="col"><div class="tile">English · Pri 5</div></div>
                <div class="col"><div class="tile">Physics · JC</div></div>
                <div class="col"><div class="tile">Chemistry · Sec 4</div></div>
              </div>
              <p class="small text-muted mt-3 mb-0 text-center">Dynamic tiles for demo only.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== Find Tutors ========== -->
  <section id="find-tutors" class="py-5">
    <div class="container">
      <div class="text-center mb-4">
        <h2 class="fw-bold section-title">Find Tutors</h2>
        <p class="text-secondary mb-0">Search by subject, level, timeslot, and budget.</p>
      </div>

      <!-- Three key filters; each gets a reveal-in on scroll -->
      <div class="row g-4">
        <div class="col-md-4">
          <div class="p-4 border rounded-4 reveal">
            <h5 class="mb-2">Subject & Level</h5>
            <p class="text-secondary mb-0">Primary, Secondary, JC, and more.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="p-4 border rounded-4 reveal">
            <h5 class="mb-2">Availability</h5>
            <p class="text-secondary mb-0">Match weekday/weekend and time.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="p-4 border rounded-4 reveal">
            <h5 class="mb-2">Budget</h5>
            <p class="text-secondary mb-0">Filter by hourly rate & experience.</p>
          </div>
        </div>
      </div>

      <div class="text-center mt-4 reveal">
        <a class="btn btn-primary btn-lg" href="#assignment">I have an assignment</a>
      </div>
    </div>
  </section>

  <!-- ========== Assignment ========== -->
  <section id="assignment" class="py-5 bg-light">
    <div class="container">
      <div class="row g-4 align-items-center">
        <div class="col-lg-6">
          <h3 class="fw-bold mb-3 section-title reveal">Post an Assignment</h3>
          <ol class="text-secondary reveal">
            <li>Describe subject, level, goals, schedule, and budget.</li>
            <li>Receive shortlisted tutors automatically.</li>
            <li>Chat, confirm, and start lessons.</li>
          </ol>
        </div>
        <div class="col-lg-6">
          <div class="p-4 border rounded-4 bg-white shadow-sm reveal">
            <p class="mb-2"><strong>Tip:</strong> Be specific (e.g., “E-Math exam in 6 weeks”).</p>
            <p class="mb-0 text-secondary">Better inputs → better matches.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========== Profile ========== -->
  <section id="profile" class="py-5">
    <div class="container">
      <div class="text-center mb-4">
        <h2 class="fw-bold section-title">Profile</h2>
        <p class="text-secondary mb-0">Keep your information updated for faster matches.</p>
      </div>

      <div class="row g-4">
        <div class="col-md-4">
          <div class="p-4 border rounded-4 reveal">
            <h6 class="mb-1">Student Profile</h6>
            <p class="text-secondary mb-0">Goals, preferred schedule, online/in-person.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="p-4 border rounded-4 reveal">
            <h6 class="mb-1">Tutor Profile</h6>
            <p class="text-secondary mb-0">Qualifications, subjects, levels, rates.</p>
          </div>
        </div>
        <div class="col-md-4">
          <div class="p-4 border rounded-4 reveal">
            <h6 class="mb-1">Reviews</h6>
            <p class="text-secondary mb-0">Build trust with verified feedback.</p>
          </div>
        </div>
      </div>

      <div class="text-center mt-4 reveal">
        <a class="btn btn-warning btn-lg" href="#find-tutors">Update Profile & Match</a>
      </div>
    </div>
  </section>
</template>
