<template>
  <div
    ref="googleMap"
    class="google-map"
    style="height: 100%; width: 100%;"
  ></div>
</template>

<script setup>
import { onMounted, ref, defineExpose, nextTick } from "vue";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const props = defineProps({
  mapConfig: { type: Object, required: true },
  apiKey: { type: String, required: true },
});

const googleMap = ref(null);   
const map = ref(null);         

onMounted(async () => {
  try {
    setOptions({
      key: props.apiKey,
      version: "weekly",
    });

    const { Map } = await importLibrary("maps");
    await importLibrary("places");

    // create and save the actual map
    map.value = new Map(googleMap.value, props.mapConfig);
  } catch (err) {
    console.error("Failed to load Google Maps API:", err);
  }
});

// expose the real Map instance to the parent
defineExpose({ map });
</script>
