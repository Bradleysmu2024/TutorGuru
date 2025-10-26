<template>
  <section class="py-7 hero-search-section text-center">
    <div class="container">
      <h1 class="fw-bold text-primary mb-4">
        You're one search away <br />
        from the right tutor
      </h1>

      <div class="d-flex justify-content-center">
        <div
          class="search-wrapper position-relative"
          style="max-width: 600px; width: 100%"
        >
          <input
            v-model="userInput"
            type="text"
            class="form-control search-input ps-4 pe-5 animated-input"
            :placeholder="
              !userTyping ? displayText + (showCursor ? '|' : '') : ''
            "
            @focus="handleFocus"
            @input="handleInput"
          />
          <button class="search-btn">
            <i class="bi bi-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";

const phrases = [
  "Find tutors across 700+ subjects",
  "Tutoring for Secondary School O-Level",
  "Help my son ace his A-Level",
];

const displayText = ref("");
const showCursor = ref(true);
const userTyping = ref(false);
const userInput = ref("");
let phraseIndex = 0;
let charIndex = 0;
let deleting = false;
let typingActive = true;
let typingTimer = null;
let cursorTimer = null;
let restartDelayTimer = null; // new timer for smooth restart

function typeEffect() {
  if (!typingActive) return;
  const current = phrases[phraseIndex];

  if (!deleting) {
    displayText.value = current.substring(0, charIndex + 1);
    charIndex++;
    if (charIndex === current.length) {
      deleting = true;
      typingTimer = setTimeout(typeEffect, 1500);
      return;
    }
  } else {
    displayText.value = current.substring(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
    }
  }

  const delay = deleting ? 40 : 80;
  typingTimer = setTimeout(typeEffect, delay);
}

function toggleCursor() {
  showCursor.value = !showCursor.value;
  cursorTimer = setTimeout(toggleCursor, 500);
}

function startAnimation() {
  if (typingActive) return;
  typingActive = true;
  userTyping.value = false;
  typeEffect();
  toggleCursor();
}

function stopAnimation() {
  typingActive = false;
  userTyping.value = true;
  clearTimeout(typingTimer);
  clearTimeout(cursorTimer);
  clearTimeout(restartDelayTimer);
}

function handleInput() {
  clearTimeout(restartDelayTimer);

  // When input has text — stop animation immediately
  if (userInput.value.trim() !== "") {
    stopAnimation();
    return;
  }

  // When input becomes empty — wait a bit before restarting
  restartDelayTimer = setTimeout(() => {
    startAnimation();
  }, 1500); // smoother restart delay
}

function handleFocus() {
  if (userInput.value.trim() === "") {
    startAnimation();
  } else {
    stopAnimation();
  }
}

onMounted(() => {
  typeEffect();
  toggleCursor();
});
</script>

<style scoped>
.search-wrapper {
  position: relative;
}

/* input box: slightly rounded, taller */
.search-input {
  height: 58px;
  border-radius: 14px;
  font-size: 1.05rem;
  font-family: "Inter", sans-serif;
  background-color: #fff !important;
  color: #333 !important;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

/* arrow button, squared + simple hover */
.search-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background-color: #0d6efd;
  color: #fff;
  border: none;
  border-radius: 12px;
  width: 52px;
  height: 46px;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-search-section {
  background-image: url("/src/assets/images/background.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}

/* Optional: Add overlay for better text readability */
.hero-search-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.403); /* white overlay */
  z-index: 0;
}

.hero-search-section .container {
  position: relative;
  z-index: 1;
}

.search-btn:hover {
  background-color: #0a1f54;
}

/* blinking cursor */
@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
