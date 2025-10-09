<template>
  <div>
    <HeroSearch @search="onSearch"/>
    <PopularServices/>
    <TestimonialsStrip/>
    <TrustedBy/>
  </div>
</template>

<script setup>
import HeroSearch from './HeroSearch.vue'
import PopularServices from './PopularServices.vue'
import TestimonialsStrip from './TestimonialsStrip.vue'
import TrustedBy from './TrustedBy.vue'

function onSearch(q){ if(q) alert(`Searching for: ${q}`) }
</script>
