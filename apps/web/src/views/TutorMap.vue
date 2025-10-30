<template>
  <div id="tutor-map-container">
    <!-- Search bar to set tutor location -->
    <div class="toolbar">
      <SearchBar @search="searchTutorLocation" @filter="applyFilter"/>

    </div>
    <!-- Google Map Loader -->
    <GoogleMapLoader
      ref="mapComponent"
      :mapConfig="mapConfig"
      :apiKey="apiKey"
    />

    <!-- Assignment markers -->
    <MapMarker
      v-for="a in filteredAssignments"
      :key="a.id"
      :google="google"
      :map="map"
      :assignment="a"
      :tutorMarker="tutorMarker"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, defineExpose, nextTick } from "vue";
import { db } from "../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useToast } from "../composables/useToast";
import SearchBar from "../components/SearchBar.vue";
import GoogleMapLoader from "../components/GoogleMapLoader.vue";
import MapMarker from "../components/MapMarker.vue";


const toast = useToast();
const mapComponent = ref(null);
const google = ref(null);
const map = ref(null);
const tutorMarker = ref(null); 
const assignments = ref([]);   
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const filteredAssignments = ref([]);
const mapConfig = {
  center: { lat: 1.3521, lng: 103.8198 },
  zoom: 12,
};


onMounted(async () => {
  // Wait until GoogleMapLoader actually creates the map
  let tries = 0
  while (!mapComponent.value?.map && tries < 20) {
    await new Promise(r => setTimeout(r, 250)) // wait 0.25s
    tries++
  }

  map.value = mapComponent.value?.map
  google.value = window.google

  if (!map.value) {
    console.error(" Map still not initialized after waiting.")
    return
  }

  console.log(" Map initialized:", map.value)


  // existing load
  try {
    const q = query(collection(db, "assignments"), where("status", "==", "open"));
    const snapshot = await getDocs(q);
    assignments.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      position: {
        lat: doc.data().lat,
        lng: doc.data().lng,
      },
    }));
    filteredAssignments.value = assignments.value; // keep a working copy
    console.log("Loaded open assignments:", assignments.value.length);
  } catch (error) {
    console.error("Error fetching assignments:", error);
  }
});
console.log(assignments.value)

//  When user searches postal code 
async function searchTutorLocation(postalCode) {
  if (!postalCode)
    return toast.warning("Please enter a postal code", "Postal Code Required");

  const g = window.google;
  if (!map.value || !g) return console.error("Map not initialized.");

  const geocoder = new g.maps.Geocoder();
  geocoder.geocode({ address: postalCode }, (results, status) => {
    if (status === "OK" && results[0]) {
      const location = results[0].geometry.location;

      // If marker already exists → move it
      if (tutorMarker.value) {
        tutorMarker.value.setPosition(location);
      } else {
        tutorMarker.value = new g.maps.Marker({
          map: map.value,
          position: location,
          icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          title: "Your Location",
        });
      }

      map.value.setCenter(location);
      map.value.setZoom(15);

      // Save locally
      localStorage.setItem(
        "tutorLocation",
        JSON.stringify({
          lat: location.lat(),
          lng: location.lng(),
          postal: postalCode,
        })
      );
      console.log("Tutor location saved locally:", location.lat(), location.lng());
    } else {
      toast.error("Postal code not found", "Invalid Postal Code");
    }
  });
}

// When user applys filters
function applyFilter({ subjects, levels }) {
  let filtered = assignments.value;

  if (subjects.length > 0) {
    filtered = filtered.filter(a => subjects.includes(a.subject));
  }

  if (levels.length > 0) {
    filtered = filtered.filter(a => levels.includes(a.level));
  }

  filteredAssignments.value = filtered;
  console.log("Filtered assignments:", filtered.length);
}

</script>

<style scoped>
#tutor-map-container {
  position: relative;
  width: 100%;
  height: 100vh;
}
</style>
