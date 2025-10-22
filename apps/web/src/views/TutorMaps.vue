<script setup>
console.log("Tutor Google Map with Mode Toggle ✅")

import { ref, onMounted } from "vue"
import { db } from "../services/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { useRouter } from "vue-router"
const router = useRouter()
const map = ref(null)
const postalCode = ref("")
const tutorMarker = ref(null)
let directionsService = null
let directionsRenderer = null
let activeInfoWindow = null
let activeAssignmentId = null


// --- Load Google Maps script dynamically using .env key ---
async function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google.maps)
      return
    }
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error("Google Maps failed to load"))
    document.head.appendChild(script)
  })
}

// --- Firestore: fetch OPEN assignments ---
async function getAllAssignments() {
  try {
    const q = query(collection(db, "assignments"), where("status", "==", "open"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return []
  }
}

// --- Search bar: convert postal code -> lat/lng and show red marker ---
async function searchTutorLocation() {
  if (!postalCode.value) return alert("Please enter a postal code.")
  if (!map.value) return console.error("Map not initialized.")

  const geocoder = new google.maps.Geocoder()
  geocoder.geocode({ address: postalCode.value }, (results, status) => {
    if (status === "OK" && results[0]) {
      const location = results[0].geometry.location
      if (tutorMarker.value) {
        tutorMarker.value.setPosition(location)
      } else {
        tutorMarker.value = new google.maps.Marker({
          map: map.value,
          position: location,
          icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          title: "Your Location",
        })
      }
      map.value.setCenter(location)
      map.value.setZoom(15)
      if (directionsRenderer) directionsRenderer.setMap(null)
    } else {
      alert("Postal code not found.")
    }
  })
  // Save location locally
localStorage.setItem(
  "tutorLocation",
  JSON.stringify({
    lat: location.lat(),
    lng: location.lng(),
    postal: postalCode.value
  })
)
console.log("Tutor location saved locally:", location.lat(), location.lng())

}

// --- Draw route and update travel info for selected mode ---
function showRoute(tutorLoc, assignLoc, travelInfoId, mode) {
  if (!tutorLoc || !assignLoc) return
  if (directionsRenderer) {
  directionsRenderer.setMap(null)
  directionsRenderer = null
  }
  if (!directionsService || !directionsRenderer) {
    directionsService = new google.maps.DirectionsService()
    directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: false })
  }
  directionsRenderer.setMap(map.value)

  directionsService.route(
    {
      origin: tutorLoc,
      destination: assignLoc,
      travelMode: mode,
    },
    (result, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(result)
        const route = result.routes[0].legs[0]
        const distance = route.distance.text
        const duration = route.duration.text

        const infoDiv = document.getElementById(travelInfoId)
        if (infoDiv) {
          infoDiv.innerHTML = `
            <hr>
            <b>Mode:</b> ${mode}<br>
            <b>Distance:</b> ${distance}<br>
            <b>Duration:</b> ${duration}
          `
        }
      } else {
        alert("Directions request failed: " + status)
      }
    }
  )
}

// --- Initialize map and markers ---
onMounted(async () => {
  // Restore saved tutor location if available
  const savedLoc = localStorage.getItem("tutorLocation")
  if (savedLoc) {
    const { lat, lng, postal } = JSON.parse(savedLoc)
    postalCode.value = postal
    const savedLatLng = new google.maps.LatLng(lat, lng)
    tutorMarker.value = new google.maps.Marker({
      map: map.value,
      position: savedLatLng,
      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      title: "Your Saved Location",
    })
    map.value.setCenter(savedLatLng)
    map.value.setZoom(15)
    console.log("Restored tutor location from localStorage:", lat, lng)
  }

  console.log("Loading Google Maps API...")
  await loadGoogleMapsScript()
  console.log("Google Maps loaded successfully.")

  map.value = new google.maps.Map(document.getElementById("tutor-map"), {
    center: { lat: 1.3521, lng: 103.8198 },
    zoom: 11,
  })

  const assignments = await getAllAssignments()
  console.log("Assignments fetched:", assignments)

  // Add markers for open assignments
  assignments.forEach((a) => {
    if (a.lat && a.lng) {
      const assignPos = { lat: a.lat, lng: a.lng }
      const marker = new google.maps.Marker({
        position: assignPos,
        map: map.value,
        title: a.title || "Assignment",
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
      })

      const travelInfoId = `travel-info-${a.id}`

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-size:14px;">
            <b>Subject:</b> ${a.subject || ""}<br>
            <b>Level:</b> ${a.level || ""}<br>
            <b>Title:</b> ${a.title || ""}<br>
            <b>Address:</b> ${a.formattedAddress || ""}<br><br>

            <div style="margin-bottom:8px;">
              <button id="drive-btn-${a.id}" class="btn btn-sm btn-outline-primary me-1">🚗 Drive</button>
              <button id="walk-btn-${a.id}" class="btn btn-sm btn-outline-success me-1">🚶 Walk</button>
              <button id="transit-btn-${a.id}" class="btn btn-sm btn-outline-info">🚇 Transit</button>
              <button id="apply-btn-${a.id}" class="btn btn-sm btn-outline-info" @click="router.push{path: '/dashboard'}">Apply</button>
            </div>

            <div id="${travelInfoId}" style="margin-top:8px;"></div>
          </div>
        `,
      })
      // ✅ Clear route when InfoWindow closes
      infoWindow.addListener("closeclick", () => {
        if (directionsRenderer) {
          directionsRenderer.setMap(null)
          directionsRenderer = null
          console.log("Route cleared after closing popup ❌")
        }
      })

      if (activeInfoWindow) activeInfoWindow.close()
      activeInfoWindow = infoWindow
      activeAssignmentId = a.id


          marker.addListener("click", () => {
      infoWindow.open(map.value, marker)

      setTimeout(() => {
        const driveBtn = document.getElementById(`drive-btn-${a.id}`)
        const walkBtn = document.getElementById(`walk-btn-${a.id}`)
        const transitBtn = document.getElementById(`transit-btn-${a.id}`)
        const applyBtn = document.getElementById(`apply-btn-${a.id}`)

        // attach handlers dynamically so they re-check tutorMarker at click time
        const addModeHandler = (btn, mode) => {
          if (!btn) return
          btn.addEventListener("click", () => {
            if (!tutorMarker.value) {
              alert("Set your tutor location first.")
              return
            }
            const tutorLoc = tutorMarker.value.getPosition()
            showRoute(tutorLoc, assignPos, travelInfoId, mode)
          })
        }

        addModeHandler(driveBtn, google.maps.TravelMode.DRIVING)
        addModeHandler(walkBtn, google.maps.TravelMode.WALKING)
        addModeHandler(transitBtn, google.maps.TravelMode.TRANSIT)

        if (applyBtn) applyBtn.addEventListener("click", () => router.push("/dashboard"))
      }, 300)
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
          v-model="postalCode"
          type="text"
          class="form-control"
          placeholder="Enter your postal code (e.g. 650123)"
        />
        <button class="btn btn-primary" @click="searchTutorLocation">
          Search
        </button>
      </div>
    </div>

    <!-- Google Map -->
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
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 90%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 8px;
}

button {
  font-size: 13px;
  padding: 4px 8px;
}
</style>
