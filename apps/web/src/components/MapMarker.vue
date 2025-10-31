<template></template>

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
  onMounted(() => {
    const google = props.google;
    const map = props.map;
    const a = props.assignment;
    const router = useRouter();
    const toast = useToast();

    // Validate assignment position before creating a marker
    if (!a || !a.position || !isFinite(a.position.lat) || !isFinite(a.position.lng)) {
      console.error("MapMarker: invalid assignment position, skipping marker", a && a.id, a && a.position);
      return;
    }

    // Create marker and store on the ref so onBeforeUnmount can remove it
    marker.value = new google.maps.Marker({
      position: a.position,
      map,
      icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    });

    //Build InfoWindow content safely 
    const contentDiv = document.createElement("div");
    contentDiv.style.fontSize = "14px";


    const subjectEl = document.createElement("div");
    subjectEl.textContent = `Subject: ${a.subject || ""}`;
    contentDiv.appendChild(subjectEl);

    const levelEl = document.createElement("div");
    levelEl.textContent = `Level: ${a.level || ""}`;
    contentDiv.appendChild(levelEl);


    const titleEl = document.createElement("div");
    titleEl.textContent = `Title: ${a.title || ""}`;
    contentDiv.appendChild(titleEl);


    const addressEl = document.createElement("div");
    addressEl.textContent = `Address: ${a.formattedAddress || ""}`;
    addressEl.style.marginBottom = "8px";
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

    // Travel info
    const travelInfoEl = document.createElement("div");
    contentDiv.appendChild(travelInfoEl);

    // Create info window
    const infoWindow = new google.maps.InfoWindow({
      content: contentDiv, // ✅ DOM node, no HTML string
    });

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

        // Remove old route
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

      // Clear routes when InfoWindow closes
      infoWindow.addListener("closeclick", () => {
        if (directionsRenderer) {
          directionsRenderer.setMap(null);
          directionsRenderer = null;
          travelInfoEl.textContent = "";
        }
      });
    });
  })
onBeforeUnmount(() => {
  // remove marker from map so it disappears when the component is unmounted
  if (marker.value) {
    marker.value.setMap(null)
    marker.value = null
  }
})

</script>
