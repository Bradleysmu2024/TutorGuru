<template>
  <div id="tutorCarousel" class="carousel slide carousel-fade h-100" data-bs-ride="carousel">
    <div class="carousel-inner rounded-4 shadow-lg h-100">
      <div 
        v-for="(image, index) in images" 
        :key="index"
        class="carousel-item h-100"
        :class="{ active: index === 0 }"
      >
        <!-- Added h-100 to fill container height and adjusted object-fit -->
        <img :src="image" class="d-block w-100 h-100" :alt="`Tutoring image ${index + 1}`">
      </div>
    </div>
    <button class="carousel-control-prev" type="button" data-bs-target="#tutorCarousel" data-bs-slide="prev">
      <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Previous</span>
    </button>
    <button class="carousel-control-next" type="button" data-bs-target="#tutorCarousel" data-bs-slide="next">
      <span class="carousel-control-next-icon" aria-hidden="true"></span>
      <span class="visually-hidden">Next</span>
    </button>
  </div>
</template>

<script setup>
const imageModules = import.meta.glob('../assets/images/home/*.(jpg|jpeg|png|gif|webp)', { eager: true })

// Extract the image URLs from the modules
const images = Object.values(imageModules).map(module => module.default)
</script>

<style scoped>
/* Made carousel fill full height of container */
.carousel {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.carousel-inner {
  border-radius: 1rem;
  height: 100%;
}

.carousel-item {
  height: 100%;
}

.carousel-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

@media (max-width: 768px) {
  .carousel {
    min-height: 300px;
  }
}
</style>
