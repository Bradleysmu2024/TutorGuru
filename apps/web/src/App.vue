<script setup>
/**
 * App.vue
 * - Owns the global loading overlay with a dynamic progress bar.
 * - Renders the NavBar and HomePage after loading finishes.
 *
 * Loader logic:
 *   We maintain a `progress` that eases toward a `target`.
 *   Real browser milestones (DOM ready, images, fonts, window load)
 *   bump `target` upward. When `load` fires, we finish to 100% and hide.
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import NavBar from './components/NavBar.vue'
import HomePage from './components/HomePage.vue'

// Loading state + numbers
const isLoading = ref(true)
const progress  = ref(0)   // what the user sees
const target    = ref(15)  // where we want to go next (raised on milestones)

// Timers + listeners for cleanup
let tickTimer
let imgListeners = []

/**
 * Smoothly approach the target (NProgress-style).
 * This keeps movement natural without big jumps.
 */
function easeTowardTarget() {
  if (progress.value < target.value) {
    const gap = target.value - progress.value
    progress.value += Math.max(1, Math.round(gap * 0.12))
    if (progress.value > target.value) progress.value = target.value
  }
}

/** Push to 100% and hide the overlay after a tiny pause. */
function finish() {
  target.value = 100
  const doneCheck = setInterval(() => {
    easeTowardTarget()
    if (progress.value >= 100) {
      clearInterval(doneCheck)
      setTimeout(() => (isLoading.value = false), 200)
    }
  }, 40)
}

onMounted(() => {
  // Tick the easing function
  tickTimer = setInterval(easeTowardTarget, 40)

  // ---- Milestone 1: DOM readiness ----
  if (document.readyState === 'complete') {
    // Everything already loaded (refresh case)
    target.value = Math.max(target.value, 80)
  } else if (document.readyState !== 'loading') {
    // DOMContentLoaded happened
    target.value = Math.max(target.value, 40)
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      target.value = Math.max(target.value, 45)
    }, { once: true })
  }

  // ---- Milestone 2: Images progress (0..90%) ----
  const imgs = Array.from(document.images || [])
  const pending = imgs.filter(img => !img.complete)
  if (pending.length === 0) {
    target.value = Math.max(target.value, 75)
  } else {
    let loaded = 0
    const bump = () => {
      loaded++
      // Scale to 20..90% based on how many finished
      const scaled = 20 + Math.round((loaded / pending.length) * 70)
      target.value = Math.max(target.value, Math.min(scaled, 90))
    }
    pending.forEach(img => {
      const onDone = () => {
        bump()
        img.removeEventListener('load', onDone)
        img.removeEventListener('error', onDone)
      }
      img.addEventListener('load', onDone)
      img.addEventListener('error', onDone)
      imgListeners.push([img, onDone])
    })
  }

  // ---- Milestone 3: Web fonts ready ----
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      target.value = Math.max(target.value, 85)
    })
  }

  // ---- Milestone 4: Everything loaded (images, CSS, fonts, etc.) ----
  if (document.readyState === 'complete') {
    finish()
  } else {
    window.addEventListener('load', finish, { once: true })
  }
})

onBeforeUnmount(() => {
  // Clean timers and listeners to avoid leaks (SPA navigations)
  clearInterval(tickTimer)
  imgListeners.forEach(([img, fn]) => {
    img.removeEventListener('load', fn)
    img.removeEventListener('error', fn)
  })
  imgListeners = []
})
</script>

<template>
  <!-- ========= Loading Overlay (visible until isLoading=false) ========= -->
  <transition name="fade">
    <div v-if="isLoading" class="loading-overlay d-flex justify-content-center align-items-center">
      <div class="loading-card p-4 rounded-4 shadow">
        <div class="d-flex align-items-center mb-2">
          <strong>Welcome to TutorGuru</strong>
          <span class="ms-auto small text-muted">{{ progress }}%</span>
        </div>

        <!-- Bootstrap progress bar; we animate via width binding -->
        <div
          class="progress"
          role="progressbar"
          aria-label="Loading progress"
          :aria-valuenow="progress"
          aria-valuemin="0"
          aria-valuemax="100"
          style="height: 10px;"
        >
          <div
            class="progress-bar progress-bar-striped"
            :class="{ 'progress-bar-animated': progress < 100 }"
            :style="{ width: progress + '%' }"
          />
        </div>
      </div>
    </div>
  </transition>

  <!-- ========= App Content ========= -->
  <!-- While loading, we blur and disable pointer events via .app-dim -->
  <div :class="{ 'app-dim': isLoading }">
    <NavBar />
    <main>
      <HomePage />
    </main>

    <!-- Simple footer; keep minimal for now -->
    <footer class="py-4 border-top mt-5">
      <div class="container text-center small text-muted">
        © {{ new Date().getFullYear() }} TutorGuru
      </div>
    </footer>
  </div>
</template>
