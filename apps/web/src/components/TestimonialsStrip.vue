<template>
  <section class="py-5 bg-white border-top">
    <div class="container">
      <h2 class="fw-bold mb-4 text-center section-title">
        What parents say about TutorGuru
      </h2>

      <div class="row g-4">
        <div
          class="col-lg-4"
          v-for="(t, i) in testimonials"
          :key="i"
        >
          <div class="card shadow-sm border-0 rounded-4 h-100">
            <div class="card-body text-center">
              <!-- Parent photo -->
              <div class="parent-img-wrapper mb-3">
                <img
                  :src="t.image"
                  alt="Parent photo"
                  class="parent-img"
                />
              </div>

              <p class="text-secondary mb-4">“{{ t.quote }}”</p>
              <h6 class="fw-semibold mb-0">{{ t.name }}</h6>
              <small class="text-muted">{{ t.role }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import parent1 from '../assets/images/parent1.png'
import parent2 from '../assets/images/parent2.png'
import parent3 from '../assets/images/parent3.png'

const testimonials = [
  {
    image: parent1,
    quote:
      'TutorGuru has been a lifesaver for my son. The tutors are patient, understanding, and really care about progress!',
    name: 'Mrs Lim',
    role: 'Mother of Secondary 3 Student'
  },
  {
    image: parent2,
    quote:
      'We love how flexible the scheduling is. My daughter enjoys her sessions and her grades have improved so much!',
    name: 'Mr Tan',
    role: 'Father of Primary 6 Student'
  },
  {
    image: parent3,
    quote:
      'Professional tutors and seamless matching process. Highly recommended for busy working parents like us!',
    name: 'Mr Rajesh',
    role: 'Father of JC Student'
  }
]
</script>

<style scoped>
.parent-img-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.parent-img {
  width: 100px;
  height: 120px;
  border-radius: 15px; /* softly rounded square */
  object-fit: cover;
  object-position: top; /* shows full head to shoulder */
  background-color: #f6f6f6;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.parent-img:hover {
  transform: scale(1.05);
  
}
.text-secondary {
  color: #5A5A5A !important; /* slightly darker variant */
}
</style>
