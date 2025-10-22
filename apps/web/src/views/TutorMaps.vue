<script setup>
console.log("Tutor map component script loaded ✅")
import { ref, onMounted } from "vue"
import { db } from "../services/firebase"
import { collection, getDocs } from "firebase/firestore"
import * as L from "leaflet"
import "leaflet/dist/leaflet.css"

const map = ref(null)
const postalCode = ref("")
const tutorMarker = ref(null)

// Fetch assignments from Firestore
async function getAllAssignments() {
  try {
    const snapshot = await getDocs(collection(db, "assignments"))
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

  // Ensure map is ready
  if (!map.value) {
    console.error("Map is not initialized yet.")
    return
  }

  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${postalCode.value}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
  const res = await fetch(url)
  const data = await res.json()

  if (data.results && data.results.length > 0) {
    const result = data.results[0]
    const lat = parseFloat(result.LATITUDE)
    const lng = parseFloat(result.LONGITUDE)

    // Combine readable address (if any)
    const fullAddress = [
      result.BLK_NO,
      result.ROAD_NAME,
      result.BUILDING,
      "Singapore " + result.POSTAL,
    ]
      .filter(Boolean) // remove empty strings
      .join(", ")

    // If marker already exists, just move & update popup
    if (tutorMarker.value) {
      tutorMarker.value.setLatLng([lat, lng])
      tutorMarker.value.setPopupContent(
        `<b>Your Location</b><br>${fullAddress}`
      )
    } else {
      // create only once
      const redIcon = new L.Icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })

      tutorMarker.value = L.marker([lat, lng], { icon: redIcon })
        .addTo(map.value)
        .bindPopup(`<b>Your Location</b><br>${fullAddress}`)
        .openPopup()
    }

    // Center map on marker
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

      const popupHTML = `
        <div>
          <b>Subject:</b> ${a.subject || ""}<br>
          <b>Level:</b> ${a.level || ""}<br>
          <b>Title:</b> ${a.title || ""}<br>
          <b>Address:</b> ${a.formattedAddress || ""}<br><br>
          <button id="apply-btn-${a.id}" class="btn btn-primary">Click to apply</button>
        </div>
      `
      marker.bindPopup(popupHTML)

      // Attach Vue router click listener once popup opens
      marker.on("popupopen", () => {
        const btn = document.getElementById(`apply-btn-${a.id}`)
        if (btn) {
          btn.addEventListener("click", () => {
            console.log("Navigating to dashboard...")
            // Use Vue Router programmatically
            window.location.href = "/dashboard"
            // or if you have router imported:
            // router.push("/dashboard")
          })
        }
      })
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

