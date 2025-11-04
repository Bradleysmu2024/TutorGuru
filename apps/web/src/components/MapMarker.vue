<template>
  <!-- renderless component: hidden root so Vue mounts/unmounts predictably -->
  <div style="display:none" aria-hidden="true"></div>
</template>

<script setup>
import { POINT_MARKER_ICON_CONFIG } from "../composables/mapSettings";
import { useRouter } from "vue-router";
import { useToast } from "../composables/useToast";
import { onMounted, onBeforeUnmount, watch, ref } from "vue"


const props = defineProps({
  google: Object,
  map: Object,
  assignment: Object,
  tutorMarker: Object,
})

function showRoute(origin, destination, travelInfoEl, mode, setRenderer) {
  const directionsService = new props.google.maps.DirectionsService();
  const directionsRenderer = new props.google.maps.DirectionsRenderer({
    map: props.map,
  });

  directionsService.route(
    {
      origin,
      destination,
      travelMode: mode,
    },
    (result, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(result);
        setRenderer(directionsRenderer);

        const leg = result.routes[0].legs[0];
        const distance = leg.distance.text;
        const duration = leg.duration.text;

        travelInfoEl.textContent = `${mode}: ${distance}, ${duration}`;
      } else {
        travelInfoEl.textContent = "Unable to find route."
      }
    }
  );
}

const marker = ref(null)

function createMarker() {
  // guard: don't create twice
  if (marker.value) return;

  const google = props.google;
  const map = props.map;
  const a = props.assignment;
  const router = useRouter();
  const toast = useToast();

  // Validate assignment position before creating a marker
  if (!a || !a.position || !isFinite(a.position.lat) || !isFinite(a.position.lng)) {
    return;
  }

  marker.value = new google.maps.Marker({
    position: a.position,
    map,
    icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  });

  //Build InfoWindow content safely
  const contentDiv = document.createElement("div");
  contentDiv.className = "map-info-window";
  contentDiv.style.fontSize = "14px";
  contentDiv.style.padding = "8px";
  contentDiv.style.minWidth = "250px";

  const subjectEl = document.createElement("div");
  subjectEl.className = "info-subject";
  subjectEl.textContent = `Subject: ${a.subject || ""}`;
  subjectEl.style.marginBottom = "4px";
  subjectEl.style.fontWeight = "500";
  contentDiv.appendChild(subjectEl);

  const levelEl = document.createElement("div");
  levelEl.className = "info-level";
  levelEl.textContent = `Level: ${a.level || ""}`;
  levelEl.style.marginBottom = "4px";
  contentDiv.appendChild(levelEl);

  const titleEl = document.createElement("div");
  titleEl.className = "info-title";
  titleEl.textContent = `Title: ${a.title || ""}`;
  titleEl.style.marginBottom = "4px";
  titleEl.style.fontWeight = "600";
  contentDiv.appendChild(titleEl);

  const addressEl = document.createElement("div");
  addressEl.className = "info-address";
  addressEl.textContent = `Address: ${a.formattedAddress || ""}`;
  addressEl.style.marginBottom = "12px";
  addressEl.style.fontSize = "13px";
  contentDiv.appendChild(addressEl);

  const btnGroup = document.createElement("div");
  btnGroup.style.marginBottom = "8px";

  const makeBtn = (label, classes, emoji) => {
    const btn = document.createElement("button");
    btn.textContent = `${emoji} ${label}`;
    btn.className = classes;
    btn.style.marginRight = "6px";
    return btn;
  };

  const driveBtn = makeBtn("Drive", "btn btn-sm btn-outline-primary", "🚗");
  const walkBtn = makeBtn("Walk", "btn btn-sm btn-outline-success", "🚶");
  const transitBtn = makeBtn("Transit", "btn btn-sm btn-outline-info", "🚇");
  const applyBtn = makeBtn("Apply", "btn btn-sm btn-outline-warning", "📋");

  btnGroup.append(driveBtn, walkBtn, transitBtn, applyBtn);
  contentDiv.appendChild(btnGroup);

  const travelInfoEl = document.createElement("div");
  travelInfoEl.className = "info-travel";
  travelInfoEl.style.marginTop = "8px";
  travelInfoEl.style.fontSize = "13px";
  travelInfoEl.style.fontWeight = "500";
  contentDiv.appendChild(travelInfoEl);

  const infoWindow = new google.maps.InfoWindow({
    content: contentDiv,
  });

  // attach infoWindow reference to marker so cleanup can close it later
  try {
    marker.value._infoWindow = infoWindow;
  } catch (e) {
    // ignore
  }

  let directionsRenderer = null;

  marker.value.addListener("click", () => {
    infoWindow.open(map, marker.value);

    const handleRoute = (mode) => {
      if (!props.tutorMarker) {
        toast.warning("Set your tutor location first", "Location Required");
        return;
      }

      const origin = props.tutorMarker.getPosition();
      const destination = a.position;

      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }

      showRoute(origin, destination, travelInfoEl, mode, (renderer) => {
        directionsRenderer = renderer;
      });
    };

    driveBtn.addEventListener("click", () =>
      handleRoute(google.maps.TravelMode.DRIVING)
    );
    walkBtn.addEventListener("click", () =>
      handleRoute(google.maps.TravelMode.WALKING)
    );
    transitBtn.addEventListener("click", () =>
      handleRoute(google.maps.TravelMode.TRANSIT)
    );

    applyBtn.addEventListener("click", () => router.push("/dashboard"));

    infoWindow.addListener("closeclick", () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
        directionsRenderer = null;
        travelInfoEl.textContent = "";
      }
    });
  });
}

