<template>
  <section class="py-5 bg-light">
    <div class="container">
      <h2 class="fw-bold mb-4 section-title">Popular Tutoring Services</h2>

      <ul class="nav nav-pills mb-4 gap-2">
        <li class="nav-item" v-for="cat in categories" :key="cat">
          <button class="nav-link px-3 py-2" :class="{active:cat===active}"
                  @click="active=cat">{{ cat }}</button>
        </li>
      </ul>

      <div class="row g-4">
        <div class="col-md-4" v-for="(s, i) in filtered" :key="i">
          <div class="card border-0 shadow-sm h-100">
            <img :src="s.image" class="card-img-top rounded-3" alt="">
            <div class="card-body">
              <h6 class="fw-semibold mb-2">{{ s.tutor }}</h6>
              <p class="small text-muted mb-1">⭐ {{ s.rating }} ({{ s.reviews }})</p>
              <p class="mb-0 small text-secondary">{{ s.subject }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-5">
        <button class="btn btn-outline-primary rounded-pill px-4 py-2">View more tutors</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
const active = ref('Primary School')
const categories = ['Primary School','Secondary School','Junior College','University']
const services = [
  { tutor:'Ms. Tan',    rating:5.0, reviews:120, subject:'O-Level Chinese',    level:'Secondary School', image:'https://picsum.photos/seed/chinese/600/400' },
  { tutor:'Mr. Lim',    rating:4.9, reviews:90,  subject:'P3 Science',         level:'Primary School',   image:'https://picsum.photos/seed/science/600/400' },
  { tutor:'Ms. Wong',   rating:4.8, reviews:210, subject:'JC H2 Math',          level:'Junior College',   image:'https://picsum.photos/seed/math/600/400' },
  { tutor:'Mrs. Koh',   rating:4.9, reviews:75,  subject:'Primary English',     level:'Primary School',   image:'https://picsum.photos/seed/english/600/400' },
  { tutor:'Dr. Lee',    rating:4.7, reviews:52,  subject:'University Calculus', level:'University',       image:'https://picsum.photos/seed/calculus/600/400' },
  { tutor:'Mr. Rahman', rating:4.8, reviews:130, subject:'Sec 3 Physics',       level:'Secondary School', image:'https://picsum.photos/seed/physics/600/400' },
]
const filtered = computed(()=> services.filter(s=> s.level===active.value))
</script>

<style scoped>
.nav-pills .nav-link.active{ background-color:var(--tg-navy); }
.card-img-top{ object-fit:cover; height:230px; }
</style>
