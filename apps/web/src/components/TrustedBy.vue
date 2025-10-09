<template>
  <section class="py-5">
    <div class="container text-center">
      <h5 class="text-muted mb-4">Tutors from leading universities</h5>

      <div class="trusted-by-wrapper overflow-hidden position-relative py-3">
        <div class="trusted-scroll d-flex align-items-center gap-5">
          <div
            v-for="(brand, i) in repeatedBrands"
            :key="i"
            class="trusted-item"
          >
            <img
              :src="brand.logo"
              :alt="brand.name"
              class="trusted-logo"
            />
            <span class="trusted-name">{{ brand.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import university1 from '../assets/university1.png'
import university2 from '../assets/university2.png'
import university3 from '../assets/university3.png'
import university4 from '../assets/university4.png'
import university5 from '../assets/university5.png'
import university6 from '../assets/university6.png'

const brands = [
  { name: 'Hardvard', logo: university1 },
  { name: 'NUS', logo: university2 },
  { name: 'NTU', logo: university3 },
  { name: 'SMU', logo: university4 },
  { name: 'SIT', logo: university5 },
  { name: 'SIM', logo: university6 }
]

// Duplicate for seamless scroll
const repeatedBrands = [...brands, ...brands]
</script>

<style scoped>
.trusted-by-wrapper {
  mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
}

.trusted-scroll {
  display: flex;
  animation: scroll-left 20s linear infinite;
  gap: 6rem; /* ← adjust this value */
}

.trusted-item {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0; /* no extra spacing */
  transition: transform 0.3s ease;
}

.trusted-item:hover {
  transform: scale(1.1);
}

.trusted-logo {
  width: 120px;
  height: 60px;
  object-fit: contain;
  filter: none !important;
  opacity: 1 !important;
  margin-right: -16px; /* negative margin pulls text closer */
  vertical-align: middle;
}


.trusted-name {
  font-weight: 600;
  color: #212529;
  font-size: 1rem;
  white-space: nowrap;
  line-height: 1; /* vertically aligns text better with image */
}

@keyframes scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
</style>
