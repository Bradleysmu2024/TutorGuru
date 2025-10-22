<script setup>
console.log("Tutor map component script loaded ✅")
import { ref, onMounted } from "vue"
import { db } from "../services/firebase"
import { collection, getDocs, query, where} from "firebase/firestore"
import * as L from "leaflet"
import "leaflet/dist/leaflet.css"

const map = ref(null)
const postalCode = ref("")
const tutorMarker = ref(null)

// Fetch assignments from Firestore
async function getAllAssignments() {
  try {
    // Define the collection reference
    const assignmentsRef = collection(db, "assignments")

    // Create a query to only fetch documents where status == "open"
    const q = query(assignmentsRef, where("status", "==", "open"))

    // Run the query
    const snapshot = await getDocs(q)

    // Map the results into an array
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return []
  }
}

// Convert postal code to lat/lng via OneMap API
async function searchTutorLocation() {
  if (!postalCode.value) {
    alert("Please enter a postal code.")
    return
  }

  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${postalCode.value}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
  const res = await fetch(url)
  const data = await res.json()

  if (data.results && data.results.length > 0) {
    const lat = parseFloat(data.results[0].LATITUDE)
    const lng = parseFloat(data.results[0].LONGITUDE)

    if (tutorMarker.value) {
      map.value.removeLayer(tutorMarker.value)
    }

    const redIcon = new L.Icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })

    tutorMarker.value = L.marker([lat, lng], { icon: redIcon }).addTo(map.value)
    tutorMarker.value.bindPopup(`<b>Your Location</b><br>Postal Code: ${postalCode.value}`).openPopup()
    map.value.setView([lat, lng], 15)
  } else {
    alert("Postal code not found.")
  }
}

// Initialize the Leaflet map
onMounted(async () => {
  console.log("Initializing tutor map...")
  map.value = L.map("tutor-map").setView([1.3521, 103.8198], 11)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map.value)

  const assignments = await getAllAssignments()
  assignments.forEach(a => {
    if (a.lat && a.lng) {
      const marker = L.marker([a.lat, a.lng]).addTo(map.value)
      marker.bindPopup(`
        <b>Subject:</b> ${a.subject || ""}<br>
        <b>Level:</b> ${a.level || ""}<br>
        <b>Title:</b> ${a.title || ""}<br>
        <b>Address:</b> ${a.formattedAddress || ""}
      `)
    }
  })
})
</script>


<template>
  <div id="tutor-map-container">
    <!-- Floating Search Bar -->
    <div class="tutor-search-bar shadow">
      <div class="input-group">
        <input
          type="text"
          class="form-control"
          v-model="postalCode"
          placeholder="Enter your postal code (e.g. 650123)"
        />
        <button class="btn btn-primary" @click="searchTutorLocation">
          Search
        </button>
      </div>
    </div>

    <!-- Actual map -->
    <div id="tutor-map"></div>
  </div>
</template>


<style scoped>
#tutor-map-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

#tutor-map {
  width: 100%;
  height: 100%;
}

.tutor-search-bar {
  position: absolute;
  top: 80px; /* adjust to clear navbar */
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 90%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 8px;
}
</style>