function removeMarker() {
  if (marker.value) {
    const google = props.google;
    if (google && google.maps && google.maps.event && marker.value) {
      google.maps.event.clearInstanceListeners(marker.value);
      if (marker.value._infoWindow) google.maps.event.clearInstanceListeners(marker.value._infoWindow);
      if (marker.value.setVisible) marker.value.setVisible(false);
    }

    try {
      marker.value.setMap(null);
    } catch (e) {
      console.warn("MapMarker: error setting marker.map = null", e);
    }
    marker.value = null;
  }
}

onMounted(() => {
  createMarker();
});

// If the parent filters data and removes this assignment, ensure the marker is removed.
watch(() => props.assignment, (newA, oldA) => {
  if (!newA) {
    removeMarker();
    return;
  }
  // if assignment changed, recreate marker
  if (!oldA || newA.id !== oldA.id) {
    removeMarker();
    createMarker();
  }
});

// If the map instance changes, attach marker to the new map
watch(() => props.map, (newMap, oldMap) => {
  if (!newMap) return;
  if (marker.value) marker.value.setMap(newMap);
  else createMarker();
});

onBeforeUnmount(() => {
  removeMarker();
});

</script>

<style>
/* Google Maps InfoWindow styling for light and dark mode */
.map-info-window {
  background-color: #ffffff;
  color: #212529;
}

.info-address {
  color: #6c757d;
}

.info-travel {
  color: #0d6efd;
}

/* Dark mode styles */
body.dark-mode .map-info-window {
  background-color: #1e1e1e !important;
  color: #e0e0e0 !important;
}

body.dark-mode .info-subject,
body.dark-mode .info-level,
body.dark-mode .info-title {
  color: #e0e0e0 !important;
}

body.dark-mode .info-address {
  color: #999 !important;
}

body.dark-mode .info-travel {
  color: #2196f3 !important;
}

/* Override Google Maps default InfoWindow styles */
body.dark-mode .gm-style .gm-style-iw-c {
  background-color: #1e1e1e !important;
}

body.dark-mode .gm-style .gm-style-iw-d {
  color: #e0e0e0 !important;
}

body.dark-mode .gm-style .gm-style-iw-t::after {
  background: linear-gradient(45deg, #1e1e1e 50%, rgba(0,0,0,0) 51%, rgba(0,0,0,0) 100%) !important;
}
</style>