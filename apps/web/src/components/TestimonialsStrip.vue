<template>
  <section class="py-5 bg-white border-top">
    <div class="container">
      <h2 class="fw-bold mb-4 text-center section-title">
        What clients say about TutorGuru
      </h2>

      <div class="row g-4">
        <div class="col-lg-4" v-for="(t, i) in testimonials" :key="i">
          <div class="card shadow-sm border-0 rounded-4 h-100">
            <div class="card-body">
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="logo-box rounded-3"></div>
                <div class="small text-muted fw-semibold">{{ t.company }}</div>
              </div>

              <p class="mb-4 text-secondary">“{{ t.quote }}”</p>

              <div class="small">
                <div class="fw-semibold">{{ t.name }}</div>
                <div class="text-muted">{{ t.role }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const testimonials = [
  {
    company: "MorningCrunch",
    quote:
      "Speed, quality, and a trusted network of tutors we rely on long-term.",
    name: "Gregor Becker & Paul Ostwald",
    role: "Founders",
  },
  {
    company: "Project Alianza",
    quote: "Matched us with educators who truly understand student needs.",
    name: "Kristin Van Busum",
    role: "CEO & Co-Founder",
  },
  {
    company: "SENIA",
    quote: "Turnaround time is fast and results are excellent.",
    name: "Christina & Gina Senia",
    role: "Co-Founders",
  },
];
</script>

<style scoped>
.logo-box {
  width: 84px;
  height: 28px;
  background: linear-gradient(90deg, var(--tg-light), #fff);
  border: 1px solid #e9ecef;
}
</style>
