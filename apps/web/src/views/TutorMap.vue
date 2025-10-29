<template>
  <GoogleMapLoader
    :mapConfig="mapConfig"
    :apiKey="apiKey"
  />
    <template slot-scope="{ google, map }">
  	{{ map }}
  	{{ google }}
  </template>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { db } from "../services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "vue-router";
import { useToast } from "../composables/useToast";
import GoogleMapsApiLoader from 'google-maps-api-loader'
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const mapConfig = {
  center: { lat: 1.3521, lng: 103.8198 },
  zoom: 12
}
</script>