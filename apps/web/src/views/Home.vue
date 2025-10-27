<template>
  <div class="home-page">
    <HeroSearch />
    <HeroSection />
    <Features />
    <CtaSection />
    <TestimonialsStrip />
    <TrustedBy />
  </div>
</template>

<script setup>
import HeroSection from "../components/HeroSection.vue";
import HeroSearch from "../components/HeroSearch.vue";
import TestimonialsStrip from "../components/TestimonialsStrip.vue";
import TrustedBy from "../components/TrustedBy.vue";
import Features from "../components/Features.vue";
import CtaSection from "../components/CtaSection.vue";
</script>
