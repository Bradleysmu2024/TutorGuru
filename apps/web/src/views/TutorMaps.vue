<script setup>
import { ref, onMounted } from "vue"
import FileUpload from "../components/FileUpload.vue"
import { auth, db, getSubjects, getLevels } from "../services/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage"

import * as L from 'leaflet';

import 'leaflet/dist/leaflet.css';

onMounted(() => {
  const map = L.map('map').setView([1.3521, 103.8198], 11) // Singapore center

  // Load free OSM tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  // Add pin
  const marker = L.marker([1.3456, 103.9312]).addTo(map)
  marker.bindPopup('<b>Math Tuition at Bedok</b><br>Click to view').openPopup()
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