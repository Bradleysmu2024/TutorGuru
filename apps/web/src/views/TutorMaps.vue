<script setup>
import { ref, onMounted } from "vue"
import FileUpload from "../components/FileUpload.vue"
import { auth, db, getSubjects, getLevels } from "../services/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, updateDoc, getDocs } from "firebase/firestore"
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import * as L from 'leaflet';

import 'leaflet/dist/leaflet.css';

async function getAllAssignments() {
  try {
    const snapshot = await getDocs(collection(db, "assignments"))
    console.log(snapshot)
    const assignments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    console.log("Fetched assignments:", assignments)
    return assignments
  } catch (error) {
    console.error("Error fetching assignments:", error)
    return []
  }
}
onMounted(async () => {
  // Initialize map
  map.value = L.map("map").setView([1.3521, 103.8198], 11) // Singapore center

  // Load free OSM tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map.value)

  // Fetch assignments
  const assignments = await getAllAssignments()

  // Add markers dynamically
  assignments.forEach((a) => {
    if (a.lat && a.lng) {
      const marker = L.marker([a.lat, a.lng]).addTo(map.value)
      marker.bindPopup(`<b>Subject: </b> ${a.subject || ""}<br>
      <b>Level: </b> ${a.level || ""}<br> 
      <b>Description: </b>${a.title || "Untitled Assignment"}<br>
      <b>Address: </b> ${a.formattedAddress || ""}<br>

      `)
    }
  })
})

// let mapOptions = {
//     center:[51.958, 9.141],
//     zoom:10
// }


// let map = new L.map('map' , mapOptions);

// let layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
// map.addLayer(layer);

// let marker = new L.Marker([51.958, 9.141]);
// marker.addTo(map);





</script>

<template>
    <head>

    </head>

    <div id="map"></div>
</template>

<style scoped>
#map{
    width: 100%;
    height: 100vh;
}


</style>