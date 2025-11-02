<template>
  <section class="hero-search-section text-center">
    <div class="container h-100 d-flex align-items-center justify-content-center">
      <h1 class="fw-bold text-primary">
        <span class="animated-sentence">{{ displayText }}</span>
        <span class="cursor" :class="{ blinking: showCursor }">|</span>
      </h1>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const sentences = [
  "You're one search away from the right tutor",
  "Help my son ace his PSLE",
  "Find assignments across Singapore"
];

const displayText = ref("");
const showCursor = ref(true);
let sentenceIndex = 0;
let charIndex = 0;
let deleting = false;
let typingTimer = null;
let cursorTimer = null;

function typeEffect() {
  const currentSentence = sentences[sentenceIndex];

  if (!deleting) {
    displayText.value = currentSentence.substring(0, charIndex + 1);
    charIndex++;
    if (charIndex === currentSentence.length) {
      deleting = true;
      typingTimer = setTimeout(typeEffect, 2500); // pause at end of sentence
      return;
    }
  } else {
    displayText.value = currentSentence.substring(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      deleting = false;
      sentenceIndex = (sentenceIndex + 1) % sentences.length;
    }
  }

  const delay = deleting ? 30 : 80;
  typingTimer = setTimeout(typeEffect, delay);
}

function toggleCursor() {
  showCursor.value = !showCursor.value;
  cursorTimer = setTimeout(toggleCursor, 530);
}

onMounted(() => {
  typeEffect();
  toggleCursor();
});

onUnmounted(() => {
  clearTimeout(typingTimer);
  clearTimeout(cursorTimer);
});
</script>

<style scoped>
.hero-search-section {
  background-image: url("/src/assets/images/background.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  min-height: 300px;
  display: flex;
  align-items: center;
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

.animated-sentence {
  display: inline-block;
  min-height: 3rem;
  color: #0d6efd;
}

.cursor {
  display: inline-block;
  margin-left: 2px;
  opacity: 1;
  animation: blink 1.06s infinite;
}

.cursor.blinking {
  opacity: 1;
}

/* blinking cursor */
@keyframes blink {
  0%, 49% {
    opacity: 1;
  }
  50%, 100% {
    opacity: 0;
  }
}
</style>
