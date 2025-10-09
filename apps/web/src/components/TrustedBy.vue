<template>
  <section class="py-5 bg-white">
    <div class="container">
      <div class="logo-marquee rounded-4 border">
        <div class="marquee-track" :style="{ animationDuration: speed }">
          <div v-for="(l,i) in logos" :key="'a'+i" class="brand-pill">{{ l }}</div>
          <div v-for="(l,i) in logos" :key="'b'+i" class="brand-pill">{{ l }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const logos = ['Hitachi','PayPal','Similarweb','Skechers','MyHeritage','Netflix','L’Oréal','Unilever']
const speed = '26s'
</script>

<style scoped>
.logo-marquee{ overflow:hidden; background:#fff; padding:28px 0; }
.marquee-track{ display:flex; gap:64px; width:max-content; animation:scroll linear infinite; will-change:transform; }
@keyframes scroll{ from{ transform:translateX(0) } to{ transform:translateX(-50%) } }
.brand-pill{ padding:10px 26px; border-radius:999px; border:1px solid #e9ecef; color:#343a40; background:#fff; font-weight:600; opacity:.85; white-space:nowrap; }
.logo-marquee:hover .marquee-track{ animation-play-state:paused; }
</style>
