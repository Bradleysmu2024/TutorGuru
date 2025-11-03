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
import { ref, onMounted } from "vue";
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
  let tries = 0
  while (!mapComponent.value?.map && tries < 20) {
    await new Promise(r => setTimeout(r, 250))
    tries++
  }

  map.value = mapComponent.value?.map
  google.value = window.google

  if (!map.value) {
    console.error(" Map still not initialized after waiting.")
    return
  }


  // existing load
    try {
      const q = query(collection(db, "assignments"), where("status", "==", "open"));
      const snapshot = await getDocs(q);

      // Coerce lat/lng to numbers and skip invalid entries to avoid Google Maps errors
      const items = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const rawLat = data.lat ?? data.position?.lat;
          const rawLng = data.lng ?? data.position?.lng;
          const lat = parseFloat(rawLat);
          const lng = parseFloat(rawLng);

          if (!isFinite(lat) || !isFinite(lng)) {
            console.warn(`Skipping assignment ${doc.id} due to invalid lat/lng:`, rawLat, rawLng);
            return null;
          }

          return {
            id: doc.id,
            ...data,
            position: { lat, lng },
          };
        })
        .filter(Boolean);

      assignments.value = items;
      filteredAssignments.value = items;
      console.log("Loaded open assignments:", assignments.value.length);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
});

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
  // Normalize "All" selections: if user selected an 'All' option, treat it as no filter
  const isAllSelected = arr =>
    !arr || arr.length === 0 || arr.some(v => typeof v === 'string' && (/^all(\s+subjects?)?$/i.test(v) || /^all(\s+levels?)?$/i.test(v) || /^all$/i.test(v)));

  const subjectFilterActive = !isAllSelected(subjects);
  const levelFilterActive = !isAllSelected(levels);

  let filtered = assignments.value;

  if (subjectFilterActive) {
    filtered = filtered.filter(a => subjects.includes(a.subject));
  }

  if (levelFilterActive) {
    filtered = filtered.filter(a => levels.includes(a.level));
  }

  filteredAssignments.value = filtered;
  console.log("Filtered assignments:", filtered.length, "ids:", filtered.map(f => f.id), "subjectFilterActive:", subjectFilterActive, "levelFilterActive:", levelFilterActive);
}

</script>

<style scoped>
#tutor-map-container {
  position: relative;
  width: 100%;
  height: 100vh;
}
</style>
