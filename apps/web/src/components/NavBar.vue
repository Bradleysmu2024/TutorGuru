<script setup>
/**
 * NavBar.vue
 * - Sticky navigation with brand on the left.
 * - Highlights the current section link as the user scrolls.
 * - Uses a tiny scroll handler (no extra libraries).
 */
import { onMounted, onBeforeUnmount, ref } from 'vue'

// Which section is "active" (used to style links)
const active = ref('find-tutors')

/**
 * Decide which section is active based on each section's position
 * relative to the viewport top. Threshold keeps it from flickering
 * when near boundaries.
 */
function setActiveByScroll() {
  const ids = ['find-tutors', 'assignment', 'profile']
  const tops = ids
    .map(id => {
      const el = document.getElementById(id)
      return el ? { id, top: el.getBoundingClientRect().top } : null
    })
    .filter(Boolean)

  const threshold = 140
  // First section within threshold, otherwise the last one scrolled past
  const current =
    tops.find(s => s.top >= 0 && s.top < threshold) ||
    tops.reverse().find(s => s.top < 0) ||
    { id: 'find-tutors' }

  active.value = current.id
}

let handler
onMounted(() => {
  handler = () => setActiveByScroll()
  window.addEventListener('scroll', handler, { passive: true })
  setActiveByScroll() // initialize on first render
})
onBeforeUnmount(() => window.removeEventListener('scroll', handler))
</script>

<template>
  <nav class="navbar navbar-expand-lg bg-white shadow-sm sticky-top">
    <div class="container">
      <!-- Brand (left) -->
      <a class="navbar-brand fw-bold" href="#">TutorGuru</a>

      <!-- Mobile toggle -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#mainNav"
        aria-controls="mainNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Links (right) -->
      <div id="mainNav" class="collapse navbar-collapse">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a :class="['nav-link', active==='find-tutors' && 'active']" href="#find-tutors">Find Tutors</a>
          </li>
          <li class="nav-item">
            <a :class="['nav-link', active==='assignment' && 'active']" href="#assignment">Assignment</a>
          </li>
          <li class="nav-item">
            <a :class="['nav-link', active==='profile' && 'active']" href="#profile">Profile</a>
          </li>
          <li class="nav-item">
            <!-- CTA uses theme's orange (btn-warning) -->
            <a class="btn btn-warning ms-lg-2" href="#find-tutors">Get Started</a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
